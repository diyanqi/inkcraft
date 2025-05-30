// app/dashboard/create/types.ts
import { z } from "zod";

// Define Form Schema Type
export const formSchema = z.object({
    title: z.string().min(0),
    originalText: z.string().min(1, { message: "请输入原题题干" }),
    referenceText: z.string().min(0),
    essayType: z.string().min(1, { message: "请选择作文类型" }),
    essayText: z.string().optional(), // Optional in schema as it's exclusive with essayTexts
    firstSentence: z.string().optional(),
    secondSentence: z.string().optional(),
    model: z.string().min(1, { message: "请选择模型" }),
    tone: z.string().min(1, { message: "请选择语气" }),
    essayTexts: z.array(z.string()).optional(), // 添加批量模式下的文本数组
    essayNotes: z.array(z.string()).optional() // 添加批量模式下的备注数组
}).superRefine((data, ctx) => {
    if (data.essayType === "gaokao-english-continuation") {
        if (!data.firstSentence || data.firstSentence.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "请输入第一段段首句",
                path: ["firstSentence"],
            });
        }
        if (!data.secondSentence || data.secondSentence.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "请输入第二段段首句",
                path: ["secondSentence"],
            });
        }
    }
});

export type FormData = z.infer<typeof formSchema>;

// Type for data submitted to the API, includes essayTexts for batch mode
export type FormSubmitData = Omit<FormData, 'essayText'> & { 
    essayText?: string; 
    essayTexts?: string[];
    essayNotes?: string[]; // 添加图片备注数组
};

export interface BatchEssayItem {
    id: string;
    file: File | null;
    previewUrl: string;
    ocrText: string;
    ocrStatus: 'idle' | 'loading' | 'success' | 'error';
    errorMessage?: string;
    note: string; // 添加图片备注字段
}

export interface OcrQueueItem {
    batchItemId: string;
    file: File;
}
