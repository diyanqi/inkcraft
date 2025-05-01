'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Check, ScanText, ImagePlus, RotateCcw, Crop as CropIcon } from "lucide-react" // Renamed lucide-react Crop to CropIcon to avoid conflict
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
// Import react-image-crop
import ReactCrop, {
    centerCrop,
    makeAspectCrop,
} from 'react-image-crop';
import type { Crop, PixelCrop, PercentCrop } from 'react-image-crop'; // Explicitly import types and add PercentCrop
import imageCompression from 'browser-image-compression'
import { useMediaQuery } from "@/hooks/use-media-query"

import { useState, useRef, useCallback, useEffect } from "react"
import { Loader2 } from "lucide-react"

// Import react-image-crop styles
import 'react-image-crop/dist/ReactCrop.css'

// Helper function to draw the cropped image onto a canvas
// This is different from react-easy-crop's getCroppedImg
async function canvasPreview(
    image: HTMLImageElement,
    crop: PixelCrop,
    scale = 1,
    rotate = 0,
): Promise<Blob | null> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('No 2D context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    // devicePixelRatio slightly increases sharpness on retina devices
    // at the expense of slightly slower render times.
    // document.body.append(canvas) // for debugging

    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.floor(crop.width * scaleX * ratio)
    canvas.height = Math.floor(crop.height * scaleY * ratio)

    ctx.scale(ratio, ratio)
    ctx.imageSmoothingQuality = 'high'

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY

    const rotateRads = rotate * Math.PI / 180
    const centerX = image.naturalWidth / 2
    const centerY = image.naturalHeight / 2

    ctx.save()

    // 5) Move the crop origin to the canvas origin (0,0)
    ctx.translate(-cropX, -cropY)
    // 4) Move the canvas origin to the center of the original image
    ctx.translate(centerX, centerY)
    // 3) Rotate around the center of the original image
    ctx.rotate(rotateRads)
    // 2) Scale the image
    ctx.scale(scale, scale)
    // 1) Move the center of the original image to the canvas origin (0,0)
    ctx.translate(-centerX, -centerY)

    // Draw the cropped image
    ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
    )

    ctx.restore()

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                // canvas.remove() // for debugging
                resolve(blob)
            },
            'image/jpeg',
            1 // quality
        )
    })
}


export default function CreatePage() {
    // State management
    const [originalText, setOriginalText] = useState("")
    const [referenceText, setReferenceText] = useState("")
    const [essayText, setEssayText] = useState("")
    const [isOriginalOCRLoading, setIsOriginalOCRLoading] = useState(false)
    const [isReferenceOCRLoading, setIsReferenceOCRLoading] = useState(false)
    const [isEssayOCRLoading, setIsEssayOCRLoading] = useState(false)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    // 新增loading状态
    const [isCorrectionLoading, setIsCorrectionLoading] = useState(false)

    // react-image-crop states
    const [imageSrc, setImageSrc] = useState<string | null>(null) // Original image data URL
    const [crop, setCrop] = useState<Crop>() // Current crop object (user is dragging)
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>() // Final crop object (after user stops dragging)
    const [croppedImageSrc, setCroppedImageSrc] = useState<string | null>(null) // Data URL of the cropped preview
    const [isCropMode, setIsCropMode] = useState(false) // Whether the cropper is visible

    const [activeInput, setActiveInput] = useState<'original' | 'reference' | 'essay' | null>(null)

    // File input references
    const originalFileInputRef = useRef<HTMLInputElement>(null)
    const referenceFileInputRef = useRef<HTMLInputElement>(null)
    const essayFileInputRef = useRef<HTMLInputElement>(null)
    const inputFileRef = useRef<HTMLInputElement>(null) // Unified file input

    // Ref for the image element inside the cropper
    const imgRef = useRef<HTMLImageElement>(null)

    // Media query
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Handle image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string)
            setCroppedImageSrc(null) // Clear previous cropped image
            // Keep crop and completedCrop as undefined initially, onImageLoad will set the default
            setCrop(undefined)
            setCompletedCrop(undefined)
            setIsCropMode(true) // Automatically enter crop mode after selecting
        })
        reader.readAsDataURL(file)

        if (e.target) e.target.value = '' // Reset file input
    }

    // Handle drag-and-drop
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string)
                setCroppedImageSrc(null)
                setCrop(undefined)
                setCompletedCrop(undefined)
                setIsCropMode(true)
            })
            reader.readAsDataURL(file)
        }
    }

    // Prevent default drag-over behavior
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    // 表单验证schema
    const formSchema = z.object({
        title: z.string().min(0, { message: "请输入标题" }),
        originalText: z.string().min(1, { message: "请输入原题题干" }),
        referenceText: z.string().min(0, { message: "请输入参考范文" }),
        essayType: z.string().min(1, { message: "请选择作文类型" }),
        essayText: z.string().min(1, { message: "请输入习作" }),
        model: z.string().min(1, { message: "请选择模型" }),
        tone: z.string().min(1, { message: "请选择语气" })
    })

    // 表单处理
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            originalText,
            referenceText,
            essayType: "gaokao-english-continuation",
            essayText,
            model: "gpt4",
            tone: "default"
        }
    })

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsCorrectionLoading(true);
        try {
            const res = await fetch('/api/correction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });
            const data = await res.json();
            if (data.success && data.id) {
                toast.success('批改创建成功，正在跳转...');
                router.push(`/dashboard/correction/${data.id}`);
            } else {
                toast.error(data.message || '批改创建失败');
            }
        } catch (e) {
            toast.error('请求出错');
        } finally {
            setIsCorrectionLoading(false);
        }
    };
    // Handle image load in the cropper - Set default 80% crop here
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        imgRef.current = e.currentTarget;
        const { width, height } = e.currentTarget;

        // Calculate and set the initial 80% centered crop when the image loads
        // This logic runs when a *new* image is loaded.
        // When re-entering crop mode for the *same* image, we'll use the completedCrop.
        if (!crop && !completedCrop) { // Only set default if no crop is already defined
            const initialCrop: PercentCrop = { // <-- Changed type to PercentCrop
                unit: '%', // Use percentage units
                width: 80, // 80% width
                height: 80, // 80% height
                x: 0, // Temporary x, centerCrop will calculate
                y: 0, // Temporary y, centerCrop will calculate
            };

            // Center the calculated crop
            const centeredCrop = centerCrop(initialCrop, width, height);

            // Set the calculated centered crop as the initial crop state
            setCrop(centeredCrop);

            // Also immediately calculate and set the completed crop based on this default
            // This allows the preview to show right away and the "确认识别" button to be enabled
            // without the user needing to drag.
            if (imgRef.current && centeredCrop.width && centeredCrop.height && centeredCrop.unit === '%') {
                // Need to convert percentage crop to pixel crop for completedCrop
                const pixelCrop: PixelCrop = {
                    x: (centeredCrop.x / 100) * width,
                    y: (centeredCrop.y / 100) * height,
                    width: (centeredCrop.width / 100) * width,
                    height: (centeredCrop.height / 100) * height,
                    unit: 'px' // completedCrop is typically in pixels
                };
                setCompletedCrop(pixelCrop);
            }
        }


    }, [crop, completedCrop]); // Dependencies: include crop and completedCrop to avoid re-setting default if they exist.

    // Generate the cropped preview when completedCrop changes
    useEffect(() => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            // Use canvasPreview to get the cropped blob
            canvasPreview(
                imgRef.current,
                completedCrop,
                1, // scale
                0  // rotate
            ).then(blob => {
                if (blob) {
                    const reader = new FileReader()
                    reader.onload = () => {
                        setCroppedImageSrc(reader.result as string)
                    }
                    reader.readAsDataURL(blob)
                }
            }).catch(error => {
                console.error("Failed to create canvas preview:", error);
                toast.error("生成图片预览失败");
            });
        } else {
            setCroppedImageSrc(null); // Clear preview if crop is cleared
        }
    }, [completedCrop]); // Effect runs when completedCrop changes

    // Confirm crop
    const handleConfirmCrop = () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            // The useEffect above already generated the croppedImageSrc
            // We just need to exit crop mode
            setIsCropMode(false);
        } else {
            toast.error("请先完成裁剪区域的选择");
        }
    }

    // Proceed with OCR
    const handleProceedOCR = async () => {
        if (!croppedImageSrc || !activeInput) {
            toast.error("没有可识别的图片");
            return;
        }
        try {
            // Convert the cropped data URL back to a Blob
            const response = await fetch(croppedImageSrc);
            const croppedBlob = await response.blob();

            await handleOCR(croppedBlob, activeInput);

            // Close drawer/dialog and reset states after successful OCR
            setIsDrawerOpen(false);
            setImageSrc(null);
            setCroppedImageSrc(null);
            setIsCropMode(false);
            setActiveInput(null);
            setCrop(undefined); // Reset crop state
            setCompletedCrop(undefined); // Reset completed crop state
            if (inputFileRef.current) inputFileRef.current.value = ''; // Reset file input element
        } catch (error) {
            console.error("Error processing cropped image for OCR:", error);
            toast.error("处理图片失败");
        }
    }

    // OCR handling function
    const handleOCR = async (file: Blob, inputType: 'original' | 'reference' | 'essay') => {
        const setLoading = {
            original: setIsOriginalOCRLoading,
            reference: setIsReferenceOCRLoading,
            essay: setIsEssayOCRLoading,
        }[inputType]

        setLoading(true)
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
            // Use the original file name or a generic one
            const fileName = `ocr_image_${inputType}.jpg`;
            const fileToProcess = new File([file], fileName, {
                type: "image/jpeg",
                lastModified: Date.now(),
            })
            const compressedFile = await imageCompression(fileToProcess, options)
            const formData = new FormData()
            formData.append("file", compressedFile, fileName)

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()
            if (res.ok && data.success) {
                // 使用form.setValue更新表单字段
                const fieldMap = {
                    original: 'originalText',
                    reference: 'referenceText',
                    essay: 'essayText'
                }[inputType] as 'originalText' | 'referenceText' | 'essayText';
                form.setValue(fieldMap, data.text)
                toast.success("识别成功")
            } else {
                // Log the full error response from the server
                console.error("OCR API Error:", data);
                throw new Error(data.error || "识别失败");
            }
        } catch (err) {
            console.error("OCR Fetch or Processing Error:", err); // Log the actual error
            // Display a user-friendly message, possibly based on the error
            if (err instanceof Error) {
                toast.error(`OCR 失败: ${err.message}`);
            } else {
                toast.error("OCR 失败，请重试");
            }
        } finally {
            setLoading(false)
        }
    }

    // OCR Button component
    const OCRButton = ({
        isLoading,
        inputType,
    }: {
        isLoading: boolean,
        inputType: 'original' | 'reference' | 'essay'
    }) => (
        <Button
            type="button"
            className="flex items-center gap-1 text-sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => {
                setActiveInput(inputType)
                setIsDrawerOpen(true)
                // The file input click is now triggered inside the drawer/dialog
            }}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    识别中...
                </>
            ) : (
                <>
                    <ScanText className="h-4 w-4" />
                    文字识别
                </>
            )}
        </Button>
    )

    // Function to reset all image/cropping related states
    const resetImageStates = () => {
        setImageSrc(null);
        setCroppedImageSrc(null);
        setIsCropMode(false);
        setActiveInput(null);
        setCrop(undefined); // Ensure crop state is reset
        setCompletedCrop(undefined); // Ensure completed crop state is reset
        if (inputFileRef.current) inputFileRef.current.value = ''; // Reset file input element
    };


    const renderCropperContent = () => (
        <div className="flex flex-col items-center justify-center px-4 gap-4 h-full"> {/* Added h-full */}
            {!imageSrc && (
                <>
                    <div
                        className="w-full max-w-md h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-500 hover:border-gray-400 transition-colors cursor-pointer"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => inputFileRef.current?.click()}
                    >
                        将图片拖放到此处
                    </div>
                    <Button onClick={() => inputFileRef.current?.click()} variant="outline">
                        <ImagePlus className="w-4 h-4 mr-2" /> 或手动选择…
                    </Button>
                    {/* Unified file input */}
                    <input
                        ref={inputFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                </>
            )}
            {imageSrc && isCropMode && (
                // Container for ReactCrop - needs dimensions
                <div className="relative w-full max-w-md h-[400px] md:h-[500px]"> {/* Increased height */}
                    <ReactCrop
                        crop={crop}
                        onChange={(_: any, percentCrop: any) => setCrop(percentCrop)}
                        onComplete={(c: any) => setCompletedCrop(c)}
                        // Add the custom class for styling the overlay
                        className="ios-crop-overlay"
                    // No 'aspect' prop for freeform cropping
                    // ruleOfThirds // Optional: show grid lines
                    // circularCrop // Optional: circular crop
                    // minWidth, minHeight, maxWidth, maxHeight can be added here
                    // disabled={isLoading} // Disable crop while loading?
                    >
                        {/* The image element that ReactCrop works on */}
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imageSrc}
                            onLoad={onImageLoad} // onImageLoad sets the default crop if none exists
                            // Style to make image fit container and allow cropping
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </ReactCrop>
                </div>
            )}
            {imageSrc && !isCropMode && croppedImageSrc && (
                <div className="flex flex-col items-center gap-4">
                    <img
                        src={croppedImageSrc}
                        alt="Cropped preview"
                        className="max-w-full max-h-[400px] md:max-h-[500px] object-contain" // Increased max height
                    />
                    <div className="flex flex-row gap-2">
                        <Button
                            onClick={resetImageStates} // Use reset function
                            variant="ghost"
                        >
                            <RotateCcw className="w-4 h-4 mr-1" /> 重新选择
                        </Button>
                        <Button
                            onClick={() => {
                                // Set the crop state to the last completed crop before re-entering crop mode
                                if (completedCrop) {
                                    setCrop(completedCrop);
                                }
                                setIsCropMode(true); // Go back to crop mode
                            }}
                            variant="ghost"
                        >
                            <CropIcon className="w-4 h-4 mr-2" /> 重新裁剪 {/* Use CropIcon */}
                        </Button>
                    </div>
                </div>
            )}
            {/* Handle the case where imageSrc is set but not in crop mode and no croppedImageSrc (shouldn't happen often with current logic) */}
            {imageSrc && !isCropMode && !croppedImageSrc && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground">请选择或裁剪图片</p>
                    <Button
                        onClick={resetImageStates} // Use reset function
                        variant="ghost"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" /> 重新选择
                    </Button>
                </div>
            )}
        </div>
    );

    const renderCropperFooter = () => (
        <div className="flex flex-row justify-end gap-2 mt-4">
            {imageSrc && isCropMode ? (
                <>
                    <Button
                        onClick={() => {
                            setIsCropMode(false); // Exit crop mode without confirming
                            // Optionally reset crop/completedCrop here if you want to discard changes made during this crop session
                            // setCrop(undefined); // Keep the current crop state when cancelling to allow resuming? Or clear?
                            // setCompletedCrop(undefined); // Keep the completedCrop state?
                        }}
                        variant="ghost"
                    >
                        取消裁剪
                    </Button>
                    <Button
                        onClick={handleConfirmCrop}
                        // Button is enabled if completedCrop has dimensions (set by onImageLoad or onComplete)
                        disabled={!completedCrop?.width || !completedCrop?.height || isOriginalOCRLoading || isReferenceOCRLoading || isEssayOCRLoading}
                    >
                        确认裁剪
                    </Button>
                </>
            ) : imageSrc && !isCropMode && croppedImageSrc ? (
                <>
                    <Button
                        onClick={handleProceedOCR}
                        disabled={isOriginalOCRLoading || isReferenceOCRLoading || isEssayOCRLoading}
                    >
                        确认识别
                    </Button>
                </>
            ) : null}
            {/* Simplified cancel button logic */}
            {/* This '取消' button closes the modal/drawer entirely */}
            <Button
                variant="outline"
                onClick={() => {
                    setIsDrawerOpen(false);
                    resetImageStates(); // Reset states when cancel button is clicked
                }}
            >
                取消
            </Button>
        </div>
    );


    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* First Card: Question Input */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">题干录入</CardTitle>
                                <CardDescription>录入并匹配原题，提供精准化解析。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>标题 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                            <FormControl>
                                                <input
                                                    type="text"
                                                    placeholder="留白以自动生成"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="originalText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>原题题干</FormLabel>
                                            <FormControl>
                                                <div className="grid w-auto max-w-3xl gap-1.5">
                                                    <Textarea
                                                        placeholder="在这里输入原题题干…"
                                                        className="max-h-[7lh]"
                                                        {...field}
                                                    />
                                                    <div className="flex justify-end">
                                                        <OCRButton
                                                            isLoading={isOriginalOCRLoading}
                                                            inputType="original"
                                                        />
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="referenceText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>参考范文 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                            <FormControl>
                                                <div className="grid w-auto max-w-3xl gap-1.5">
                                                    <Textarea
                                                        placeholder="在这里输入参考范文…"
                                                        className="max-h-[7lh]"
                                                        {...field}
                                                    />
                                                    <div className="flex justify-end">
                                                        <OCRButton
                                                            isLoading={isReferenceOCRLoading}
                                                            inputType="reference"
                                                        />
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="essayType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>作文类型</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="选择类型" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="gaokao-english-continuation">高考英语 读后续写</SelectItem>
                                                    <SelectItem value="gaokao-english-practical" disabled>高考英语 应用文</SelectItem>
                                                    <SelectItem value="gaokao-chinese-composition" disabled>高考语文 作文</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Second Card: Essay Input */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">文章录入</CardTitle>
                                <CardDescription>录入待批改的作文，支持文字识别。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="essayText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>录入习作</FormLabel>
                                            <FormControl>
                                                <div className="grid w-full gap-1.5">
                                                    <Textarea
                                                        placeholder="在这里输入你的作文…"
                                                        className="max-h-[14lh]"
                                                        {...field}
                                                    />
                                                    <div className="flex justify-end">
                                                        <OCRButton
                                                            isLoading={isEssayOCRLoading}
                                                            inputType="essay"
                                                        />
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Third Card: Correction Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">批改选项</CardTitle>
                                <CardDescription>在这里自定义生成结果的展示内容。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="model"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>选择模型</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="选择模型" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="gpt4">GPT-4o</SelectItem>
                                                    <SelectItem value="llama">Meta Llama</SelectItem>
                                                    <SelectItem value="deepseek">Deepseek-v3</SelectItem>
                                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                                    <SelectItem value="qwen">通义千问</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>讲解语气 <span className="text-sm text-muted-foreground">*实验性</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="选择语气" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="default">默认</SelectItem>
                                                    <SelectItem value="serious">一本正经</SelectItem>
                                                    <SelectItem value="humorous">幽默风趣</SelectItem>
                                                    <SelectItem value="sharp">犀利锐评</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end mt-8">
                        <Button type="submit" className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                            <Check /> 开始批改
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Unified Component for Cropper */}
            {
                isDesktop ? (
                    <Dialog open={isDrawerOpen} onOpenChange={(open) => {
                        setIsDrawerOpen(open)
                        if (!open) {
                            resetImageStates(); // Reset states when dialog closes
                        }
                    }}>
                        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col"> {/* Added h-[80vh] and flex-col */}
                            <DialogHeader>
                                <DialogTitle>文字识别</DialogTitle>
                                <DialogDescription>选择图片并裁剪</DialogDescription>
                            </DialogHeader>
                            <div className="flex-grow overflow-y-auto"> {/* Added flex-grow and overflow */}
                                {renderCropperContent()}
                            </div>
                            {renderCropperFooter()}
                        </DialogContent>
                    </Dialog>
                ) : (
                    <Drawer open={isDrawerOpen} onOpenChange={(open) => {
                        setIsDrawerOpen(open)
                        if (!open) {
                            resetImageStates(); // Reset states when drawer closes
                        }
                    }}>
                        <DrawerContent className="h-[90vh] flex flex-col"> {/* Added flex-col */}
                            <DrawerHeader>
                                <DrawerTitle>文字识别</DrawerTitle>
                                <DrawerDescription>选择图片并裁剪</DrawerDescription>
                            </DrawerHeader>
                            <div className="flex-grow overflow-y-auto"> {/* Added flex-grow and overflow */}
                                {renderCropperContent()}
                            </div>
                            <DrawerFooter className="flex flex-row justify-end gap-2">
                                {renderCropperFooter()}
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                )
            }


            {/* <div className="flex justify-end mt-8">
                <Button
                    type="button"
                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={handleCorrectionSubmit}
                    disabled={isSubmitting}
                >
                    <Check /> 开始批改
                </Button>
            </div> */}
        </div>
    )
}


// 按钮loading组件
function ButtonLoading() {
    return (
        <Button disabled>
            <Loader2 className="animate-spin mr-2" />
            请稍候
        </Button>
    )
}
