import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from "@/utils/corrections";

export async function POST(req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) {
    const { public: isPublic } = await req.json();

    const actualParams = await params;
    const { uuid } = actualParams;

    if (!uuid || typeof isPublic !== "boolean") {
        return NextResponse.json({ success: false, message: "无效的请求参数" }, { status: 400 });
    }

    try {
        const util = new CorrectionUtil();
        const updated = await util.updateByUuid(uuid, { public: isPublic });

        if (updated) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: "更新失败" }, { status: 500 });
        }
    } catch (error) {
        console.error("更新分享状态失败:", error);
        return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
    }
}
