// components/create-page/metadata-input-section.tsx
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, Loader2 } from "lucide-react";
import { runOcrProcess, handleDragOverGeneric } from "@/lib/ocr"; // Import OCR utility and drag handler
import { toast } from "sonner";

interface MetadataInputSectionProps {
    form: UseFormReturn<FormData>;
    onOcrLoadingChange: (isLoading: boolean) => void; // Callback to notify parent about OCR loading
}

export function MetadataInputSection({ form, onOcrLoadingChange }: MetadataInputSectionProps) {
    const [originalTextTab, setOriginalTextTab] = useState("manual");
    const [referenceTextTab, setReferenceTextTab] = useState("manual");

    const [isOriginalTextOcrLoading, setIsOriginalTextOcrLoading] = useState(false);
    const [isReferenceTextOcrLoading, setIsReferenceTextOcrLoading] = useState(false);

    const [originalTextPreview, setOriginalTextPreview] = useState<string | null>(null);
    const [referenceTextPreview, setReferenceTextPreview] = useState<string | null>(null);

    // Notify parent when OCR loading state changes
    useEffect(() => {
        onOcrLoadingChange(isOriginalTextOcrLoading || isReferenceTextOcrLoading);
    }, [isOriginalTextOcrLoading, isReferenceTextOcrLoading, onOcrLoadingChange]);


    useEffect(() => {
        return () => {
            // Cleanup preview URLs on unmount
            if (originalTextPreview) URL.revokeObjectURL(originalTextPreview);
            if (referenceTextPreview) URL.revokeObjectURL(referenceTextPreview);
        };
    }, [originalTextPreview, referenceTextPreview]);


    const handleSingleFieldOcrUpload = useCallback(async (
        file: File,
        fieldName: keyof Pick<FormData, 'originalText' | 'referenceText'>,
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
            (message) => { toast.error(message); /* Preview remains on error */ }
        );
        setLoading(false);
    }, [form]); // form is stable from useForm

    const createFieldSpecificHandlers = (
        fieldName: keyof Pick<FormData, 'originalText' | 'referenceText'>,
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


    return (
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
    );
}
