// app/dashboard/create/page.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter, usePathname } from "next/navigation"
import React, { useState, useCallback, useEffect } from "react"
import {
    Form,
} from "@/components/ui/form"
import {
    Card,
} from "@/components/ui/card" // Keep Card as it's used for layout
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Import types and schema
import { formSchema, FormData, FormSubmitData } from "../../../types/create"

// Import new components and hook
import { ConfirmCorrectionDialog } from "@/components/create-page/confirm-correction-dialog"
import { MetadataInputSection } from "@/components/create-page/metadata-input-section"
import { EssayInputSection } from "@/components/create-page/essay-input-section"
import { OptionsInputSection } from "@/components/create-page/options-input-section"
import { useBatchOcrProcessing } from "@/hooks/use-batch-ocr-processing"


export default function CreatePage() {
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isCorrectionLoading, setIsCorrectionLoading] = useState(false);
    const [correctionProgress, setCorrectionProgress] = useState(0);
    const [correctionProgressMessage, setCorrectionProgressMessage] = useState("");
    const [pendingFormData, setPendingFormData] = useState<FormSubmitData | null>(null);
    const router = useRouter();
    const currentPathname = usePathname();

    const [isBatchModeEssay, setIsBatchModeEssay] = useState(false);

    // State to track OCR loading from child components
    const [isMetadataOcrLoading, setIsMetadataOcrLoading] = useState(false);
    const [isEssayOcrLoading, setIsEssayOcrLoading] = useState(false); // This will track loading for either single or batch

    // Use the batch OCR hook
    const {
        batchEssays,
        isBatchOcrLoading,
        // We don't need other states/handlers here, they are used inside EssayInputSection
    } = useBatchOcrProcessing();


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
                    // Redirect only after toast is shown or with a slight delay
                     setTimeout(() => {
                         router.push(`/dashboard/correction/wait/${data.uuid}`);
                     }, 1000); // Add a small delay
                } else {
                     // If no uuid, stay on the page but show success
                     setIsCorrectionLoading(false); // Allow user to submit again
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
             // Only reset loading state if we are NOT redirecting
             if (!currentPathname?.includes('/dashboard/correction/wait/')) {
                 // This check might not be reliable immediately after router.push.
                 // A better approach might be to handle loading state within the wait page,
                 // or rely solely on the redirect. For now, keep the basic logic.
                 // A more robust solution would involve client-side state management or server-side redirects.
                 // For simplicity here, we'll let the redirect handle the perceived "loading" state change.
                 // If redirect fails or doesn't happen, the finally block will run.
                 // Let's simplify: reset loading unless we successfully got a UUID for redirect.
                 if (!(pendingFormData as any)?.uuid) { // Check if UUID was part of response (simplified)
                     setIsCorrectionLoading(false);
                 }
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
            delete (dataToSubmit as any).essayText; // Ensure essayText is not sent in batch mode
        } else {
            if (!values.essayText || values.essayText.trim() === "") {
                form.setError("essayText", { type: "manual", message: "请输入习作" });
                toast.error("请输入习作内容。");
                return;
            }
            delete (dataToSubmit as any).essayTexts; // Ensure essayTexts is not sent in single mode
        }

        // Ensure required fields are not empty after potential OCR issues in single mode
         if (!isBatchModeEssay && (!dataToSubmit.essayText || dataToSubmit.essayText.trim() === "")) {
             form.setError("essayText", { type: "manual", message: "请输入习作内容或确保图片识别成功" });
             toast.error("请输入习作内容或确保图片识别成功。");
             return;
         }
         if (!dataToSubmit.originalText || dataToSubmit.originalText.trim() === "") {
              form.setError("originalText", { type: "manual", message: "请输入原题题干或确保图片识别成功" });
              toast.error("请输入原题题干或确保图片识别成功。");
              return;
         }


        setPendingFormData(dataToSubmit);
        setCorrectionProgress(0);
        setCorrectionProgressMessage("");
        setIsConfirmDialogOpen(true);
    };

    // Determine overall OCR loading status
    const isAnyOcrLoading = isMetadataOcrLoading || isEssayOcrLoading;


    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Metadata Input Section */}
                        <MetadataInputSection form={form} onOcrLoadingChange={setIsMetadataOcrLoading} />

                        {/* Essay Input Section */}
                        <EssayInputSection
                            form={form}
                            isBatchModeEssay={isBatchModeEssay}
                            setIsBatchModeEssay={setIsBatchModeEssay}
                            onOcrLoadingChange={setIsEssayOcrLoading}
                        />

                        {/* Options Input Section */}
                        <OptionsInputSection form={form} />
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
            />
        </div>
    )
}
