"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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

  return (
    <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{correction.icon}</span>
          <h1 className="text-2xl font-bold">{correction.title}</h1>
          <div className="ml-auto text-2xl font-bold text-green-600">{correction.score} 分</div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
          <div>模型：{correction.model}</div>
          <Separator orientation="vertical" />
          <div>创建时间：{new Date(correction.created_at).toLocaleString()}</div>
          <Separator orientation="vertical" />
          <div>用户：{correction.user_email}</div>
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
              <p className="indent-8 my-5 leading-loose tracking-wide font-literature text-gray-800 dark:text-gray-200 transition-colors duration-300 hover:text-gray-900 dark:hover:text-gray-100" {...props} />
            ),
          }}
        >
          {correction.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}