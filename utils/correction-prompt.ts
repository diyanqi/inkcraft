// Define the expected top-level scoring categories from the prompt (used by generateScore)
export const SCORING_CATEGORIES = [
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

export function getEnglishContinuationScorePrompt(originalText: string, essayText: string, tonePrompt: string) {
  return `"你是一个高考英语读后续写的阅卷老师，现在有一个高考英语读后续写作文题目和一篇待批改续写作文，需要你对这篇待批改作文进行评分。
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
重要提醒：你的输出仅包含【JSON格式】，不允许出现其他字符或注释。对于json格式中双引号里的内容，请勿再次使用双引号，只允许使用单引号。
请严格只输出JSON，不能有任何注释、代码块标记、markdown、自然语言说明。所有key都用双引号，内容如需引号请用转义。
直接给出json，不要有前置说明。`
}

// Define the expected top-level keys in the JSON output for upgradation
export const UPGRADATION_SECTIONS = [
  "词汇",
  "词组",
  "句式",
  "细节描写"
];

export function getEnglishContinuationUpgradationPrompt(originalText: string, essayText: string, tonePrompt: string) {
  return `你是一个专业的英语写作助手，擅长提升文章的词汇、词组、句式和细节描写水平。你的任务是根据用户提供的题目和续写作文，找出续写作文中有待提升的词汇、词组和句式，给出升格建议。同时给出该词汇、词组、句式或细节描写的相关解释和例句（句式和细节描写部分可能更侧重说明和升格后的效果）。严格保持原文的故事情节、人物设定、时态和语体风格不变。不要添加、删除或修改任何情节或信息。你的输出只能是以JSON格式展现的升格内容，不允许包含任何其他说明、注释或格式。
你需要注意：对于词汇升格，需要高级；对于细节描写升格，需要生动巧妙。

具体地：请仔细阅读原文的每一句话，对里面有待提升的词汇、词组、句式和细节描写，给出升格建议。严格按照以下JSON格式输出：

{
  "词汇": [ // 从待升格作文中找出的词汇
    { "原词": "energetic", "升格": "vigorous", "英文释义": "full of energy, strength, and enthusiasm. It describes something done with a lot of force, effort, or intensity.", "简明中文释义": "<adj.> 充满活力的；精力充沛的", "英文例句": "Theodore Roosevelt was a strong and vigorous politician." },
    { "原词": "happy", "升格": "elated", "英文释义": "in high spirits; jubilant or exultant.", "简明中文释义": "<adj.> 兴高采烈的；欢欣鼓舞的", "英文例句": "She was elated at the prospect of a holiday." }
    // 其他词汇同理，至少10处
  ],
  "词组": [ // 从待升格作文找出的词组
    { "原词组": "walk quickly", "升格": "stride purposefully", "英文释义": "to walk with long steps in a particular direction with a clear intention.", "简明中文释义": "大步流星地走；坚定地走", "英文例句": "He watched her stride purposefully towards the manager's office." },
    { "原词组": "think about", "升格": "contemplate", "英文释义": "to think about something for a long time or in a serious way.", "简明中文释义": "沉思；深思熟虑", "英文例句": "He sat on the beach contemplating the meaning of life." }
    // 其他词组同理，至少5处
  ],
  "句式": [ // 从待升格作文找出的句式
    { "原句": "He was so tired that he could not move.", "升格句": "So tired was he that he could not move.", "说明": "使用倒装句式，增强语气。", "英文例句": "So difficult was the exam that only 10% of the students passed." },
    { "原句": "The rain fell heavily.", "升格句": "Down came the heavy rain.", "说明": "使用副词开头的倒装句，使描述更生动。", "英文例句": "Out of the house rushed the children." }
    // 其他句式同理，至少5处
  ],
  "细节描写": [ // 从待升格作文找出的细节描写
    { "原描写": "The room was dark.", "升格描写": "The room was cloaked in a thick, oppressive darkness, where shadows seemed to writhe in the corners.", "说明": "增加了比喻和更具感**彩的词汇，增强了黑暗的压抑感。", "英文例句": "The ancient forest was cloaked in an eerie silence." },
    { "原描写": "She felt sad.", "升格描写": "A heavy cloak of sorrow settled upon her shoulders, weighing down her spirit with each passing moment.", "说明": "将抽象的悲伤具象化，使用比喻使其更生动。", "英文例句": "A sense of dread settled upon him as he entered the old house." }
    // 其他细节描写同理，至少3处
  ]
}

作文题：
${originalText}

待升格的续写：
${essayText}

${tonePrompt} // Append the tone prompt here

请提供升格后的JSON内容：
请严格只输出JSON，不能有任何注释、代码块标记、markdown、自然语言说明。所有key都用双引号，内容如需引号请用转义。`
}

// 生成升格作文纯享版的prompt
export function getEnglishContinuationPurePrompt(originalText: string, essayText: string) {
  return `你是一个专业的英语写作助手，擅长提升文章的词汇、词组、句式和细节描写水平。你的任务是根据用户提供的题目和续写作文，提升用户续写作文其中有待提升的词汇、词组、句式和细节描写，给出升格后的全文。严格保持原文的故事情节、人物设定、时态和语体风格不变。不要添加、删除或修改任何情节或信息。你的输出只能是以JSON格式展现的升格内容，不允许包含任何其他说明、注释或格式。

具体要求：
1. 将普通词汇升格为C1+词汇、高级词汇，或者是生动形象的合成词；
2. 将普通词组升格为地道词组，或者在没有使用词组的地方恰当地使用词组；
3. 将简单句式升格为复合句式、特殊句式；
4. 将简单细节描写升格为生动细节描写；
5. 可以修改句间的连接，使过渡更流畅。

作文题：
${originalText}

待升格的续写：
${essayText}

请提供升格后的合法JSON内容，格式严格按照：
{
  "<升格前原文的一句话>": {
    "升格": "<升格后的一句话>",
    "点评": "<为什么这样写，妙处在哪里>"
  },
  ...
}

原文每一句的话都需要升格。
以句号.为每一句话的分隔单位。
请严格只输出JSON，不能有任何注释、代码块标记、markdown、自然语言说明。所有key都用双引号，内容如需引号请用转义。`
}

// Define the expected top-level keys in the JSON output for interpretation based on new requirements
export const INTERPRETATION_SECTIONS = [
  "mainIdeaSummary",
  "plotAndCharacters",
  "textType",
  "writingFramework",
  "roughOutline",
  "relevantVocabulary"
];

// Define the mapping from JSON keys to Chinese titles for Markdown
export const INTERPRETATION_SECTIONS_MAP: { [key: string]: string } = {
  preamble: "写在前面",
  introductoryQuestions: "问题导入",
  paragraphAnalysis: "分段解读",
  questionAnswers: "问题解答",
  writingOutline: "写作框架搭建",
  extendedVocabulary: "续写中可能要用到的相关话题词汇、预料的补充扩展",
};

// Define the desired order of sections in the Markdown output
export const INTERPRETATION_SECTIONS_ORDER: string[] = [
  "preamble",
  "introductoryQuestions",
  "paragraphAnalysis",
  "questionAnswers",
  "writingOutline",
  "extendedVocabulary",
];

export function getInterpretationPrompt(
  originalText: string,
  tonePrompt: string,
  targetSection: "preamble" | "introductoryQuestionsAndAnswers" | "paragraphAnalysis" | "writingOutline" | "extendedVocabulary"
) {
  let specificInstruction = "";
  let exampleJsonTargetComment = "";

  switch (targetSection) {
    case "preamble":
      specificInstruction = "Your task is to generate ONLY the 'preamble' part of the JSON structure. Ensure your response for 'preamble' is detailed, insightful, and substantial.";
      exampleJsonTargetComment = "// AI should ONLY output: { \"preamble\": \"...\" }";
      break;
    case "introductoryQuestionsAndAnswers":
      specificInstruction = "Your task is to generate ONLY the 'introductoryQuestions' and 'questionAnswers' parts of the JSON structure. Ensure these are comprehensive and deeply analytical.";
      exampleJsonTargetComment = "// AI should ONLY output: { \"introductoryQuestions\": [...], \"questionAnswers\": [...] }";
      break;
    case "paragraphAnalysis":
      specificInstruction = "Your task is to generate ONLY the 'paragraphAnalysis' part of the JSON structure. Provide in-depth analysis for each paragraph.";
      exampleJsonTargetComment = "// AI should ONLY output: { \"paragraphAnalysis\": [...] }";
      break;
    case "writingOutline":
      specificInstruction = "Your task is to generate ONLY the 'writingOutline' part of the JSON structure. Ensure the outline is well-structured and provides clear guidance for writing.";
      exampleJsonTargetComment = "// AI should ONLY output: { \"writingOutline\": {...} }";
      break;
    case "extendedVocabulary":
      specificInstruction = "Your task is to generate ONLY the 'extendedVocabulary' part of the JSON structure. Include a rich selection of words, phrases, and sentences for each topic.";
      exampleJsonTargetComment = "// AI should ONLY output: { \"extendedVocabulary\": {...} }";
      break;
  }

  return `你是一个专业的英语作文题目分析师，擅长将复杂的作文题目分解成易于理解和写作的部分。
${specificInstruction}
你的输出只能是以JSON格式展现的所请求部分的解析内容，不允许包含任何其他说明、注释或格式。

你需要严格按照以下完整JSON结构的对应部分输出。确保所有请求的字段都存在，并且内容充实、详尽。
${exampleJsonTargetComment}

完整的JSON结构参考如下:
{
  "preamble": "由作文题目得到的备考提示、出题评价或人生感悟，连接成自然的段落，不少于300字。",
  "introductoryQuestions": [
    "提出5到7个关键问题，帮助理解和分析题目，包括主人公性格、时间、地点、事件、原因、情节、主旨等。"
    // ... 5-7个问题
  ],
  "paragraphAnalysis": [
    {
      "originText": "原文引用 (分析原文的每一段，至少5-7段，原文段落少于5段，则细致分析每一句)",
      "details": "简要翻译原文段落，补充文化背景信息，深入解读关键词和细节，分析内涵和外延，分析协同点及使用方法，总结语料和语言点，拓展词汇和表达，组织成自然的段落，不少于200字。"
      // 分析内容全部只写在 details 字段中，不要创建新的字段
    }
    // ... 对原文的每一段进行同样格式的分析
  ],
  "questionAnswers": [
    {
      "question": "对应'introductoryQuestions'中的一个问题。",
      "answer": "对该问题进行详尽且深入的解答，连接成自然的段落，不少于150字。"
    }
    // ... 回答'introductoryQuestions'中的所有问题
  ],
  "writingOutline": {
    "第一段": [
      "列出第一段的写作要点，使用'1.1 要点'等格式，提供清晰、具体的指导。",
      // ... 3到4个详细要点
    ],
    "第二段": [
      "列出第二段的写作要点，使用'2.1 要点'等格式，提供清晰、具体的指导。",
      // ... 3到4个详细要点
    ]
  },
  "extendedVocabulary": {
    "话题一: [请替换为具体话题名称]": {
      "vocabulary": [
        {
          "word": "widow",
          "explaination": "解释词汇的含义和用法。",
          "chinese_meaning": "n. 寡妇",
          "example_sentence": "提供例句。"
        }
        // ... 5到6个高质量词汇及其解释
      ],
      "phrases": [
        {
          "phrase": "phrase1",
          "explaination": "解释短语的含义和用法。",
          "chinese_meaning": "中文释义1",
          "example_sentence": "提供例句。"
        },
        // ... 3到4个高质量短语
        {
          "phrase": "短语2",
          "chinese_meaning": "中文释义2"
        }
      ],
      "sentences": [
        "例句1",
        "例句2"
        // ... 3到4个高质量例句
      ]
    }
    // ... 最多包含2到3个话题
  }
}

作文题目：
${originalText}

${tonePrompt}

请严格只输出所要求部分的JSON内容 (${targetSection})，不能有任何注释、代码块标记、markdown、自然语言说明。所有key都用双引号，内容如需引号请用转义。JSON内容必须严格符合上述对应部分的结构。`;
}