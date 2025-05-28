// components/nav-history.tsx
"use client"

import {
    IconDots,
    IconFolder,
    IconShare3,
    IconTrash,
} from "@tabler/icons-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useCorrectionHistory } from "@/hooks/use-correction-history"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import React, { useState, useCallback } from "react" // Import useState and useCallback
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog" // Import the new component
import { toast } from "sonner" // Import toast for notifications

export function NavHistory() {
    const { isMobile } = useSidebar()
    // Assuming useCorrectionHistory provides a refetch function to update the list
    const { history, loading, hasMore, loadMore, refetch } = useCorrectionHistory();
    const router = useRouter()
    const [loadingMore, setLoadingMore] = useState(false)

    // State for delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDeleteUuid, setItemToDeleteUuid] = useState<string | null>(null);
    const [itemToDeleteTitle, setItemToDeleteTitle] = useState<string | undefined>(undefined);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handler to open the delete dialog
    const handleDeleteClick = useCallback((uuid: string, title?: string) => {
        setItemToDeleteUuid(uuid);
        setItemToDeleteTitle(title);
        setIsDeleteDialogOpen(true);
    }, []);

    // Handler to confirm and perform deletion
    const handleConfirmDelete = useCallback(async () => {
        if (!itemToDeleteUuid) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/correction/delete/${itemToDeleteUuid}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                toast.success("习作删除成功！");
                // Refetch history to update the list
                if (refetch) {
                     refetch();
                } else {
                     // Fallback if refetch is not available (less ideal)
                     // You might need to manually filter the history state here
                     // setHistory(prevHistory => prevHistory.filter(item => item.uuid !== itemToDeleteUuid));
                     console.warn("useCorrectionHistory hook does not provide a 'refetch' function. History list may not update automatically.");
                }
            } else {
                toast.error(`删除失败: ${result.message || '未知错误'}`);
            }
        } catch (error: any) {
            console.error("Delete API error:", error);
            toast.error(`删除请求失败: ${error.message || '网络错误'}`);
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setItemToDeleteUuid(null);
            setItemToDeleteTitle(undefined);
        }
    }, [itemToDeleteUuid, refetch]); // Include refetch in dependency array

    // Close dialog handler
    const handleDialogClose = useCallback((open: boolean) => {
         if (!open) {
             setIsDeleteDialogOpen(false);
             // Reset itemToDeleteUuid and title only when closing
             if (!isDeleting) { // Only reset if not currently in the process of deleting
                 setItemToDeleteUuid(null);
                 setItemToDeleteTitle(undefined);
             }
         } else {
             setIsDeleteDialogOpen(true);
         }
    }, [isDeleting]); // Include isDeleting

    if (loading) {
        return (
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                <SidebarGroupLabel>历史批改</SidebarGroupLabel>
                <SidebarMenu>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SidebarMenuItem key={index}>
                            <div className="flex items-center gap-2 px-2 py-1.5">
                                <Skeleton className="h-5 w-5 rounded" />
                                <Skeleton className="h-4 w-[120px]" />
                            </div>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        )
    }

    if (!loading && history.length === 0) {
        return (
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                <SidebarGroupLabel>历史批改</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="text-sidebar-foreground/50 px-2 py-1.5 text-xs ">
                            这里空空如也～
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        )
    }

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>历史批改</SidebarGroupLabel>
            <SidebarMenu>
                {history.map((item) => (
                    <SidebarMenuItem key={item.uuid}>
                        <SidebarMenuButton asChild>
                            <div
                                onClick={() => router.push(`/dashboard/correction/${item.uuid}`)}
                                className="cursor-pointer"
                            >
                                <span className="text-xs">{item.icon}</span>
                                {/* Use item.title if available, fallback to uuid or a default */}
                                <span>{item.title || `习作 ${item.uuid?.slice(0, 4)}...`}</span>
                            </div>
                        </SidebarMenuButton>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuAction
                                    showOnHover
                                    className="data-[state=open]:bg-accent rounded-sm"
                                >
                                    <IconDots />
                                    <span className="sr-only">更多操作</span>
                                </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-24 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align={isMobile ? "end" : "start"}
                            >
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/correction/${item.uuid}`)} >
                                    <IconFolder className="mr-2 h-4 w-4" /> {/* Added icons */}
                                    <span>打开</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <IconShare3 className="mr-2 h-4 w-4" /> {/* Added icons */}
                                    <span>分享</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* Updated Delete DropdownMenuItem */}
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleDeleteClick(item.uuid!, item.title || `习作 ${item.uuid?.slice(0, 4)}...`)} // Pass uuid and title
                                >
                                    <IconTrash className="mr-2 h-4 w-4" /> {/* Added icon */}
                                    <span>删除</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                ))}
                {hasMore && (
                    <SidebarMenuItem>
                        {loadingMore ? (
                            <Button disabled className="w-full flex gap-2 justify-center items-center text-sidebar-foreground/70">
                                <Loader2 className="animate-spin" />
                                <span>加载中</span>
                            </Button>
                        ) : (
                            <SidebarMenuButton
                                onClick={async () => {
                                    setLoadingMore(true)
                                    await loadMore()
                                    setLoadingMore(false)
                                }}
                                className="text-sidebar-foreground/70"
                                disabled={loadingMore}
                            >
                                <IconDots className="text-sidebar-foreground/70" />
                                <span>加载更多</span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                )}
                {!hasMore && history.length > 0 && (
                    <SidebarMenuItem>
                        <div className="text-sidebar-foreground/50 px-2 py-1.5 text-xs text-center w-full">
                            我也是有底线的～
                        </div>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>

            {/* Delete Confirmation Dialog/Drawer */}
            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onOpenChange={handleDialogClose} // Use the custom close handler
                onConfirm={handleConfirmDelete}
                itemTitle={itemToDeleteTitle}
                isLoading={isDeleting}
            />
        </SidebarGroup>
    )
}
