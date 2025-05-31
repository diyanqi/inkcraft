"use client"
import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

interface ResponsiveDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  itemTitle: string
  isLoading?: boolean
  children?: React.ReactNode
}

export function ResponsiveDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  itemTitle,
  isLoading = false,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{itemTitle}</DialogTitle>
            <DialogDescription>
              确认执行此操作吗？
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">{children}</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              variant="default"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "处理中..." : "确认"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{itemTitle}</DrawerTitle>
          <DrawerDescription>
            确认执行此操作吗？
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 mt-4">{children}</div>
        <DrawerFooter className="pt-2 flex justify-end gap-2">
          <DrawerClose asChild>
            <Button variant="outline">取消</Button>
          </DrawerClose>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "处理中..." : "确认"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
