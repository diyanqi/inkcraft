import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from '@/utils/corrections';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");
  if (!uuid) {
    return NextResponse.json({ success: false, message: "缺少uuid参数" }, { status: 400 });
  }

  try {
    const util = new CorrectionUtil();
    const data = await util.getByUuid(uuid);
    if (!data) {
      return NextResponse.json({ success: false, message: "未找到批改任务" }, { status: 404 });
    }

    // 状态映射
    let progress = 10;
    let status = 'pending';
    let message = '任务已提交，等待分配...';
    // 细分阶段
    switch (data.status) {
      case 'pending':
        progress = 10;
        status = 'pending';
        message = '任务已提交，等待分配...';
        break;
      case 'generate-score':
        progress = 20;
        status = 'pending';
        message = '正在智能评分...';
        break;
      case 'generate-interpretation':
        progress = 40;
        status = 'pending';
        message = '正在生成题解读...';
        break;
      case 'generate-upgradation':
        progress = 60;
        status = 'pending';
        message = '正在生成升格建议...';
        break;
      case 'generate-pure-upgradation':
        progress = 75;
        status = 'pending';
        message = '正在生成升格文纯享版...';
        break;
      case 'generate-title':
        progress = 85;
        status = 'pending';
        message = '正在生成标题...';
        break;
      case 'generate-icon':
        progress = 95;
        status = 'pending';
        message = '正在生成图标...';
        break;
      case 'success':
      case 'finished':
        progress = 100;
        status = 'finished';
        message = '批改已完成，正在跳转...';
        break;
      case 'failed':
      case 'error':
        progress = 100;
        status = 'error';
        message = '批改失败，请重试或联系管理员';
        break;
      default:
        progress = 10;
        status = 'pending';
        message = 'AI正在批改中，请耐心等待...';
    }

    return NextResponse.json({
      success: true,
      progress,
      status,
      message,
      correctionId: status === 'finished' ? data.id : null,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      message: e?.message || "查询进度失败",
    }, { status: 500 });
  }
} 