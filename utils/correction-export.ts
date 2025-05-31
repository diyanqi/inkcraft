// utils/correction-export.ts

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDocx from "remark-docx";
import { saveAs } from "file-saver";
import { Correction, CorrectionJson, SCORE_LABELS } from "@/types/correction";
import { generateRichMarkdownReport } from "./markdown-report-generator"; // Import the generator
import { toast } from "sonner";

interface ExportCorrectionReportParams {
    correction: Correction;
    parsedFullJsonContent: CorrectionJson;
    exportFormat: string;
    exportAllEssays: boolean;
    combineFiles: boolean;
    selectedEssayIndex: number;
    showOriginalInPureUpgrade: boolean;
    showAnnotationsInPureUpgrade: boolean;
    showOriginalInStrengthen: boolean;
    showAnnotationsInStrengthen: boolean;
    setLoadingExport: (loading: boolean) => void;
    setOpenExportDialog: (open: boolean) => void;
    toast: typeof toast;
}

export async function exportCorrectionReport({
    correction,
    parsedFullJsonContent,
    exportFormat,
    exportAllEssays,
    combineFiles,
    selectedEssayIndex,
    showOriginalInPureUpgrade,
    showAnnotationsInPureUpgrade,
    showOriginalInStrengthen,
    showAnnotationsInStrengthen,
    setLoadingExport,
    setOpenExportDialog,
    toast,
}: ExportCorrectionReportParams) {
    setLoadingExport(true);

    try {
        const essays = parsedFullJsonContent.essays || [];

        if (correction.type?.endsWith("-batch") && exportAllEssays) {
            if (combineFiles) {
                let combinedMarkdownContent = "";
                if (essays.length > 0) {
                    for (let i = 0; i < essays.length; i++) {
                        const essayItem = essays[i];
                        const essayMarkdown = generateRichMarkdownReport(
                            {
                                question: parsedFullJsonContent.question,
                                referenceAnswer: parsedFullJsonContent.referenceAnswer,
                                interpretation: parsedFullJsonContent.interpretation,
                                ...essayItem,
                            },
                            SCORE_LABELS,
                            showOriginalInPureUpgrade,
                            showAnnotationsInPureUpgrade,
                            showOriginalInStrengthen,
                            showAnnotationsInStrengthen,
                            correction.title,
                            i
                        );
                        combinedMarkdownContent += essayMarkdown;
                        if (i < essays.length - 1) {
                            combinedMarkdownContent += "\n\n---\n\n";
                        }
                    }
                } else {
                    combinedMarkdownContent = "_没有可导出的习作内容。_";
                }

                const fileNameBase = `${correction.title.replace(/\s+/g, "_")}_全部整合报告`;

                if (exportFormat === "md") {
                    const blob = new Blob([combinedMarkdownContent], { type: "text/markdown;charset=utf-8" });
                    saveAs(blob, `${fileNameBase}.md`);
                } else if (exportFormat === "pdf") {
                    const response = await fetch("https://loose-randi-amzcd-498668ee.koyeb.app", {
                        method: "POST", body: new URLSearchParams({ markdown: combinedMarkdownContent }), headers: {"Content-Type": "application/x-www-form-urlencoded"}
                    });
                    if (!response.ok) throw new Error(`PDF生成失败 (整合报告): ${response.statusText}`);
                    saveAs(await response.blob(), `${fileNameBase}.pdf`);
                } else if (exportFormat === "docx") {
                    // @ts-expect-error: remark-docx output type is not correctly inferred
                    const doc = await unified().use(remarkParse).use(remarkDocx, { output: "blob" }).process(combinedMarkdownContent);
                    saveAs(await doc.result as Blob, `${fileNameBase}.docx`);
                }

                if (essays.length > 0) {
                    toast("导出成功", {
                        description: `已成功请求导出整合报告，包含 ${essays.length} 篇习作。`,
                    });
                } else {
                    toast("导出提示", {
                        description: `没有习作内容可导出。`,
                    });
                }

            } else {
                if (essays.length > 0) {
                    for (let i = 0; i < essays.length; i++) {
                        const essayItem = essays[i];
                        const markdownContentToExport = generateRichMarkdownReport(
                            {
                                question: parsedFullJsonContent.question,
                                referenceAnswer: parsedFullJsonContent.referenceAnswer,
                                interpretation: parsedFullJsonContent.interpretation,
                                ...essayItem,
                            },
                            SCORE_LABELS,
                            showOriginalInPureUpgrade,
                            showAnnotationsInPureUpgrade,
                            showOriginalInStrengthen,
                            showAnnotationsInStrengthen,
                            correction.title,
                            i
                        );
                        const fileNameBase = `${correction.title.replace(/\s+/g, "_")}_习作_${i + 1}`;

                        if (exportFormat === "md") {
                            const blob = new Blob([markdownContentToExport], { type: "text/markdown;charset=utf-8" });
                            saveAs(blob, `${fileNameBase}.md`);
                        } else if (exportFormat === "pdf") {
                            const response = await fetch("https://loose-randi-amzcd-498668ee.koyeb.app", {
                                method: "POST", body: new URLSearchParams({ markdown: markdownContentToExport }), headers: {"Content-Type": "application/x-www-form-urlencoded"}
                            });
                            if (!response.ok) throw new Error(`PDF生成失败 (习作 ${i+1}): ${response.statusText}`);
                            saveAs(await response.blob(), `${fileNameBase}.pdf`);
                        } else if (exportFormat === "docx") {
                            // @ts-expect-error: remark-docx output type is not correctly inferred
                            const doc = await unified().use(remarkParse).use(remarkDocx, { output: "blob" }).process(markdownContentToExport);
                            saveAs(await doc.result as Blob, `${fileNameBase}.docx`);
                        }
                        if (exportFormat === "pdf" && essays.length > 1) await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    toast("导出成功", {
                        description: `已成功请求导出 ${essays.length} 篇习作。`,
                    });
                } else {
                     toast("导出提示", {
                        description: `没有习作内容可导出。`,
                    });
                }
            }
        } else {
            const currentEssayData = (correction.type?.endsWith("-batch") && essays.length > selectedEssayIndex && selectedEssayIndex >= 0)
                ? {
                    question: parsedFullJsonContent.question,
                    referenceAnswer: parsedFullJsonContent.referenceAnswer,
                    interpretation: parsedFullJsonContent.interpretation,
                    ...essays[selectedEssayIndex],
                  }
                : parsedFullJsonContent;

            const essayIndexForTitle = (correction.type?.endsWith("-batch") && !exportAllEssays && essays.length > selectedEssayIndex && selectedEssayIndex >= 0)
                ? selectedEssayIndex
                : undefined;

            const markdownContentToExport = generateRichMarkdownReport(
                currentEssayData,
                SCORE_LABELS,
                showOriginalInPureUpgrade,
                showAnnotationsInPureUpgrade,
                showOriginalInStrengthen,
                showAnnotationsInStrengthen,
                correction.title,
                essayIndexForTitle
            );

            const fileNameBase = correction.title.replace(/\s+/g, "_") +
                                 (essayIndexForTitle !== undefined ? `_习作_${selectedEssayIndex + 1}` : '_批改记录');

            if (exportFormat === "md") {
                const blob = new Blob([markdownContentToExport], { type: "text/markdown;charset=utf-8" });
                saveAs(blob, `${fileNameBase}.md`);
            } else if (exportFormat === "pdf") {
                 const response = await fetch("https://loose-randi-amzcd-498668ee.koyeb.app", {
                    method: "POST", body: new URLSearchParams({ markdown: markdownContentToExport }), headers: {"Content-Type": "application/x-www-form-urlencoded"}
                });
                if (!response.ok) throw new Error(`PDF生成失败: ${response.statusText}`);
                saveAs(await response.blob(), `${fileNameBase}.pdf`);
            } else if (exportFormat === "docx") {
                // @ts-expect-error: remark-docx output type is not correctly inferred
                const doc = await unified().use(remarkParse).use(remarkDocx, { output: "blob" }).process(markdownContentToExport);
                saveAs(await doc.result as Blob, `${fileNameBase}.docx`);
            }
            toast("导出成功", {
                description: `已成功请求导出报告: ${fileNameBase}.${exportFormat}`,
            });
        }
        setOpenExportDialog(false);
    } catch (error) {
        console.error("导出错误:", error);
        toast.error("导出失败", {
            description: `导出失败: ${error instanceof Error ? error.message : "未知错误"}. 请重试或选择其他格式.`,
        });
    } finally {
        setLoadingExport(false);
    }
}