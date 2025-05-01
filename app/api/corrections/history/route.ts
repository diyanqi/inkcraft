import { auth } from "@/auth"
import { CorrectionUtil } from "@/utils/corrections"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit")
  const skip = searchParams.get("skip")

  try {
    const util = new CorrectionUtil();
    const history = await util.getByUserEmail(
      session.user.email,
      limit ? parseInt(limit) : 7,
      skip ? parseInt(skip) : 0
    )
    return NextResponse.json({ data: history })
  } catch (error) {
    console.error("获取历史记录失败:", error)
    return NextResponse.json({ error: "获取历史记录失败" }, { status: 500 })
  }
}