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
  generateStrengthenFoundation,
} from "@/utils/generate-continuation"; // Assuming these are compatible or you'll adapt
import { generateTitle, generateIcon } from "@/utils/generate-metadata";

function calculateScore(score_dimensions: any) {
  if (!score_dimensions || typeof score_dimensions !== 'object') {
    console.warn("calculateScore received invalid score_dimensions:", score_dimensions);
    return 0;
  }
  const totalScore = Object.values(score_dimensions).reduce(
    (sum: number, dimension: any) => sum + (dimension?.score || 0),
    0
  );
  // Keep Gaokao English continuation score out of 25
  return Math.round((totalScore * 25) / 100 * 10) / 10;
}

// Define作文批改函数
export const correctionFunctions = [
  inngest.createFunction(
    { id: "correction.create", retries: 2 },
    { event: "correction/create" },
    async ({ event, step, logger }) => {
      const formData = event.data as {
        uuid: string;
        user_email: string;
        originalText: string;
        essayText?: string; // For single
        essayTexts?: string[]; // For batch
        model: string;
        essayType: string;
        tone: string;
        title?: string;
        referenceText?: string;
        isBatch: boolean;
      };

      const util = new CorrectionUtil();
      const uuid = formData.uuid;

      logger.info(`Correction process started for UUID: ${uuid}`, { isBatch: formData.isBatch, user_email: formData.user_email, type: formData.essayType });

      const baseCorrectionType = formData.essayType; // e.g., "gaokao-english-continuation"
      const finalCorrectionType = formData.isBatch ? `${baseCorrectionType}-batch` : baseCorrectionType;

      // --- Shared Data for Batch or Single ---
      let sharedTitle = formData.title || ""; // Use provided title or empty string
      let sharedIcon = "";
      let sharedInterpretation: any = null;

      // --------------------------------------------------------------------------
      // STEP 1: Create Initial Record
      // --------------------------------------------------------------------------
      await step.run("create-initial-correction", async () => {
        logger.info("Step: create-initial-correction", { uuid, isBatch: formData.isBatch });
        let initialContent: any = {
          question: formData.originalText,
          referenceAnswer: formData.referenceText || "",
        };

        if (formData.isBatch) {
          initialContent.essays = []; // Placeholder for batch essay results
        } else {
          initialContent.answer = formData.essayText || ""; // For single essay
        }

        const correctionData = {
          uuid,
          title: sharedTitle, // Will use formData.title if present, else empty
          icon: sharedIcon,   // Initially empty
          model: formData.model,
          content: JSON.stringify(initialContent),
          score: 0, // Will be updated (average for batch)
          user_email: formData.user_email,
          public: false,
          type: finalCorrectionType,
          status: "processing", // Generic initial processing status
        };
        await util.create(correctionData);
        logger.info("Initial correction created", { uuid, type: finalCorrectionType });
      });

      // Update status for next logical step
      await util.updateByUuid(uuid, { status: baseCorrectionType === 'gaokao-english-continuation' ? 'generate-interpretation' : 'processing-essays' });

      // --------------------------------------------------------------------------
      // STEP 2: Generate Interpretation (if applicable, once for all)
      // --------------------------------------------------------------------------
      if (baseCorrectionType === 'gaokao-english-continuation') {
        logger.info("Step: generate-interpretation (orchestrator)", { uuid });

        const preambleJson = await step.run("generate-preamble", async () => {
          logger.info("Sub-step: generate-preamble", { uuid });
          return generateInterpretationPart(formData.originalText, formData.tone, formData.model, "preamble");
        });
        if (!preambleJson || typeof preambleJson.preamble !== "string") {
          logger.error("Failed to generate or parse preamble.", { uuid, preambleJson });
          throw new Error("Failed to generate or parse preamble.");
        }

        const iqAndAJson = await step.run("generate-introductory-questions-and-answers", async () => {
          logger.info("Sub-step: generate-introductory-questions-and-answers", { uuid });
          return generateInterpretationPart(formData.originalText, formData.tone, formData.model, "introductoryQuestionsAndAnswers");
        });
        if (!iqAndAJson || !Array.isArray(iqAndAJson.introductoryQuestions) || !Array.isArray(iqAndAJson.questionAnswers)) {
          logger.error("Failed to generate or parse IQ and Answers.", { uuid, iqAndAJson });
          throw new Error("Failed to generate or parse introductory questions and answers.");
        }

        const paragraphAnalysisJson = await step.run("generate-paragraph-analysis", async () => {
          logger.info("Sub-step: generate-paragraph-analysis", { uuid });
          return generateInterpretationPart(formData.originalText, formData.tone, formData.model, "paragraphAnalysis");
        });
        if (!paragraphAnalysisJson || !Array.isArray(paragraphAnalysisJson.paragraphAnalysis)) {
          logger.error("Failed to generate or parse paragraph analysis.", { uuid, paragraphAnalysisJson });
          throw new Error("Failed to generate or parse paragraph analysis.");
        }

        const writingOutlineJson = await step.run("generate-writing-outline", async () => {
          logger.info("Sub-step: generate-writing-outline", { uuid });
          return generateInterpretationPart(formData.originalText, formData.tone, formData.model, "writingOutline");
        });
        console.log("Writing Outline JSON:", writingOutlineJson);
        if (!writingOutlineJson || typeof writingOutlineJson.writingOutline !== "object") {
          logger.error("Failed to generate or parse writing outline.", { uuid, writingOutlineJson });
          throw new Error("Failed to generate or parse writing outline.");
        }

        const extendedVocabularyJson = await step.run("generate-extended-vocabulary", async () => {
          logger.info("Sub-step: generate-extended-vocabulary", { uuid });
          return generateInterpretationPart(formData.originalText, formData.tone, formData.model, "extendedVocabulary");
        });
        if (!extendedVocabularyJson || typeof extendedVocabularyJson.extendedVocabulary !== "object") {
          logger.error("Failed to generate or parse extended vocabulary.", { uuid, extendedVocabularyJson });
          throw new Error("Failed to generate or parse extended vocabulary.");
        }

        sharedInterpretation = {
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
            sharedInterpretation.guiding_problems.push({
              question: typeof question === "string" ? question : "",
              answer: answerObj && typeof answerObj.answer === "string" ? answerObj.answer : "",
            });
          }
        }
        if (Array.isArray(paragraphAnalysisJson.paragraphAnalysis)) {
          sharedInterpretation.paragraph_analysis = paragraphAnalysisJson.paragraphAnalysis.map((item: any) => ({
            original_text: item.originText || item.original_text || "", // Handle potential variations
            interpretation: item.details || item.interpretation || "",
          }));
        }
        if (typeof writingOutlineJson.writingOutline === "object" && writingOutlineJson.writingOutline !== null) {
          for (const key of Object.keys(writingOutlineJson.writingOutline)) {
            const pointsArr = Array.isArray(writingOutlineJson.writingOutline[key]) ? writingOutlineJson.writingOutline[key] : [];
            sharedInterpretation.writing_framework_construction.sections.push({ points: pointsArr });
          }
        }
        if (typeof extendedVocabularyJson.extendedVocabulary === "object" && extendedVocabularyJson.extendedVocabulary !== null) {
          for (const topicName in extendedVocabularyJson.extendedVocabulary) {
            const topic = extendedVocabularyJson.extendedVocabulary[topicName];
            sharedInterpretation.vocabulary_and_phrases_for_continuation.topics.push({
              topic_name: topicName,
              vocabulary: Array.isArray(topic.vocabulary) ? topic.vocabulary : [],
              phrases: Array.isArray(topic.phrases) ? topic.phrases : [],
              useful_sentences: Array.isArray(topic.sentences) ? topic.sentences : [],
            });
          }
        }
        logger.info("Shared interpretation generated", { uuid });
        await util.updateByUuid(uuid, { status: "processing" });
      }

      // --------------------------------------------------------------------------
      // STEP 3: Process each essay (Score, Upgradation, Pure Upgradation, Strengthen Foundation)
      // --------------------------------------------------------------------------
      logger.info("Step: processing-essays", { uuid, count: formData.isBatch ? formData.essayTexts?.length : 1 });
      let individualEssayResults: any[] = [];
      let totalBatchScore = 0;
      const essaysToProcess = formData.isBatch ? formData.essayTexts! : [formData.essayText!];

      for (let i = 0; i < essaysToProcess.length; i++) {
        const currentEssayText = essaysToProcess[i];
        const essayLoggerSuffix = formData.isBatch ? ` (Essay ${i + 1}/${essaysToProcess.length})` : "";
        const stepIdSuffix = formData.isBatch ? `-essay-${i}` : ''; // Unique step IDs for batch

        logger.info(`Starting processing for essay${essayLoggerSuffix}`, { uuid });

        // Sub-Step 3.1: Generate Score
        const scoreResult = await step.run(`generate-score${stepIdSuffix}`, async () => {
          logger.info(`Sub-step: generate-score${essayLoggerSuffix}`, { uuid });
          return generateScore(formData.originalText, currentEssayText, formData.tone, formData.model);
        });

        if (!scoreResult || !scoreResult.score_dimensions) {
          logger.error(`Failed to generate score or score_dimensions missing for essay${essayLoggerSuffix}`, { uuid, scoreResult });
          // Potentially mark this essay as failed and continue, or throw to retry batch
          throw new Error(`Score generation failed for essay ${i + 1}.`);
        }
        const individualScore = calculateScore(scoreResult.score_dimensions);
        totalBatchScore += individualScore;

        let upgradationResult: any = null;
        let pureUpgradationResult: any = null;
        let strengthenFoundationResult: any = null;

        // Sub-Step 3.2 & 3.3: Upgradation (only for gaokao-english-continuation)
        if (baseCorrectionType === 'gaokao-english-continuation') {
          upgradationResult = await step.run(`generate-upgradation${stepIdSuffix}`, async () => {
            logger.info(`Sub-step: generate-upgradation${essayLoggerSuffix}`, { uuid });
            return generateUpgradation(formData.originalText, currentEssayText, formData.tone, formData.model);
          });

          pureUpgradationResult = await step.run(`generate-pure-upgradation${stepIdSuffix}`, async () => {
            logger.info(`Sub-step: generate-pure-upgradation${essayLoggerSuffix}`, { uuid });
            return generatePureUpgradation(formData.originalText, currentEssayText, formData.model);
          });

          // Sub-Step 3.4: Strengthen Foundation
          strengthenFoundationResult = await step.run(`generate-strengthen-foundation${stepIdSuffix}`, async () => {
            logger.info(`Sub-step: generate-strengthen-foundation${essayLoggerSuffix}`, { uuid });
            return generateStrengthenFoundation(formData.originalText, currentEssayText, formData.model);
          });
        }

        individualEssayResults.push({
          answer: currentEssayText,
          score_dimensions: scoreResult.score_dimensions,
          score: individualScore,
          upgradation: baseCorrectionType === 'gaokao-english-continuation' ? (upgradationResult?.upgradation || null) : null,
          pureUpgradation: baseCorrectionType === 'gaokao-english-continuation' ? (pureUpgradationResult?.pure_upgradation || null) : null,
          strengthenFoundation: baseCorrectionType === 'gaokao-english-continuation' ? (strengthenFoundationResult?.strengthen_foundation || null) : null,
        });
        logger.info(`Finished processing for essay${essayLoggerSuffix}`, { uuid });
      }
      await util.updateByUuid(uuid, { status: "processing" });

      // --------------------------------------------------------------------------
      // STEP 4: Aggregate results and Update record
      // --------------------------------------------------------------------------
      await step.run("update-correction-with-results", async () => {
        logger.info("Step: update-correction-with-results", { uuid });
        const currentCorrection = await util.getByUuid(uuid);
        if (!currentCorrection) throw new Error(`Correction not found for UUID: ${uuid} before final content update`);

        let newContentObject: any = JSON.parse(currentCorrection.content || "{}"); // Start with existing content

        if (formData.isBatch) {
          newContentObject.essays = individualEssayResults;
        } else {
          // For single, merge results into the main content object
          // Ensure 'question' and 'referenceAnswer' are preserved from initial creation
          newContentObject = {
            question: newContentObject.question,
            referenceAnswer: newContentObject.referenceAnswer,
            ...individualEssayResults[0]
          };
        }

        // Add shared interpretation if generated
        if (sharedInterpretation) {
          newContentObject.interpretation = sharedInterpretation;
        }

        const finalScore = formData.isBatch
          ? (essaysToProcess.length > 0 ? Math.round((totalBatchScore / essaysToProcess.length) * 10) / 10 : 0)
          : individualEssayResults[0]?.score || 0;

        await util.updateByUuid(uuid, {
          score: finalScore,
          content: JSON.stringify(newContentObject),
          status: "processing", // Next step is title generation
        });
        logger.info("Correction record updated with all essay results and shared interpretation", { uuid });
      });

      // --------------------------------------------------------------------------
      // STEP 5: Generate Title (if not provided by user, once for all)
      // --------------------------------------------------------------------------
      let currentStatusForNextStep = "generate-title";
      if (!formData.title) { // Only generate if title was not provided
        await step.run("generate-title", async () => {
          logger.info("Step: generate-title (as not provided by user)", { uuid });
          sharedTitle = await generateTitle(formData.originalText); // formData.originalText should be correct
          await util.updateByUuid(uuid, { title: sharedTitle, status: "processing" });
          currentStatusForNextStep = "generate-icon";
          logger.info("Title generated and record updated", { uuid, newTitle: sharedTitle });
        });
      } else {
        // Title was provided, so just update status for the next step
        logger.info("Title was provided by user, skipping generation.", { uuid, existingTitle: formData.title });
        await util.updateByUuid(uuid, { status: "processing" }); // Ensure status moves to next
        currentStatusForNextStep = "generate-icon";
      }

      // --------------------------------------------------------------------------
      // STEP 6: Generate Icon (once for all)
      // --------------------------------------------------------------------------
      await step.run("generate-icon", async () => {
        logger.info("Step: generate-icon", { uuid });
        sharedIcon = await generateIcon(formData.originalText); // formData.originalText

        // Fetch current correction to ensure we have the latest title (either user-provided or generated)
        const correctionToFinalize = await util.getByUuid(uuid);
        if (!correctionToFinalize) throw new Error(`Correction not found for UUID: ${uuid} in generate-icon`);

        await util.updateByUuid(uuid, {
          icon: sharedIcon,
          title: correctionToFinalize.title, // Preserve the title (user's or generated)
          status: "success",
        });
        logger.info("Icon generated and record updated to success", { uuid, icon: sharedIcon });
      });

      logger.info("Correction process completed successfully", { uuid, finalType: finalCorrectionType });
      return {
        success: true,
        message: "批改任务已完成",
        uuid: uuid,
      };
    }
  ),
];

