// utils/generate-continuation.ts
import { streamText } from 'ai';
import { parse } from 'best-effort-json-parser';
// Import the defined models
import { getModelByName } from './models';
// Import tone utility functions
import { getTonePrompt } from './tone-prompt';
import {
  getEnglishContinuationPurePrompt,
  getEnglishContinuationScorePrompt,
  getEnglishContinuationUpgradationPrompt,
  getInterpretationPrompt,
  INTERPRETATION_SECTIONS,
  INTERPRETATION_SECTIONS_MAP,
  UPGRADATION_SECTIONS
} from './correction-prompt';

/**
 * Generates the score and detailed breakdown for the essay continuation.
 * @param originalText The original text prompt.
 * @param essayText The user's essay continuation text.
 * @param tone The tone parameter.
 * @param model The model parameter.
 * @returns An object containing the calculated score and the detailed content string.
 */
export async function generateScore(
  originalText: string,
  essayText: string,
  tone: string,
  model: string
): Promise<{ score: number, content: string }> {
  console.log("Initiating score generation...");

  let content = `# 1. 题目\n${originalText}\n# 2. 我的续写\n${essayText}\n`;
  let fullResponseText = '';

  try {
    const aiModel = getModelByName(model);
    const tonePrompt = getTonePrompt(tone);

    console.log("--- Streaming AI response for score ---");

    const streamResult = await streamText({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: getEnglishContinuationScorePrompt(originalText, essayText, tonePrompt),
        },
      ],
      maxTokens: 4096,
      topP: 0.1,
    });

    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        process.stdout.write(chunk);
        fullResponseText += chunk;
      }
    }

    console.log("\n--- End of AI response stream ---");

    if (!fullResponseText) {
      throw new Error("AI response was empty.");
    }

    const start = fullResponseText.indexOf('{');
    const end = fullResponseText.lastIndexOf('}');
    if (start === -1 || end === -1 || start >= end) {
      console.error("Invalid JSON structure received:", fullResponseText);
      throw new Error("Failed to find valid JSON object in AI response. Raw response logged.");
    }
    const jsonString = fullResponseText.substring(start, end + 1);

    let json: any;
    try {
      json = parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      console.error("Received JSON string:", jsonString);
      throw new Error(`Failed to parse AI response JSON: ${parseError}`);
    }

    if (!json || typeof json !== 'object' || !json.分项评分) {
      console.error("Parsed JSON missing expected '分项评分' key:", json);
      throw new Error("Parsed JSON does not have the expected structure ('分项评分' key missing).");
    }

    let totalScore = 0;
    content += `# 3. 评分细则\n`;
    const finalCategories = json.分项评分;
    for (const key in finalCategories) {
      if (Object.prototype.hasOwnProperty.call(finalCategories, key)) {
        const section = finalCategories[key];
        content += `\n- **${key}**\n\n  `;
        let reasonContent = "";
        if (typeof section === 'object' && section !== null) {
          for (const subKey in section) {
            if (Object.prototype.hasOwnProperty.call(section, subKey)) {
              const scoreValue = Number(section[subKey]?.score) || 0;
              totalScore += scoreValue;
              reasonContent += `${section[subKey]?.reason || 'N/A'}； `;
            }
          }
        } else {
          console.warn(`Section '${key}' is not an object or is null in the response.`);
          reasonContent = '评分数据格式错误； ';
        }
        content += reasonContent.trim().replace(/；$/, '。') + '\n';
      }
    }

    let score = Number((totalScore / 100 * 25).toFixed(1));

    if (isNaN(score) || (score === 0 && totalScore === 0 && fullResponseText.length > 10)) {
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

    score = Math.max(0, Math.min(25, isNaN(score) ? 0 : score));
    content += `\n## 总分\n${score}分`;

    console.log(`Final score calculated: ${score}`);
    return { score, content };

  } catch (error) {
    console.error("Error generating score:", error);
    if (fullResponseText) {
      console.error("Partial AI response received before error:", fullResponseText);
    }
    throw error;
  }
}

/**
 * Rewrites the user's essay continuation text to upgrade vocabulary, phrases, sentence structures, and detailed descriptions.
 * @param originalText The original text prompt (for context).
 * @param essayText The user's essay continuation text to upgrade.
 * @param tone The tone parameter.
 * @param model The model parameter.
 * @returns A Promise resolving to an object containing the parsed JSON and the generated Markdown content, or null if generation fails.
 */
export async function generateUpgradation(
  originalText: string,
  essayText: string,
  tone: string,
  model: string
): Promise<{ json: any, markdownContent: string } | null> {
  console.log("Initiating language upgradation...");

  let fullResponseText = '';
  let markdownContent = '';

  try {
    const aiModel = getModelByName(model);
    const tonePrompt = getTonePrompt(tone);

    console.log("--- Streaming AI response for language upgradation ---");

    const streamResult = await streamText({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: getEnglishContinuationUpgradationPrompt(originalText, essayText, tonePrompt),
        },
      ],
      maxTokens: 6144,
      temperature: 0.5,
    });

    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        process.stdout.write(chunk);
        fullResponseText += chunk;
      }
    }

    console.log("\n--- End of AI response stream for language upgradation ---");

    if (!fullResponseText.trim()) {
      console.warn("AI response for language upgradation was empty or only whitespace.");
      return null;
    }

    const startObject = fullResponseText.indexOf('{');
    const endObject = fullResponseText.lastIndexOf('}');
    if (startObject === -1 || endObject === -1 || startObject >= endObject) {
      console.error("Invalid JSON structure received for upgradation (no valid object found):", fullResponseText);
      return null;
    }
    const jsonString = fullResponseText.substring(startObject, endObject + 1);

    let json: any;
    try {
      json = JSON.parse(jsonString);
      console.log('Parsed JSON:', json);
    } catch (parseError) {
      console.error("Failed to parse JSON for upgradation:", parseError);
      console.error("Received JSON string:", jsonString);
      return null;
    }

    markdownContent += '# 语言升格建议\n\n';

    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      for (const sectionName of UPGRADATION_SECTIONS) {
        const items = json[sectionName];
        if (Array.isArray(items) && items.length > 0) {
          markdownContent += `## ${sectionName}升格\n\n`;
          
          items.forEach((item: any) => {
            if (typeof item !== 'object' || item === null) return;

            switch (sectionName) {
              case "词汇":
                markdownContent += `- **原词**: \`${item.原词 || 'N/A'}\` -> **升格**: \`${item.升格 || 'N/A'}\`\n`;
                if (item.英文释义) markdownContent += `  - **英文释义**: ${item.英文释义}\n`;
                if (item.简明中文释义) markdownContent += `  - **简明中文释义**: ${item.简明中文释义}\n`;
                if (item.英文例句) markdownContent += `  - **英文例句**: _${item.英文例句}_\n`;
                break;
              case "词组":
                markdownContent += `- **原词组**: \`${item.原词组 || 'N/A'}\` -> **升格**: \`${item.升格 || 'N/A'}\`\n`;
                if (item.英文释义) markdownContent += `  - **英文释义**: ${item.英文释义}\n`;
                if (item.简明中文释义) markdownContent += `  - **简明中文释义**: ${item.简明中文释义}\n`;
                if (item.英文例句) markdownContent += `  - **英文例句**: _${item.英文例句}_\n`;
                break;
              case "句式":
                markdownContent += `- **原句**: \`${item.原句 || 'N/A'}\`\n`;
                markdownContent += `  - **升格句**: \`${item.升格句 || 'N/A'}\`\n`;
                if (item.说明) markdownContent += `  - **说明**: ${item.说明}\n`;
                if (item.英文例句) markdownContent += `  - **英文例句**: _${item.英文例句}_\n`;
                break;
              case "细节描写":
                markdownContent += `- **原描写**: \`${item.原描写 || 'N/A'}\`\n`;
                markdownContent += `  - **升格描写**: \`${item.升格描写 || 'N/A'}\`\n`;
                if (item.说明) markdownContent += `  - **说明**: ${item.说明}\n`;
                if (item.英文例句) markdownContent += `  - **英文例句**: _${item.英文例句}_\n`;
                break;
            }
            markdownContent += '\n';
          });
          markdownContent += '---\n\n';
        }
      }
    } else {
      console.error("Parsed JSON for upgradation is not the expected object structure:", json);
      markdownContent += "_错误：AI返回的升格建议数据结构与预期不符，无法完整展示。_\n\n";
    }

    console.log("Successfully generated and parsed upgradation suggestions.");
    return { json, markdownContent };

  } catch (error) {
    console.error("Error generating language upgradation:", error);
    return null;
  }
}

/**
 * Generates the pure upgradation of the user's essay continuation text.
 * @param originalText The original text prompt.
 * @param essayText The user's essay continuation text to upgrade.
 * @param model The model parameter.
 * @returns A Promise resolving to an object containing the parsed JSON and the generated Markdown content, or null if generation fails.
 */
export async function generatePureUpgradation(
  originalText: string,
  essayText: string,
  model: string
): Promise<{ json: any, markdownContent: string } | null> {
  console.log("Initiating pure upgradation...");

  let fullResponseText = '';
  let markdownContent = '';

  try {
    const aiModel = getModelByName(model);

    console.log("--- Streaming AI response for pure upgradation ---");

    const streamResult = await streamText({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: getEnglishContinuationPurePrompt(originalText, essayText),
        },
      ],
      maxTokens: 6144,
      temperature: 0.8,
    });

    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        process.stdout.write(chunk);
        fullResponseText += chunk;
      }
    }

    console.log("\n--- End of AI response stream for pure upgradation ---");

    if (!fullResponseText.trim()) {
      console.warn("AI response for pure upgradation was empty or only whitespace.");
      return null;
    }

    const startObject = fullResponseText.indexOf('{');
    const endObject = fullResponseText.lastIndexOf('}');
    if (startObject === -1 || endObject === -1 || startObject >= endObject) {
      console.error("Invalid JSON structure received for pure upgradation (no valid object found):", fullResponseText);
      return null;
    }
    const jsonString = fullResponseText.substring(startObject, endObject + 1);

    let json: any;
    try {
      json = JSON.parse(jsonString);
      console.log('Parsed JSON:', json);
    } catch (parseError) {
      console.error("Failed to parse JSON for pure upgradation:", parseError);
      console.error("Received JSON string:", jsonString);
      return null;
    }

    markdownContent += '# 升格文纯享版\n\n';

    // Loop through the JSON entries
    // Each entry is [originalSentence, detailsObject]
    for (const [originalSentence, details] of Object.entries(json)) {
      // Check if details is a valid object and contains the expected keys
      if (typeof details === 'object' && details !== null && '升格' in details && '点评' in details) {
        const upgradedSentence = details['升格'];
        const comment = details['点评'];

        // Format markdown content as: Upgraded Sentence (Comment)
        markdownContent += `${upgradedSentence} _(${comment})_`;
      } else {
        console.warn("Skipping entry due to unexpected structure:", originalSentence, details);
        // Optionally, add the original sentence and a note about the error
        markdownContent += `### 原文 (格式异常)：\n${originalSentence}\n\n`;
        markdownContent += `*注意：此条目数据格式异常，无法正常显示升格和点评内容。*\n\n`;
      }
    }

    console.log("Successfully generated and parsed pure upgradation.");
    return { json, markdownContent };

  } catch (error) {
    console.error("Error generating pure upgradation:", error);
    return null;
  }
}

/**
 * Generates an interpretation of the essay topic, suggesting key themes, perspectives, keywords, etc.
 * @param originalText The original essay topic text.
 * @param tone The tone parameter.
 * @param model The model parameter.
 * @returns A Promise resolving to an object containing the parsed JSON and the generated Markdown content, or null if generation fails.
 */
export async function generateInterpretation(
  originalText: string,
  tone: string,
  model: string
): Promise<{ json: any, markdownContent: string } | null> {
  console.log("Initiating topic interpretation generation...");

  let fullResponseText = '';
  let markdownContent = '';

  try {
    const aiModel = getModelByName(model);
    const tonePrompt = getTonePrompt(tone);

    console.log("--- Streaming AI response for topic interpretation ---");

    // 调用获取解析提示的函数，只传递 originalText 和 tonePrompt
    const streamResult = await streamText({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: getInterpretationPrompt(originalText, tonePrompt),
        },
      ],
      maxTokens: 6144, // 可以根据需要调整
      temperature: 0.5, // 可以根据需要调整
    });

    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        process.stdout.write(chunk);
        fullResponseText += chunk;
      }
    }

    console.log("\n--- End of AI response stream for topic interpretation ---");

    if (!fullResponseText.trim()) {
      console.warn("AI response for topic interpretation was empty or only whitespace.");
      return null;
    }

    // 尝试从完整的响应文本中提取JSON对象
    const startObject = fullResponseText.indexOf('{');
    const endObject = fullResponseText.lastIndexOf('}');
    if (startObject === -1 || endObject === -1 || startObject >= endObject) {
      console.error("Invalid JSON structure received for interpretation (no valid object found):", fullResponseText);
      return null;
    }
    const jsonString = fullResponseText.substring(startObject, endObject + 1);

    let json: any;
    try {
      json = JSON.parse(jsonString);
      console.log('Parsed JSON:', json);
    } catch (parseError) {
      console.error("Failed to parse JSON for interpretation:", parseError);
      console.error("Received JSON string:", jsonString);
      return null;
    }

    // 构建Markdown内容
    markdownContent += `# 作文题目解析\n\n`;

    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      // 使用 INTERPRETATION_SECTIONS 数组来保证章节顺序和遍历
      for (const sectionKey of INTERPRETATION_SECTIONS) {
        const sectionTitle = INTERPRETATION_SECTIONS_MAP[sectionKey]; // 从映射中获取中文标题
        const sectionContent = json[sectionKey];

        // 检查章节是否存在且有内容 (对于对象和数组，检查是否非空)
        const hasContent = sectionContent !== undefined && sectionContent !== null &&
                           (!(typeof sectionContent === 'object') || Object.keys(sectionContent).length > 0);

        if (hasContent) {
           markdownContent += `## ${sectionTitle}\n\n`;

           switch (sectionKey) {
             case "mainIdeaSummary":
             case "plotAndCharacters":
             case "textType":
             case "writingFramework":
               // 这些部分期望是字符串
               if (typeof sectionContent === 'string') {
                 markdownContent += `${sectionContent}\n`;
               } else {
                 console.warn(`Expected string for section "${sectionKey}", but received:`, typeof sectionContent);
                 markdownContent += `_内容格式错误_\n`;
               }
               break;

             case "roughOutline":
               // 这部分期望是对象，键是段落标题，值是字符串数组
               if (typeof sectionContent === 'object' && sectionContent !== null && !Array.isArray(sectionContent)) {
                 for (const paragraphTitle in sectionContent) {
                   if (Object.prototype.hasOwnProperty.call(sectionContent, paragraphTitle)) {
                     const points = sectionContent[paragraphTitle];
                     markdownContent += `### ${paragraphTitle}\n\n`;
                     if (Array.isArray(points) && points.length > 0) {
                       points.forEach((point: string) => {
                         markdownContent += `- ${point}\n`;
                       });
                     } else {
                       markdownContent += "_无要点_\n";
                     }
                     markdownContent += '\n'; // 段落之间添加空行
                   }
                 }
               } else {
                 console.warn(`Expected object for section "${sectionKey}", but received:`, typeof sectionContent);
                 markdownContent += `_内容格式错误_\n`;
               }
               break;

             case "relevantVocabulary":
               // 这部分期望是对象，键是主题，值是包含 vocabulary, phrases, sentences 数组的对象
               if (typeof sectionContent === 'object' && sectionContent !== null && !Array.isArray(sectionContent)) {
                 for (const themeTitle in sectionContent) {
                   if (Object.prototype.hasOwnProperty.call(sectionContent, themeTitle)) {
                     const themeContent = sectionContent[themeTitle];
                     markdownContent += `### ${themeTitle}\n\n`;
                     if (typeof themeContent === 'object' && themeContent !== null && !Array.isArray(themeContent)) {
                       if (Array.isArray(themeContent.vocabulary) && themeContent.vocabulary.length > 0) {
                         markdownContent += `- **词汇**: ${themeContent.vocabulary.map((v: string) => `\`${v}\``).join(', ')}\n`;
                       }
                       if (Array.isArray(themeContent.phrases) && themeContent.phrases.length > 0) {
                         markdownContent += `- **短语**: ${themeContent.phrases.map((p: string) => `\`${p}\``).join(', ')}\n`;
                       }
                       if (Array.isArray(themeContent.sentences) && themeContent.sentences.length > 0) {
                         markdownContent += `- **句子**:\n`;
                         themeContent.sentences.forEach((s: string) => {
                            markdownContent += `  - _${s}_\n`;
                         });
                       }
                       if ((!Array.isArray(themeContent.vocabulary) || themeContent.vocabulary.length === 0) &&
                           (!Array.isArray(themeContent.phrases) || themeContent.phrases.length === 0) &&
                           (!Array.isArray(themeContent.sentences) || themeContent.sentences.length === 0)) {
                            markdownContent += "_无语料_\n";
                       }
                     } else {
                       console.warn(`Expected object for theme content in section "${sectionKey}", but received:`, typeof themeContent);
                       markdownContent += `_主题内容格式错误_\n`;
                     }
                     markdownContent += '\n'; // 主题之间添加空行
                   }
                 }
               } else {
                 console.warn(`Expected object for section "${sectionKey}", but received:`, typeof sectionContent);
                 markdownContent += `_内容格式错误_\n`;
               }
               break;

             default:
               // 处理任何未预料到的章节键
               console.warn(`Unknown section key encountered: "${sectionKey}"`);
               markdownContent += `_未知章节内容_\n`;
               if (typeof sectionContent === 'string') {
                   markdownContent += `${sectionContent}\n`;
               } else {
                   markdownContent += `\`\`\`json\n${JSON.stringify(sectionContent, null, 2)}\n\`\`\`\n`;
               }
               break;
           }
           markdownContent += '---\n\n'; // 章节之间添加分隔符
        } else {
           // 如果AI没有返回这个章节或者内容为空，也可以选择打印一个提示或者跳过
           console.log(`Section "${sectionKey}" not found or is empty in AI response.`);
        }
      }
      // 所有章节后不再需要额外的分隔符，因为每个章节后都有了

    } else {
      console.error("Parsed JSON for interpretation is not the expected object structure:", json);
      markdownContent += "_错误：AI返回的题目解析数据结构与预期不符，无法完整展示。_\n\n";
    }


    console.log("Successfully generated and parsed topic interpretation.");
    return { json, markdownContent };

  } catch (error) {
    console.error("Error generating topic interpretation:", error);
    return null;
  }
}
