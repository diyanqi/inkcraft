import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from "@/utils/corrections";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "未登录或无效用户" }, { status: 401 });
    }
    // 获取前端传递的数据（实际开发中应校验数据）
    // 这里只用测试数据
    const body = await req.json();
    const testData = {
      title: "测试批改标题",
      icon: "📝",
      model: "gpt-4",
      content: body.essayText,
      score: 9.5,
      user_email: session.user.email,
    };
    const util = new CorrectionUtil();
    const result = await util.create(testData);
    return NextResponse.json({ success: true, id: result.id });
  } catch (e) {
    return NextResponse.json({ success: false, message: "批改创建失败", error: String(e) }, { status: 500 });
  }
}