// utils/generate-continuation.ts
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai'; // StreamPart is implicitly handled by the SDK types now
import { parse } from 'best-effort-json-parser';

// Define AI model instances - these are shared
const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASEURL || '',
  apiKey: process.env.OPENAI_API_APIKEY || '',
  compatibility: 'compatible',
});

const deepseek = createOpenAI({
  baseURL: process.env.DEEPSEEK_API_BASEURL || '',
  apiKey: process.env.DEEPSEEK_API_APIKEY || '',
  compatibility: 'compatible',
});

const siliconflow = createOpenAI({
  baseURL: process.env.SILICONFLOW_API_BASEURL || '',
  apiKey: process.env.SILICONFLOW_API_APIKEY || '',
  compatibility: 'compatible',
})

const gpt = createOpenAI({
  baseURL: process.env.GPT_API_BASEURL || '',
  apiKey: process.env.GPT_API_APIKEY || '',
  compatibility: 'compatible',
})
// Helper type for the enqueue function
type EnqueueFunction = (data: any) => void;

// Define the expected top-level scoring categories from the prompt
const SCORING_CATEGORIES = [
  "内容与原文融洽度",
  "情节合理性与完整性",
  "词汇丰富性",
  "语法准确性",
  "句式多样性",
  "衔接与连贯性",
  "创新性与逻辑性",
  "文体与人称一致性",
  "英语文学素养与教师主观评价"
];


/**
 * Generates the score and detailed breakdown for the essay continuation.
 * Streams the raw AI response to the console and sends progress updates for scoring categories.
 * @param originalText The original text prompt.
 * @param essayText The user's essay continuation text.
 * @param tone The tone parameter.
 * @param model The model parameter.
 * @param enqueue Function to send progress updates via the stream.
 * @returns An object containing the calculated score and the detailed content string.
 */
export async function generateScore(
  originalText: string,
  essayText: string,
  tone: string,
  model: string,
  enqueue: EnqueueFunction
): Promise<{ score: number, content: string }> {
  enqueue({ type: 'progress', message: '正在生成评分...' });
  console.log("Initiating score generation..."); // Console log start

  let content = `# 1. 题目\n${originalText}\n# 2. 我的续写\n${essayText}\n`;
  let fullResponseText = ''; // Accumulator for the full AI response text
  const reportedCategories = new Set<string>(); // Track categories already reported via enqueue

  try {
    // Use the specific model defined in the original logic
    const aiModel = (
      model === 'llama' ? openai('@cf/meta/llama-4-scout-17b-16e-instruct') :
        model === 'deepseek' ? deepseek('deepseek-chat') :
          model === 'qwen' ? siliconflow('Qwen/Qwen3-8B') :
            model === 'glm' ? siliconflow('THUDM/GLM-Z1-9B-0414') :
              model === 'gpt4' ? siliconflow('gpt-3.5-turbo') :
                openai('@cf/qwen/qwen1.5-14b-chat-awq')
    );

    const tonePrompt = (
      tone === 'serious' ? "特别要求：你的评论批改语气需要一本正经，像一个经验丰富而严厉的老师。" :
        tone === 'humorous' ? "特别要求：你的评论批改语气需要幽默风趣，可以用上网络梗，可以多用emoji表情包，可以多搞笑。" :
          tone === 'sharp' ? "特别要求：你的评论批改语气需要尖锐、锐评、一针见血。" :
            ""
    );

    console.log("--- Streaming AI response for score ---"); // Marker for console output

    // Call streamText and iterate over the response stream
    const streamResult = await streamText({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: `"你是一个高考英语读后续写的阅卷老师，现在有一个高考英语读后续写作文题目和一篇待批改续写作文，需要你对这篇待批改作文进行评分。
要求：
1）请认真阅读作文批改要求和作文题目，对这篇待批改作文进行公正严格的批改和打分；
2）评分一定要严格，实事求是，好的给高分，差的给低分。
3）最后返回内容要严格按照最后的输出格式。

一、作文批改要求
  不能轻易随便给出高分，更不能给出满分。
  要严格批改，每一处评分都要在用户的作文中找到证据。
  每个子项需先说明评分理由再给出具体分数：
1. 内容与原文融洽度（15分）
• 1.1 情节连贯性（5分）
  ◦ 5分：段首用时间/动作/环境描写无缝衔接原文（如原文结尾"midnight"→续写"At dawn..."）
  ◦ 2分：衔接基本合理但缺乏过渡词（直接跳转"Two days later..."）
  ◦ 0分：情节断裂（如原文紧张场景突转欢乐派对）
• 1.2 人物一致性（5分）
  ◦ 5分：言行符合原文设定（如懦弱角色保持谨慎）
  ◦ 2分：次要人物性格轻微偏差（如朋友从安静变为健谈）
  ◦ 0分：主角行为严重矛盾（善良者无故伤害他人）
• 1.3 主题契合度（5分）
  ◦ 5分：深化原文主题（如"环保"→续写清理污染）
  ◦ 2分：保持主题但缺乏发展（仅重复原文内容）
  ◦ 0分：偏离核心主题（如"友谊"故事突转商业竞争）
2. 情节合理性与完整性（15分）
• 2.1 冲突解决（5分）
  ◦ 5分：用伏笔解决矛盾（如用前文"地图"脱困）
  ◦ 2分：解决合理但缺乏铺垫（突然出现救援队）
  ◦ 0分：未解决冲突或机械降神（外星人救场）
• 2.2 符合常识（5分）
  ◦ 5分：符合物理/社会规则（雨天用塑料布生火）
  ◦ 2分：轻微瑕疵（森林中轻易找到药品）
  ◦ 0分：严重违背常识（徒手击退狼群）
• 2.3 积极结局（5分）
  ◦ 5分：自然传递正能量（互助脱困后建立友谊）
  ◦ 2分：结局积极但突兀（直接陈述"他们幸福了"）
  ◦ 0分：消极结局（主角放弃或死亡）
3. 词汇丰富性（10分）
• 3.1 词汇多样性（3分）
  ◦ 3分：同义词替换≥5处（"said"→whispered/exclaimed）
  ◦ 1分：替换3-4处
  ◦ 0分：重复使用基础词汇
• 3.2 用词准确性（3分）
  ◦ 3分：无中式英语且搭配精准（"make a decision"）
  ◦ 1分：1-2处错误（误用"borrow"代替"lend"）
  ◦ 0分：≥3处搭配错误
• 3.3 高级词汇（4分）
  ◦ 4分：C1+词汇≥3个（resilient, dilemma）
  ◦ 2分：使用1-2个
  ◦ 0分：仅基础词汇
4. 语法准确性（15分）
• 4.1 主谓一致（5分）
  ◦ 5分：零错误
  ◦ 2分：1-2处错误（"She don't know"）
  ◦ 0分：≥3处错误
• 4.2 时态正确（5分）
  ◦ 5分：全文时态与原文100%一致
  ◦ 2分：1-2处时态跳跃（过去→现在时）
  ◦ 0分：≥3处时态错误
• 4.3 句子结构（5分）
  ◦ 5分：无粘连句/片段句
  ◦ 2分：1处结构错误（无连词逗号连接）
  ◦ 0分：≥2处结构错误
5. 句式多样性（10分）
• 5.1 复合句占比（4分）
  ◦ 4分：复合句≥40%（如定语从句"who..."）
  ◦ 2分：30-39%
  ◦ 0分：＜30%
• 5.2 特殊句式（6分）
  ◦ 6分：使用≥3种（倒装/强调/独立主格）
  ◦ 2分：使用1-2种
  ◦ 0分：未使用
6. 衔接与连贯性（10分）
• 6.1 显性衔接（6分）
  ◦ 6分：过渡词使用≥3次且恰当（however/meanwhile）
  ◦ 3分：使用1-2次
  ◦ 1分：未使用或误用（用"therefore"表转折）
• 6.2 隐性衔接（4分）
  ◦ 4分：代词指代100%清晰（"they"明确指救援队）
  ◦ 2分：1-2处指代模糊
  ◦ 0分：≥3处指代混乱
7. 创新性与逻辑性（10分）
• 7.1 细节创新（5分）
  ◦ 5分：添加≥2个合理新元素（锈指南针/野果充饥）
  ◦ 2分：添加1个新元素
  ◦ 0分：无新细节或脱离逻辑
• 7.2 因果逻辑（5分）
  ◦ 5分：事件因果链完整（受伤→消毒→恢复）
  ◦ 2分：因果基本合理但缺步骤（直接包扎未清洁）
  ◦ 0分：因果断裂（未解释如何获救）
8. 文体与人称一致性（10分）
• 8.1 叙述视角（5分）
  ◦ 5分：严格保持原文人称（第一人称全程"我"）
  ◦ 3分：1-2处人称偏移（混用"I"和"he"）
  ◦ 0分：彻底改变视角
• 8.2 语体风格（5分）
  ◦ 5分：100%符合故事文体（对话用引号，无学术词汇）
  ◦ 3分：1-2处风格不符（用"furthermore"替代"then"）
  ◦ 0分：文体混杂
9. 英语文学素养与教师主观评价（10分）
• 9.1 英语语言素养（5分）
  ◦ 5分：总体读来自然流畅，称得上是地道的 native English，看不出是中国人写的
  ◦ 2分：有中文式英语的痕迹
  ◦ 0分：完全不符合英语语言习惯
• 9.2 教师主观评价（5分）
  ◦ 5分：看起来很舒服，真人阅卷老师可能会喜欢
  ◦ 2分：真人阅卷老师可能会觉得有不足之处
  ◦ 0分：完全不符合老师的评价标准

二、作文题目
${originalText}

三、作文内容
${essayText}

四、输出格式
示例标准化JSON输出：
{
  "分项评分": {
    "内容与原文融洽度": {
      "情节连贯性": {
        "reason": "段首用'As the rain poured'衔接原文暴雨场景，但缺乏时间过渡词",
        "score": 2
      },
      "人物一致性": {
        "reason": "主角保持勇敢设定，但朋友突然冷漠（原文设定为热情）",
        "score": 2
      },
      "主题契合度": {
        "reason": "深化'勇气'主题，通过克服恐惧推动成长",
        "score": 2
      }
    },
    "情节合理性与完整性": {
      "冲突解决": {
        "reason": "用前文'哨子'发出求救信号，伏笔回收合理",
        "score": 2
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
        "score": 3
      },
      "用词准确性": {
        "reason": "误用'receive the prize'应为'win the prize'",
        "score": 2
      },
      "高级词汇": {
        "reason": "使用'resilient'和'determination'",
        "score": 2
      }
    },
    // 其他维度同理，你需要根据前面所说的，每一条都要进行评分。
  }
}
${tonePrompt}
重要提醒：你的输出仅包含【JSON格式】，不允许出现其他字符或注释。对于json格式中双引号里的内容，请勿再次使用双引号，只允许使用单引号。`,
        },
      ],
      maxTokens: 4096, // Reduced maxTokens slightly as a potential optimization, adjust if needed
      // temperature: 0,
      topP: 0.1,
    });

    // Iterate over the stream parts
    for await (const part of streamResult.fullStream) {
      // Check if the part is a text delta and has content
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        // Write the chunk directly to the console's standard output
        process.stdout.write(chunk);
        // Append the chunk to the full response text
        fullResponseText += chunk;

        // --- Check for new category keys ---
        for (const category of SCORING_CATEGORIES) {
          // Check if category hasn't been reported yet AND appears in the text
          // We look for the category name enclosed in quotes followed by a colon
          // This is a heuristic and might need adjustment if AI format varies slightly
          const searchString = `"${category}":`;
          if (!reportedCategories.has(category) && fullResponseText.includes(searchString)) {
            // Send enqueue message for this category
            enqueue({ type: 'progress', message: `正在评分: ${category}` });
            // Mark this category as reported
            reportedCategories.add(category);
          }
        }
        // --- End check for new category keys ---
      }
      // You could potentially handle other part types here if needed
      // e.g., part.type === 'finish', part.type === 'error'
    }

    console.log("\n--- End of AI response stream ---"); // Add a newline and marker

    // Check if we received any response
    if (!fullResponseText) {
      throw new Error("AI response was empty.");
    }

    // Parse the accumulated JSON string
    const start = fullResponseText.indexOf('{');
    const end = fullResponseText.lastIndexOf('}');
    if (start === -1 || end === -1 || start >= end) {
      console.error("Invalid JSON structure received:", fullResponseText);
      throw new Error("Failed to find valid JSON object in AI response. Raw response logged.");
    }
    const jsonString = fullResponseText.substring(start, end + 1);

    let json: any;
    try {
      json = parse(jsonString); // Use best-effort parser
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      console.error("Received JSON string:", jsonString);
      throw new Error(`Failed to parse AI response JSON: ${parseError}`);
    }

    // Check if the parsed JSON has the expected structure
    if (!json || typeof json !== 'object' || !json.分项评分) {
      console.error("Parsed JSON missing expected '分项评分' key:", json);
      throw new Error("Parsed JSON does not have the expected structure ('分项评分' key missing).");
    }

    // Calculate total score and format content
    let totalScore = 0;
    content += `# 3. 评分细则\n`;
    // Ensure consistent order matching SCORING_CATEGORIES if possible, otherwise use the order from JSON
    const finalCategories = json.分项评分; // Use the parsed JSON structure
    for (const key in finalCategories) { // Iterate through the keys from the actual JSON response
      if (Object.prototype.hasOwnProperty.call(finalCategories, key)) { // Ensure key is own property
        const section = finalCategories[key];
        // Format category header (e.g., make it bold markdown)
        content += `\n- **${key}**\n\n  `; // Add bold markdown and indent reasons
        let reasonContent = "";
        if (typeof section === 'object' && section !== null) { // Check if section is an object
          for (const subKey in section) {
            if (Object.prototype.hasOwnProperty.call(section, subKey)) { // Ensure subKey is own property
              const scoreValue = Number(section[subKey]?.score) || 0; // Ensure score is a number
              totalScore += scoreValue;
              // Combine reason and score for each sub-item if needed, or just reasons
              reasonContent += `${section[subKey]?.reason || 'N/A'}； `; // Add subkey/score detail
            }
          }
        } else {
          console.warn(`Section '${key}' is not an object or is null in the response.`);
          reasonContent = '评分数据格式错误； ';
        }
        // Remove trailing semicolon and space, add period.
        content += reasonContent.trim().replace(/；$/, '。') + '\n';
      }
    }


    // Convert to 25-point scale and round to one decimal place
    let score = Number((totalScore / 100 * 25).toFixed(1));

    // Fallback using regex - Keep this as a safety net
    if (isNaN(score) || (score === 0 && totalScore === 0 && fullResponseText.length > 10)) { // Added length check to avoid fallback on genuinely empty/failed responses
      console.warn("Initial score calculation resulted in 0 or NaN, attempting regex fallback...");
      const regex = /(\d+)\s*分/g;
      const matches = fullResponseText.match(regex);
      let fallbackSum = 0;
      if (matches) {
        fallbackSum = matches.reduce((acc, cur) => {
          const num = parseInt(cur, 10);
          return acc + (isNaN(num) ? 0 : num);
        }, 0);
        console.log(`Regex fallback found scores summing to: ${fallbackSum}`);
      } else {
        console.warn("Regex fallback found no score matches.");
      }
      if (fallbackSum > 0) {
        totalScore = fallbackSum;
        score = Number((totalScore / 100 * 25).toFixed(1));
        console.log(`Using fallback score: ${score}`);
      } else {
        console.warn("Fallback score is also 0 or failed. Score remains 0.");
        score = 0;
      }
    }

    // Ensure score is within 0-25 range and is a valid number
    score = Math.max(0, Math.min(25, isNaN(score) ? 0 : score));
    content += `\n## 总分\n${score}分`; // Use standard markdown for Total Score header

    console.log(`Final score calculated: ${score}`); // Log final score
    return { score, content };

  } catch (error) {
    console.error("Error generating score:", error);
    if (fullResponseText) {
      console.error("Partial AI response received before error:", fullResponseText);
    }
    enqueue({ type: 'error', message: '生成评分失败', error: String(error) });
    throw error;
  }
}

// --- generateTitle and generateIcon remain unchanged ---

/**
 * Generates a title for the essay continuation based on the original text.
 * @param originalText The original text prompt.
 * @param enqueue Function to send progress updates via the stream.
 * @returns The generated title string.
 */
export async function generateTitle(
  originalText: string,
  enqueue: EnqueueFunction
): Promise<string> {
  enqueue({ type: 'progress', message: '正在生成标题...' });

  try {
    // Use a faster model for title generation
    const fastModel = openai('@cf/meta/llama-3.1-8b-instruct-fast'); // Assuming this model exists and is fast

    const { text: titleResponse } = await generateText({
      model: fastModel,
      messages: [
        {
          role: 'system',
          content: `用户将提供给你一道读后续写题，请你分析题目内容，并总结出一个标题，输出时仅包含一行该标题，不允许出现其他字符或注释。`,
        },
        {
          role: 'user',
          content: `读后续写题：\n${originalText}`,
        }
      ],
      temperature: 0.5 // Allow some creativity for title
    });

    return titleResponse.trim(); // Return the generated title, trimmed

  } catch (error) {
    console.error("Error generating title:", error);
    enqueue({ type: 'error', message: '生成标题失败', error: String(error) });
    throw error; // Re-throw
  }
}

/**
 * Generates an emoji icon for the essay continuation based on the original text.
 * @param originalText The original text prompt.
 * @param enqueue Function to send progress updates via the stream.
 * @returns The generated emoji icon string.
 */
export async function generateIcon(
  originalText: string,
  enqueue: EnqueueFunction
): Promise<string> {
  enqueue({ type: 'progress', message: '正在生成图标...' });

  try {
    // Use a faster model for icon generation
    const fastModel = openai('@cf/meta/llama-3.1-8b-instruct-fast'); // Assuming this model exists and is fast

    const { text: icon } = await generateText({
      model: fastModel,
      messages: [
        {
          role: 'system',
          content: `用户将提供给你一道读后续写题，请你分析题目内容，并输出一个你认为与之相关的emoji字符（只能一个字符，例如📝），并且在输出时不允许出现其他字符或注释。`,
        },
        {
          role: 'user',
          content: `读后续写题：\n${originalText}`,
        }
      ],
      temperature: 0.3 // Keep it focused
    });

    // Basic validation for a single character emoji
    const trimmedIcon = icon.trim();
    // Improved emoji check using unicode property escape and length check
    if (trimmedIcon && (trimmedIcon.length === 1 || /\p{Emoji}/u.test(trimmedIcon))) {
      // Return the first grapheme cluster if multiple emojis are returned accidentally
      const firstEmoji = [...trimmedIcon][0];
      return firstEmoji;
    } else {
      // If AI didn't return a single emoji, provide a default or log a warning
      console.warn(`AI did not return a single valid emoji for icon (received: '${icon}'), returning default.`);
      return "📄"; // Default icon
    }

  } catch (error) {
    console.error("Error generating icon:", error);
    enqueue({ type: 'error', message: '生成图标失败', error: String(error) });
    // Return a default icon on error
    return "📄";
  }
}