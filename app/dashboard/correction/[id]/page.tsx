"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin w-8 h-8 mr-2" /> 加载中...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!correction) {
    return <div className="text-center mt-10">未找到批改记录</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <span className="text-4xl">{correction.icon}</span>
          <div>
            <CardTitle>{correction.title}</CardTitle>
            <div className="text-sm text-gray-500">模型：{correction.model}</div>
            <div className="text-xs text-gray-400">创建时间：{new Date(correction.created_at).toLocaleString()}</div>
          </div>
          <div className="ml-auto text-2xl font-bold text-green-600">{correction.score} 分</div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 font-semibold">批改内容：</div>
          <div className="whitespace-pre-line bg-gray-50 rounded p-4 border text-gray-800">
            {correction.content}
          </div>
          <div className="mt-4 text-xs text-gray-400 text-right">用户：{correction.user_email}</div>
        </CardContent>
      </Card>
    </div>
  );
}