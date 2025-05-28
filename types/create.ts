// app/dashboard/create/types.ts
import { z } from "zod";

// Define Form Schema Type
export const formSchema = z.object({
    title: z.string().min(0),
    originalText: z.string().min(1, { message: "请输入原题题干" }),
    referenceText: z.string().min(0),
    essayType: z.string().min(1, { message: "请选择作文类型" }),
    essayText: z.string().optional(), // Optional in schema as it's exclusive with essayTexts
    model: z.string().min(1, { message: "请选择模型" }),
    tone: z.string().min(1, { message: "请选择语气" })
});

export type FormData = z.infer<typeof formSchema>;

// Type for data submitted to the API, includes essayTexts for batch mode
export type FormSubmitData = Omit<FormData, 'essayText'> & { essayText?: string; essayTexts?: string[] };

export interface BatchEssayItem {
    id: string;
    file: File | null;
    previewUrl: string;
    ocrText: string;
    ocrStatus: 'idle' | 'loading' | 'success' | 'error';
    errorMessage?: string;
}

export interface OcrQueueItem {
    batchItemId: string;
    file: File;
}
