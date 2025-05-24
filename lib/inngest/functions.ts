/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { inngest } from "@/lib/inngest";
import { CorrectionUtil } from "@/utils/corrections";
import {
  generateInterpretationPart,
  generatePureUpgradation,
  generateScore,
  generateUpgradation,
} from "@/utils/generate-continuation";
import { generateTitle, generateIcon } from "@/utils/generate-metadata";

function calculateScore(score_dimensions: any) {
  if (!score_dimensions || typeof score_dimensions !== 'object') {
    console.warn("calculateScore received invalid score_dimensions:", score_dimensions);
    return 0;
  }
  const totalScore = Object.values(score_dimensions).reduce(
    (sum: number, dimension: any) => sum + (dimension?.score || 0), // Add null check for dimension.score
    0
  );
  return Math.round((totalScore * 25) / 100 * 10) / 10;
}

// 定义作文批改函数
export const correctionFunctions = [
  inngest.createFunction(
    { id: "correction.create", retries: 2 }, // Added retries for robustness
    { event: "correction/create" },
    async ({ event, step, logger }) => { // Added logger
      const formData = event.data;
      const util = new CorrectionUtil();
      const uuid = formData.uuid;

      logger.info("Correction process started", { uuid, user_email: formData.user_email });

      // 步骤1：创建初始批改记录
      await step.run("create-initial-correction", async () => {
        logger.info("Step: create-initial-correction", { uuid });
        const correctionData = {
          uuid,
          title: formData.title || "",
          icon: "",
          model: formData.model,
          content: JSON.stringify({
            question: formData.originalText,
            answer: formData.essayText,
          }),
          score: 0,
          user_email: formData.user_email,
          public: false,
          type: "gaokao-english-continuation",
          status: "generate-score", // Initial status
        };
        await util.create(correctionData);
        logger.info("Initial correction created", { uuid });
      });

      // 步骤2：生成分数和内容
      await step.run("generate-score", async () => {
        logger.info("Step: generate-score", { uuid });
        const result = await generateScore(
          formData.originalText,
          formData.essayText,
          formData.tone,
          formData.model
        );

        if (!result || !result.score_dimensions) {
          logger.error("Failed to generate score or score_dimensions missing", { uuid, result });
          throw new Error("Score generation failed or returned invalid data.");
        }
        
        const currentCorrection = await util.getByUuid(uuid);
        if (!currentCorrection) throw new Error(`Correction not found for UUID: ${uuid} in generate-score`);
        const contentObj = JSON.parse(currentCorrection.content || "{}");
        
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          score: calculateScore(result.score_dimensions),
          content: JSON.stringify({
            ...contentObj,
            score_dimensions: result.score_dimensions,
          }),
          status: "generate-interpretation", // Next status
        });
        logger.info("Score generated and record updated", { uuid });
      });

      // 步骤3：生成作文题解读 (分步进行)
      logger.info("Step: generate-interpretation (orchestrator)", { uuid });

      const preambleJson = await step.run("generate-preamble", async () => {
        logger.info("Sub-step: generate-preamble", { uuid });
        return generateInterpretationPart(
          formData.originalText, formData.tone, formData.model, "preamble"
        );
      });
      if (!preambleJson || typeof preambleJson.preamble !== "string") {
        logger.error("Failed to generate or parse preamble.", { uuid, preambleJson });
        throw new Error("Failed to generate or parse preamble.");
      }

      const iqAndAJson = await step.run("generate-introductory-questions-and-answers", async () => {
        logger.info("Sub-step: generate-introductory-questions-and-answers", { uuid });
        return generateInterpretationPart(
          formData.originalText, formData.tone, formData.model, "introductoryQuestionsAndAnswers"
        );
      });
      if (!iqAndAJson || !Array.isArray(iqAndAJson.introductoryQuestions) || !Array.isArray(iqAndAJson.questionAnswers)) {
        logger.error("Failed to generate or parse IQ and Answers.", { uuid, iqAndAJson });
        throw new Error("Failed to generate or parse introductory questions and answers.");
      }

      const paragraphAnalysisJson = await step.run("generate-paragraph-analysis", async () => {
        logger.info("Sub-step: generate-paragraph-analysis", { uuid });
        return generateInterpretationPart(
          formData.originalText, formData.tone, formData.model, "paragraphAnalysis"
        );
      });
      if (!paragraphAnalysisJson || !Array.isArray(paragraphAnalysisJson.paragraphAnalysis)) {
        logger.error("Failed to generate or parse paragraph analysis.", { uuid, paragraphAnalysisJson });
        throw new Error("Failed to generate or parse paragraph analysis.");
      }

      const writingOutlineJson = await step.run("generate-writing-outline", async () => {
        logger.info("Sub-step: generate-writing-outline", { uuid });
        return generateInterpretationPart(
          formData.originalText, formData.tone, formData.model, "writingOutline"
        );
      });
      if (!writingOutlineJson || typeof writingOutlineJson.writingOutline !== "object" || writingOutlineJson.writingOutline === null) {
        logger.error("Failed to generate or parse writing outline.", { uuid, writingOutlineJson });
        throw new Error("Failed to generate or parse writing outline.");
      }

      const extendedVocabularyJson = await step.run("generate-extended-vocabulary", async () => {
        logger.info("Sub-step: generate-extended-vocabulary", { uuid });
        return generateInterpretationPart(
          formData.originalText, formData.tone, formData.model, "extendedVocabulary"
        );
      });
      if (!extendedVocabularyJson || typeof extendedVocabularyJson.extendedVocabulary !== "object" || extendedVocabularyJson.extendedVocabulary === null) {
        logger.error("Failed to generate or parse extended vocabulary.", { uuid, extendedVocabularyJson });
        throw new Error("Failed to generate or parse extended vocabulary.");
      }

      const assembledInterpretation = {
        preface: { content: preambleJson.preamble || "" },
        guiding_problems: [] as { question: string; answer: string }[],
        paragraph_analysis: [] as { original_text: string; interpretation: string }[],
        writing_framework_construction: { sections: [] as { points: string[] }[] },
        vocabulary_and_phrases_for_continuation: { topics: [] as any[] },
      };

      if (Array.isArray(iqAndAJson.introductoryQuestions) && Array.isArray(iqAndAJson.questionAnswers)) {
        for (let i = 0; i < iqAndAJson.introductoryQuestions.length; i++) {
          const question = iqAndAJson.introductoryQuestions[i];
          const answerObj = iqAndAJson.questionAnswers.find((ans: any) => ans.question === question) || iqAndAJson.questionAnswers[i];
          assembledInterpretation.guiding_problems.push({
            question: typeof question === "string" ? question : "",
            answer: answerObj && typeof answerObj.answer === "string" ? answerObj.answer : "",
          });
        }
      }
      if (Array.isArray(paragraphAnalysisJson.paragraphAnalysis)) {
        assembledInterpretation.paragraph_analysis = paragraphAnalysisJson.paragraphAnalysis.map((item: any) => ({
          original_text: item.originText || "",
          interpretation: item.details || "",
        }));
      }
      if (typeof writingOutlineJson.writingOutline === "object" && writingOutlineJson.writingOutline !== null) {
        for (const key of Object.keys(writingOutlineJson.writingOutline)) {
          const pointsArr = Array.isArray(writingOutlineJson.writingOutline[key]) ? writingOutlineJson.writingOutline[key] : [];
          assembledInterpretation.writing_framework_construction.sections.push({ points: pointsArr });
        }
      }
      if (typeof extendedVocabularyJson.extendedVocabulary === "object" && extendedVocabularyJson.extendedVocabulary !== null) {
        for (const topicName in extendedVocabularyJson.extendedVocabulary) {
          const topic = extendedVocabularyJson.extendedVocabulary[topicName];
          assembledInterpretation.vocabulary_and_phrases_for_continuation.topics.push({
            topic_name: topicName,
            vocabulary: Array.isArray(topic.vocabulary) ? topic.vocabulary : [],
            phrases: Array.isArray(topic.phrases) ? topic.phrases : [],
            useful_sentences: Array.isArray(topic.sentences) ? topic.sentences : [],
          });
        }
      }
      
      // Update record after assembling interpretation
      let currentCorrectionForInterpretation = await util.getByUuid(uuid);
      if (!currentCorrectionForInterpretation) throw new Error(`Correction not found for UUID: ${uuid} before interpretation update`);
      let contentObjForInterpretation = JSON.parse(currentCorrectionForInterpretation.content || "{}");
      await util.updateByUuid(uuid, {
        ...currentCorrectionForInterpretation,
        content: JSON.stringify({
          ...contentObjForInterpretation,
          interpretation: assembledInterpretation,
        }),
        status: "generate-upgradation", // THIS IS THE STATUS YOU ARE SEEING
      });
      logger.info("Interpretation assembled and record updated", { uuid, status: "generate-upgradation" });

      // 步骤4：生成升格建议
      await step.run("generate-upgradation", async () => {
        logger.info("Step: generate-upgradation", { uuid });
        const result = await generateUpgradation(
          formData.originalText,
          formData.essayText,
          formData.tone,
          formData.model
        );
        
        const currentCorrection = await util.getByUuid(uuid);
        if (!currentCorrection) throw new Error(`Correction not found for UUID: ${uuid} in generate-upgradation`);
        const contentObj = JSON.parse(currentCorrection.content || "{}");
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          content: JSON.stringify({
            ...contentObj,
            upgradation: result?.upgradation || null,
          }),
          status: "generate-pure-upgradation", // Next status
        });
        logger.info("Upgradation generated and record updated", { uuid, status: "generate-pure-upgradation" });
      });

      // 步骤5：生成升格文纯享版
      await step.run("generate-pure-upgradation", async () => {
        logger.info("Step: generate-pure-upgradation", { uuid });
        const result = await generatePureUpgradation(
          formData.originalText,
          formData.essayText,
          formData.model
        );

        const currentCorrection = await util.getByUuid(uuid);
        if (!currentCorrection) throw new Error(`Correction not found for UUID: ${uuid} in generate-pure-upgradation`);
        const contentObj = JSON.parse(currentCorrection.content || "{}");
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          content: JSON.stringify({
            ...contentObj,
            pureUpgradation: result?.pure_upgradation || null,
          }),
          status: "generate-title", // Next status
        });
        logger.info("Pure upgradation generated and record updated", { uuid, status: "generate-title" });
      });
      
      let statusBeforeTitle = "generate-title"; // Default next status

      // 步骤6：生成标题（如果没有提供）
      if (!formData.title) {
        await step.run("generate-title", async () => {
          logger.info("Step: generate-title", { uuid });
          const title = await generateTitle(formData.originalText);

          const currentCorrection = await util.getByUuid(uuid);
          if (!currentCorrection) throw new Error(`Correction not found for UUID: ${uuid} in generate-title`);
          await util.updateByUuid(uuid, {
            ...currentCorrection,
            title,
            status: "generate-icon", // Next status
          });
          statusBeforeTitle = "generate-icon"; // Update for the next step
          logger.info("Title generated and record updated", { uuid, status: "generate-icon" });
        });
      } else {
         // If title was provided, we need to manually set the status for the next step
         // Get current record to ensure we don't lose other data
        const currentCorrection = await util.getByUuid(uuid);
        if (!currentCorrection) throw new Error(`Correction not found for UUID: ${uuid} before skipping title generation`);
        // Only update status if it's currently 'generate-title'
        if (currentCorrection.status === 'generate-title') {
            await util.updateByUuid(uuid, {
              status: "generate-icon", // Set status for next step
            });
            logger.info("Title was provided, skipping generation, status updated to generate-icon", { uuid });
        }
        statusBeforeTitle = "generate-icon";
      }


      // 步骤7：生成图标
      await step.run("generate-icon", async () => {
        logger.info("Step: generate-icon", { uuid });
        const icon = await generateIcon(formData.originalText);

        const currentCorrection = await util.getByUuid(uuid);
        if (!currentCorrection) throw new Error(`Correction not found for UUID: ${uuid} in generate-icon`);
        // Ensure the status we are updating from is the one set by the previous step
        // This check might be overly cautious if util.updateByUuid is robust,
        // but helps if there are non-awaited issues.
        if (currentCorrection.status !== statusBeforeTitle && currentCorrection.status !== "generate-icon") {
            logger.warn("Status mismatch before final update in generate-icon", {currentStatus: currentCorrection.status, expected: statusBeforeTitle});
        }

        await util.updateByUuid(uuid, {
          ...currentCorrection, // Spread existing data
          icon,                 // Add/update icon
          status: "success",    // Final status
        });
        logger.info("Icon generated and record updated to success", { uuid, status: "success" });
      });

      logger.info("Correction process completed successfully", { uuid });
      return {
        success: true,
        message: "批改任务已完成",
        uuid: uuid,
      };
    }
  ),
];