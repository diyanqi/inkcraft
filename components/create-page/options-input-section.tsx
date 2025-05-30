// components/create-page/options-input-section.tsx
import React from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface OptionsInputSectionProps {
    form: UseFormReturn<FormData>;
}

export function OptionsInputSection({ form }: OptionsInputSectionProps) {
    return (
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
                                {/* <SelectItem value="deepseek">Deepseek-v3</SelectItem> */}
                                <SelectItem value="llama">Llama 3.1 70B</SelectItem>
                                <SelectItem value="qwen">通义千问 3</SelectItem>
                                {/* <SelectItem value="glm">智谱清言 GLM-4</SelectItem> */}
                                <SelectItem value="gemini">Gemini 2</SelectItem>
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
    );
}
