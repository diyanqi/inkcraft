import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from "@/utils/corrections";
import { auth } from "@/auth";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "未登录或无效用户" }, { status: 401 });
    }

    const { params } = await context;
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "无效的ID" }, { status: 400 });
    }
    const util = new CorrectionUtil();
    const data = await util.getById(Number(id));

    if (data && data.user_email !== session.user.email) {
      return NextResponse.json({ success: false, message: "无权访问此批改记录" }, { status: 403 });
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "未找到批改记录" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: "获取批改记录失败", error: String(e) }, { status: 500 });
  }
}