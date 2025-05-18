/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { inngest } from "@/lib/inngest";
import { CorrectionUtil } from "@/utils/corrections";
import { generateInterpretation, generatePureUpgradation, generateScore, generateUpgradation } from "@/utils/generate-continuation";
import { generateTitle, generateIcon } from "@/utils/generate-metadata";

function calculateScore(score_dimensions: any) {
  // 计算总分
  const totalScore = Object.values(score_dimensions).reduce((sum: number, dimension: any) => sum + dimension.score, 0);
  // 转换为 25 分制，保留一位小数
  return Math.round(totalScore * 25 / 100 * 10) / 10;
}

// 定义作文批改函数
export const correctionFunctions = [
  inngest.createFunction(
    { id: "correction.create" },
    { event: "correction/create" },
    async ({ event, step }) => {
      const formData = event.data;
      const util = new CorrectionUtil();

      // 使用辅助函数生成唯一 UUID
      const uuid = formData.uuid;
      console.log(formData);

      // 步骤1：创建初始批改记录
      const initialCorrection = await step.run("create-initial-correction", async () => {
        const correctionData = {
          uuid,
          title: formData.title || "",
          icon: "",
          model: formData.model,
          content: JSON.stringify({ question: formData.originalText, answer: formData.essayText }),
          score: 0,
          user_email: formData.user_email,
          public: false,
          type: 'gaokao-english-continuation',
          status: 'generate-score'
        };

        const result = await util.create(correctionData);
        return result;
      });

      // 步骤2：生成分数和内容
      const scoreResult = await step.run("generate-score", async () => {
        const result = await generateScore(
          formData.originalText,
          formData.essayText,
          formData.tone,
          formData.model
        );

        // 更新批改记录
        const currentCorrection = await util.getByUuid(uuid);
        const contentObj = JSON.parse(currentCorrection.content || '{}');
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          score: calculateScore(result.score_dimensions),
          content: JSON.stringify({
            ...contentObj,
            score_dimensions: result.score_dimensions
          }),
          status: 'generate-interpretation'
        });

        return result;
      });

      // 步骤3：生成作文题解读
      const interpretaionResult = await step.run("generate-interpretation", async () => {
        const result = await generateInterpretation(
          formData.originalText,
          formData.tone,
          formData.model
        );

        // 更新批改记录
        const currentCorrection = await util.getByUuid(uuid);
        const contentObj = JSON.parse(currentCorrection.content || '{}');
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          content: JSON.stringify({
            ...contentObj,
            interpretation: result?.interpretation || null
          }),
          status: 'generate-upgradation'
        });

        return result;
      });

      // 步骤4：生成升格建议
      const upgradationResult = await step.run("generate-upgradation", async () => {
        const result = await generateUpgradation(
          formData.originalText,
          formData.essayText,
          formData.tone,
          formData.model
        );

        // 更新批改记录
        const currentCorrection = await util.getByUuid(uuid);
        const contentObj = JSON.parse(currentCorrection.content || '{}');
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          content: JSON.stringify({
            ...contentObj,
            upgradation: result?.upgradation || null
          }),
          status: 'generate-pure-upgradation'
        });

        return result;
      });

      // 步骤5：生成升格文纯享版
      const pureUpgradationResult = await step.run("generate-pure-upgradation", async () => {
        const result = await generatePureUpgradation(
          formData.originalText,
          formData.essayText,
          formData.model
        );

        // 更新批改记录
        const currentCorrection = await util.getByUuid(uuid);
        const contentObj = JSON.parse(currentCorrection.content || '{}');
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          content: JSON.stringify({
            ...contentObj,
            pureUpgradation: result?.pure_upgradation || null
          }),
          status: 'generate-title'
        });

        return result;
      });

      // 步骤6：生成标题（如果没有提供）
      if (!formData.title) {
        await step.run("generate-title", async () => {
          const title = await generateTitle(formData.originalText);

          // 更新批改记录
          const currentCorrection = await util.getByUuid(uuid);
          await util.updateByUuid(uuid, {
            ...currentCorrection,
            title,
            status: 'generate-icon'
          });

          return title;
        });
      }

      // 步骤7：生成图标
      await step.run("generate-icon", async () => {
        const icon = await generateIcon(formData.originalText);

        // 更新批改记录
        const currentCorrection = await util.getByUuid(uuid);
        await util.updateByUuid(uuid, {
          ...currentCorrection,
          icon,
          status: 'success' // 所有步骤完成后更新状态为成功
        });

        return icon;
      });

      // 返回最终结果
      return {
        success: true,
        message: "批改任务已完成",
        uuid: uuid
      };
    }
  )
]; 