"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown, { Components } from "react-markdown"; // Import Components type
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { unified } from "unified";
import markdown from "remark-parse";
import docx from "remark-docx";
import { saveAs } from "file-saver";
import React from "react"; // Import React for types like ReactNode
import CorrectionMarkdownContent from "./CorrectionMarkdownContent";
import CorrectionJsonContent from "./CorrectionJsonContent";

interface Correction {
    uuid: string;
    title: string;
    icon: string;
    model: string;
    content: string;
    score: number;
    user_email: string;
    created_at: string;
    updated_at: string;
}

export default function CorrectionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const uuid = params!.uuid as string;
    const [loading, setLoading] = useState(true);
    const [correction, setCorrection] = useState<Correction | null>(null);
    const [error, setError] = useState("");
    const [exportFormat, setExportFormat] = useState("md");
    const [loadingExport, setLoadingExport] = useState(false);
    const [open, setOpen] = useState(false);
    const [jsonContent, setJsonContent] = useState<any | null>(null);

    useEffect(() => {
        async function fetchCorrection() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/correction/${uuid}`);
                const data = await res.json();
                if (!data.success) {
                    setError(data.message || "获取批改记录失败");
                } else {
                    setCorrection(data.data);
                    // 尝试解析 content 为 JSON
                    try {
                        const parsed = JSON.parse(data.data.content);
                        setJsonContent(parsed);
                    } catch (e) {
                        setJsonContent(null);
                    }
                }
            } catch (e) {
                setError("请求出错");
            } finally {
                setLoading(false);
            }
        }
        if (uuid) fetchCorrection();
    }, [uuid]);

    if (loading) {
        // ... (Skeleton loading state remains the same)
        return (
          <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded" />
                <Skeleton className="h-8 w-[200px]" />
                <div className="ml-auto">
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </header>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[92%]" />
            </div>
          </article>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center mt-10">{error}</div>;
    }

    if (!correction) {
        return <div className="text-center mt-10">未找到批改记录</div>;
    }

    const handleExport = async () => {
        // ... (Export logic remains the same)
        if (!correction) return;

        setLoadingExport(true);
        try {
          const markdownContent = `# ${correction.title}\n\n` +
            `- 模型: ${correction.model}\n` +
            `- 分数: ${correction.score}\n` +
            `- 创建时间: ${new Date(correction.created_at).toLocaleString()}\n` +
            `- 用户: ${correction.user_email}\n\n` +
            `${correction.content}`;

          if (exportFormat === "md") {
            const blob = new Blob([markdownContent], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${correction.title.replace(/\s+/g, "_")}_批改记录.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else if (exportFormat === "pdf") {
            const response = await fetch("https://loose-randi-amzcd-498668ee.koyeb.app", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                markdown: markdownContent,
              }),
            });

            if (!response.ok) throw new Error("PDF生成失败");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${correction.title.replace(/\s+/g, "_")}_批改记录.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else if (exportFormat === "docx") {
            // @ts-ignore remark-docx might need specific setup or types
            const processor = unified().use(markdown).use(docx, { output: "blob" });

            const doc = await processor.process(markdownContent);
            const blob = await doc.result as Blob;
            saveAs(blob, `${correction.title.replace(/\s+/g, "_")}_批改记录.docx`);
          }
          setOpen(false);
        } catch (error) {
          console.error("导出错误:", error);
          alert("导出失败，请重试或选择其他格式");
        } finally {
          setLoadingExport(false);
        }
    };

    // Define the custom components for ReactMarkdown
    const markdownComponents: Components = {
        // Adjusted Heading Sizes: h1=2xl, h2=xl, h3=lg, h4=base
        h1: ({ node, ...props }) => <h1 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0" {...props} />,
        h2: ({ node, ...props }) => <h2 className="mt-10 scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" {...props} />,
        h3: ({ node, ...props }) => <h3 className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight" {...props} />,
        h4: ({ node, ...props }) => <h4 className="mt-6 scroll-m-20 text-base font-semibold tracking-tight" {...props} />, // Changed to text-base
        p: ({ node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
        a: ({ node, ...props }) => <a className="font-medium text-primary underline underline-offset-4" {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />,
        ul: ({ node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />,
        li: ({ node, ...props }) => <li className="mt-2" {...props} />,
        table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-y-auto">
                <table className="w-full" {...props} />
            </div>
        ),
        thead: ({ node, ...props }) => <thead {...props} />,
        tbody: ({ node, ...props }) => <tbody {...props} />,
        tr: ({ node, ...props }) => <tr className="m-0 border-t p-0 even:bg-muted" {...props} />,
        th: ({ node, ...props }) => <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
        td: ({ node, ...props }) => <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
        pre: ({ node, children, ...props }) => (
            <pre className="mt-6 mb-4 overflow-x-auto rounded-lg border bg-black py-4" {...props}>
                {/* The direct child of pre should be code, let the code component handle its styling */}
                {children}
            </pre>
        ),
        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        hr: ({ node, ...props }) => <hr className="my-4 md:my-8 border-border" {...props} />, // Added border color
    };


    return (
        <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
                 {/* ... (Header content remains the same) */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{correction.icon}</span>
                  <h1 className="text-3xl font-bold">{correction.title}</h1> {/* Page Title */}
                  <div className="ml-auto text-2xl font-bold text-green-600">{correction.score} 分</div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                  <div>模型：{correction.model}</div>
                  <Separator orientation="vertical" className="h-auto" />
                  <div>创建时间：{new Date(correction.created_at).toLocaleString()}</div>
                  <Separator orientation="vertical" className="h-auto" />
                  <div>用户：{correction.user_email}</div>
                </div>
                <div className="flex flex-wrap gap-x-6 -mb-3 mt-3">
                  <div className="ml-auto">
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">导出</Button>
                      </DialogTrigger>
                      {/* ... (Dialog content remains the same) */}
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>导出</DialogTitle>
                          <DialogDescription>
                            选择您需要的格式并导出。
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              导出格式
                            </Label>
                            <Select onValueChange={setExportFormat} value={exportFormat}>
                              <SelectTrigger className="w-[230px]">
                                <SelectValue placeholder="选择格式" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="md">.md</SelectItem>
                                <SelectItem value="pdf">.pdf</SelectItem>
                                <SelectItem value="docx">.docx</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                              取消
                            </Button>
                          </DialogClose>
                          <Button type="submit" onClick={handleExport} disabled={loadingExport}>
                            {loadingExport ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                请稍候
                              </>
                            ) : (
                              "确认导出"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
            </header>
            <Separator />
            <div className="mt-6 max-w-none">
                {jsonContent ? (
                    <CorrectionJsonContent data={jsonContent} />
                ) : (
                    <CorrectionMarkdownContent content={correction.content} />
                )}
            </div>
        </article>
    );
}