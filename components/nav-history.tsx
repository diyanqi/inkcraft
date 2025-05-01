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

export function NavHistory() {
  const { isMobile } = useSidebar()
  const { history, loading, hasMore, loadMore } = useCorrectionHistory()
  const router = useRouter()

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
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <div 
                onClick={() => router.push(`/dashboard/correction/${item.id}`)} 
                className="cursor-pointer"
              >
                <span className="text-xs">{item.icon}</span>
                <span>{item.title}</span>
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
                <DropdownMenuItem>
                  <IconFolder />
                  <span>打开</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconShare3 />
                  <span>分享</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <IconTrash />
                  <span>删除</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        {hasMore && (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={loadMore}
              className="text-sidebar-foreground/70"
            >
              <IconDots className="text-sidebar-foreground/70" />
              <span>加载更多</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
