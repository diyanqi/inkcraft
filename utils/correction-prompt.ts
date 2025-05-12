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
重要提醒：你的输出仅包含【JSON格式】，不允许出现其他字符或注释。对于json格式中双引号里的内容，请勿再次使用双引号，只允许使用单引号。`
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

请提供升格后的JSON内容：`;
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
`;
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
mainIdeaSummary: "大意梳理",
plotAndCharacters: "情节与人物分析 (5W)",
textType: "文本类型",
writingFramework: "写作框架思路",
roughOutline: "大致写作提纲",
relevantVocabulary: "相关语料建议",
};


export function getInterpretationPrompt(originalText: string, tonePrompt: string) {
  return `你是一个专业的英语作文题目分析师，擅长将复杂的作文题目分解成易于理解和写作的部分。你的任务是根据用户提供的作文题目，生成一份详细的解析，帮助用户理解题目并规划写作。你的输出只能是以JSON格式展现的解析内容，不允许包含任何其他说明、注释或格式。

你需要严格按照以下JSON格式输出：

{
"mainIdeaSummary": "梳理题目大意，抓住其中可能包含的伏笔、暗示，以及在写作中可以协同的部分。", // 字符串，包含对题目大意的总结和相关提示
"plotAndCharacters": "分析题目的when, who, where, what, why，分析可能的人物性格，梳理故事情节。", // 字符串，包含对5W、人物和情节的分析
"textType": "确定文本类型：人与自然、人与社会、还是自我成长。", // 字符串，明确指出文本类型
"writingFramework": "运用文本类型衔接情节与人物分析，过渡到主题大意，梳理写作框架思路。", // 字符串，说明如何构建写作框架
"roughOutline": { // 对象，表示大致的写作提纲
  "第一段": [ // 数组，包含第一段的要点
    "1.1 要点",
    "1.2 要点",
    "1.3 要点"
    // ... 3~4个小部分
  ],
  "第二段": [ // 数组，包含第二段的要点
    "2.1 要点",
    "2.2 要点",
    "2.3 要点",
    "2.4 要点"
    // ... 3~4个小部分
  ]
  // ... 更多段落同理
},
"relevantVocabulary": { // 对象，包含可能需要用到的相关语料，以主题为单位
  "主题一: [主题名称]": { // 对象，表示第一个主题的语料
    "vocabulary": [ // 数组，至少3个词汇
      "词汇1",
      "词汇2",
      "词汇3"
    ],
    "phrases": [ // 数组，至少3个短语
      "短语1",
      "短语2",
      "短语3"
    ],
    "sentences": [ // 数组，至少2个句子
      "句子1",
      "句子2"
    ]
  },
  "主题二: [主题名称]": { // 对象，表示第二个主题的语料
    "vocabulary": [
      "词汇A",
      "词汇B",
      "词汇C"
    ],
    "phrases": [
      "短语A",
      "短语B",
      "短语C"
    ],
    "sentences": [
      "句子A",
      "句子B"
    ]
  }
  // ... 最多两个主题
}
}

作文题目：
${originalText}

${tonePrompt} // Append the tone prompt here

请提供解析的JSON内容：`;
}