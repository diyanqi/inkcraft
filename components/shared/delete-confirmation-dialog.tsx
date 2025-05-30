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
// Removed Input import
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox component
import { Loader2 } from "lucide-react";
import type { CheckedState } from "@radix-ui/react-checkbox"; // Import CheckedState type

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

    // State to hold the checkbox checked state
    const [isChecked, setIsChecked] = React.useState(false);

    // Determine if the confirm button should be enabled
    // Button is enabled if checkbox is checked AND not loading
    const isConfirmButtonEnabled = isChecked && !isLoading;

    // Effect to clear the checkbox state when the dialog/drawer closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsChecked(false);
        }
    }, [isOpen]);

    // Handler for checkbox change
    const handleCheckedChange = (checked: CheckedState) => {
        // Only update state if the checked value is a boolean (true or false)
        // Ignore the 'indeterminate' state if the checkbox supports it,
        // as we only care about a definitive checked/unchecked state for confirmation.
        if (typeof checked === 'boolean') {
            setIsChecked(checked);
        }
    };


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
                {/* Add checkbox for confirmation */}
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="confirm-delete-checkbox"
                        checked={isChecked}
                        // Use the new handler that correctly processes CheckedState
                        onCheckedChange={handleCheckedChange}
                        disabled={isLoading} // Disable checkbox while loading
                    />
                    <Label
                        htmlFor="confirm-delete-checkbox"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        我了解此操作不可撤销，并且无法退款，并确认删除。
                    </Label>
                </div>
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
