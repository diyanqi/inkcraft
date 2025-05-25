// app/api/correction/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkModelAvaliability } from "@/utils/models";
import { checkToneAvaliability } from "@/utils/tone-prompt";
import { inngest } from "@/lib/inngest";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "未登录或无效用户" }, { status: 401 });
    }

    const body = await req.json();
    const { originalText, essayText, essayTexts, model, essayType, tone, title, referenceText } = body;

    // Basic common validations
    if (!originalText || !model || !essayType || !tone) {
      return NextResponse.json({ success: false, message: "缺少原题、模型、作文类型或语气参数" }, { status: 400 });
    }

    // Validate essayText or essayTexts
    const isBatch = Array.isArray(essayTexts) && essayTexts.length > 0;
    const isSingle = typeof essayText === 'string' && essayText.trim() !== '';

    if (!isBatch && !isSingle) {
      return NextResponse.json({ success: false, message: "缺少习作内容 (essayText或essayTexts)" }, { status: 400 });
    }
    if (isBatch && isSingle) {
      return NextResponse.json({ success: false, message: "不能同时提供 essayText 和 essayTexts" }, { status: 400 });
    }
    
    if (isBatch) {
        for (const text of essayTexts) {
            if (typeof text !== 'string' || text.trim() === '') {
                return NextResponse.json({ success: false, message: "批量习作中包含无效或空的文本" }, { status: 400 });
            }
        }
    }

    if (!checkModelAvaliability(model)) {
      return NextResponse.json({ success: false, message: "无效的模型参数" }, { status: 400 });
    }

    // Allow more essay types if your system supports them, this example focuses on gaokao-english-continuation
    const VALID_ESSAY_TYPES = ['gaokao-english-continuation', 'gaokao-english-practical', 'gaokao-chinese-composition'];
    if (!VALID_ESSAY_TYPES.includes(essayType)) {
      return NextResponse.json({ success: false, message: "无效的作文类型参数" }, { status: 400 });
    }

    if (!checkToneAvaliability(tone)) {
      return NextResponse.json({ success: false, message: "无效的语气参数" }, { status: 400 });
    }

    // Generate unique ID for the job (batch or single)
    const uuid = uuidv4();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventData: any = {
      uuid,
      user_email: session.user.email,
      originalText,
      model,
      essayType,
      tone,
      title: title || "", // Ensure title is at least an empty string
      referenceText: referenceText || "", // Ensure referenceText is at least an empty string
      isBatch,
    };

    if (isBatch) {
      eventData.essayTexts = essayTexts;
    } else {
      eventData.essayText = essayText; // For single essay
    }

    // Send event to Inngest
    await inngest.send({
      name: "correction/create", // Ensure this matches your Inngest function event trigger
      data: eventData
    });

    return NextResponse.json({
      success: true,
      message: "批改任务已提交，正在后台处理",
      uuid
    });

  } catch (e) {
    console.error("API Error in /api/correction/create:", e);
    const errorMessage = e instanceof Error ? e.message : "服务器内部错误";
    return NextResponse.json({ success: false, message: errorMessage, error: String(e) }, { status: 500 });
  }
}