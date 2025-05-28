// components/shared/delete-confirmation-dialog.tsx
import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query"; // Assuming this hook exists
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Input } from "@/components/ui/input"; // Import Input component
import { Label } from "@/components/ui/label"; // Optional: Import Label for input
import { Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    itemTitle?: string; // Optional: Title of the item being deleted
    isLoading: boolean;
}

export function DeleteConfirmationDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    itemTitle,
    isLoading,
}: DeleteConfirmationDialogProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)"); // Adjust breakpoint as needed

    // State to hold the input value
    const [confirmationInput, setConfirmationInput] = React.useState("");

    // Required text for confirmation
    const requiredConfirmationText = "确认删除";

    // Determine if the confirm button should be enabled
    const isConfirmButtonEnabled = confirmationInput === requiredConfirmationText && !isLoading;

    // Effect to clear the input when the dialog/drawer closes
    React.useEffect(() => {
        if (!isOpen) {
            setConfirmationInput("");
        }
    }, [isOpen]);

    const ConfirmationContent = (
        <>
            <DialogHeader className={isDesktop ? "" : "text-left"}>
                <DialogTitle>确认删除</DialogTitle>
                <DialogDescription>
                    您确定要删除
                    {itemTitle ? (
                        <span className="font-bold text-red-600"> {itemTitle} </span>
                    ) : (
                        " 这篇习作"
                    )}
                    吗？此操作不可撤销。
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {/* Add input field for confirmation */}
                <Label htmlFor="delete-confirmation-input" className="sr-only">
                    请输入 '{requiredConfirmationText}' 进行确认
                </Label>
                <Input
                    id="delete-confirmation-input"
                    placeholder={`请输入 '${requiredConfirmationText}' 进行确认`}
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    disabled={isLoading} // Disable input while loading
                    className="w-full"
                />
            </div>
            <DialogFooter className={isDesktop ? "" : "flex-col gap-2 sm:px-0"}>
                {isDesktop ? (
                    <>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={!isConfirmButtonEnabled} // Use the computed state
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            确认删除
                        </Button>
                    </>
                ) : (
                    <>
                         <Button
                            variant="destructive"
                            onClick={onConfirm}
                            disabled={!isConfirmButtonEnabled} // Use the computed state
                            className="w-full"
                        >
                             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            确认删除
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" disabled={isLoading} className="w-full">取消</Button>
                        </DrawerClose>
                    </>
                )}
            </DialogFooter>
        </>
    );

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
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
