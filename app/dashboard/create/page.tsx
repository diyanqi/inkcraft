'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, usePathname } from "next/navigation"
import React, { useState, useCallback, useEffect } from "react" // Import useEffect
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, ScanText, ImagePlus, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { inngest } from "@/lib/inngest"
import imageCompression from 'browser-image-compression';

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
    onConfirm: () => void;
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
    if (!formData) return null;

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

                    {isLoading && (
                        <div className="mt-4 pt-4 border-t">
                            <Label className="text-sm font-medium">批改进度</Label>
                            <Progress value={progress} className="w-full mt-2" />
                            <p className="text-sm text-muted-foreground mt-1 text-center">{progressMessage || "准备开始..."}</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {!isLoading ? (
                        <>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    取消
                                </Button>
                            </DialogClose>
                            <Button type="button" onClick={onConfirm}>
                                确认批改
                            </Button>
                        </>
                    ) : (
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
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isCorrectionLoading, setIsCorrectionLoading] = useState(false);
    const [correctionProgress, setCorrectionProgress] = useState(0);
    const [correctionProgressMessage, setCorrectionProgressMessage] = useState("");
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
    const router = useRouter();
    const currentPathname = usePathname();

    // State for managing tabs
    const [originalTextTab, setOriginalTextTab] = useState("manual");
    const [referenceTextTab, setReferenceTextTab] = useState("manual");
    const [essayTextTab, setEssayTextTab] = useState("manual");

    // State for managing OCR loading
    const [isOriginalTextOcrLoading, setIsOriginalTextOcrLoading] = useState(false);
    const [isReferenceTextOcrLoading, setIsReferenceTextOcrLoading] = useState(false);
    const [isEssayTextOcrLoading, setIsEssayTextOcrLoading] = useState(false);

    // State for storing image previews
    const [originalTextPreview, setOriginalTextPreview] = useState<string | null>(null);
    const [referenceTextPreview, setReferenceTextPreview] = useState<string | null>(null);
    const [essayTextPreview, setEssayTextPreview] = useState<string | null>(null);


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

    // Effect to revoke object URLs when component unmounts or previews change
    useEffect(() => {
        return () => {
            if (originalTextPreview) URL.revokeObjectURL(originalTextPreview);
            if (referenceTextPreview) URL.revokeObjectURL(referenceTextPreview);
            if (essayTextPreview) URL.revokeObjectURL(essayTextPreview);
        };
    }, [originalTextPreview, referenceTextPreview, essayTextPreview]); // Re-run if previews change (though primarily for unmount)


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
                toast.success('批改任务已提交！请过三分钟后刷新页面查看结果。');
                if (data.uuid) {
                     router.push(`/dashboard/correction/wait/${data.uuid}`);
                }
            } else {
                throw new Error(data.message || '提交失败');
            }
        } catch (e) {
            console.error('Correction Process Error:', e);
            toast.error(e instanceof Error ? e.message : '发生未知错误');
            setIsConfirmDialogOpen(false);
        } finally {
            if (!currentPathname?.includes('/dashboard/correction/wait/')) {
                 setIsCorrectionLoading(false);
                 setPendingFormData(null);
            }
        }
    };

    const onSubmit = (values: FormData) => {
        setPendingFormData(values);
        setCorrectionProgress(0);
        setCorrectionProgressMessage("");
        setIsConfirmDialogOpen(true);
    };

    // --- OCR Handling Logic ---

    const handleOcrUpload = useCallback(async (file: File, fieldName: keyof FormData, currentPreview: string | null) => {
        if (!file) return;

        // Revoke previous preview URL if it exists
        if (currentPreview) {
            URL.revokeObjectURL(currentPreview);
        }

        // Create and set new preview URL immediately
        const newPreviewUrl = URL.createObjectURL(file);
        if (fieldName === 'originalText') setOriginalTextPreview(newPreviewUrl);
        else if (fieldName === 'referenceText') setReferenceTextPreview(newPreviewUrl);
        else if (fieldName === 'essayText') setEssayTextPreview(newPreviewUrl);


        // Set loading state based on field
        if (fieldName === 'originalText') setIsOriginalTextOcrLoading(true);
        else if (fieldName === 'referenceText') setIsReferenceTextOcrLoading(true);
        else if (fieldName === 'essayText') setIsEssayTextOcrLoading(true);

        toast.info("正在压缩图片并识别文字...");

        try {
            // Compress image
            const options = {
                maxSizeMB: 1, // Max size in MB
                maxWidthOrHeight: 1920, // Max width/height
                useWebWorker: true, // Use web worker for better performance
            };
            const compressedFile = await imageCompression(file, options);

            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', compressedFile, compressedFile.name);

            // Call OCR API
            const response = await fetch('/api/ocr', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                form.setValue(fieldName, result.text); // Set form value
                toast.success("文字识别成功！");
                // Keep the image preview displayed
            } else {
                toast.error(result.message || "文字识别失败。");
                // Optionally clear the preview on failure? Let's keep it for now.
            }

        } catch (error) {
            console.error('OCR Error:', error);
            toast.error("处理图片或识别文字时发生错误。");
             // Optionally clear the preview on error? Let's keep it for now.
        } finally {
             // Reset loading state based on field
            if (fieldName === 'originalText') setIsOriginalTextOcrLoading(false);
            else if (fieldName === 'referenceText') setIsReferenceTextOcrLoading(false);
            else if (fieldName === 'essayText') setIsEssayTextOcrLoading(false);
        }
    }, [form]); // Depend on form instance

    // Helper to handle file input change
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormData, currentPreview: string | null) => {
        const file = event.target.files?.[0];
        if (file) {
            handleOcrUpload(file, fieldName, currentPreview);
        }
        // Clear the input value so the same file can be selected again
        event.target.value = '';
    };

    // Helper to handle drop event
    const handleDrop = (event: React.DragEvent<HTMLDivElement>, fieldName: keyof FormData, currentPreview: string | null) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleOcrUpload(file, fieldName, currentPreview);
        }
    };

    // Prevent default drag behavior
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };


    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Card: 题干录入 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">题干录入</CardTitle>
                                <CardDescription>录入原题及范文。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>标题 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                        <FormControl><input type="text" placeholder="留白以自动生成" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {/* Original Text Field with Tabs */}
                                <FormField control={form.control} name="originalText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>原题题干</FormLabel>
                                        <Tabs value={originalTextTab} onValueChange={setOriginalTextTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="manual">手动输入</TabsTrigger>
                                                <TabsTrigger value="ocr">图像识别</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="manual">
                                                <FormControl>
                                                    <Textarea placeholder="在这里输入原题题干…" className="min-h-[100px] max-h-[200px]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </TabsContent>
                                            <TabsContent value="ocr">
                                                <div
                                                    className={`relative flex flex-col items-center justify-center p-2 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors overflow-hidden ${isOriginalTextOcrLoading ? 'opacity-50 cursor-not-allowed' : ''} ${originalTextPreview ? 'min-h-[100px] max-h-[200px]' : 'min-h-[100px]'}`} // Added relative, overflow, min/max height
                                                    onDrop={(e) => handleDrop(e, 'originalText', originalTextPreview)} // Pass current preview
                                                    onDragOver={handleDragOver}
                                                    onClick={() => document.getElementById('originalText-ocr-input')?.click()}
                                                >
                                                     {isOriginalTextOcrLoading ? (
                                                        // Loading state (can overlay image if needed, but simple replacement is fine)
                                                        <div className="flex flex-col items-center">
                                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                            <p className="text-sm">正在识别中...</p>
                                                        </div>
                                                     ) : originalTextPreview ? (
                                                        // Image preview state
                                                        <div className="relative w-full h-full flex items-center justify-center">
                                                             {/* Hint Overlay */}
                                                             <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-center text-sm p-2">
                                                                 点击或拖拽新图片替换
                                                             </div>
                                                            <img src={originalTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain" />
                                                        </div>
                                                     ) : (
                                                        // Initial state (dashed box)
                                                        <>
                                                            <ImagePlus className="h-8 w-8 mb-2" />
                                                            <p className="text-sm text-center">拖拽图片到此处或点击上传</p>
                                                        </>
                                                     )}
                                                    <input
                                                        id="originalText-ocr-input"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange(e, 'originalText', originalTextPreview)} // Pass current preview
                                                        disabled={isOriginalTextOcrLoading}
                                                    />
                                                </div>
                                                <FormMessage /> {/* Display message below the upload area */}
                                            </TabsContent>
                                        </Tabs>
                                    </FormItem>
                                )} />

                                {/* Reference Text Field with Tabs */}
                                <FormField control={form.control} name="referenceText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>参考范文 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                        <Tabs value={referenceTextTab} onValueChange={setReferenceTextTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="manual">手动输入</TabsTrigger>
                                                <TabsTrigger value="ocr">图像识别</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="manual">
                                                <FormControl>
                                                    <Textarea placeholder="在这里输入参考范文…" className="min-h-[100px] max-h-[200px]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </TabsContent>
                                            <TabsContent value="ocr">
                                                 <div
                                                    className={`relative flex flex-col items-center justify-center p-2 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors overflow-hidden ${isReferenceTextOcrLoading ? 'opacity-50 cursor-not-allowed' : ''} ${referenceTextPreview ? 'min-h-[100px] max-h-[200px]' : 'min-h-[100px]'}`} // Added relative, overflow, min/max height
                                                    onDrop={(e) => handleDrop(e, 'referenceText', referenceTextPreview)} // Pass current preview
                                                    onDragOver={handleDragOver}
                                                    onClick={() => document.getElementById('referenceText-ocr-input')?.click()}
                                                >
                                                     {isReferenceTextOcrLoading ? (
                                                        <div className="flex flex-col items-center">
                                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                            <p className="text-sm">正在识别中...</p>
                                                        </div>
                                                     ) : referenceTextPreview ? (
                                                         <div className="relative w-full h-full flex items-center justify-center">
                                                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-center text-sm p-2">
                                                                  点击或拖拽新图片替换
                                                              </div>
                                                             <img src={referenceTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain" />
                                                         </div>
                                                     ) : (
                                                        <>
                                                            <ImagePlus className="h-8 w-8 mb-2" />
                                                            <p className="text-sm text-center">拖拽图片到此处或点击上传</p>
                                                        </>
                                                     )}
                                                    <input
                                                        id="referenceText-ocr-input"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange(e, 'referenceText', referenceTextPreview)} // Pass current preview
                                                        disabled={isReferenceTextOcrLoading}
                                                    />
                                                </div>
                                                <FormMessage />
                                            </TabsContent>
                                        </Tabs>
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="essayType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>作文类型</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder="选择类型" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="gaokao-english-continuation">高考英语 读后续写</SelectItem>
                                                {/* Add other types if needed */}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Card: 文章录入 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">文章录入</CardTitle>
                                <CardDescription>录入待批改的作文。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {/* Essay Text Field with Tabs */}
                                <FormField control={form.control} name="essayText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>录入习作</FormLabel>
                                        <Tabs value={essayTextTab} onValueChange={setEssayTextTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="manual">手动输入</TabsTrigger>
                                                <TabsTrigger value="ocr">图像识别</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="manual">
                                                <FormControl>
                                                    <Textarea placeholder="在这里输入你的作文…" className="min-h-[200px] max-h-[400px]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </TabsContent>
                                            <TabsContent value="ocr">
                                                <div
                                                    className={`relative flex flex-col items-center justify-center p-2 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors overflow-hidden ${isEssayTextOcrLoading ? 'opacity-50 cursor-not-allowed' : ''} ${essayTextPreview ? 'min-h-[200px] max-h-[400px]' : 'min-h-[200px]'}`} // Added relative, overflow, min/max height
                                                    onDrop={(e) => handleDrop(e, 'essayText', essayTextPreview)} // Pass current preview
                                                    onDragOver={handleDragOver}
                                                    onClick={() => document.getElementById('essayText-ocr-input')?.click()}
                                                >
                                                     {isEssayTextOcrLoading ? (
                                                        <div className="flex flex-col items-center">
                                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                            <p className="text-sm">正在识别中...</p>
                                                        </div>
                                                     ) : essayTextPreview ? (
                                                         <div className="relative w-full h-full flex items-center justify-center">
                                                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-center text-sm p-2">
                                                                  点击或拖拽新图片替换
                                                              </div>
                                                             <img src={essayTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain" />
                                                         </div>
                                                     ) : (
                                                        <>
                                                            <ImagePlus className="h-8 w-8 mb-2" />
                                                            <p className="text-sm text-center">拖拽图片到此处或点击上传</p>
                                                        </>
                                                     )}
                                                    <input
                                                        id="essayText-ocr-input"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange(e, 'essayText', essayTextPreview)} // Pass current preview
                                                        disabled={isEssayTextOcrLoading}
                                                    />
                                                </div>
                                                <FormMessage />
                                            </TabsContent>
                                        </Tabs>
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Card: 批改选项 */}
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
                                                <SelectItem value="deepseek">Deepseek-v3</SelectItem>
                                                <SelectItem value="llama">Llama 3.3</SelectItem>
                                                <SelectItem value="qwen">通义千问 3</SelectItem>
                                                <SelectItem value="glm">智谱清言 4</SelectItem>
                                                <SelectItem value="gemini">Google Gemini 2</SelectItem>
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
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end mt-8">
                        <Button
                            type="submit"
                            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary flex items-center gap-2"
                            disabled={isCorrectionLoading || isOriginalTextOcrLoading || isReferenceTextOcrLoading || isEssayTextOcrLoading} // Disable submit button during OCR
                        >
                            {(isOriginalTextOcrLoading || isReferenceTextOcrLoading || isEssayTextOcrLoading) ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                            开始批改
                        </Button>
                    </div>
                </form>
            </Form>

            <ConfirmCorrectionDialog
                isOpen={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                onConfirm={startCorrectionProcess}
                formData={pendingFormData}
                isLoading={isCorrectionLoading}
                progress={correctionProgress}
                progressMessage={correctionProgressMessage}
            />
        </div>
    )
}
