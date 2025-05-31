// components/nav-history.tsx
"use client"

import {
    IconDots,
    IconFolder,
    IconShare,
    IconShareOff,
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
import { Input } from "@/components/ui/input"
import React, { useState, useCallback } from "react" // Import useState and useCallback
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog" // Import the new component
import { toast } from "sonner" // Import toast for notifications
import { ResponsiveDialog } from "@/components/confirm-share-dialog"; // Import ResponsiveDialog
import { CopyToClipboard } from "@/components/ui/copy-to-clipboard"; // Import CopyToClipboard

export function NavHistory() {
    const { isMobile } = useSidebar()
    const { history, loading, hasMore, loadMore, refetch } = useCorrectionHistory();
    const router = useRouter()
    const [loadingMore, setLoadingMore] = useState(false)

    // State for delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDeleteUuid, setItemToDeleteUuid] = useState<string | null>(null);
    const [itemToDeleteTitle, setItemToDeleteTitle] = useState<string | undefined>(undefined);
    const [isDeleting, setIsDeleting] = useState(false);

    // State for share confirmation dialog
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [itemToShareUuid, setItemToShareUuid] = useState<string | null>(null);
    const [itemToSharePublic, setItemToSharePublic] = useState<boolean | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Handler to open the share dialog
    const handleShareClick = useCallback((uuid: string, isPublic: boolean) => {
        setItemToShareUuid(uuid);
        setItemToSharePublic(isPublic);
        setIsShareDialogOpen(true);
        // 无论是否分享状态，都设置分享链接
        setShareLink(`${window.location.origin}/shared-correction/${uuid}`);
    }, []);

    // Handler to confirm and perform sharing
    const handleConfirmShare = useCallback(async () => {
        if (!itemToShareUuid || itemToSharePublic === null) return;

        setIsSharing(true);
        try {
            const response = await fetch(`/api/correction/share/${itemToShareUuid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ public: !itemToSharePublic }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(itemToSharePublic ? "分享已取消！" : "分享成功！");
                // 刷新历史记录列表
                await refetch();
                
                if (itemToSharePublic) {
                    // 如果是取消分享，则关闭对话框
                    setIsShareDialogOpen(false);
                }
            } else {
                toast.error(`操作失败: ${result.message || '未知错误'}`);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Share API error:", error);
                toast.error(`请求失败: ${error.message || '网络错误'}`);
            } else {
                console.error("Unexpected error:", error);
                toast.error('请求失败: 未知错误');
            }
        } finally {
            setIsSharing(false);
            if (itemToSharePublic) {
                // 如果是取消分享，重置所有状态
                setItemToShareUuid(null);
                setItemToSharePublic(null);
                setShareLink(null);
            }
        }
    }, [itemToShareUuid, itemToSharePublic, refetch]);

    // Close dialog handler
    const handleShareDialogClose = useCallback(async (open: boolean) => {
        if (!open) {
            setIsShareDialogOpen(false);
            if (!isSharing) {
                setItemToShareUuid(null);
                setItemToSharePublic(null);
                setShareLink(null);
                // 关闭对话框时刷新历史记录
                await refetch();
            }
        }
    }, [isSharing, refetch]);

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
                                <DropdownMenuItem
                                    onClick={() => handleShareClick(item.uuid!, item.public)}
                                >
                                    {item.public ? (
                                        <IconShareOff className="mr-2 h-4 w-4" />
                                    ) : (
                                        <IconShare className="mr-2 h-4 w-4" />
                                    )}
                                    <span>{item.public ? "取消分享" : "分享"}</span>
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

            {/* Share Confirmation Dialog */}
            <ResponsiveDialog
                isOpen={isShareDialogOpen}
                onOpenChange={handleShareDialogClose}
                onConfirm={handleConfirmShare}
                itemTitle={itemToSharePublic ? "取消分享" : "分享"}
                isLoading={isSharing}
            >
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        {itemToSharePublic 
                            ? "确定要取消分享这个习作吗？取消后链接将失效。" 
                            : "确定要分享这个习作吗？任何拥有链接的人都可以查看。"}
                    </div>
                    {/* 总是显示分享链接区域 */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium">分享链接{!itemToSharePublic && "（分享后可用）"}</div>
                        <div className="flex items-center gap-2">
                            <Input
                                value={shareLink || ""}
                                readOnly
                                className="flex-1 text-sm text-muted-foreground"
                            />
                            { shareLink && (
                                <CopyToClipboard text={shareLink} />
                            )}
                        </div>
                    </div>
                </div>
            </ResponsiveDialog>
        </SidebarGroup>
    )
}
