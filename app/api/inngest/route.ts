import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { correctionFunctions } from "@/lib/inngest/functions";

// 创建 Inngest API 路由
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: correctionFunctions,
}); 