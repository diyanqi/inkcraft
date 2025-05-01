import { NextRequest, NextResponse } from "next/server";
import { CorrectionUtil } from "@/utils/corrections";
import { auth } from "@/auth";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASEURL || '',
  apiKey: process.env.OPENAI_API_APIKEY || '',
  compatibility: 'compatible',
});

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

    let content = "";

    // 调用OpenAI API，生成批改分数结果
    const model = openai('@cf/meta/llama-3.1-8b-instruct-fast');
    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `你是高考英语阅卷专家，用户将会给你一个高考英语读后续写作文题目和他的作文，请按以下规则严谨评分：
1. 评分维度与分值（共100分）：
  ◦ ① 内容与原文融洽度（15分）
  ◦ ② 情节合理性与完整性（15分）
  ◦ ③ 词汇丰富性（20分）
  ◦ ④ 语法准确性（20分）
  ◦ ⑤ 句式多样性（10分）
  ◦ ⑥ 衔接与连贯性（10分）
  ◦ ⑦ 创新性与逻辑性（10分）
  ◦ ⑧ 文体与人称一致性（10分）
2. 扣分证据链要求：
  ◦ 对每处扣分必须提供：
✓ 错误类型定位（如"时态错误/语法错误/逻辑错误等"）
✓ 原文位置标注（如"第2段第3句"）
3. 输出规范：
{  
  "分项评分": {  
    "内容融洽度": 分数,  
    "情节合理性": 分数,  
    "词汇": 分数,  
    "语法": 分数,  
    "句式": 分数,  
    "衔接": 分数,  
    "创新": 分数,  
    "文体": 分数  
  },   
  "扣分证据链": [  
    {  
      "维度": "语法",  
      "扣分": 分值,  
      "思考": "错误类型+位置+修正建议",  
      "例句": "续写原文引用"  
    },  
    ...  
  ]
}  
4. 执行步骤：
  ◦ Step 1：对照原文标记续写中的情节矛盾点（如人物行为突变）
  ◦ Step 2：逐句分析语法错误（时态/主谓一致/从句结构）并定位
  ◦ Step 3：统计句式复杂度（复合句占比需≥40%）
  ◦ Step 4：验证人称与文体一致性（如对话需用引号，不得混合正式与非正式用语）
5. 重要提醒：你的输出仅包含JSON格式，不允许出现其他字符或注释。`,
        },
        {
          role: 'user',
          content: `# 1. 题目\n${body.originalText}\n# 2. 我的续写\n${body.essayText}`,
        },
      ],
      maxTokens: 4096,
      temperature: 0.1,
    });
    // 解析字符串，首先找到json所在的位置（从第一个`{`开始，到最后一个`}`结束）
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonString = text.substring(start, end + 1);
    // 解析JSON字符串
    const json = JSON.parse(jsonString);
    // 计算总分
    let totalScore = 0;
    for (const key in json.分项评分) {
      totalScore += json.分项评分[key];
    }
    // 100 分制转换为 25 分制，并且保留一位小数
    const score = Number((totalScore / 100 * 25).toFixed(1));
    // 接下来生成初步的 content
    content = `# 1. 题目\n${body.originalText}\n# 2. 我的续写\n${body.essayText}\n# 3. 我的评分\n总分：${score}分`;
    // 加入扣分证据链
    for (const evidence of json.扣分证据链) {
      content += `\n\n# 扣分证据链\n${evidence.思考}\n${evidence.例句}`;
    }

    const fastModel = openai('@cf/meta/llama-3.1-8b-instruct-fast');
    // 生成标题
    let title = "";
    if (body.title && body.title.length > 0) {
      title = body.title;
    } else {
      // 调用OpenAI API，生成标题
      const { text: titleResponse } = await generateText({
        model: fastModel,
        messages: [
          {
            role: 'system',
            content: `用户将提供给你一道读后续写题，请你分析题目内容，并总结出一个标题，输出时仅包含一行该标题，不允许出现其他字符或注释。`,
          },
          {
            role: 'user',
            content: `读后续写题：\n${body.originalText}`,
          }
        ]
      });
      title = titleResponse;
    }

    // 生成图标
    const { text: icon } = await generateText({
      model: fastModel,
      messages: [
        {
          role: 'system',
          content: `用户将提供给你一道读后续写题，请你分析题目内容，并输出一个你认为与之相关的emoji字符（只能一个字符，例如📝），并且在输出时不允许出现其他字符或注释。`,
        },
        {
          role: 'user',
          content: `读后续写题：\n${body.originalText}`,
        }
      ]
    });

    const testData = {
      title,
      icon,
      model: body.model || "gpt-4",
      content,
      score,
      user_email: session.user.email,
    };
    const util = new CorrectionUtil();
    const result = await util.create(testData);
    return NextResponse.json({ success: true, id: result.id });
  } catch (e) {
    return NextResponse.json({ success: false, message: "批改创建失败", error: String(e) }, { status: 500 });
  }
}