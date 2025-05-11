'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, usePathname } from "next/navigation"; // Add usePathname here
import React, { useState, useRef, useCallback, useEffect } from "react" // Added useEffect
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
    DialogFooter, // Added
    DialogHeader,
    DialogTitle,
    DialogClose, // Added
} from "@/components/ui/dialog"
import { Check, ScanText, ImagePlus, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import imageCompression from 'browser-image-compression'
import { useMediaQuery } from "@/hooks/use-media-query"
import { Progress } from "@/components/ui/progress" // Added
import { Label } from "@/components/ui/label" // Added
import { inngest } from "@/lib/inngest"

// Removed crop related imports and functions

// Define Form Schema Type
const formSchema = z.object({
    title: z.string().min(0), // Optional title
    originalText: z.string().min(1, { message: "请输入原题题干" }),
    referenceText: z.string().min(0), // Optional reference
    essayType: z.string().min(1, { message: "请选择作文类型" }),
    essayText: z.string().min(1, { message: "请输入习作" }),
    model: z.string().min(1, { message: "请选择模型" }),
    tone: z.string().min(1, { message: "请选择语气" })
});
type FormData = z.infer<typeof formSchema>;


// --- Confirmation Dialog Component ---
interface ConfirmCorrectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void; // Renamed from startCorrectionProcess for clarity
    formData: FormData | null;
    isLoading: boolean;
    progress: number;
    progressMessage: string;
}

function ConfirmCorrectionDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    formData,
    isLoading,
    progress,
    progressMessage
}: ConfirmCorrectionDialogProps) {
    if (!formData) return null; // Don't render if no data

    // Helper to get display names
    const getModelDisplayName = (value: string) => {
        const options: { [key: string]: string } = {
            "gpt4": "GPT-4o",
            "llama": "Meta Llama",
            "deepseek": "Deepseek-v3",
            "gemini": "Google Gemini 2",
            "qwen": "通义千问",
            "glm": "智谱清言",
        };
        return options[value] || value;
    };

    const getToneDisplayName = (value: string) => {
        const options: { [key: string]: string } = {
            "default": "默认",
            "serious": "一本正经",
            "humorous": "幽默风趣",
            "sharp": "犀利锐评",
        };
        return options[value] || value;
    };

    const getEssayTypeDisplayName = (value: string) => {
        const options: { [key: string]: string } = {
            "gaokao-english-continuation": "高考英语 读后续写",
            "gaokao-english-practical": "高考英语 应用文",
            "gaokao-chinese-composition": "高考语文 作文",
        };
        return options[value] || value;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>确认批改信息</DialogTitle>
                    <DialogDescription>
                        请核对以下信息，确认无误后开始批改。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Display summary of options */}
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-right text-muted-foreground">作文类型</Label>
                        <div className="col-span-2 font-medium">{getEssayTypeDisplayName(formData.essayType)}</div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-right text-muted-foreground">选用模型</Label>
                        <div className="col-span-2 font-medium">{getModelDisplayName(formData.model)}</div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-right text-muted-foreground">讲解语气</Label>
                        <div className="col-span-2 font-medium">{getToneDisplayName(formData.tone)}</div>
                    </div>

                    {/* Progress Section - Visible only when loading */}
                    {isLoading && (
                        <div className="mt-4 pt-4 border-t">
                            <Label className="text-sm font-medium">批改进度</Label>
                            <Progress value={progress} className="w-full mt-2" />
                            <p className="text-sm text-muted-foreground mt-1 text-center">{progressMessage || "准备开始..."}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {/* Conditional Rendering for Buttons */}
                    {!isLoading ? (
                        <>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    取消
                                </Button>
                            </DialogClose>
                            <Button type="button" onClick={onConfirm}> {/* Changed to type="button" */}
                                确认批改
                            </Button>
                        </>
                    ) : (
                        // Show only a disabled "Processing" button or nothing while loading
                        // Or keep the cancel button active? Let's keep Cancel active.
                        <>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isLoading}>
                                    取消
                                </Button>
                            </DialogClose>
                            <Button type="button" disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                批改中...
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


// --- Main Page Component ---
export default function CreatePage() {
    // State management
    const [isOriginalOCRLoading, setIsOriginalOCRLoading] = useState(false);
    const [isReferenceOCRLoading, setIsReferenceOCRLoading] = useState(false);
    const [isEssayOCRLoading, setIsEssayOCRLoading] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // For OCR Image Selection
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false); // For Confirmation Dialog
    const [isCorrectionLoading, setIsCorrectionLoading] = useState(false); // For API call loading state
    const [correctionProgress, setCorrectionProgress] = useState(0); // Progress 0-100
    const [correctionProgressMessage, setCorrectionProgressMessage] = useState(""); // Progress text
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null); // Store validated data before confirmation

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [activeInput, setActiveInput] = useState<'original' | 'reference' | 'essay' | null>(null);
    const inputFileRef = useRef<HTMLInputElement>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const router = useRouter();
    const currentPathname = usePathname(); // Get the current pathname

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            originalText: "",
            referenceText: "",
            essayType: "gaokao-english-continuation",
            essayText: "",
            model: "qwen",
            tone: "default"
        }
    });

    // --- Functions ---

    // Image handling (handleImageChange, handleDrop, handleDragOver) - unchanged
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string)
        })
        reader.readAsDataURL(file)
        if (e.target) e.target.value = '' // Reset file input
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string)
            })
            reader.readAsDataURL(file)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    // resetImageStates - unchanged
    const resetImageStates = () => {
        setImageSrc(null);
        setActiveInput(null);
        if (inputFileRef.current) inputFileRef.current.value = '';
    };

    // handleOCR - unchanged (keeps its own toasts for success/error)
    const handleOCR = async (file: Blob, inputType: 'original' | 'reference' | 'essay') => {
        const setLoadingState = {
            original: setIsOriginalOCRLoading,
            reference: setIsReferenceOCRLoading,
            essay: setIsEssayOCRLoading,
        }[inputType];
        setLoadingState(true);
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
            const fileName = `ocr_image_${inputType}.jpg`;
            const fileToProcess = new File([file], fileName, {
                type: file.type.startsWith('image/') ? file.type : 'image/jpeg',
                lastModified: Date.now(),
            });
            const compressedFile = await imageCompression(fileToProcess, options);
            const formData = new FormData();
            formData.append("file", compressedFile, fileName);

            const res = await fetch("/api/ocr", { method: "POST", body: formData });
            const data = await res.json();

            if (res.ok && data.success) {
                const fieldMap = {
                    original: 'originalText',
                    reference: 'referenceText',
                    essay: 'essayText'
                }[inputType] as 'originalText' | 'referenceText' | 'essayText';
                form.setValue(fieldMap, data.text);
                toast.success("OCR 识别成功"); // Keep OCR toast
            } else {
                console.error("OCR API Error:", data);
                throw new Error(data.error || "OCR 识别失败");
            }
        } catch (err) {
            console.error("OCR Fetch or Processing Error:", err);
            // Keep OCR toast for failure
            toast.error(`OCR 失败: ${err instanceof Error ? err.message : "请重试"}`);
        } finally {
            setLoadingState(false);
        }
    };


    // handleProceedOCR (calls handleOCR) - unchanged
    const handleProceedOCR = async () => {
        if (!imageSrc || !activeInput) {
            toast.error("没有可识别的图片");
            return;
        }
        try {
            const response = await fetch(imageSrc);
            const imageBlob = await response.blob();
            await handleOCR(imageBlob, activeInput);
            setIsDrawerOpen(false);
            resetImageStates();
        } catch (error) {
            console.error("Error processing image for OCR:", error);
            toast.error("处理图片失败");
        }
    }


    // Function to be called when confirming in the dialog
    const startCorrectionProcess = async () => {
        if (!pendingFormData) {
            toast.error("无法开始批改：缺少表单数据。");
            setIsConfirmDialogOpen(false);
            return;
        }

        setIsCorrectionLoading(true);
        setCorrectionProgress(5);
        setCorrectionProgressMessage("正在提交批改任务...");

        try {
            // 发送到后端 API
            const response = await fetch('/api/correction/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pendingFormData)
            });

            const data = await response.json();

            if (data.success) {
                setCorrectionProgress(100);
                setCorrectionProgressMessage("批改任务已提交！请过三分钟后刷新页面查看结果。");
                // toast.success('批改任务已提交，正在跳转...');
                // setTimeout(() => {
                //     setIsConfirmDialogOpen(false);
                //     router.push(`/dashboard/correction/${data.id}`);
                // }, 500);
            } else {
                throw new Error(data.message || '提交失败');
            }
        } catch (e) {
            console.error('Correction Process Error:', e);
            toast.error(e instanceof Error ? e.message : '发生未知错误');
            setIsConfirmDialogOpen(false);
        } finally {
            if (!currentPathname?.includes('/dashboard/correction/')) {
                setIsCorrectionLoading(false);
                setPendingFormData(null);
            }
        }
    };


    // Original onSubmit function - Now triggers the confirmation dialog
    const onSubmit = (values: FormData) => {
        // 1. Store the validated data
        setPendingFormData(values);
        // 2. Reset progress from previous attempts
        setCorrectionProgress(0);
        setCorrectionProgressMessage("");
        // 3. Open the confirmation dialog
        setIsConfirmDialogOpen(true);
        // Note: isCorrectionLoading is set to true inside startCorrectionProcess
    };

    // --- Render Helper Components ---

    // OCRButton - unchanged
    const OCRButton = ({ isLoading, inputType }: { isLoading: boolean, inputType: 'original' | 'reference' | 'essay' }) => (
        <Button
            type="button"
            className="flex items-center gap-1 text-sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => { setActiveInput(inputType); setIsDrawerOpen(true); }}
        >
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />识别中...</> : <><ScanText className="h-4 w-4" />文字识别</>}
        </Button>
    );

    // renderImageSelectionContent - unchanged
    const renderImageSelectionContent = () => (
        <div className="flex flex-col items-center justify-center px-4 gap-4 h-full">
            {!imageSrc ? (
                <>
                    <div
                        className="w-full max-w-md h-40 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 transition-colors cursor-pointer text-center p-4"
                        onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => inputFileRef.current?.click()}
                    >
                        <ImagePlus className="w-8 h-8 mb-2 text-gray-400" />
                        将图片拖放到此处 或 点击选择
                    </div>
                    <input ref={inputFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                    <p className="text-sm text-muted-foreground">已选择图片:</p>
                    <img src={imageSrc} alt="Selected preview" className="max-w-full max-h-[400px] md:max-h-[500px] object-contain border rounded-md" />
                </div>
            )}
        </div>
    );


    // renderImageSelectionFooter - unchanged
    const renderImageSelectionFooter = () => (
        <div className="flex flex-row justify-end gap-2 pt-4 border-t">
            {imageSrc && (
                <Button onClick={resetImageStates} variant="ghost" disabled={isOriginalOCRLoading || isReferenceOCRLoading || isEssayOCRLoading}>
                    <RotateCcw className="w-4 h-4 mr-1" /> 重新选择
                </Button>
            )}
            <Button onClick={handleProceedOCR} disabled={!imageSrc || isOriginalOCRLoading || isReferenceOCRLoading || isEssayOCRLoading}>
                <ScanText className="w-4 h-4 mr-2" /> 确认识别
            </Button>
            <Button variant="outline" onClick={() => { setIsDrawerOpen(false); resetImageStates(); }}>
                取消
            </Button>
        </div>
    );


    // --- Main Return JSX ---
    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <Form {...form}>
                {/* Form structure remains the same - uses form.handleSubmit(onSubmit) */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Grid for Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Card 1: Question Input */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">题干录入</CardTitle>
                                <CardDescription>录入原题及范文，支持文字识别。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>标题 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                        <FormControl><input type="text" placeholder="留白以自动生成" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="originalText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>原题题干</FormLabel>
                                        <FormControl>
                                            <div className="grid w-auto max-w-3xl gap-1.5">
                                                <Textarea placeholder="在这里输入原题题干…" className="min-h-[100px] max-h-[200px]" {...field} />
                                                <div className="flex justify-end"><OCRButton isLoading={isOriginalOCRLoading} inputType="original" /></div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="referenceText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>参考范文 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                        <FormControl>
                                            <div className="grid w-auto max-w-3xl gap-1.5">
                                                <Textarea placeholder="在这里输入参考范文…" className="min-h-[100px] max-h-[200px]" {...field} />
                                                <div className="flex justify-end"><OCRButton isLoading={isReferenceOCRLoading} inputType="reference" /></div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="essayType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>作文类型</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder="选择类型" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="gaokao-english-continuation">高考英语 读后续写</SelectItem>
                                                {/* Other items */}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Card 2: Essay Input */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">文章录入</CardTitle>
                                <CardDescription>录入待批改的作文，支持文字识别。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField control={form.control} name="essayText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>录入习作</FormLabel>
                                        <FormControl>
                                            <div className="grid w-full gap-1.5">
                                                <Textarea placeholder="在这里输入你的作文…" className="min-h-[200px] max-h-[400px]" {...field} />
                                                <div className="flex justify-end"><OCRButton isLoading={isEssayOCRLoading} inputType="essay" /></div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Card 3: Correction Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">批改选项</CardTitle>
                                <CardDescription>自定义生成结果的展示内容。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField control={form.control} name="model" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>选择模型</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="选择模型" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {/* <SelectItem value="gpt4">GPT-4o</SelectItem> */}
                                                <SelectItem value="deepseek">Deepseek-v3</SelectItem>
                                                <SelectItem value="llama">Llama 3.3</SelectItem>
                                                <SelectItem value="qwen">通义千问 3</SelectItem>
                                                <SelectItem value="glm">智谱清言 4</SelectItem>
                                                <SelectItem value="gemini">Google Gemini 2</SelectItem>
                                                {/* Other items */}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="tone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>讲解语气 <span className="text-sm text-muted-foreground">*实验性</span></FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="选择语气" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="default">默认</SelectItem>
                                                <SelectItem value="serious">一本正经</SelectItem>
                                                <SelectItem value="humorous">幽默风趣</SelectItem>
                                                <SelectItem value="sharp">犀利锐评</SelectItem>
                                                {/* Other items */}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit Button Area - Button type is submit, triggers form.handleSubmit */}
                    <div className="flex justify-end mt-8">
                        <Button
                            type="submit" // This button now triggers the dialog via onSubmit
                            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary flex items-center gap-2"
                            // Disable the main submit button while the correction process (including dialog interaction) is active
                            disabled={isCorrectionLoading}
                        >
                            {/* The main button no longer shows loading itself, the dialog handles it */}
                            <Check className="h-4 w-4" />
                            开始批改
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Image Selection Modal/Drawer (OCR) */}
            {isDesktop ? (
                <Dialog open={isDrawerOpen} onOpenChange={(open) => { setIsDrawerOpen(open); if (!open) resetImageStates(); }}>
                    <DialogContent className="sm:max-w-[550px] h-[75vh] flex flex-col">
                        <DialogHeader><DialogTitle>文字识别</DialogTitle><DialogDescription>请选择要识别的图片</DialogDescription></DialogHeader>
                        <div className="flex-grow overflow-y-auto py-4">{renderImageSelectionContent()}</div>
                        {renderImageSelectionFooter()}
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={isDrawerOpen} onOpenChange={(open) => { setIsDrawerOpen(open); if (!open) resetImageStates(); }}>
                    <DrawerContent className="h-[85vh] flex flex-col">
                        <DrawerHeader className="text-left"><DrawerTitle>文字识别</DrawerTitle><DrawerDescription>请选择要识别的图片</DrawerDescription></DrawerHeader>
                        <div className="flex-grow overflow-y-auto px-4 py-4">{renderImageSelectionContent()}</div>
                        <DrawerFooter className="flex-row justify-end gap-2 border-t pt-4">{renderImageSelectionFooter()}</DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )}

            {/* Confirmation Dialog - Rendered here, controlled by state */}
            <ConfirmCorrectionDialog
                isOpen={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                onConfirm={startCorrectionProcess} // Pass the actual API call function
                formData={pendingFormData}
                isLoading={isCorrectionLoading}
                progress={correctionProgress}
                progressMessage={correctionProgressMessage}
            />
        </div>
    )
}