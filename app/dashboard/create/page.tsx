/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, usePathname } from "next/navigation"
import React, { useState, useCallback, useEffect, useRef } from "react"
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
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import imageCompression from 'browser-image-compression';
import { Switch } from "@/components/ui/switch"
import { v4 as uuidv4 } from 'uuid';

// Define Form Schema Type
const formSchema = z.object({
    title: z.string().min(0),
    originalText: z.string().min(1, { message: "请输入原题题干" }),
    referenceText: z.string().min(0),
    essayType: z.string().min(1, { message: "请选择作文类型" }),
    essayText: z.string().optional(),
    model: z.string().min(1, { message: "请选择模型" }),
    tone: z.string().min(1, { message: "请选择语气" })
});
type FormData = z.infer<typeof formSchema>;

type FormSubmitData = Omit<FormData, 'essayText'> & { essayText?: string; essayTexts?: string[] };

interface BatchEssayItem {
    id: string;
    file: File | null;
    previewUrl: string;
    ocrText: string;
    ocrStatus: 'idle' | 'loading' | 'success' | 'error';
    errorMessage?: string;
}

interface OcrQueueItem {
    batchItemId: string;
    file: File;
}

interface ConfirmCorrectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    formData: FormSubmitData | null;
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

    const essayCount = formData.essayTexts ? formData.essayTexts.length : (formData.essayText ? 1 : 0);

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
                     <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-right text-muted-foreground">习作数量</Label>
                        <div className="col-span-2 font-medium">{essayCount} 篇</div>
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


export default function CreatePage() {
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isCorrectionLoading, setIsCorrectionLoading] = useState(false);
    const [correctionProgress, setCorrectionProgress] = useState(0);
    const [correctionProgressMessage, setCorrectionProgressMessage] = useState("");
    const [pendingFormData, setPendingFormData] = useState<FormSubmitData | null>(null);
    const router = useRouter();
    const currentPathname = usePathname();

    const [originalTextTab, setOriginalTextTab] = useState("manual");
    const [referenceTextTab, setReferenceTextTab] = useState("manual");
    const [essayTextTab, setEssayTextTab] = useState("manual");

    const [isOriginalTextOcrLoading, setIsOriginalTextOcrLoading] = useState(false);
    const [isReferenceTextOcrLoading, setIsReferenceTextOcrLoading] = useState(false);
    const [isEssayTextOcrLoading, setIsEssayTextOcrLoading] = useState(false);

    const [originalTextPreview, setOriginalTextPreview] = useState<string | null>(null);
    const [referenceTextPreview, setReferenceTextPreview] = useState<string | null>(null);
    const [essayTextPreview, setEssayTextPreview] = useState<string | null>(null);

    const [isBatchModeEssay, setIsBatchModeEssay] = useState(false);
    const [batchEssays, setBatchEssays] = useState<BatchEssayItem[]>([]);
    const [ocrProcessingQueue, setOcrProcessingQueue] = useState<OcrQueueItem[]>([]);
    const [activeOcrCount, setActiveOcrCount] = useState(0);
    const MAX_CONCURRENT_OCR = 2;
    const draggedItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const batchEssaysRef = useRef<BatchEssayItem[]>(batchEssays); // For unmount cleanup

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            originalText: "",
            referenceText: "",
            essayType: "gaokao-english-continuation",
            essayText: "",
            model: "gemini",
            tone: "default"
        }
    });

    useEffect(() => {
        batchEssaysRef.current = batchEssays;
    }, [batchEssays]);

    useEffect(() => {
        return () => {
            if (originalTextPreview) URL.revokeObjectURL(originalTextPreview);
            if (referenceTextPreview) URL.revokeObjectURL(referenceTextPreview);
            if (essayTextPreview) URL.revokeObjectURL(essayTextPreview);
        };
    }, [originalTextPreview, referenceTextPreview, essayTextPreview]);

    useEffect(() => {
        // Unmount cleanup for batch essay previews
        return () => {
            batchEssaysRef.current.forEach(item => {
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
        };
    }, []); // Empty dependency array for unmount only


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
                headers: { 'Content-Type': 'application/json' },
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
            const errorMessage = e instanceof Error ? e.message : '发生未知错误';
            toast.error(`批改请求失败: ${errorMessage}`);
            setCorrectionProgressMessage(`错误: ${errorMessage}`);
        } finally {
            if (!currentPathname?.includes('/dashboard/correction/wait/')) {
                 setIsCorrectionLoading(false);
            }
        }
    };

    const onSubmit = (values: FormData) => {
        const dataToSubmit: FormSubmitData = { ...values };

        if (isBatchModeEssay) {
            const texts = batchEssays
                .filter(e => e.ocrStatus === 'success' && e.ocrText && e.ocrText.trim() !== "")
                .map(e => e.ocrText);

            if (texts.length === 0) {
                toast.error("批量模式下至少需要一篇成功识别且包含文本的习作。");
                return;
            }
            dataToSubmit.essayTexts = texts;
            delete dataToSubmit.essayText;
        } else {
            if (!values.essayText || values.essayText.trim() === "") {
                form.setError("essayText", { type: "manual", message: "请输入习作" });
                toast.error("请输入习作内容。");
                return;
            }
            delete (dataToSubmit as any).essayTexts;
        }
        setPendingFormData(dataToSubmit);
        setCorrectionProgress(0);
        setCorrectionProgressMessage("");
        setIsConfirmDialogOpen(true);
    };

    const runOcrProcess = useCallback(async (file: File, onSuccess: (text: string) => void, onError: (message: string) => void) => {
        toast.info("正在压缩图片并识别文字...");
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedFile = await imageCompression(file, options);
            const formData = new FormData();
            formData.append('file', compressedFile, compressedFile.name);

            const response = await fetch('/api/ocr', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                onSuccess(result.text);
                toast.success("文字识别成功！");
            } else {
                onError(result.message || "文字识别失败。");
                toast.error(result.message || "文字识别失败。");
            }
        } catch (error) {
            console.error('OCR Error:', error);
            const message = error instanceof Error ? error.message : "处理图片或识别文字时发生错误。";
            onError(message);
            toast.error(message);
        }
    }, []);

    const handleSingleFieldOcrUpload = useCallback(async (
        file: File,
        fieldName: keyof Pick<FormData, 'originalText' | 'referenceText' | 'essayText'>,
        currentPreview: string | null,
        setLoading: (loading: boolean) => void,
        setPreview: (url: string | null) => void
    ) => {
        if (!file) return;
        if (currentPreview) URL.revokeObjectURL(currentPreview);

        const newPreviewUrl = URL.createObjectURL(file);
        setPreview(newPreviewUrl);
        setLoading(true);

        await runOcrProcess(
            file,
            (text) => form.setValue(fieldName, text),
            () => { /* Error already toasted, preview remains */ }
        );
        setLoading(false);
    }, [form, runOcrProcess]);

    // Batch OCR Processing Effect
    useEffect(() => {
        const canProcessCount = MAX_CONCURRENT_OCR - activeOcrCount;
        if (canProcessCount > 0 && ocrProcessingQueue.length > 0) {
            const itemsToProcessNow = ocrProcessingQueue.slice(0, canProcessCount);
            const remainingQueue = ocrProcessingQueue.slice(canProcessCount);

            setOcrProcessingQueue(remainingQueue); // Update queue state first
            setActiveOcrCount(prev => prev + itemsToProcessNow.length);

            itemsToProcessNow.forEach(item => {
                setBatchEssays(prevEssays =>
                    prevEssays.map(be =>
                        be.id === item.batchItemId ? { ...be, ocrStatus: 'loading' } : be
                    )
                );

                runOcrProcess(
                    item.file,
                    (text) => {
                        setBatchEssays(prevEssays =>
                            prevEssays.map(be =>
                                be.id === item.batchItemId ? { ...be, ocrText: text, ocrStatus: 'success' } : be
                            )
                        );
                        setActiveOcrCount(c => c - 1);
                    },
                    (message) => {
                        setBatchEssays(prevEssays =>
                            prevEssays.map(be =>
                                be.id === item.batchItemId ? { ...be, ocrStatus: 'error', errorMessage: message } : be
                            )
                        );
                        setActiveOcrCount(c => c - 1);
                    }
                );
            });
        }
    }, [activeOcrCount, ocrProcessingQueue, runOcrProcess, MAX_CONCURRENT_OCR]);


    const handleBatchFilesUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newItems: BatchEssayItem[] = [];
        const newQueueItems: OcrQueueItem[] = [];

        Array.from(files).forEach(file => {
            const id = uuidv4();
            const previewUrl = URL.createObjectURL(file);
            newItems.push({ id, file, previewUrl, ocrText: "", ocrStatus: 'idle' });
            newQueueItems.push({ batchItemId: id, file });
        });

        setBatchEssays(prev => [...prev, ...newItems]);
        setOcrProcessingQueue(prev => [...prev, ...newQueueItems]);
    };
    
    const handleBatchFileChangeFromInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleBatchFilesUpload(event.target.files);
        event.target.value = ''; // Allow re-uploading same files
    };

    const handleBatchFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        handleBatchFilesUpload(event.dataTransfer.files);
    };


    const handleRemoveBatchItem = (idToRemove: string) => {
        const itemToRemove = batchEssays.find(item => item.id === idToRemove);
        if (itemToRemove?.previewUrl) {
            URL.revokeObjectURL(itemToRemove.previewUrl);
        }
        setBatchEssays(prev => prev.filter(item => item.id !== idToRemove));
        setOcrProcessingQueue(prev => prev.filter(item => item.batchItemId !== idToRemove));
        // If item was loading and removed, activeOcrCount will decrement when its promise (eventually) resolves/rejects.
        // If it was 'idle' in queue, it's simply removed.
        // If it was 'loading', its OCR process might still complete, but its result won't update state for a non-existent item.
        // To be perfectly clean, one might need to cancel the OCR if possible, but for now, this is okay.
    };

    const handleBatchTextChange = (id: string, text: string) => {
        setBatchEssays(prev => prev.map(item => item.id === id ? { ...item, ocrText: text } : item));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        draggedItem.current = index;
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = () => {
        if (draggedItem.current === null || dragOverItem.current === null || draggedItem.current === dragOverItem.current) {
            return;
        }
        setBatchEssays(prev => {
            const newItems = [...prev];
            const [dragged] = newItems.splice(draggedItem.current!, 1);
            newItems.splice(dragOverItem.current!, 0, dragged);
            return newItems;
        });
        draggedItem.current = null;
        dragOverItem.current = null;
    };

    const createFieldSpecificHandlers = (
        fieldName: keyof Pick<FormData, 'originalText' | 'referenceText' | 'essayText'>,
        currentPreview: string | null,
        setLoading: (loading: boolean) => void,
        setPreview: (url: string | null) => void
    ) => {
        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) handleSingleFieldOcrUpload(file, fieldName, currentPreview, setLoading, setPreview);
            event.target.value = '';
        };
        const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            const file = event.dataTransfer.files?.[0];
            if (file) handleSingleFieldOcrUpload(file, fieldName, currentPreview, setLoading, setPreview);
        };
        return { handleFileChange, handleDrop };
    };

    const originalTextHandlers = createFieldSpecificHandlers('originalText', originalTextPreview, setIsOriginalTextOcrLoading, setOriginalTextPreview);
    const referenceTextHandlers = createFieldSpecificHandlers('referenceText', referenceTextPreview, setIsReferenceTextOcrLoading, setReferenceTextPreview);
    const essayTextHandlers = createFieldSpecificHandlers('essayText', essayTextPreview, setIsEssayTextOcrLoading, setEssayTextPreview);

    const handleDragOverGeneric = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const isAnyOcrLoading = isOriginalTextOcrLoading || isReferenceTextOcrLoading ||
                            (isBatchModeEssay ? batchEssays.some(e => e.ocrStatus === 'loading') : isEssayTextOcrLoading);

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">题干录入</CardTitle>
                                <CardDescription>录入原题及范文。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>标题 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                        <FormControl><input type="text" placeholder="留白以自动生成" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="originalText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>原题题干</FormLabel>
                                        <Tabs value={originalTextTab} onValueChange={setOriginalTextTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="manual">手动输入</TabsTrigger><TabsTrigger value="ocr">图像识别</TabsTrigger></TabsList>
                                            <TabsContent value="manual">
                                                <FormControl><Textarea placeholder="在这里输入原题题干…" className="min-h-[100px] max-h-[200px]" {...field} /></FormControl>
                                                <FormMessage />
                                            </TabsContent>
                                            <TabsContent value="ocr">
                                                <div className={`relative flex flex-col items-center justify-center p-2 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors overflow-hidden ${isOriginalTextOcrLoading ? 'opacity-50 cursor-not-allowed' : ''} ${originalTextPreview ? 'min-h-[100px] max-h-[200px]' : 'min-h-[100px]'}`}
                                                    onDrop={originalTextHandlers.handleDrop} onDragOver={handleDragOverGeneric} onClick={() => !isOriginalTextOcrLoading && document.getElementById('originalText-ocr-input')?.click()}>
                                                    {isOriginalTextOcrLoading ? (<div className="flex flex-col items-center"><Loader2 className="h-8 w-8 animate-spin mb-2" /><p className="text-sm">正在识别中...</p></div>)
                                                        : originalTextPreview ? (<div className="relative w-full h-full flex items-center justify-center"><div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-center text-sm p-2">点击或拖拽新图片替换</div><img src={originalTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain" /></div>)
                                                            : (<><ImagePlus className="h-8 w-8 mb-2" /><p className="text-sm text-center">拖拽图片到此处或点击上传</p></>)}
                                                    <input id="originalText-ocr-input" type="file" accept="image/*" className="hidden" onChange={originalTextHandlers.handleFileChange} disabled={isOriginalTextOcrLoading} />
                                                </div>
                                                <FormMessage />
                                            </TabsContent>
                                        </Tabs>
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="referenceText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>参考范文 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                        <Tabs value={referenceTextTab} onValueChange={setReferenceTextTab} className="w-full">
                                            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="manual">手动输入</TabsTrigger><TabsTrigger value="ocr">图像识别</TabsTrigger></TabsList>
                                            <TabsContent value="manual">
                                                <FormControl><Textarea placeholder="在这里输入参考范文…" className="min-h-[100px] max-h-[200px]" {...field} /></FormControl>
                                                <FormMessage />
                                            </TabsContent>
                                            <TabsContent value="ocr">
                                                <div className={`relative flex flex-col items-center justify-center p-2 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors overflow-hidden ${isReferenceTextOcrLoading ? 'opacity-50 cursor-not-allowed' : ''} ${referenceTextPreview ? 'min-h-[100px] max-h-[200px]' : 'min-h-[100px]'}`}
                                                    onDrop={referenceTextHandlers.handleDrop} onDragOver={handleDragOverGeneric} onClick={() => !isReferenceTextOcrLoading && document.getElementById('referenceText-ocr-input')?.click()}>
                                                    {isReferenceTextOcrLoading ? (<div className="flex flex-col items-center"><Loader2 className="h-8 w-8 animate-spin mb-2" /><p className="text-sm">正在识别中...</p></div>)
                                                        : referenceTextPreview ? (<div className="relative w-full h-full flex items-center justify-center"><div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-center text-sm p-2">点击或拖拽新图片替换</div><img src={referenceTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain" /></div>)
                                                            : (<><ImagePlus className="h-8 w-8 mb-2" /><p className="text-sm text-center">拖拽图片到此处或点击上传</p></>)}
                                                    <input id="referenceText-ocr-input" type="file" accept="image/*" className="hidden" onChange={referenceTextHandlers.handleFileChange} disabled={isReferenceTextOcrLoading} />
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
                                                <SelectItem value="gaokao-english-practical">高考英语 应用文</SelectItem>
                                                <SelectItem value="gaokao-chinese-composition">高考语文 作文</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">文章录入</CardTitle>
                                <CardDescription>录入待批改的作文。 {isBatchModeEssay && <span className="font-semibold text-primary">批量模式已开启</span>}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Switch
                                        id="batch-mode-switch"
                                        checked={isBatchModeEssay}
                                        onCheckedChange={setIsBatchModeEssay}
                                    />
                                    <Label htmlFor="batch-mode-switch">批量批改模式</Label>
                                </div>

                                {!isBatchModeEssay ? (
                                    <FormField control={form.control} name="essayText" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>录入习作 (单篇)</FormLabel>
                                            <Tabs value={essayTextTab} onValueChange={setEssayTextTab} className="w-full">
                                                <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="manual">手动输入</TabsTrigger><TabsTrigger value="ocr">图像识别</TabsTrigger></TabsList>
                                                <TabsContent value="manual">
                                                    <FormControl><Textarea placeholder="在这里输入你的作文…" className="min-h-[200px] max-h-[400px]" {...field} /></FormControl>
                                                    <FormMessage />
                                                </TabsContent>
                                                <TabsContent value="ocr">
                                                    <div className={`relative flex flex-col items-center justify-center p-2 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors overflow-hidden ${isEssayTextOcrLoading ? 'opacity-50 cursor-not-allowed' : ''} ${essayTextPreview ? 'min-h-[200px] max-h-[400px]' : 'min-h-[200px]'}`}
                                                        onDrop={essayTextHandlers.handleDrop} onDragOver={handleDragOverGeneric} onClick={() => !isEssayTextOcrLoading && document.getElementById('essayText-ocr-input')?.click()}>
                                                        {isEssayTextOcrLoading ? (<div className="flex flex-col items-center"><Loader2 className="h-8 w-8 animate-spin mb-2" /><p className="text-sm">正在识别中...</p></div>)
                                                            : essayTextPreview ? (<div className="relative w-full h-full flex items-center justify-center"><div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-center text-sm p-2">点击或拖拽新图片替换</div><img src={essayTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain" /></div>)
                                                                : (<><ImagePlus className="h-8 w-8 mb-2" /><p className="text-sm text-center">拖拽图片到此处或点击上传</p></>)}
                                                        <input id="essayText-ocr-input" type="file" accept="image/*" className="hidden" onChange={essayTextHandlers.handleFileChange} disabled={isEssayTextOcrLoading} />
                                                    </div>
                                                    <FormMessage />
                                                </TabsContent>
                                            </Tabs>
                                        </FormItem>
                                    )} />
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="batch-essay-dropzone">上传习作图片 (可多选或拖拽)</Label>
                                            <div
                                                id="batch-essay-dropzone"
                                                className={`mt-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors min-h-[120px] ${ (activeOcrCount > 0 && ocrProcessingQueue.length >= MAX_CONCURRENT_OCR - activeOcrCount) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onDrop={handleBatchFileDrop}
                                                onDragOver={handleDragOverGeneric}
                                                onClick={() => !(activeOcrCount > 0 && ocrProcessingQueue.length >= MAX_CONCURRENT_OCR - activeOcrCount) && document.getElementById('batch-essay-input-hidden')?.click()}
                                            >
                                                <ImagePlus className="h-8 w-8 mb-2" />
                                                <p className="text-sm text-center">拖拽图片到此处或点击上传</p>
                                                <p className="text-xs text-muted-foreground">支持多选</p>
                                            </div>
                                            <input
                                                id="batch-essay-input-hidden"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleBatchFileChangeFromInput}
                                                className="hidden"
                                                disabled={(activeOcrCount > 0 && ocrProcessingQueue.length >= MAX_CONCURRENT_OCR - activeOcrCount)}
                                            />
                                             {activeOcrCount > 0 && <p className="text-sm text-muted-foreground mt-1">正在处理 {activeOcrCount} 张图片... {ocrProcessingQueue.length > 0 ? `队列中还有 ${ocrProcessingQueue.length} 张` : ''}</p>}
                                        </div>

                                        {batchEssays.length > 0 && <p className="text-sm text-muted-foreground">拖动习作可调整顺序。共 {batchEssays.length} 篇。</p>}
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                            {batchEssays.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onDragOver={(e) => handleDragOver(e, index)}
                                                    onDrop={handleDrop}
                                                    className="flex items-start gap-3 p-3 border rounded-md bg-background hover:shadow-md cursor-grab relative"
                                                >
                                                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium z-10">
                                                        {index + 1}
                                                    </div>
                                                    <div className="w-20 h-20 flex-shrink-0 border rounded overflow-hidden bg-muted ml-3 mt-3">
                                                        {item.previewUrl && <img src={item.previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <Textarea
                                                            placeholder="OCR识别结果将显示在此..."
                                                            value={item.ocrText}
                                                            onChange={(e) => handleBatchTextChange(item.id, e.target.value)}
                                                            className="min-h-[80px] text-sm h-28 resize-none" // Added h-28 and resize-none
                                                            rows={5} // Added rows={5}
                                                            disabled={item.ocrStatus === 'loading'}
                                                        />
                                                        {item.ocrStatus === 'loading' && <p className="text-xs text-muted-foreground mt-1 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" />识别中...</p>}
                                                        {item.ocrStatus === 'error' && <p className="text-xs text-red-500 mt-1">错误: {item.errorMessage}</p>}
                                                        {item.ocrStatus === 'success' && !item.ocrText && <p className="text-xs text-amber-600 mt-1">识别完成，但未检测到文本。</p>}
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveBatchItem(item.id)} disabled={item.ocrStatus === 'loading'}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        {batchEssays.length === 0 && isBatchModeEssay && (
                                            <p className="text-sm text-muted-foreground text-center py-4">请上传习作图片开始批量批改。</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
                                                <SelectItem value="llama">Llama 3.1 70B</SelectItem>
                                                <SelectItem value="qwen">通义千问 2.5</SelectItem>
                                                <SelectItem value="glm">智谱清言 GLM-4</SelectItem>
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
                            disabled={isCorrectionLoading || isAnyOcrLoading}
                        >
                            {isAnyOcrLoading ? (
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