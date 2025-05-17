'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, usePathname } from "next/navigation"
import React, { useState } from "react"
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
import { Check, ScanText, ImagePlus, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { inngest } from "@/lib/inngest"

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
            if (!currentPathname?.includes('/dashboard/correction/')) {
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
                                        <FormControl><input type="text" placeholder="留白以自动生成" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="originalText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>原题题干</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="在这里输入原题题干…" className="min-h-[100px] max-h-[200px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="referenceText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>参考范文 <span className="text-sm text-muted-foreground">*可选</span></FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="在这里输入参考范文…" className="min-h-[100px] max-h-[200px]" {...field} />
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
                                <CardDescription>录入待批改的作文。</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField control={form.control} name="essayText" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>录入习作</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="在这里输入你的作文…" className="min-h-[200px] max-h-[400px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
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
                            disabled={isCorrectionLoading}
                        >
                            <Check className="h-4 w-4" />
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