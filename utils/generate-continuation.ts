// utils/generate-continuation.ts
import { streamText } from 'ai';
import { parse } from 'best-effort-json-parser';
// Import the defined models
import { getModelByName } from './models';
// Import tone utility functions
import { getTonePrompt } from './tone-prompt'; // Import getTonePrompt
import {
  getEnglishContinuationScorePrompt,
  getEnglishContinuationUpgradationPrompt,
  SCORING_CATEGORIES,
  UPGRADATION_SECTIONS // Assuming UPGRADATION_SECTIONS is ["词汇", "词组", "句式", "细节描写"] in order
} from './correction-prompt';

// Helper type for the enqueue function
type EnqueueFunction = (data: any) => void;

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

        for (const category of SCORING_CATEGORIES) {
          const searchString = `"${category}":`;
          if (!reportedCategories.has(category) && fullResponseText.includes(searchString)) {
            enqueue({ type: 'progress', message: `正在评分: ${category}` });
            reportedCategories.add(category);
          }
        }
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
    enqueue({ type: 'error', message: '生成评分失败', error: String(error) });
    throw error;
  }
}

/**
 * Rewrites the user's essay continuation text to upgrade vocabulary, phrases, sentence structures, and detailed descriptions.
 * Streams the AI response (expected to be JSON), parses it, generates a Markdown summary, and sends progress updates.
 * Selects the AI model based on the 'model' parameter.
 * Incorporates the 'tone' parameter into the prompt to influence the AI's response style.
 *
 * @param originalText The original text prompt (for context).
 * @param essayText The user's essay continuation text to upgrade.
 * @param tone The tone parameter.
 * @param model The model parameter.
 * @param enqueue Function to send progress updates via the stream.
 * @returns A Promise resolving to an object containing the parsed JSON and the generated Markdown content, or null if generation fails.
 */
export async function generateUpgradation(
  originalText: string,
  essayText: string,
  tone: string,
  model: string,
  enqueue: EnqueueFunction
): Promise<{ json: any, markdownContent: string } | null> {
  enqueue({ type: 'progress', message: '正在分析并生成升格建议...' });
  console.log("Initiating language upgradation...");

  let fullResponseText = '';
  const reportedSections = new Set<string>();
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
      maxTokens: 6144, // Increased maxTokens might be needed for detailed JSON
      temperature: 0.5,
      topP: 0.9,
    });

    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        process.stdout.write(chunk);
        fullResponseText += chunk;

        // Progress updates based on encountering section keys
        for (const section of UPGRADATION_SECTIONS) {
          const searchString = `"${section}":`; // e.g., "词汇":
          if (!reportedSections.has(section) && fullResponseText.includes(searchString)) {
            enqueue({ type: 'progress', message: `正在生成: ${section} 建议` });
            reportedSections.add(section);
          }
        }
      }
    }

    console.log("\n--- End of AI response stream for language upgradation ---");

    if (!fullResponseText.trim()) {
      console.warn("AI response for language upgradation was empty or only whitespace.");
      enqueue({ type: 'error', message: '未能生成升格建议：AI返回为空' });
      return null;
    }

    // Attempt to extract a JSON object from the response
    const startObject = fullResponseText.indexOf('{');
    const endObject = fullResponseText.lastIndexOf('}');
    if (startObject === -1 || endObject === -1 || startObject >= endObject) {
      console.error("Invalid JSON structure received for upgradation (no valid object found):", fullResponseText);
      enqueue({ type: 'error', message: '未能生成升格建议：AI返回非JSON对象格式' });
      return null;
    }
    const jsonString = fullResponseText.substring(startObject, endObject + 1);

    let json: any;
    try {
      json = JSON.parse(jsonString); // Using standard JSON.parse
      console.log('Parsed JSON:', json);
    } catch (parseError) {
      console.error("Failed to parse JSON for upgradation:", parseError);
      console.error("Received JSON string:", jsonString);
      enqueue({ type: 'error', message: `未能生成升格建议：解析JSON失败: ${parseError}` });
      return null;
    }

    // --- Generate Markdown Content based on the new JSON structure ---
    markdownContent += '# 语言升格建议\n\n';

    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      for (const originalSentence in json) {
        if (Object.prototype.hasOwnProperty.call(json, originalSentence)) {
          const sentenceData = json[originalSentence];

          if (typeof sentenceData !== 'object' || sentenceData === null) {
            console.warn(`Data for sentence "${originalSentence}" is not an object:`, sentenceData);
            markdownContent += `_处理原文片段 "${originalSentence}" 时遇到格式问题。_\n\n`;
            continue;
          }

          markdownContent += `## 原文片段：\`${originalSentence}\`\n\n`;

          for (const sectionName of UPGRADATION_SECTIONS) { // UPGRADATION_SECTIONS = ["词汇", "词组", "句式", "细节描写"]
            const items = sentenceData[sectionName];
            if (Array.isArray(items) && items.length > 0) {
              markdownContent += `### ${sectionName}升格\n\n`;
              items.forEach((item: any) => {
                if (typeof item !== 'object' || item === null) return; // Skip malformed items

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
                markdownContent += '\n'; // Add a newline after each item's details
              });
            }
          }

          if (sentenceData.升格后的完整句子) {
            markdownContent += `### 升格后的完整句子\n`;
            markdownContent += `> ${sentenceData.升格后的完整句子}\n\n`;
          }
          markdownContent += '---\n\n'; // Separator between different original sentences
        }
      }
    } else {
      console.error("Parsed JSON for upgradation is not the expected object structure (keys as original sentences):", json);
      enqueue({ type: 'error', message: '未能正确解析升格建议：AI返回数据结构与预期不符。' });
      markdownContent += "_错误：AI返回的升格建议数据结构与预期不符（期望一个以原句为键的对象），无法完整展示。_\n\n";
      // Optionally, include raw JSON in markdown for debugging if it's small enough
      // if (jsonString.length < 2000) { // Avoid overly long raw dumps
      //   markdownContent += "```json\n" + JSON.stringify(json, null, 2) + "\n```\n";
      // }
    }
    // --- End Generate Markdown Content ---

    console.log("Successfully generated and parsed upgradation suggestions.");
    return { json, markdownContent };

  } catch (error) {
    console.error("Error generating language upgradation:", error);
    // Check if the error message is already an enqueue-able object (e.g. from a deeper utility)
    // This check avoids duplicate error messages if the error object itself is from `enqueue`
    const isPreEnqueuedError = typeof error === 'object' && error !== null && 'type' in error && error.type === 'error';
    if (!isPreEnqueuedError && !fullResponseText.includes('"type":"error"')) { // Avoid duplicate if AI already sent an error in stream
        enqueue({ type: 'error', message: '生成升格建议时发生意外错误', error: String(error) });
    } else if (isPreEnqueuedError) {
        enqueue(error); // Forward the pre-enqueued error
    }
    return null;
  }
}