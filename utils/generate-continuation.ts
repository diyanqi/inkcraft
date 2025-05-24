/* eslint-disable @typescript-eslint/no-explicit-any */
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
  getInterpretationPrompt} from './correction-prompt';

// Helper function to calculate the 'input' parameter for Youdao signature

// Helper function to calculate the Youdao v3 signature


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
): Promise<{ score_dimensions: any }> {
  console.log("Initiating score generation...");

  let fullResponseText = '';

  // 分项评分中文->英文key映射
  const keyMap: Record<string, string> = {
    '内容与原文融洽度': 'relevance_and_accuracy',
    '情节合理性与完整性': 'plot_plausibility_completeness',
    '词汇丰富性': 'vocabulary_richness',
    '语法准确性': 'grammatical_accuracy',
    '句式多样性': 'sentence_variety',
    '衔接与连贯性': 'cohesion_coherence',
    '创新性与逻辑性': 'originality_logicality',
    '文体与人称一致性': 'style_voice_consistency',
    '英语文学素养与教师主观评价': 'literary_competence_teacher_evaluation',
  };

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
      throw new Error("Parsed JSON does not have the expected structure ('分项评分' key missing).\n");
    }

    // 组装score_dimensions
    const score_dimensions: Record<string, { score: number, explaination: string }> = {};
    const finalCategories = json.分项评分;
    for (const zhKey in finalCategories) {
      if (Object.prototype.hasOwnProperty.call(finalCategories, zhKey)) {
        const enKey = keyMap[zhKey] || zhKey;
        let totalScore = 0;
        const explanations: string[] = [];
        const section = finalCategories[zhKey];

        if (typeof section === 'object' && section !== null) {
          for (const subKey in section) {
            if (Object.prototype.hasOwnProperty.call(section, subKey)) {
              const sub = section[subKey];
              const score = typeof sub.score === 'number' ? sub.score : Number(sub.score) || 0;
              const explanation = sub.reason || sub.explaination || '';
              totalScore += score;
              explanations.push(explanation);
            }
          }
        } else if (typeof section === 'string') {
          explanations.push(section);
        }

        score_dimensions[enKey] = {
          score: totalScore,
          explaination: explanations.join('；')
        };
      }
    }

    return { score_dimensions };
  } catch (err) {
    console.error("Error generating score:", err);
    if (fullResponseText) {
      console.error("Partial AI response received before error:", fullResponseText);
    }
    throw err;
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
): Promise<{ upgradation: any } | null> {
  console.log("Initiating language upgradation...");

  let fullResponseText = '';

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

    // 组装目标格式
    const upgradation = {
      vocabulary_upgradation: Array.isArray(json["词汇"]) ? json["词汇"].map((item: any) => ({
        original_word: item.原词 || '',
        upgraded_word: item.升格 || '',
        english_explanation: item.英文释义 || '',
        chinese_meaning: item.简明中文释义 || '',
        example_sentence: item.英文例句 || ''
      })) : [],
      phrase_upgradation: Array.isArray(json["词组"]) ? json["词组"].map((item: any) => ({
        original_phrase: item.原词组 || '',
        upgraded_phrase: item.升格 || '',
        english_explanation: item.英文释义 || '',
        chinese_meaning: item.简明中文释义 || '',
        example_sentence: item.英文例句 || ''
      })) : [],
      sentence_upgradation: Array.isArray(json["句式"]) ? json["句式"].map((item: any) => ({
        original_sentence: item.原句 || '',
        upgraded_sentence: item.升格句 || '',
        explanation: item.说明 || '',
        example_sentence: item.英文例句 || ''
      })) : [],
      detail_description_upgradation: Array.isArray(json["细节描写"]) ? json["细节描写"].map((item: any) => ({
        original_description: item.原描写 || '',
        upgraded_description: item.升格描写 || '',
        explanation: item.说明 || '',
        example_sentence: item.英文例句 || ''
      })) : []
    };

    return { upgradation };
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
): Promise<{ pure_upgradation: any[] } | null> {
  console.log("Initiating pure upgradation...");

  let fullResponseText = '';

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

    // 组装目标格式
    const pure_upgradation: any[] = [];
    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        const item = json[key];
        pure_upgradation.push({
          sentence: key,
          upgradation: item.升格 || '',
          comment: item.点评 || ''
        });
      }
    }

    return { pure_upgradation };
  } catch (error) {
    console.error("Error generating pure upgradation:", error);
    return null;
  }
}

/**
 * Generates a specific part of the interpretation of the essay topic.
 * @param originalText The original essay topic text.
 * @param tone The tone parameter.
 * @param model The model parameter.
 * @param targetSection The specific section of the interpretation to generate.
 * @returns A Promise resolving to an object containing the parsed JSON for the requested section, or null if generation fails.
 */
export async function generateInterpretationPart(
  originalText: string,
  tone: string,
  model: string,
  targetSection: "preamble" | "introductoryQuestionsAndAnswers" | "paragraphAnalysis" | "writingOutline" | "extendedVocabulary"
): Promise<any | null> { // Return type is now 'any' as it's a part of the full structure
  console.log(`Initiating topic interpretation generation for section: ${targetSection}...`);

  let fullResponseText = '';

  try {
    const aiModel = getModelByName(model);
    const tonePrompt = getTonePrompt(tone);

    console.log(`--- Streaming AI response for topic interpretation section: ${targetSection} ---`);

    const streamResult = await streamText({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: getInterpretationPrompt(originalText, tonePrompt, targetSection), // Pass targetSection
        },
      ],
      maxTokens: 8192, // Increased maxTokens as we are asking for more detailed content per section
      temperature: 0.7, // Slightly lower temp for more predictable JSON structure
    });

    for await (const part of streamResult.fullStream) {
      if (part.type === 'text-delta' && part.textDelta) {
        const chunk = part.textDelta;
        process.stdout.write(chunk);
        fullResponseText += chunk;
      }
    }

    console.log(`\n--- End of AI response stream for topic interpretation section: ${targetSection} ---`);

    if (!fullResponseText.trim()) {
      console.warn(`AI response for topic interpretation section ${targetSection} was empty or only whitespace.`);
      return null;
    }

    const startObject = fullResponseText.indexOf('{');
    const endObject = fullResponseText.lastIndexOf('}');
    if (startObject === -1 || endObject === -1 || startObject >= endObject) {
      console.error(`Invalid JSON structure received for interpretation section ${targetSection} (no valid object found):`, fullResponseText);
      return null;
    }
    const jsonString = fullResponseText.substring(startObject, endObject + 1);

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(jsonString);
      console.log(`Parsed JSON for section ${targetSection}:`, parsedJson);
    } catch (parseError) {
      console.error(`Failed to parse JSON for interpretation section ${targetSection}:`, parseError);
      console.error("Received JSON string:", jsonString);
      return null;
    }

    // The function now returns the parsed JSON part directly.
    // The calling function (in function.ts) will be responsible for assembling these parts.
    return parsedJson;

  } catch (error) {
    console.error(`Error generating topic interpretation for section ${targetSection}:`, error);
    return null;
  }
}