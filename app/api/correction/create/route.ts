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
    // 接下来生成初步的 content
    content = `# 1. 题目\n${body.originalText}\n# 2. 我的续写\n${body.essayText}\n`;

    // 调用OpenAI API，生成批改分数结果
    const model = openai('@cf/meta/llama-3.1-8b-instruct-fast');
    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `"作为经验丰富的高考英语续写阅卷专家，请严格按以下细则对读后续写评分，每个子项需先说明评分理由再给出具体分数：

1. 内容与原文融洽度（15分）

• 1.1 情节连贯性（5分）

  ◦ 5分：段首用时间/动作/环境描写无缝衔接原文（如原文结尾"midnight"→续写"At dawn..."）

  ◦ 3分：衔接基本合理但缺乏过渡词（直接跳转"Two days later..."）

  ◦ 1分：情节断裂（如原文紧张场景突转欢乐派对）

• 1.2 人物一致性（5分）

  ◦ 5分：言行符合原文设定（如懦弱角色保持谨慎）

  ◦ 3分：次要人物性格轻微偏差（如朋友从安静变为健谈）

  ◦ 1分：主角行为严重矛盾（善良者无故伤害他人）

• 1.3 主题契合度（5分）

  ◦ 5分：深化原文主题（如"环保"→续写清理污染）

  ◦ 3分：保持主题但缺乏发展（仅重复原文内容）

  ◦ 1分：偏离核心主题（如"友谊"故事突转商业竞争）

2. 情节合理性与完整性（15分）

• 2.1 冲突解决（6分）

  ◦ 6分：用伏笔解决矛盾（如用前文"地图"脱困）

  ◦ 4分：解决合理但缺乏铺垫（突然出现救援队）

  ◦ 2分：未解决冲突或机械降神（外星人救场）

• 2.2 符合常识（5分）

  ◦ 5分：符合物理/社会规则（雨天用塑料布生火）

  ◦ 3分：轻微瑕疵（森林中轻易找到药品）

  ◦ 1分：严重违背常识（徒手击退狼群）

• 2.3 积极结局（4分）

  ◦ 4分：自然传递正能量（互助脱困后建立友谊）

  ◦ 2分：结局积极但突兀（直接陈述"他们幸福了"）

  ◦ 0分：消极结局（主角放弃或死亡）

3. 词汇丰富性（20分）

• 3.1 词汇多样性（8分）

  ◦ 8分：同义词替换≥5处（"said"→whispered/exclaimed）

  ◦ 5分：替换3-4处

  ◦ 2分：重复使用基础词汇

• 3.2 用词准确性（8分）

  ◦ 8分：无中式英语且搭配精准（"make a decision"）

  ◦ 5分：1-2处错误（误用"borrow"代替"lend"）

  ◦ 2分：≥3处搭配错误

• 3.3 高级词汇（4分）

  ◦ 4分：C1+词汇≥3个（resilient, dilemma）

  ◦ 2分：使用1-2个

  ◦ 0分：仅基础词汇

4. 语法准确性（20分）

• 4.1 主谓一致（7分）

  ◦ 7分：零错误

  ◦ 5分：1-2处错误（"She don't know"）

  ◦ 3分：≥3处错误

• 4.2 时态正确（8分）

  ◦ 8分：全文时态与原文100%一致

  ◦ 5分：1-2处时态跳跃（过去→现在时）

  ◦ 3分：≥3处时态错误

• 4.3 句子结构（5分）

  ◦ 5分：无粘连句/片段句

  ◦ 3分：1处结构错误（无连词逗号连接）

  ◦ 1分：≥2处结构错误

5. 句式多样性（10分）

• 5.1 复合句占比（6分）

  ◦ 6分：复合句≥40%（如定语从句"who..."）

  ◦ 4分：30-39%

  ◦ 2分：＜30%

• 5.2 特殊句式（4分）

  ◦ 4分：使用≥2种（倒装/强调/独立主格）

  ◦ 2分：使用1种

  ◦ 0分：未使用

6. 衔接与连贯性（10分）

• 6.1 显性衔接（6分）

  ◦ 6分：过渡词使用≥3次且恰当（however/meanwhile）

  ◦ 4分：使用1-2次

  ◦ 2分：未使用或误用（用"therefore"表转折）

• 6.2 隐性衔接（4分）

  ◦ 4分：代词指代100%清晰（"they"明确指救援队）

  ◦ 2分：1-2处指代模糊

  ◦ 0分：≥3处指代混乱

7. 创新性与逻辑性（10分）

• 7.1 细节创新（5分）

  ◦ 5分：添加≥2个合理新元素（锈指南针/野果充饥）

  ◦ 3分：添加1个新元素

  ◦ 1分：无新细节或脱离逻辑

• 7.2 因果逻辑（5分）

  ◦ 5分：事件因果链完整（受伤→消毒→恢复）

  ◦ 3分：因果基本合理但缺步骤（直接包扎未清洁）

  ◦ 1分：因果断裂（未解释如何获救）

8. 文体与人称一致性（10分）

• 8.1 叙述视角（5分）

  ◦ 5分：严格保持原文人称（第一人称全程"我"）

  ◦ 3分：1-2处人称偏移（混用"I"和"he"）

  ◦ 1分：彻底改变视角

• 8.2 语体风格（5分）

  ◦ 5分：100%符合故事文体（对话用引号，无学术词汇）

  ◦ 3分：1-2处风格不符（用"furthermore"替代"then"）

  ◦ 1分：文体混杂（插入实验数据说明）

标准化JSON输出

{  
  "分项评分": {  
    "内容与原文融洽度": {  
      "情节连贯性": {  
        "reason": "段首用'As the rain poured'衔接原文暴雨场景，但缺乏时间过渡词",  
        "score": 3  
      },  
      "人物一致性": {  
        "reason": "主角保持勇敢设定，但朋友突然冷漠（原文设定为热情）",  
        "score": 3  
      },  
      "主题契合度": {  
        "reason": "深化'勇气'主题，通过克服恐惧推动成长",  
        "score": 5  
      }  
    },  
    "情节合理性与完整性": {  
      "冲突解决": {  
        "reason": "用前文'哨子'发出求救信号，伏笔回收合理",  
        "score": 6  
      },  
      "符合常识": {  
        "reason": "'湿木头生火'违反燃烧常识",  
        "score": 1  
      },  
      "积极结局": {  
        "reason": "传递希望但获救过程仓促",  
        "score": 2  
      }  
    },  
    "词汇丰富性": {  
      "词汇多样性": {  
        "reason": "同义词替换4处（shouted→screamed/cried）",  
        "score": 5  
      },  
      "用词准确性": {  
        "reason": "误用'receive the prize'应为'win the prize'",  
        "score": 5  
      },  
      "高级词汇": {  
        "reason": "使用'resilient'和'determination'",  
        "score": 2  
      }  
    },  
    // 其他维度同理...  
  }
}  

重要提醒：你的输出仅包含JSON格式，不允许出现其他字符或注释。`,
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
      const section = json.分项评分[key];
      for (const subKey in section) {
        totalScore += section[subKey].score;
        content += `\n## ${key}\n${subKey}：${section[subKey].reason}\n`;
      }
    }
    // 100 分制转换为 25 分制，并且保留一位小数
    const score = Number((totalScore / 100 * 25).toFixed(1));

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