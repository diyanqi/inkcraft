// app/api/generate-continuation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from "@/utils/corrections";
import { auth } from "@/auth";
import { checkModelAvaliability } from "@/utils/models";
import { checkToneAvaliability } from "@/utils/tone-prompt";
import { inngest } from "@/lib/inngest";

// Import the new utility functions
import { generateScore, generateUpgradation } from "@/utils/generate-continuation";
import { generateTitle, generateIcon } from "@/utils/generate-metadata";


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "未登录或无效用户" }, { status: 401 });
    }

    const body = await req.json();
    
    // 校验数据：包含：originalText, essayText
    if (!body.originalText || !body.essayText || !body.model || !body.essayType || !body.tone) {
      return NextResponse.json({ success: false, message: "缺少必要参数" }, { status: 400 });
    }

    // 校验 model
    if (!checkModelAvaliability(body.model)) {
      return NextResponse.json({ success: false, message: "无效的模型参数" }, { status: 400 });
    }

    // 校验 essayType
    if (!['gaokao-english-continuation'].includes(body.essayType)) {
      return NextResponse.json({ success: false, message: "无效的作文类型参数" }, { status: 400 });
    }

    // 校验 tone
    if (!checkToneAvaliability(body.tone)) {
      return NextResponse.json({ success: false, message: "无效的语气参数" }, { status: 400 });
    }

    if (body.essayType === 'gaokao-english-continuation') {
      // 生成唯一ID
      const id = crypto.randomUUID();

      // 发送事件到 Inngest
      await inngest.send({
        name: "correction/create",
        data: {
          ...body,
          id,
          user_email: session.user.email
        }
      });

      // 返回成功响应
      return NextResponse.json({ 
        success: true, 
        message: "批改任务已提交，正在后台处理",
        id
      });
    }

    return NextResponse.json({ success: false, message: "不支持的作文类型" }, { status: 400 });
  } catch (e) {
    console.error("Overall error:", e);
    return NextResponse.json({ success: false, message: "服务器错误", error: String(e) }, { status: 500 });
  }
}