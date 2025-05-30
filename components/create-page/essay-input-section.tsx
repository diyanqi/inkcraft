// components/create-page/essay-input-section.tsx
import React, { useState, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "@/types/create";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ImagePlus,
    Loader2,
    Trash2,
    GripVertical,
    AlertTriangle,
    Clock,
    CheckCircle2,
    FileText,
    ImageIcon,
    SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useBatchOcrProcessing } from "@/hooks/use-batch-ocr-processing";
import { runOcrProcess, handleDragOverGeneric } from "@/lib/ocr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface EssayInputSectionProps {
    form: UseFormReturn<FormData>;
    isBatchModeEssay: boolean;
    setIsBatchModeEssay: (isBatch: boolean) => void;
    onOcrLoadingChange: (isLoading: boolean) => void;
}

export function EssayInputSection({
    form,
    isBatchModeEssay,
    setIsBatchModeEssay,
    onOcrLoadingChange,
}: EssayInputSectionProps) {
    const [essayTextTab, setEssayTextTab] = useState("manual");
    const [isEssayTextOcrLoading, setIsEssayTextOcrLoading] = useState(false);
    const [essayTextPreview, setEssayTextPreview] = useState<string | null>(null);

    const {
        batchEssays,
        ocrProcessingQueue,
        activeOcrCount,
        isBatchOcrLoading,
        addFilesToBatch,
        removeItemFromBatch,
        updateBatchItemText,
        updateBatchItemNote,
        handleDragStart,
        handleDragOver,
        handleDrop,
        MAX_CONCURRENT_OCR
    } = useBatchOcrProcessing();

    useEffect(() => {
        onOcrLoadingChange(isBatchModeEssay ? isBatchOcrLoading : isEssayTextOcrLoading);
    }, [isBatchModeEssay, isBatchOcrLoading, isEssayTextOcrLoading, onOcrLoadingChange]);

    useEffect(() => {
        return () => {
            if (essayTextPreview) URL.revokeObjectURL(essayTextPreview);
        };
    }, [essayTextPreview]);

    useEffect(() => {
        if (isBatchModeEssay) {
            const texts = batchEssays.map(item => item.ocrText);
            const notes = batchEssays.map(item => item.note);
            form.setValue('essayTexts', texts, { shouldDirty: true, shouldValidate: texts.length > 0 });
            form.setValue('essayNotes', notes, { shouldDirty: true });
        }
    }, [isBatchModeEssay, batchEssays, form]);

    const handleSingleEssayOcrUpload = useCallback(async (
        file: File,
        currentPreview: string | null,
        setLoading: (loading: boolean) => void,
        setPreview: (url: string | null) => void
    ) => {
        if (!file) return;
        if (currentPreview) URL.revokeObjectURL(currentPreview);

        const newPreviewUrl = URL.createObjectURL(file);
        setPreview(newPreviewUrl);
        setLoading(true);
        form.setValue('essayText', '');

        try {
            await runOcrProcess(
                file,
                (text) => form.setValue('essayText', text, { shouldDirty: true, shouldValidate: !!text }),
                (message) => { toast.error(message); }
            );
        } catch (error) {
            console.error("OCR Process failed:", error);
            toast.error("图像识别过程中发生错误。");
        } finally {
            setLoading(false);
        }
    }, [form]);

    const handleSingleEssayFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleSingleEssayOcrUpload(file, essayTextPreview, setIsEssayTextOcrLoading, setEssayTextPreview);
        event.target.value = '';
    };

    const handleSingleEssayDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file) handleSingleEssayOcrUpload(file, essayTextPreview, setIsEssayTextOcrLoading, setEssayTextPreview);
    };

    const handleBatchFileChangeFromInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        addFilesToBatch(event.target.files);
        event.target.value = '';
    };

    const handleBatchFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        addFilesToBatch(event.dataTransfer.files);
    };

    const renderStatusBadge = (item: typeof batchEssays[0]) => {
        switch (item.ocrStatus) {
            case 'loading':
                return <Badge variant="outline" className="text-xs py-1 px-2"><Loader2 className="h-3 w-3 animate-spin mr-1" />识别中...</Badge>;
            case 'idle':
                const queuePosition = ocrProcessingQueue.findIndex(q => q.batchItemId === item.id);
                const queueText = queuePosition !== -1 ? ` #${queuePosition + 1}/${ocrProcessingQueue.length}` : '';
                return <Badge variant="secondary" className="text-xs py-1 px-2"><Clock className="h-3 w-3 mr-1" />排队中{queueText}</Badge>;
            case 'error':
                return <Badge variant="destructive" className="text-xs py-1 px-2"><AlertTriangle className="h-3 w-3 mr-1" />错误: {item.errorMessage || "未知错误"}</Badge>;
            case 'success':
                if (!item.ocrText) {
                    return <Badge variant="outline" className="text-xs py-1 px-2 border-amber-500 text-amber-600"><SearchX className="h-3 w-3 mr-1" />无文本</Badge>;
                }
                return <Badge variant="default" className="text-xs py-1 px-2 bg-green-500 hover:bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />已完成</Badge>;
            default:
                return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">文章录入</CardTitle>
                <CardDescription>
                    录入待批改的作文。
                    {isBatchModeEssay && <span className="font-semibold text-primary"> 批量模式已开启</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="flex items-center space-x-2">
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
                                    <div className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors ${isEssayTextOcrLoading ? 'opacity-50 cursor-not-allowed' : ''} ${essayTextPreview ? 'min-h-[200px] max-h-[400px]' : 'min-h-[200px]'}`}
                                        onDrop={handleSingleEssayDrop} onDragOver={handleDragOverGeneric} onClick={() => !isEssayTextOcrLoading && document.getElementById('essayText-ocr-input')?.click()}>
                                        {isEssayTextOcrLoading ? (<div className="flex flex-col items-center"><Loader2 className="h-10 w-10 animate-spin mb-2 text-primary" /><p className="text-sm">正在识别中...</p></div>)
                                            : essayTextPreview ? (<div className="relative w-full h-full flex items-center justify-center group"><div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-center text-sm p-2">点击或拖拽新图片替换</div><img src={essayTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain rounded-sm" /></div>)
                                                : (<><ImagePlus className="h-10 w-10 mb-2" /><p className="text-sm text-center">拖拽图片到此处或点击上传</p><p className="text-xs text-muted-foreground/80 mt-1">支持 JPG, PNG, WEBP 等常见格式</p></>)}
                                        <input id="essayText-ocr-input" type="file" accept="image/*" className="hidden" onChange={handleSingleEssayFileChange} disabled={isEssayTextOcrLoading} />
                                    </div>
                                    <FormMessage />
                                </TabsContent>
                            </Tabs>
                        </FormItem>
                    )} />
                ) : (
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="batch-essay-dropzone" className="text-base font-medium">上传习作图片</Label>
                            <div
                                id="batch-essay-dropzone"
                                className={`mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer text-muted-foreground hover:border-primary/70 transition-colors bg-muted/20 hover:bg-muted/40 ${isBatchOcrLoading && activeOcrCount >= MAX_CONCURRENT_OCR ? 'opacity-60 cursor-not-allowed' : ''}`}
                                onDrop={handleBatchFileDrop}
                                onDragOver={handleDragOverGeneric}
                                onClick={() => !(isBatchOcrLoading && activeOcrCount >= MAX_CONCURRENT_OCR) && document.getElementById('batch-essay-input-hidden')?.click()}
                            >
                                <ImagePlus className="h-12 w-12 mb-3 text-gray-400" />
                                <p className="text-base font-medium text-center">拖拽图片到此处，或<span className="text-primary">点击上传</span></p>
                                <p className="text-sm text-muted-foreground/80 mt-1">支持多选。推荐使用清晰的扫描件或照片。</p>
                            </div>
                            <input
                                id="batch-essay-input-hidden"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleBatchFileChangeFromInput}
                                className="hidden"
                                disabled={isBatchOcrLoading && activeOcrCount >= MAX_CONCURRENT_OCR}
                            />
                            {(activeOcrCount > 0 || ocrProcessingQueue.length > 0) &&
                                <p className="text-sm text-muted-foreground mt-2">
                                    {activeOcrCount > 0 && `正在处理 ${activeOcrCount} 张图片... `}
                                    {ocrProcessingQueue.length > 0 && `队列中还有 ${ocrProcessingQueue.length} 张等待处理。`}
                                </p>
                            }
                        </div>

                        {batchEssays.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-base font-medium">已上传习作 ({batchEssays.length} 篇)</h3>
                                    <p className="text-sm text-muted-foreground">拖动可调整顺序</p>
                                </div>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                                    {batchEssays.map((item, index) => (
                                        <div
                                            key={item.id}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDrop={(e) => {
                                                e.preventDefault(); // Crucial for allowing the drop
                                                handleDrop();     // Call the hook's handler
                                            }}
                                            className="flex items-start gap-4 p-4 border rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col items-center space-y-1 flex-shrink-0 pt-1">
                                                <div
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    className="cursor-grab text-muted-foreground hover:text-primary p-1"
                                                    title="拖动排序"
                                                    // Removed onMouseDown={(e) => e.preventDefault()}
                                                >
                                                    <GripVertical className="h-5 w-5" />
                                                </div>
                                                <div className="text-xs font-semibold bg-muted text-muted-foreground rounded-full h-6 w-6 flex items-center justify-center">
                                                    {index + 1}
                                                </div>
                                            </div>

                                            <div className="w-24 h-24 flex-shrink-0 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                                {item.previewUrl ? (
                                                    <img src={item.previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-10 w-10 text-gray-400" />
                                                )}
                                            </div>

                                            <div className="flex-grow space-y-2 min-w-0">
                                                <Input
                                                    id={`note-${item.id}`}
                                                    value={item.note}
                                                    onChange={(e) => updateBatchItemNote(item.id, e.target.value)}
                                                    placeholder="备注 (例如：学生姓名，作文题目)"
                                                    className="text-sm h-9"
                                                    disabled={item.ocrStatus === 'loading'}
                                                />
                                                <div className="relative">
                                                    <Textarea
                                                        placeholder={item.ocrStatus === 'idle' || item.ocrStatus === 'loading' ? "等待识别完成..." : "OCR识别结果"}
                                                        value={item.ocrText}
                                                        onChange={(e) => updateBatchItemText(item.id, e.target.value)}
                                                        className="min-h-[100px] text-sm resize-y max-h-[200px]"
                                                        rows={4}
                                                        disabled={item.ocrStatus === 'loading' || item.ocrStatus === 'idle'}
                                                    />
                                                    {(item.ocrStatus === 'idle' || item.ocrStatus === 'loading') && !item.ocrText && (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                                                            <FileText className="h-8 w-8 text-muted-foreground mb-1" />
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.ocrStatus === 'loading' ? '正在提取文本...' : '等待处理...'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-h-[20px]">
                                                   {renderStatusBadge(item)}
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 pt-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItemFromBatch(item.id)}
                                                    disabled={item.ocrStatus === 'loading'}
                                                    className="text-muted-foreground hover:text-destructive h-9 w-9"
                                                    title="删除此项"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {batchEssays.length === 0 && isBatchModeEssay && (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/30">
                                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-base font-medium text-muted-foreground">暂无习作图片</p>
                                <p className="text-sm text-muted-foreground/80">请从上方区域上传图片开始批量批改。</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}