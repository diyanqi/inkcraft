// components/create-page/essay-input-section.tsx
import React, { useState, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "@/types/create"; // Import type
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
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBatchOcrProcessing } from "@/hooks/use-batch-ocr-processing"; // Import the hook
import { runOcrProcess, handleDragOverGeneric } from "@/lib/ocr"; // Import OCR utility and drag handler
import { toast } from "sonner";


interface EssayInputSectionProps {
    form: UseFormReturn<FormData>;
    isBatchModeEssay: boolean;
    setIsBatchModeEssay: (isBatch: boolean) => void;
    onOcrLoadingChange: (isLoading: boolean) => void; // Callback to notify parent
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
        handleDragStart,
        handleDragOver,
        handleDrop,
        MAX_CONCURRENT_OCR
    } = useBatchOcrProcessing(); // Use the custom hook

    // Notify parent about OCR loading state
    useEffect(() => {
        onOcrLoadingChange(isBatchModeEssay ? isBatchOcrLoading : isEssayTextOcrLoading);
    }, [isBatchModeEssay, isBatchOcrLoading, isEssayTextOcrLoading, onOcrLoadingChange]);


    // Cleanup single essay preview URL on unmount
    useEffect(() => {
        return () => {
            if (essayTextPreview) URL.revokeObjectURL(essayTextPreview);
        };
    }, [essayTextPreview]);


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

        await runOcrProcess(
            file,
            (text) => form.setValue('essayText', text),
            (message) => { toast.error(message); /* Preview remains on error */ }
        );
        setLoading(false);
    }, [form]); // form is stable from useForm

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
        event.target.value = ''; // Allow re-uploading same files
    };

    const handleBatchFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        addFilesToBatch(event.dataTransfer.files);
    };


    return (
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
                                        onDrop={handleSingleEssayDrop} onDragOver={handleDragOverGeneric} onClick={() => !isEssayTextOcrLoading && document.getElementById('essayText-ocr-input')?.click()}>
                                        {isEssayTextOcrLoading ? (<div className="flex flex-col items-center"><Loader2 className="h-8 w-8 animate-spin mb-2" /><p className="text-sm">正在识别中...</p></div>)
                                            : essayTextPreview ? (<div className="relative w-full h-full flex items-center justify-center"><div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-center text-sm p-2">点击或拖拽新图片替换</div><img src={essayTextPreview} alt="OCR Preview" className="max-w-full max-h-full object-contain" /></div>)
                                                : (<><ImagePlus className="h-8 w-8 mb-2" /><p className="text-sm text-center">拖拽图片到此处或点击上传</p></>)}
                                        <input id="essayText-ocr-input" type="file" accept="image/*" className="hidden" onChange={handleSingleEssayFileChange} disabled={isEssayTextOcrLoading} />
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
                                className={`mt-1 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer text-muted-foreground hover:border-primary/50 transition-colors min-h-[120px] ${ isBatchOcrLoading ? 'opacity-50 cursor-not-allowed' : ''}`} // Disable dropzone if batch OCR is busy
                                onDrop={handleBatchFileDrop}
                                onDragOver={handleDragOverGeneric}
                                onClick={() => !isBatchOcrLoading && document.getElementById('batch-essay-input-hidden')?.click()}
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
                                disabled={isBatchOcrLoading} // Disable input if batch OCR is busy
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
                                            onChange={(e) => updateBatchItemText(item.id, e.target.value)}
                                            className="min-h-[80px] text-sm h-28 resize-none"
                                            rows={5}
                                            disabled={item.ocrStatus === 'loading'}
                                        />
                                        {item.ocrStatus === 'loading' && <p className="text-xs text-muted-foreground mt-1 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" />识别中...</p>}
                                        {item.ocrStatus === 'error' && <p className="text-xs text-red-500 mt-1">错误: {item.errorMessage}</p>}
                                        {item.ocrStatus === 'success' && !item.ocrText && <p className="text-xs text-amber-600 mt-1">识别完成，但未检测到文本。</p>}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeItemFromBatch(item.id)} disabled={item.ocrStatus === 'loading'}>
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
    );
}
