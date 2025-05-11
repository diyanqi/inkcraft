import { inngest } from "@/lib/inngest";
import { CorrectionUtil } from "@/utils/corrections";
import { generatePureUpgradation, generateScore, generateUpgradation } from "@/utils/generate-continuation";
import { generateTitle, generateIcon } from "@/utils/generate-metadata";

// 定义作文批改函数
export const correctionFunctions = [
  inngest.createFunction(
    { id: "correction.create" },
    { event: "correction/create" },
    async ({ event, step }) => {
      const formData = event.data;
      const util = new CorrectionUtil();

      // 步骤1：创建初始批改记录
      const initialCorrection = await step.run("create-initial-correction", async () => {
        const correctionData = {
          title: formData.title || "",
          icon: "",
          model: formData.model,
          content: "",
          score: 0,
          user_email: formData.user_email,
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
        const currentCorrection = await util.getById(initialCorrection.id);
        await util.update(initialCorrection.id, {
          ...currentCorrection,
          score: result.score,
          content: result.content
        });

        return result;
      });

      // 步骤3：生成升格建议
      const upgradationResult = await step.run("generate-upgradation", async () => {
        const result = await generateUpgradation(
          formData.originalText,
          formData.essayText,
          formData.tone,
          formData.model
        );

        // 更新批改记录
        const currentCorrection = await util.getById(initialCorrection.id);
        await util.update(initialCorrection.id, {
          ...currentCorrection,
          content: currentCorrection.content + '\n\n' + (result?.markdownContent || "")
        });

        return result;
      });

      // 步骤4：生成纯享版
      const pureUpgradationResult = await step.run("generate-pure-upgradation", async () => {
        const result = await generatePureUpgradation(
          formData.originalText,
          formData.essayText,
          formData.tone,
          formData.model
        );

        // 更新批改记录
        const currentCorrection = await util.getById(initialCorrection.id);
        await util.update(initialCorrection.id, {
          ...currentCorrection,
          content: currentCorrection.content + '\n\n' + (result?.markdownContent || "")
        });

        return result;
      });

      // 步骤5：生成标题（如果没有提供）
      if (!formData.title) {
        await step.run("generate-title", async () => {
          const title = await generateTitle(formData.originalText);
          
          // 更新批改记录
          const currentCorrection = await util.getById(initialCorrection.id);
          await util.update(initialCorrection.id, {
            ...currentCorrection,
            title
          });

          return title;
        });
      }

      // 步骤6：生成图标
      await step.run("generate-icon", async () => {
        const icon = await generateIcon(formData.originalText);
        
        // 更新批改记录
        const currentCorrection = await util.getById(initialCorrection.id);
        await util.update(initialCorrection.id, {
          ...currentCorrection,
          icon
        });

        return icon;
      });

      // 返回最终结果
      return {
        success: true,
        message: "批改任务已完成",
        id: initialCorrection.id
      };
    }
  )
]; 