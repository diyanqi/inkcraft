import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from "@/utils/corrections";
import { auth } from "@/auth";
// import { unknown } from "zod"; // This import is unnecessary and can be removed

export async function GET(req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
  try {
    const session = await auth();

    // You need to await params as its type is Promise
    const actualParams = await params;
    const { uuid } = actualParams;

    if (!uuid) {
      return NextResponse.json({ success: false, message: "无效的UUID" }, { status: 400 });
    }
    const util = new CorrectionUtil();
    const data = await util.getByUuid(uuid);

    if (!data) {
      return NextResponse.json({ success: false, message: "未找到批改记录" }, { status: 404 });
    }

    if (data.public) {
      return NextResponse.json({ success: true, data });
    }

    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "未登录或无效用户" }, { status: 401 });
    }

    // Add a check if data exists before accessing data.user_email (though the previous check covers this)
    if (data && data.user_email !== session.user.email) {
      return NextResponse.json({ success: false, message: "无权访问此批改记录" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: unknown) { // Type e as unknown (often the default)
    // Safely determine the error message
    let errorMessage = "未知错误";
    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else {
        errorMessage = String(e); // Fallback for other types
    }

    return NextResponse.json({
      success: false,
      message: "获取批改记录失败", // User-friendly message
      error: errorMessage // Technical error details
    }, { status: 500 });
  }
}
