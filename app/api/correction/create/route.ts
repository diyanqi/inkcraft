// app/api/generate-continuation/route.ts (Assuming this is the file)
import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from "@/utils/corrections";
import { auth } from "@/auth";
import { checkModelAvaliability } from "@/utils/models";

// Import the new utility functions
import { generateScore } from "@/utils/generate-continuation";
import { generateTitle, generateIcon } from "@/utils/generate-metadata";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "未登录或无效用户" }, { status: 401 });
    }
    // 获取前端传递的数据（实际开发中应校验数据）
    const body = await req.json();
    // 校验数据：包含：originalText, essayText
    if (!body.originalText || !body.essayText || !body.model || !body.essayType || !body.tone) {
      return NextResponse.json({ success: false, message: "缺少必要参数" }, { status: 400 });
    }
    // 校验 model
    if (checkModelAvaliability(body.model)) {
      return NextResponse.json({ success: false, message: "无效的模型参数" }, { status: 400 });
    }
    // 校验 essayType
    if (!['gaokao-english-continuation'].includes(body.essayType)) {
      return NextResponse.json({ success: false, message: "无效的作文类型参数" }, { status: 400 });
    }
    // 校验 tone
    if (!['default', 'serious', 'humorous', 'sharp'].includes(body.tone)) {
      return NextResponse.json({ success: false, message: "无效的风格参数" }, { status: 400 });
    }

    if (body.essayType === 'gaokao-english-continuation') {
      // content will now be populated by generateScore
      let content = "";
      let score = 0; // Initialize score

      // Use ReadableStream directly
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const enqueue = (data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          // Initial progress message
          enqueue({ type: 'progress', message: '开始批改作文...' });

          try {
            // Call the utility functions
            const scoreResult = await generateScore(
              body.originalText,
              body.essayText,
              body.tone, // Pass tone
              body.model, // Pass model
              enqueue
            );
            score = scoreResult.score;
            content = scoreResult.content;

            // Use fastModel definition from the utility file indirectly via the functions
            // Progress message updated to reflect title generation
            enqueue({ type: 'progress', message: '评分完成，正在生成标题...' });

            let title = "";
            if (body.title && body.title.length > 0) {
              title = body.title;
            } else {
              // Call the utility function for title
              title = await generateTitle(body.originalText, enqueue);
            }

            // Progress message updated to reflect icon generation
            enqueue({ type: 'progress', message: '标题生成完成，正在生成图标...' });

            // Call the utility function for icon
            const icon = await generateIcon(body.originalText, enqueue);

            const testData = {
              title,
              icon,
              model: body.model || "gpt-4", // Keep the original model from body here
              content,
              score,
              user_email: session.user!.email || "",
            };
            const util = new CorrectionUtil();
            const result = await util.create(testData);

            // Send completion message
            enqueue({ type: 'complete', id: result.id });
          } catch (e) {
            // Errors from utility functions are caught here
            enqueue({ type: 'error', message: "批改创建失败", error: String(e) });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
  } catch (e) {
    console.error("Overall error:", e);
    return NextResponse.json({ success: false, message: "服务器错误", error: String(e) }, { status: 500 });
  }
}