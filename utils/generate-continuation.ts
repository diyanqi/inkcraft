// utils/generate-continuation.ts
import { streamText } from 'ai';
import { parse } from 'best-effort-json-parser';
// Import the defined models
import { getModelByName } from './models';
// Import tone utility functions
import { getTonePrompt } from './tone-prompt'; // Import getTonePrompt
import { getEnglishContinuationScorePrompt, getEnglishContinuationUpgradationPrompt, SCORING_CATEGORIES, UPGRADATION_SECTIONS } from './correction-prompt';

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
    // Use the specific model defined in the original logic
    const aiModel = getModelByName(model);

    // Use the imported function to get the tone prompt
    const tonePrompt = getTonePrompt(tone);

    console.log("--- Streaming AI response for score ---"); // Marker for console output

    // Call streamText and iterate over the response stream
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

/**
 * Rewrites the user's essay continuation text to upgrade vocabulary, phrases, sentence structures, and detailed descriptions.
 * Streams the AI response (expected to be JSON), parses it, generates a Markdown summary, and sends progress updates.
 * Selects the AI model based on the 'model' parameter.
 * Incorporates the 'tone' parameter into the prompt to influence the AI's response style.
 *
 * @param originalText The original text prompt (for context).
 * @param essayText The user's essay continuation text to upgrade.
 * @param tone The tone parameter ('serious', 'humorous', 'sharp', or others).
 * @param model The model parameter ('llama', 'deepseek', 'qwen', 'glm', 'gpt4', or default).
 * @param enqueue Function to send progress updates via the stream.
 * @returns A Promise resolving to an object containing the parsed JSON and the generated Markdown content, or null if generation fails.
 */
export async function generateUpgradation(
  originalText: string,
  essayText: string,
  tone: string, // Added as requested, and now used
  model: string, // Added as requested
  enqueue: EnqueueFunction
): Promise<{ json: any, markdownContent: string } | null> { // Changed return type
  enqueue({ type: 'progress', message: '正在分析并生成升格建议...' });
  console.log("Initiating language upgradation...");

  let fullResponseText = ''; // Accumulator for the full AI response text
  const reportedSections = new Set<string>(); // Track sections already reported via enqueue
  let markdownContent = ''; // Accumulator for the Markdown content

  try {
    // Select the AI model based on the model parameter
    const aiModel = getModelByName(model);

    // Use the imported function to get the tone prompt for upgradation
    const tonePrompt = getTonePrompt(tone); // Get tone prompt for upgradation

    console.log("--- Streaming AI response for language upgradation ---");

    const streamResult = await streamText({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: getEnglishContinuationUpgradationPrompt(originalText, essayText, tonePrompt),
        },
      ],
      maxTokens: 4096, // Adjust based on expected output length
      temperature: 0.5, // Allow some creativity in word choice, but not too much
      topP: 0.9, // Broaden sampling slightly for varied word choices
    });

    // Iterate over the stream parts
    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        // Write the chunk directly to the console's standard output for debugging
        process.stdout.write(chunk);
        // Append the chunk to the full response text
        fullResponseText += chunk;

        // --- Check for new section keys ---
        for (const section of UPGRADATION_SECTIONS) {
          // Check if section hasn't been reported yet AND appears in the text
          // Look for the section name enclosed in quotes followed by a colon and potentially whitespace
          const searchString = `"${section}":`;
          if (!reportedSections.has(section) && fullResponseText.includes(searchString)) {
            // Send enqueue message for this section
            enqueue({ type: 'progress', message: `正在生成: ${section} 建议` });
            // Mark this section as reported
            reportedSections.add(section);
          }
        }
        // --- End check for new section keys ---
      }
    }

    console.log("\n--- End of AI response stream for language upgradation ---");

    // Check if we received any response
    if (!fullResponseText.trim()) {
      console.warn("AI response for language upgradation was empty or only whitespace.");
      enqueue({ type: 'error', message: '未能生成升格建议：AI返回为空' });
      // Return null as the expected JSON was not received
      return null;
    }

    // Parse the accumulated JSON string
    const start = fullResponseText.indexOf('{');
    const end = fullResponseText.lastIndexOf('}');
    if (start === -1 || end === -1 || start >= end) {
      console.error("Invalid JSON structure received for upgradation:", fullResponseText);
      enqueue({ type: 'error', message: '未能生成升格建议：AI返回非JSON格式' });
      // Return null if JSON structure is invalid
      return null;
    }
    const jsonString = fullResponseText.substring(start, end + 1);

    let json: any;
    try {
      json = parse(jsonString); // Use best-effort parser
    } catch (parseError) {
      console.error("Failed to parse JSON for upgradation:", parseError);
      console.error("Received JSON string:", jsonString);
      enqueue({ type: 'error', message: `未能生成升格建议：解析JSON失败: ${parseError}` });
      // Return null if JSON parsing fails
      return null;
    }

    // Optional: Add checks to ensure the parsed JSON has the expected top-level keys
    const hasExpectedKeys = UPGRADATION_SECTIONS.every(section => json && typeof json === 'object' && json[section] !== undefined);
    if (!hasExpectedKeys) {
      console.warn("Parsed JSON missing expected keys for upgradation:", json);
      // Log a warning but proceed with generating markdown from available data
      enqueue({ type: 'warning', message: '升格建议JSON结构不完整或缺少部分类别' });
    }

    // --- Generate Markdown Content ---
    markdownContent += '# 语言升格建议\n\n';

    for (const section of UPGRADATION_SECTIONS) {
      const items = json?.[section]; // Use optional chaining in case the section is missing

      if (Array.isArray(items) && items.length > 0) {
        markdownContent += `## ${section}升格\n\n`;

        items.forEach((item, index) => {
          markdownContent += `- **建议 ${index + 1}:**\n`;

          if (section === "词汇") {
            markdownContent += `  - **原词:** ${item.原词 || 'N/A'}\n`;
            markdownContent += `  - **升格:** ${item.升格 || 'N/A'}\n`;
            if (item.英文释义) markdownContent += `  > **英文释义:** ${item.英文释义}\n`;
            if (item.简明中文释义) markdownContent += `  > **简明中文释义:** ${item.简明中文释义}\n`;
            if (item.英文例句) markdownContent += `  > **英文例句:** ${item.英文例句}\n`;
          } else if (section === "词组") {
            markdownContent += `  - **原词组:** ${item.原词组 || 'N/A'}\n`;
            markdownContent += `  - **升格:** ${item.升格 || 'N/A'}\n`;
            if (item.英文释义) markdownContent += `  > **英文释义:** ${item.英文释义}\n`;
            if (item.简明中文释义) markdownContent += `  > **简明中文释义:** ${item.简明中文释义}\n`;
            if (item.英文例句) markdownContent += `  > **英文例句:** ${item.英文例句}\n`;
          } else if (section === "句式") {
            markdownContent += `  - **原句:** ${item.原句 || 'N/A'}\n`;
            markdownContent += `  - **升格句:** ${item.升格句 || 'N/A'}\n`;
            if (item.说明) markdownContent += `  > **说明:** ${item.说明}\n`;
            if (item.英文例句) markdownContent += `  > **英文例句:** ${item.英文例句}\n`;
          } else if (section === "细节描写") {
            markdownContent += `  - **原描写:** ${item.原描写 || 'N/A'}\n`;
            markdownContent += `  - **升格描写:** ${item.升格描写 || 'N/A'}\n`;
            if (item.说明) markdownContent += `  > **说明:** ${item.说明}\n`;
            // Note: Details section example didn't have English example, but adding it just in case AI provides it
            if (item.英文例句) markdownContent += `  > **英文例句:** ${item.英文例句}\n`;
          }
          markdownContent += '\n'; // Add a newline after each item
        });
        markdownContent += '---\n\n'; // Add a horizontal rule after each section
      }
    }
    // --- End Generate Markdown Content ---


    console.log("Successfully generated and parsed upgradation suggestions.");
    // Return both the parsed JSON and the generated Markdown
    return { json, markdownContent };

  } catch (error) {
    console.error("Error generating language upgradation:", error);
    // Ensure an error message is sent via enqueue if not already sent by specific catches
    // Simple check to avoid duplicate error messages - might need more robust logic
    if (!fullResponseText.includes('"type":"error"')) {
      enqueue({ type: 'error', message: '生成升格建议失败', error: String(error) });
    }
    // Return null on error
    return null;
  }
}
