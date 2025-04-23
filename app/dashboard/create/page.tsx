'use client'

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Check, ScanText, Camera, ImagePlus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Cropper from 'react-easy-crop'
import imageCompression from 'browser-image-compression'

import { useState, useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"

// Helper function for cropping
const getCroppedImg = (imageSrc: string, crop: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.src = imageSrc
        image.onload = () => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")!

            canvas.width = crop.width
            canvas.height = crop.height

            ctx.drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height
            )

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Canvas is empty"))
                    return
                }
                resolve(blob)
            }, "image/jpeg")
        }
        image.onerror = () => reject(new Error("加载图片失败"))
    })
}

export default function CreatePage() {
    // 状态管理
    const [originalText, setOriginalText] = useState("")
    const [referenceText, setReferenceText] = useState("")
    const [essayText, setEssayText] = useState("")
    const [isOriginalOCRLoading, setIsOriginalOCRLoading] = useState(false)
    const [isReferenceOCRLoading, setIsReferenceOCRLoading] = useState(false)
    const [isEssayOCRLoading, setIsEssayOCRLoading] = useState(false)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [croppingMode, setCroppingMode] = useState(false)
    const [activeInput, setActiveInput] = useState<'original' | 'reference' | 'essay' | null>(null)

    // 文件输入引用
    const originalFileInputRef = useRef<HTMLInputElement>(null)
    const referenceFileInputRef = useRef<HTMLInputElement>(null)
    const essayFileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const inputFileRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // 打开摄像头
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
                streamRef.current = stream
            }
        } catch (err) {
            toast.error("无法访问摄像头")
        }
    }

    // 拍照
    const takePhoto = () => {
        if (!videoRef.current) return
        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(videoRef.current, 0, 0)
        const imgData = canvas.toDataURL("image/jpeg")
        setImageSrc(imgData)
        stopCamera()
        setCroppingMode(true)
    }

    // 停止摄像头
    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(track => track.stop())
        streamRef.current = null
    }

    // 处理图片选择
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setImageSrc(reader.result as string)
            setCroppingMode(true)
        }
        reader.readAsDataURL(file)
    }

    // 裁剪完成回调
    const handleCropComplete = useCallback((_: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels)
    }, [])

    // 确认裁剪
    const handleConfirmCrop = async () => {
        if (!imageSrc || !croppedAreaPixels || !activeInput) return
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (!croppedBlob) throw new Error("裁剪失败")
            await handleOCR(croppedBlob, activeInput)
            setIsDrawerOpen(false)
            setImageSrc(null)
            setCroppingMode(false)
            setActiveInput(null)
        } catch (error) {
            toast.error("裁剪或识别失败")
        }
    }

    // OCR处理函数
    const handleOCR = async (file: Blob, inputType: 'original' | 'reference' | 'essay') => {
        const setLoading = {
            original: setIsOriginalOCRLoading,
            reference: setIsReferenceOCRLoading,
            essay: setIsEssayOCRLoading,
        }[inputType]
        const setText = {
            original: setOriginalText,
            reference: setReferenceText,
            essay: setEssayText,
        }[inputType]

        setLoading(true)
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
            const fileToProcess = new File([file], "cropped.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
            })
            const compressedFile = await imageCompression(fileToProcess, options)
            const formData = new FormData()
            formData.append("file", compressedFile, "cropped.jpg")

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()
            if (res.ok && data.success) {
                setText(data.text)
                toast.success("识别成功")
            } else {
                throw new Error(data.error || "识别失败")
            }
        } catch (err) {
            toast.error("OCR 失败")
        } finally {
            setLoading(false)
        }
    }

    // OCR按钮组件
    const OCRButton = ({
        isLoading,
        onClick
    }: {
        isLoading: boolean,
        onClick: () => void
    }) => (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
                <Button
                    type="button"
                    className="flex items-center gap-1 text-sm"
                    variant="outline"
                    disabled={isLoading}
                    onClick={onClick}
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
            </DrawerTrigger>
            <DrawerContent className="h-[90vh]">
                <DrawerHeader>
                    <DrawerTitle>文字识别</DrawerTitle>
                    <DrawerDescription>拍照或选择图片并裁剪</DrawerDescription>
                </DrawerHeader>
                <div className="flex flex-col items-center justify-center px-4 gap-4">
                    {!imageSrc && (
                        <>
                            <video ref={videoRef} className="rounded-md w-full max-w-md" />
                            <Button onClick={openCamera}>
                                <Camera className="w-4 h-4 mr-2" /> 打开相机
                            </Button>
                            <Button onClick={takePhoto} variant="secondary">
                                拍照
                            </Button>
                            <Button onClick={() => inputFileRef.current?.click()} variant="ghost">
                                <ImagePlus className="w-4 h-4 mr-2" /> 从相册选择
                            </Button>
                            <input
                                ref={inputFileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </>
                    )}
                    {imageSrc && croppingMode && (
                        <div className="relative w-full h-[300px]">
                            <Cropper
                                image={imageSrc}
                                crop={{ x: 0, y: 0 }}
                                zoom={1}
                                aspect={4 / 3}
                                onCropChange={() => {}}
                                onCropComplete={handleCropComplete}
                                onZoomChange={() => {}}
                            />
                            <div className="flex justify-between mt-4">
                                <Button
                                    onClick={() => {
                                        setImageSrc(null)
                                        setCroppingMode(false)
                                        openCamera()
                                    }}
                                    variant="ghost"
                                >
                                    <RotateCcw className="w-4 h-4 mr-1" /> 重新拍摄
                                </Button>
                                <Button onClick={handleConfirmCrop} disabled={isOriginalOCRLoading || isReferenceOCRLoading || isEssayOCRLoading}>
                                    确认识别
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <DrawerFooter>
                    <DrawerClose>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setImageSrc(null)
                                stopCamera()
                                setCroppingMode(false)
                                setActiveInput(null)
                            }}
                        >
                            取消
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 第一个卡片：题干录入 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">题干录入</CardTitle>
                        <CardDescription>录入并匹配原题，提供精准化解析。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="title" className="text-md">标题 <span className="text-sm text-muted-foreground">*可选</span></Label>
                            <input
                                type="text"
                                id="title"
                                placeholder="留白以自动生成"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="original-text" className="text-md">原题题干</Label>
                            <Textarea
                                placeholder="在这里输入原题题干…"
                                id="original-text"
                                className="max-h-[7lh]"
                                value={originalText}
                                onChange={(e) => setOriginalText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={originalFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleOCR(file, 'original')
                                        if (e.target) e.target.value = ''
                                    }}
                                />
                                <OCRButton
                                    isLoading={isOriginalOCRLoading}
                                    onClick={() => {
                                        setActiveInput('original')
                                        setIsDrawerOpen(true)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="reference-text" className="text-md">参考范文 <span className="text-sm text-muted-foreground">*可选</span></Label>
                            <Textarea
                                placeholder="在这里输入参考范文…"
                                id="reference-text"
                                className="max-h-[7lh]"
                                value={referenceText}
                                onChange={(e) => setReferenceText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={referenceFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleOCR(file, 'reference')
                                        if (e.target) e.target.value = ''
                                    }}
                                />
                                <OCRButton
                                    isLoading={isReferenceOCRLoading}
                                    onClick={() => {
                                        setActiveInput('reference')
                                        setIsDrawerOpen(true)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="essay-type" className="text-md">作文类型</Label>
                            <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gaokao-english-continuation">高考英语 读后续写</SelectItem>
                                    <SelectItem value="gaokao-english-practical" disabled>高考英语 应用文</SelectItem>
                                    <SelectItem value="gaokao-chinese-composition" disabled>高考语文 作文</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 第二个卡片：文章录入 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">文章录入</CardTitle>
                        <CardDescription>录入待批改的作文，支持文字识别。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="essay-text" className="text-md">录入习作</Label>
                            <Textarea
                                placeholder="在这里输入你的作文…"
                                id="essay-text"
                                className="max-h-[14lh]"
                                value={essayText}
                                onChange={(e) => setEssayText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={essayFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleOCR(file, 'essay')
                                        if (e.target) e.target.value = ''
                                    }}
                                />
                                <OCRButton
                                    isLoading={isEssayOCRLoading}
                                    onClick={() => {
                                        setActiveInput('essay')
                                        setIsDrawerOpen(true)
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 第三个卡片：批改选项 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">批改选项</CardTitle>
                        <CardDescription>在这里自定义生成结果的展示内容。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label className="text-md">选择模型</Label>
                            <Select defaultValue="gpt4">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="选择模型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt4">GPT-4o</SelectItem>
                                    <SelectItem value="llama">Meta Llama</SelectItem>
                                    <SelectItem value="deepseek">Deepseek-v3</SelectItem>
                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                    <SelectItem value="qwen">通义千问</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label className="text-md">讲解语气 <span className="text-sm text-muted-foreground">*实验性</span></Label>
                            <Select defaultValue="default">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="选择语气" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">默认</SelectItem>
                                    <SelectItem value="serious">一本正经</SelectItem>
                                    <SelectItem value="humorous">幽默风趣</SelectItem>
                                    <SelectItem value="sharp">犀利锐评</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end mt-8">
                <Button
                    type="button"
                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <Check /> 开始批改
                </Button>
            </div>
        </div>
    )
}