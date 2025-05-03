"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
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

interface Correction {
  id: number;
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
  const id = params!.id as string;
  const [loading, setLoading] = useState(true);
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [error, setError] = useState("");
  const [exportFormat, setExportFormat] = useState("md");
  const [loadingExport, setLoadingExport] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchCorrection() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/correction/${id}`);
        const data = await res.json();
        if (!data.success) {
          setError(data.message || "获取批改记录失败");
        } else {
          setCorrection(data.data);
        }
      } catch (e) {
        setError("请求出错");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCorrection();
  }, [id]);

  if (loading) {
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
    if (!correction) return;

    setLoadingExport(true); // 开始导出时设置加载状态
    try {
      const markdownContent = `# ${correction.title}\n\n` +
        `- 模型: ${correction.model}\n` +
        `- 分数: ${correction.score}\n` +
        `- 创建时间: ${new Date(correction.created_at).toLocaleString()}\n` +
        `- 用户: ${correction.user_email}\n\n` +
        `${correction.content}`;

      if (exportFormat === "md") {
        // 原有Markdown导出逻辑
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
        // PDF导出逻辑

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
        // Docx 导出逻辑
        // @ts-ignore
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
      setLoadingExport(false); // 导出完成后取消加载状态
    }
  };

  return (
    <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{correction.icon}</span>
          <h1 className="text-3xl font-bold">{correction.title}</h1>
          <div className="ml-auto text-2xl font-bold text-green-600">{correction.score} 分</div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
          <div>模型：{correction.model}</div>
          <Separator orientation="vertical" />
          <div>创建时间：{new Date(correction.created_at).toLocaleString()}</div>
          <Separator orientation="vertical" />
          <div>用户：{correction.user_email}</div>
        </div>
        <div className="flex flex-wrap gap-x-6 -mb-3 mt-3">
          <div className="ml-auto">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">导出</Button>
              </DialogTrigger>
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
                        <Loader2 className="animate-spin" />
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
      <div className="prose prose-github dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => <h1 className="text-2xl font-semibold mt-8 mb-4 relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-8 before:bg-gradient-to-b before:from-blue-400 before:to-blue-500 hover:pl-6 hover:before:bg-gradient-to-b hover:before:from-blue-300 hover:before:to-blue-400 before:transition-colors hover:before:transition-colors duration-300 ease-in-out" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
            pre: ({ node, ...props }) => (
              <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto" {...props} />
            ),
            // 增强段落样式
            p: ({ node, ...props }) => (
              <p className="text-lg indent-8 my-2 leading-6 tracking-wide font-semibold text-gray-800 dark:text-gray-200 transition-colors duration-300 hover:text-gray-900 dark:hover:text-gray-100" {...props} />
            ),
          }}
        >
          {correction.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}