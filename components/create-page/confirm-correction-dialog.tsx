// components/create-page/confirm-correction-dialog.tsx
import React from "react";
import { useMediaQuery } from "@/hooks/use-media-query"; // Assuming this hook exists
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
// Removed: import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { FormSubmitData } from "@/types/create"; // Import the type

interface ConfirmCorrectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    formData: FormSubmitData | null;
    isLoading: boolean;
    // Removed: progress: number;
    // Removed: progressMessage: string;
}

// Helper functions (can be moved to utils if reused elsewhere)
const getModelDisplayName = (value: string) => {
    const options: { [key: string]: string } = {
        "gpt4": "GPT-4o",
        "llama": "Meta Llama",
        "deepseek": "Deepseek-v3",
        "gemini": "Google Gemini 2",
        "gemini-lite": "Google Gemini 2 Lite",
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


export function ConfirmCorrectionDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    formData,
    isLoading,
    // Removed: progress,
    // Removed: progressMessage
}: ConfirmCorrectionDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)"); // Adjust breakpoint as needed

    if (!formData) return null;

    const essayCount = formData.essayTexts ? formData.essayTexts.length : (formData.essayText ? 1 : 0);

    const ConfirmationContent = (
        <>
            <DialogHeader className={isDesktop ? "" : "text-left"}>
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

                {/* Removed: Progress bar section */}
                {/*
                {isLoading && (
                    <div className="mt-4 pt-4 border-t">
                        <Label className="text-sm font-medium">批改进度</Label>
                        <Progress value={progress} className="w-full mt-2" />
                        <p className="text-sm text-muted-foreground mt-1 text-center">{progressMessage || "准备开始..."}</p>
                    </div>
                )}
                */}
            </div>
            <DialogFooter className={isDesktop ? "" : "flex-col gap-2 sm:px-0"}>
                {/* Always show Cancel button, enabled unless loading prevents it */}
                {isDesktop ? (
                     <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isLoading}>
                            取消
                        </Button>
                    </DialogClose>
                ) : (
                    <DrawerClose asChild>
                        <Button type="button" variant="outline" disabled={isLoading} className="w-full">
                            取消
                        </Button>
                    </DrawerClose>
                )}


                {/* Confirm button logic */}
                <Button
                    type="button"
                    onClick={onConfirm}
                    disabled={isLoading} // Disable when loading
                    className={!isDesktop ? "w-full" : ""} // Full width on mobile
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "批改中..." : "确认批改"}
                </Button>
            </DialogFooter>
        </>
    );


    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[480px]">
                   {ConfirmationContent}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm p-4"> {/* Added padding for mobile */}
                    {ConfirmationContent}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
