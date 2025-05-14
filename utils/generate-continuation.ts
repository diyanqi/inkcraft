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
  INTERPRETATION_SECTIONS_ORDER,
  UPGRADATION_SECTIONS
} from './correction-prompt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch'; // Use node-fetch for compatibility, or native fetch if available in your Node.js version
import { URLSearchParams } from 'url'; // Needed to construct form data

// Helper function to calculate the 'input' parameter for Youdao signature
function getYoudaoInput(text: string): string {
  if (!text) return '';
  const len = text.length;
  if (len <= 20) {
    return text;
  }
  // input=多个q拼接后前10个字符 + 多个q拼接长度 + 多个q拼接后十个字符
  return text.substring(0, 10) + len + text.substring(len - 10);
}

// Helper function to calculate the Youdao v3 signature
function calculateYoudaoSign(appKey: string, input: string, salt: string, curtime: string, appSecret: string): string {
  // signType=v3，sha256(应用 ID+input+salt+curtime+密钥)
  const signStr = appKey + input + salt + curtime + appSecret;
  return crypto.createHash('sha256').update(signStr).digest('hex');
}

/**
* Generates the score and detailed breakdown for the essay continuation using Youdao API.
* @param originalText The original text prompt (included in output content, but not sent to Youdao API).
* @param essayText The user's essay continuation text (sent to Youdao API as 'q').
* @param tone The tone parameter (not used in Youdao API call).
* @param model The model parameter (not used in Youdao API call).
* @returns An object containing the calculated score and the detailed content string.
*/
export async function generateScore(
  originalText: string,
  essayText: string,
  tone: string, // This parameter is not used in the Youdao API call
  model: string // This parameter is not used in the Youdao API call
): Promise<{ score: number, content: string }> {
  console.log("Initiating score generation using Youdao API...");

  if (!process.env.YOUDAO_ID || !process.env.YOUDAO_SECRET) {
    throw new Error("Youdao API credentials (process.env.YOUDAO_ID and process.env.YOUDAO_SECRET) are not set in environment variables.");
  }

  const apiUrl = 'https://openapi.youdao.com/v2/correct_writing_text';
  const curtime = Math.floor(Date.now() / 1000).toString();
  const salt = uuidv4();
  const q = essayText; // Only the essay text is sent as the main content
  const input = getYoudaoInput(q);
  const sign = calculateYoudaoSign(process.env.YOUDAO_ID, input, salt, curtime, process.env.YOUDAO_SECRET);

  const params = new URLSearchParams();
  params.append('appKey', process.env.YOUDAO_ID);
  params.append('curtime', curtime);
  params.append('q', q);
  params.append('salt', salt);
  params.append('sign', sign);
  params.append('signType', 'v3');
  params.append('grade', 'high'); // As requested
  params.append('correctVersion', 'basic'); // As requested
  // It's recommended to send limitedWords for better accuracy, but not strictly required by the prompt
  // params.append('limitedWords', essayText.split(/\s+/).length.toString()); // Optional

  let content = `# 1. 题目\n${originalText}\n# 2. 我的续写\n${essayText}\n`;
  let youdaoResponse: any = null; // Variable to hold the parsed JSON response

  try {
    console.log("--- Calling Youdao API for score ---");
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Youdao API HTTP error! Status: ${response.status}, Body: ${errorText}`);
      throw new Error(`Youdao API HTTP error: ${response.status} ${response.statusText}`);
    }

    youdaoResponse = await response.json();
    console.log("--- Received Youdao API response ---");
    // console.log(JSON.stringify(youdaoResponse, null, 2)); // Uncomment for detailed response logging

    if (youdaoResponse.errorCode !== '0') {
      console.error("Youdao API returned error code:", youdaoResponse.errorCode);
      // You might want to add more specific error handling based on Youdao's error codes
      throw new Error(`Youdao API error: ${youdaoResponse.errorCode}`);
    }

    const result = youdaoResponse.Result;
    console.log(JSON.stringify(result));
    if (!result || typeof result !== 'object') {
      throw new Error("Youdao API response 'Result' field is missing or invalid.");
    }

    // Scale the score from Youdao's 0-100 scale to the desired 0-25 scale
    const score = Number(result.totalScore);

    // Build the Markdown content string based on the Youdao response
    content += `# 3. 评分细则\n`;

    const majorScore = result.majorScore;
    if (majorScore && typeof majorScore === 'object') {
      content += `\n- **语法得分率**: ${majorScore.grammarScore || 'N/A'} %. 评价: ${majorScore.grammarAdvice || '无'}\n`;
      content += `- **内容得分率**: ${majorScore.topicScore || 'N/A'} %. 评价: ${majorScore.topicAdvice || '无'}\n`;
      content += `- **词汇得分率**: ${majorScore.wordScore || 'N/A'} %. 评价: ${majorScore.wordAdvice || '无'}\n`;
      content += `- **逻辑得分率**: ${majorScore.structureScore || 'N/A'} %. 评价: ${majorScore.structureAdvice || '无'}\n`;
    } else {
      content += "\n- 主要评分项数据缺失或格式错误。\n";
    }

    const allFeatureScore = result.allFeatureScore;
    if (allFeatureScore && typeof allFeatureScore === 'object') {
      content += `- AIGC 嫌疑：${(10 - allFeatureScore.neuralScore) * 10} %.\n`;
      content += `- 语法得分率：${allFeatureScore.grammar * 10} %.\n`;
      content += `- 高级词汇得分率：${allFeatureScore.advanceVocab * 10} %.\n`;
      content += `- 字数得分率：${allFeatureScore.wordNum * 10} %.\n`;
      content += `- 话题得分率：${allFeatureScore.topic * 10} %.\n`;
      content += `- 词汇替换得分率：${allFeatureScore.lexicalSubs * 10} %.\n`;
      content += `- 词汇多样性得分率：${allFeatureScore.wordDiversity * 10} %.\n`;
      content += `- 句式得分率：${allFeatureScore.sentComplex * 10} %.\n`;
      content += `- 结构得分率：${allFeatureScore.structure * 10} %.\n`;
    }

    content += `\n### 总评\n`;
    content += `- ${result.totalEvaluation || '无总评'}\n`;
    content += `- ${result.essayAdvice || '无详细评价'}\n`;

    // Optionally include detailed sentence feedback if available and desired
    const sentsFeedback = result.essayFeedback?.sentsFeedback;
    if (Array.isArray(sentsFeedback) && sentsFeedback.length > 0) {
      content += `\n### 逐句反馈\n`;
      sentsFeedback.forEach((sent, index) => {
        content += `\n**句子 ${index + 1}:**\n`;
        content += `- 原句: ${sent.rawSent}\n`;
        if (sent.sentFeedback) {
          content += `- 错误/建议: ${sent.sentFeedback}\n`;
        }
        if (sent.correctedSent && sent.rawSent.trim() !== sent.correctedSent.trim()) {
          content += `- 修正: ${sent.correctedSent}\n`;
        }
        // You could add more details from sent.errorPosInfos or sent.synInfo if needed
      });
    }


    content += `\n## 总分\n${score}分`;

    console.log(`Final score calculated (scaled from Youdao): ${score}`);
    return { score, content };

  } catch (error) {
    console.error("Error generating score with Youdao API:", error);
    if (youdaoResponse) {
      // Log the received Youdao response body in case of processing errors after successful HTTP call
      console.error("Youdao response body:", JSON.stringify(youdaoResponse, null, 2));
    }
    // Re-throw the error after logging
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
      temperature: 0.8, // 可以根据需要调整
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
      // Log surrounding text to help debug parsing issues
      console.error("Received text snippet:", fullResponseText.substring(Math.max(0, startObject - 50), Math.min(fullResponseText.length, endObject + 50)));
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
      // Use the new order array to iterate through sections
      for (const sectionKey of INTERPRETATION_SECTIONS_ORDER) {
        const sectionTitle = INTERPRETATION_SECTIONS_MAP[sectionKey]; // Get Chinese title from map
        const sectionContent = json[sectionKey];

        // Check if section exists and has content (adjust check based on expected type)
        const hasContent = sectionContent !== undefined && sectionContent !== null &&
                           (typeof sectionContent !== 'object' || Object.keys(sectionContent).length > 0) && // Check objects are not empty
                           (!Array.isArray(sectionContent) || sectionContent.length > 0); // Check arrays are not empty

        if (hasContent) {
          markdownContent += `## ${sectionTitle}\n\n`;

          switch (sectionKey) {
            case "preamble":
              // Expect a string (natural paragraph)
              if (typeof sectionContent === 'string') {
                markdownContent += `${sectionContent}\n`;
              } else {
                console.warn(`Expected string for section "${sectionKey}", but received:`, typeof sectionContent);
                markdownContent += `_内容格式错误: 应为字符串_\n`;
              }
              break;

            case "introductoryQuestions":
              // Expect an array of strings (5-7 questions)
              if (Array.isArray(sectionContent) && sectionContent.length > 0) {
                sectionContent.forEach((question: string, index: number) => {
                  // Format as a Markdown list item
                  markdownContent += `- ${question}\n`;
                });
              } else {
                console.warn(`Expected non-empty array for section "${sectionKey}", but received:`, sectionContent);
                markdownContent += `_内容格式错误或为空: 应为字符串数组_\n`;
              }
              break;

            case "paragraphAnalysis":
              // Expect an array of objects, each with translation, details, synergy, languagePoints
              if (Array.isArray(sectionContent) && sectionContent.length > 0) {
                sectionContent.forEach((paragraph: any, index: number) => {
                  markdownContent += `### 原文第 ${index + 1} 段解读\n\n`;
                  if (typeof paragraph === 'object' && paragraph !== null) {
                    if (paragraph.originText) markdownContent += `**原文:** ${paragraph.originText}\n\n`;
                    if (paragraph.details) markdownContent += `**解读:** ${paragraph.details}\n\n`;
                    // Add a separator between paragraph analyses if there's more than one
                    if (index < sectionContent.length - 1) {
                        markdownContent += '---\n\n';
                    }
                  } else {
                    console.warn(`Expected object for paragraph analysis item ${index}, but received:`, paragraph);
                    markdownContent += `_段落解读内容格式错误_\n\n`;
                  }
                });
              } else {
                console.warn(`Expected non-empty array for section "${sectionKey}", but received:`, sectionContent);
                markdownContent += `_内容格式错误或为空: 应为对象数组_\n`;
              }
              break;

            case "questionAnswers":
              // Expect an array of objects, each with question and answer
              if (Array.isArray(sectionContent) && sectionContent.length > 0) {
                 sectionContent.forEach((qa: any, index: number) => {
                   if (typeof qa === 'object' && qa !== null && qa.question && qa.answer) {
                     markdownContent += `**问:** ${qa.question}\n\n`;
                     markdownContent += `**答:** ${qa.answer}\n\n`;
                     // Add a separator between Q&A pairs if there's more than one
                     if (index < sectionContent.length - 1) {
                         markdownContent += '---\n\n';
                     }
                   } else {
                     console.warn(`Expected object with 'question' and 'answer' for Q&A item ${index}, but received:`, qa);
                     markdownContent += `_问题解答内容格式错误_\n\n`;
                   }
                 });
              } else {
                console.warn(`Expected non-empty array for section "${sectionKey}", but received:`, sectionContent);
                markdownContent += `_内容格式错误或为空: 应为包含问答对象的数组_\n`;
              }
              break;


            case "writingOutline":
              // Expect an object with paragraph titles as keys and arrays of points as values
              if (typeof sectionContent === 'object' && sectionContent !== null && !Array.isArray(sectionContent)) {
                for (const paragraphTitle in sectionContent) {
                  if (Object.prototype.hasOwnProperty.call(sectionContent, paragraphTitle)) {
                    const points = sectionContent[paragraphTitle];
                    markdownContent += `### ${paragraphTitle}\n\n`;
                    if (Array.isArray(points) && points.length > 0) {
                      points.forEach((point: string) => {
                        markdownContent += `- ${point}\n`; // Use Markdown list format
                      });
                    } else {
                      markdownContent += "_无要点_\n";
                    }
                    markdownContent += '\n'; // Add space after each paragraph outline
                  }
                }
              } else {
                console.warn(`Expected object for section "${sectionKey}", but received:`, typeof sectionContent);
                markdownContent += `_内容格式错误: 应为包含段落要点数组的对象_\n`;
              }
              break;

            case "extendedVocabulary":
              // Expect an object with topic titles as keys and objects containing vocabulary, phrases, sentences arrays
              if (typeof sectionContent === 'object' && sectionContent !== null && !Array.isArray(sectionContent)) {
                for (const themeTitle in sectionContent) {
                  if (Object.prototype.hasOwnProperty.call(sectionContent, themeTitle)) {
                    const themeContent = sectionContent[themeTitle];
                    markdownContent += `### ${themeTitle}\n\n`;
                    if (typeof themeContent === 'object' && themeContent !== null && !Array.isArray(themeContent)) {
                      // Vocabulary (array of objects)
                      if (Array.isArray(themeContent.vocabulary) && themeContent.vocabulary.length > 0) {
                        markdownContent += `- **词汇**:\n`;
                        themeContent.vocabulary.forEach((vocabItem: any) => {
                           if (typeof vocabItem === 'object' && vocabItem !== null && vocabItem.word) {
                               markdownContent += `  - \`${vocabItem.word}\`: ${vocabItem.explanation || '无解释'}\n`;
                           }
                        });
                      }

                      // Phrases (array of strings)
                      if (Array.isArray(themeContent.phrases) && themeContent.phrases.length > 0) {
                        markdownContent += `- **短语**:\n`;
                        themeContent.phrases.forEach((phrase: string) => {
                           markdownContent += `  - \`${phrase}\`\n`;
                        });
                      }

                      // Sentences (array of strings)
                      if (Array.isArray(themeContent.sentences) && themeContent.sentences.length > 0) {
                        markdownContent += `- **句子**:\n`;
                        themeContent.sentences.forEach((sentence: string) => {
                          markdownContent += `  - _${sentence}_\n`;
                        });
                      }

                      // Check if any content was added for the theme
                      if ((!Array.isArray(themeContent.vocabulary) || themeContent.vocabulary.length === 0) &&
                          (!Array.isArray(themeContent.phrases) || themeContent.phrases.length === 0) &&
                          (!Array.isArray(themeContent.sentences) || themeContent.sentences.length === 0)) {
                        markdownContent += "_无语料_\n";
                      }

                    } else {
                      console.warn(`Expected object for theme content in section "${sectionKey}", but received:`, typeof themeContent);
                      markdownContent += `_主题内容格式错误_\n`;
                    }
                    markdownContent += '\n'; // Add space after each theme
                  }
                }
              } else {
                console.warn(`Expected object for section "${sectionKey}", but received:`, typeof sectionContent);
                markdownContent += `_内容格式错误: 应为包含话题语料对象的对象_\n`;
              }
              break;

            default:
              // Handle any unexpected section keys (shouldn't happen if ORDER is correct)
              console.warn(`Unknown section key encountered: "${sectionKey}"`);
              markdownContent += `_未知章节内容_\n`;
              // Attempt to print content if possible
              if (typeof sectionContent === 'string') {
                markdownContent += `${sectionContent}\n`;
              } else {
                markdownContent += `\`\`\`json\n${JSON.stringify(sectionContent, null, 2)}\n\`\`\`\n`;
              }
              break;
          }
          // Add a separator after each main section *except* the last one
           const sectionIndex = INTERPRETATION_SECTIONS_ORDER.indexOf(sectionKey);
           if (sectionIndex < INTERPRETATION_SECTIONS_ORDER.length - 1) {
             markdownContent += '---\n\n';
           }
        } else {
          // If AI did not return this section or content was empty/null
          console.log(`Section "${sectionKey}" not found or is empty in AI response.`);
          // Optionally add a placeholder in Markdown:
          // markdownContent += `## ${sectionTitle}\n\n_暂无内容_\n\n---\n\n`;
        }
      }

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
