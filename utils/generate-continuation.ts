// utils/generate-continuation.ts
import { streamText } from 'ai';
import { parse } from 'best-effort-json-parser';
// Import the defined models
import { getModelByName } from './models';
// Import tone utility functions
import { getTonePrompt } from './tone-prompt';
import {
  getEnglishContinuationScorePrompt,
  getEnglishContinuationUpgradationPrompt,
  SCORING_CATEGORIES,
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
      topP: 0.9,
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