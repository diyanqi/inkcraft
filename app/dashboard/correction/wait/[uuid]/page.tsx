"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function CorrectionWaitPage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("正在排队/处理中，请耐心等待...");
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/correction/progress?uuid=${uuid}`);
        const data = await res.json();
        if (!data.success) {
          setError(data.message || "获取进度失败");
          setStatus("error");
          return;
        }
        setProgress(data.progress ?? 0);
        setStatus(data.status ?? "pending");
        setMessage(data.message ?? "正在排队/处理中，请耐心等待...");
        if (data.status === "finished") {
          // 跳转到批改详情页，假设 data.correctionId 是数据库里的主键
          if (data.correctionId) {
            router.replace(`/dashboard/correction/${data.correctionId}`);
          }
        }
      } catch (e) {
        setError("进度查询失败，请稍后重试");
        setStatus("error");
      }
    }
    fetchProgress();
    if (status !== "finished" && status !== "error") {
      timer = setInterval(fetchProgress, 3000);
    }
    return () => timer && clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid, status]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-6">批改任务正在进行中</h1>
      <Progress value={progress} className="w-80 mb-4" />
      <div className="text-gray-600 mb-2">{message}</div>
      <div className="text-sm text-gray-400">任务ID: {uuid}</div>
      {status === "finished" && <div className="text-green-600 mt-4">批改已完成，正在跳转...</div>}
    </div>
  );
} 