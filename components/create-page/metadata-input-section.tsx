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

    const triggerSentenceDetection = useCallback((text: string) => {
        if (form.getValues("essayType") === "gaokao-english-continuation" && text) {
            // Improved sentence splitting: handles '.', '。', '?', '!', and ensures they are likely sentence terminators.
            // It splits by these terminators when followed by a space, newline, or end of string.
            // It also handles cases where a quote might follow the terminator.
            const sentences = text
                .replace(/\s+/g, ' ')
                .trim()
                // Regex to split sentences: looks for terminators (. ! ? 。) followed by optional quote, then whitespace (or end of string).
                // It tries to ensure that it's a proper sentence end, not just an abbreviation.
                .split(/(?<=[.。?!]['"]?)(?:\s+|$)(?=(?:[A-ZÀ-ÖØ-ÞĀ-ž"']|[0-9]|\s*[A-ZÀ-ÖØ-ÞĀ-ž"']|\s*[0-9]))/g)
                .map(s => s.trim())
                .filter(s => s !== '');
            if (sentences.length >= 2) {
                let first = sentences[sentences.length - 2].trim();
                let second = sentences[sentences.length - 1].trim();

                const prefixPatterns = [/Paragraph\s*1:?/gi, /Para\s*1:?/gi, /Paragraph\s*2:?/gi, /Para\s*2:?/gi, /^1\.\s*/, /^2\.\s*/];
                prefixPatterns.forEach(pattern => {
                    first = first.replace(pattern, '').trim();
                    second = second.replace(pattern, '').trim();
                });

                // Avoid setting if unchanged to prevent re-renders/cursor jumps
                if (form.getValues("firstSentence") !== first) {
                    form.setValue("firstSentence", first, { shouldValidate: true, shouldDirty: true });
                }
                if (form.getValues("secondSentence") !== second) {
                    form.setValue("secondSentence", second, { shouldValidate: true, shouldDirty: true });
                }
                // toast.success("段首句已自动识别并填充"); // Optional: can be too noisy
            } else {
                // toast.error("无法识别足够的句子作为段首句，请确保原文至少包含两句话。"); // Optional: can be too noisy
            }
        }
    }, [form]);

    // Watch for essayType changes to potentially clear sentence fields or trigger detection
    const essayType = form.watch("essayType");
    const originalText = form.watch("originalText");

    useEffect(() => {
        if (essayType === "gaokao-english-continuation") {
            triggerSentenceDetection(originalText || "");
        } else {
            // Clear sentence fields if essay type is not continuation, if they are not meant to be persisted
            // Check if values exist before setting to avoid unnecessary re-renders or dirtying the form
            if (form.getValues("firstSentence")) {
                form.setValue("firstSentence", "", { shouldValidate: false, shouldDirty: false });
            }
            if (form.getValues("secondSentence")) {
                form.setValue("secondSentence", "", { shouldValidate: false, shouldDirty: false });
            }
        }
    }, [essayType, originalText, triggerSentenceDetection, form]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">题干录入</CardTitle>
                <CardDescription>录入原题及范文。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <FormField control={form.control} name="essayType" render={({ field }) => (
                    <FormItem>
                        <FormLabel>作文类型</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder="选择类型" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="gaokao-english-continuation">高考英语 读后续写</SelectItem>
                                <SelectItem value="gaokao-english-practical" disabled>高考英语 应用文</SelectItem>
                                <SelectItem value="gaokao-chinese-composition" disabled>高考语文 作文</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

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
                                <FormControl><Textarea placeholder="在这里输入原题题干…（可包含段首句，会自动识别）" className="min-h-[100px] max-h-[200px]" {...field} onChange={(e) => { field.onChange(e); triggerSentenceDetection(e.target.value);}} /></FormControl>
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

                {form.watch("essayType") === "gaokao-english-continuation" && (
                    <>
                        <FormField control={form.control} name="firstSentence" render={({ field }) => (
                            <FormItem>
                                <FormLabel>第一段段首句 {form.watch("essayType") === "gaokao-english-continuation" && <span className="text-destructive">*</span>}</FormLabel>
                                <FormControl><input type="text" placeholder="请输入第一段段首句" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="secondSentence" render={({ field }) => (
                            <FormItem>
                                <FormLabel>第二段段首句 {form.watch("essayType") === "gaokao-english-continuation" && <span className="text-destructive">*</span>}</FormLabel>
                                <FormControl><input type="text" placeholder="请输入第二段段首句" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </>
                )}

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
            </CardContent>
        </Card>
    );
}
