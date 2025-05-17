import { inngest } from "@/lib/inngest";
import { CorrectionUtil } from "@/utils/corrections";
import { generateInterpretation, generatePureUpgradation, generateScore, generateUpgradation } from "@/utils/generate-continuation";
import { generateTitle, generateIcon } from "@/utils/generate-metadata";
import { v4 as uuidv4 } from 'uuid';

// 生成唯一 UUID 的辅助函数
async function generateUniqueUuid(util: CorrectionUtil, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const uuid = uuidv4();
    try {
      // 尝试查找是否存在相同 UUID
      const existing = await util.getByUuid(uuid);
      if (!existing) {
        return uuid;
      }
    } catch (error) {
      // 如果记录不存在，说明 UUID 可用
      return uuid;
    }
  }
  throw new Error('无法生成唯一 UUID，请重试');
}

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
      const uuid = await step.run("generate-unique-uuid", async () => {
        return await generateUniqueUuid(util);
      });

      // 步骤1：创建初始批改记录
      const initialCorrection = await step.run("create-initial-correction", async () => {
        const correctionData = {
          uuid,
          title: formData.title || "",
          icon: "",
          model: formData.model,
          content: JSON.stringify({question: formData.originalText, answer: formData.essayText}),
          score: 0,
          user_email: formData.user_email,
          public: false,
          type: 'gaokao-english-continuation',
          status: 'processing'
        };
        
        try {
          const result = await util.create(correctionData);
          return result;
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // PostgreSQL 唯一约束违反错误码
            const newUuid = await generateUniqueUuid(util);
            const newCorrectionData = { ...correctionData, uuid: newUuid };
            const result = await util.create(newCorrectionData);
            return result;
          }
          throw error;
        }
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
          })
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
          })
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
          })
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
          })
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
            title
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