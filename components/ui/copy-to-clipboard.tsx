"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CopyToClipboardProps {
  text: string
}

export function CopyToClipboard({ text }: CopyToClipboardProps) {
  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success("复制成功！")
      },
      (err) => {
        console.error("复制失败:", err)
        toast.error("复制失败，请重试！")
      }
    )
  }, [text])

  return (
    <Button variant="outline" onClick={handleCopy}>
      复制链接
    </Button>
  )
}
