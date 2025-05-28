// utils/correction-export.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDocx from "remark-docx";
import { saveAs } from "file-saver";
import { findContextSimple, mdBlockquote } from "@/utils/markdownUtils";
import { Correction, CorrectionJson, EssayItem, SCORE_LABELS } from "@/types/correction"; // Import types and constant

// This function now takes a complete "single essay equivalent" JSON
function generateRichMarkdownReport(
    data: CorrectionJson, // This should now be the constructed displayJson
    scoreLabels: { [key: string]: string },
    showOriginalInPure: boolean,
    showAnnotationsInPure: boolean,
    showOriginalInStrengthen: boolean, // Added
    showAnnotationsInStrengthen: boolean, // Added
    overallTitle: string, // Added overallTitle for context in combined reports
    essayIndex?: number // Optional: for multi-essay export titling
): string {
    let md = `# ${overallTitle}${essayIndex !== undefined ? ` - 习作 ${essayIndex + 1}` : ''}\n\n`;
    md += "## 一、原文与我的续写\n\n";

    const {
        question, // Shared
        answer,   // From selected/single essay
        score_dimensions, // From selected/single essay
        interpretation, // Shared
        upgradation,    // From selected/single essay
        pureUpgradation,// From selected/single essay
        strengthenFoundation, // Added
    } = data;
    const studentAnswerText = answer || ""; // Ensure it's defined for context search

    if (question) {
        md += "### 真题回顾\n";
        md += mdBlockquote(question) + "\n\n";
    }
    if (answer) {
        md += "### 我的续写\n";
        md += mdBlockquote(answer) + "\n\n";
    }
    if (!question && !answer) {
        md += "_暂无原文或续写内容。_\n\n";
    }

    md += "## 二、评分维度解析\n\n";
    if (score_dimensions && Object.keys(score_dimensions).length > 0) {
        md += "### 综合得分概览\n";
        Object.keys(score_dimensions).forEach(key => {
            md += `- **${scoreLabels[key] || key}**: ${score_dimensions[key]?.score ?? 'N/A'}分\n`;
        });
        md += "\n";

        md += "### 各维度详细得分\n";
        md += "| 维度 | 得分 | 说明 |\n";
        md += "|---|---|---|\n";
        Object.keys(score_dimensions).forEach(key => {
            md += `| ${scoreLabels[key] || key} | ${score_dimensions[key]?.score ?? 'N/A'} | ${score_dimensions[key]?.explaination || ''} |\n`;
        });
        md += "\n";
    } else {
        md += "_暂无评分维度信息。_\n\n";
    }

    // Interpretation is shared, always use data.interpretation
    if (interpretation) {
        md += "## 三、写作思路与解析\n\n";
        const {
            preface,
            guiding_problems,
            paragraph_analysis,
            writing_framework_construction,
        } = interpretation;

        let hasAnalysisContent = false;
        if (preface?.content) {
            hasAnalysisContent = true;
            md += "### 前言概述\n";
            md += preface.content.split('\n').filter((p: string) => p.trim() !== '').join('\n\n') + "\n\n";
        }
        if (Array.isArray(guiding_problems) && guiding_problems.length > 0) {
            hasAnalysisContent = true;
            md += "### 关键问题导入\n";
            guiding_problems.forEach((item: { question: string }, idx: number) => {
                md += `${idx + 1}. ${item.question}\n`;
            });
            md += "\n";

            md += "### 关键问题解答\n";
            guiding_problems.forEach((item: { question: string; answer?: string }, idx: number) => {
                md += `${idx + 1}. **${item.question}**\n`;
                if (item.answer) {
                    md += item.answer.split('\n').filter((l: string) => l.trim() !== '').map((l: string) => `   ${l}`).join('\n') + '\n';
                }
            });
            md += "\n";
        }
        if (Array.isArray(paragraph_analysis) && paragraph_analysis.length > 0) {
            hasAnalysisContent = true;
            md += "### 原文段落解析\n\n";
            paragraph_analysis.forEach((item: { original_text: string; interpretation: string }, idx: number) => {
                md += `**原文片段 ${idx + 1}:**\n`;
                md += mdBlockquote(item.original_text) + "\n";
                md += `**解析:**\n${item.interpretation}\n\n`;
                if (idx < paragraph_analysis.length - 1) md += "---\n\n";
            });
        }
        if (writing_framework_construction?.sections?.length > 0) {
            hasAnalysisContent = true;
            md += "### 续写框架构建\n";
            writing_framework_construction.sections.forEach((section: { title?: string, points: string[] }, idx: number) => {
                md += `${idx + 1}. **${section.title || '章节 ' + (idx + 1)}**\n`;
                if (Array.isArray(section.points) && section.points.length > 0) {
                    section.points.forEach((point: string) => {
                        md += `    - ${point}\n`;
                    });
                }
            });
            md += "\n";
        }
        if (!hasAnalysisContent) {
            md += "_暂无写作解析信息。_\n\n";
        }

        md += "## 四、话题相关语料积累\n\n";
        const { vocabulary_and_phrases_for_continuation } = interpretation;
        if (vocabulary_and_phrases_for_continuation?.topics?.length > 0) {
            vocabulary_and_phrases_for_continuation.topics.forEach((topic: any, topicIdx: number) => {
                md += `### ${topic.topic_name}\n\n`;
                if (Array.isArray(topic.vocabulary) && topic.vocabulary.length > 0) {
                    md += "#### 核心词汇\n";
                    topic.vocabulary.forEach((v: any) => {
                        md += `- **${v.word}**`;
                        if (v.chinese_meaning) md += ` (${v.chinese_meaning})`;
                        md += "\n";
                        if (v.explaination) md += `  - 解释: ${v.explaination}\n`;
                        if (v.example_sentence) md += `  - 例句: *${v.example_sentence}*\n`;
                    });
                    md += "\n";
                }
                if (Array.isArray(topic.phrases) && topic.phrases.length > 0) {
                    md += "#### 常用短语\n";
                    topic.phrases.forEach((p: any) => {
                        const phraseText = typeof p === 'object' ? p.phrase : String(p);
                        md += `- **${phraseText}**`;
                        if (typeof p === 'object' && p.chinese_meaning) md += ` (${p.chinese_meaning})`;
                        md += "\n";
                        if (typeof p === 'object' && p.explaination) md += `  - 解释: ${p.explaination}\n`;
                        if (typeof p === 'object' && p.example_sentence) md += `  - 例句: *${p.example_sentence}*\n`;
                    });
                    md += "\n";
                }
                if (Array.isArray(topic.useful_sentences) && topic.useful_sentences.length > 0) {
                    md += "#### 实用句型\n";
                    topic.useful_sentences.forEach((s: any) => {
                        md += `- ${s}\n`;
                    });
                    md += "\n";
                }
                if (topicIdx < vocabulary_and_phrases_for_continuation.topics.length - 1) md += "---\n\n";
            });
        } else {
            md += "_暂无话题语料信息。_\n\n";
        }
    } else {
        md += "## 三、写作思路与解析\n\n_暂无写作解析信息。_\n\n";
        md += "## 四、话题相关语料积累\n\n_暂无话题语料信息。_\n\n";
    }

    // Strengthen Foundation
    md += "## 五、夯实基础\n\n";
     if (Array.isArray(strengthenFoundation) && strengthenFoundation.length > 0) {
        strengthenFoundation.forEach((item, idx) => {
            md += `- 原句: \`${item.sentence}\`\n`;
            md += `  纠错: **${item.correction}**\n`;
            if (showAnnotationsInStrengthen && item.comment) md += `  - 批注: ${item.comment}\n`; // Check option and comment existence
            if (showOriginalInStrengthen) { // Option to show context in export
                 // Pass studentAnswerText (string) to findContextSimple
                 const context = findContextSimple(studentAnswerText, item.sentence);
                 if (context) md += `  - 原文参考: ...${context.prefix}${context.match}${context.suffix}...\n`;
            }
        });
        md += "\n";
    } else {
        md += "_暂无基础纠正内容。_\n\n";
    }


    // Upgradation and PureUpgradation are from selected/single essay
    md += "## 六、表达方式升级建议\n\n";
    const {
        vocabulary_upgradation,
        phrase_upgradation,
        sentence_upgradation,
        detail_description_upgradation,
    } = upgradation || {};

    // Ensure studentAnswerText is passed as string
    const renderUpgradationItemContext = (originalText: string, searchTerm: string) => {
        const context = findContextSimple(originalText, searchTerm);
        if (context) {
            return `  - 原文参考: ...${context.prefix}**${context.match}**${context.suffix}...\n`;
        }
        return "";
    };

    let hasUpgradeSuggestions = false;

    if (Array.isArray(vocabulary_upgradation) && vocabulary_upgradation.length > 0) {
        hasUpgradeSuggestions = true;
        md += "### 词汇升级\n";
        vocabulary_upgradation.forEach(item => {
            md += `- \`${item.original_word}\` → **${item.upgraded_word}**\n`;
            if (item.english_explanation || item.chinese_meaning) {
                md += `  - 解释: ${item.english_explanation || ''}${item.chinese_meaning ? ` (${item.chinese_meaning})` : ''}\n`;
            }
            if (item.example_sentence) md += `  - 例句: *${item.example_sentence}*\n`;
            md += renderUpgradationItemContext(studentAnswerText, item.original_word);
        });
        md += "\n";
    }
    if (Array.isArray(phrase_upgradation) && phrase_upgradation.length > 0) {
        hasUpgradeSuggestions = true;
        md += "### 短语升级\n";
        phrase_upgradation.forEach(item => {
            md += `- \`${item.original_phrase}\` → **${item.upgraded_phrase}**\n`;
            if (item.english_explanation || item.chinese_meaning) {
                md += `  - 解释: ${item.english_explanation || ''}${item.chinese_meaning ? ` (${item.chinese_meaning})` : ''}\n`;
            }
            if (item.example_sentence) md += `  - 例句: *${item.example_sentence}*\n`;
            md += renderUpgradationItemContext(studentAnswerText, item.original_phrase);
        });
        md += "\n";
    }
    if (Array.isArray(sentence_upgradation) && sentence_upgradation.length > 0) {
        hasUpgradeSuggestions = true;
        md += "### 句型升级\n";
        sentence_upgradation.forEach(item => {
            md += `- 原句: \`${item.original_sentence}\`\n`;
            md += `  升格: **${item.upgraded_sentence}**\n`;
            if (item.explanation) md += `  - 解释: ${item.explanation}\n`;
            md += renderUpgradationItemContext(studentAnswerText, item.original_sentence);
        });
        md += "\n";
    }
    if (Array.isArray(detail_description_upgradation) && detail_description_upgradation.length > 0) {
        hasUpgradeSuggestions = true;
        md += "### 细节描写升级\n";
        detail_description_upgradation.forEach(item => {
            md += `- 原描写: \`${item.original_description}\`\n`;
            md += `  升格: **${item.upgraded_description}**\n`;
            if (item.explanation) md += `  - 解释: ${item.explanation}\n`;
            md += renderUpgradationItemContext(studentAnswerText, item.original_description);
        });
        md += "\n";
    }
    if (!hasUpgradeSuggestions) {
        md += "_暂无续写升级建议。_\n\n";
    }

    md += "## 七、升格文纯享版\n\n"; // Renumbered section
    if (Array.isArray(pureUpgradation) && pureUpgradation.length > 0) {
        let pureTextContent = "";
        // Fix: Specify the correct type for the item in forEach callback
        pureUpgradation.forEach((item: { sentence: string; upgradation: string; comment?: string; }) => {
            if (showOriginalInPure && item.sentence) {
                pureTextContent += `(${item.sentence}) `;
            }
            pureTextContent += `**${item.upgradation}**`;
            if (showAnnotationsInPure && item.comment) { // Check if item.comment exists
                pureTextContent += ` _[批注: ${item.comment}]_`;
            }
            pureTextContent += " ";
        });
        md += pureTextContent.trim() + "\n\n";
    } else {
        md += "_暂无升格文内容。_\n\n";
    }

    return md;
}

interface ExportCorrectionReportParams {
    correction: Correction;
    parsedFullJsonContent: CorrectionJson;
    exportFormat: string;
    exportAllEssays: boolean;
    selectedEssayIndex: number;
    showOriginalInPureUpgrade: boolean;
    showAnnotationsInPureUpgrade: boolean;
    showOriginalInStrengthen: boolean; // Added
    showAnnotationsInStrengthen: boolean; // Added
    setLoadingExport: (loading: boolean) => void;
    setOpenExportDialog: (open: boolean) => void;
}

export async function exportCorrectionReport({
    correction,
    parsedFullJsonContent,
    exportFormat,
    exportAllEssays,
    selectedEssayIndex,
    showOriginalInPureUpgrade,
    showAnnotationsInPureUpgrade,
    showOriginalInStrengthen, // Added
    showAnnotationsInStrengthen, // Added
    setLoadingExport,
    setOpenExportDialog,
}: ExportCorrectionReportParams) {
    setLoadingExport(true);

    try {
        if (correction.type?.endsWith("-batch") && exportAllEssays) {
            // Export all essays as separate files
            for (let i = 0; i < (parsedFullJsonContent.essays?.length || 0); i++) {
                const essayItem = parsedFullJsonContent.essays![i];
                const markdownContentToExport = generateRichMarkdownReport(
                    { // Construct the JSON structure for this specific essay
                        question: parsedFullJsonContent.question,
                        referenceAnswer: parsedFullJsonContent.referenceAnswer,
                        interpretation: parsedFullJsonContent.interpretation,
                        ...essayItem, // Spread the specific essay's details
                    },
                    SCORE_LABELS,
                    showOriginalInPureUpgrade,
                    showAnnotationsInPureUpgrade,
                    showOriginalInStrengthen, // Pass option
                    showAnnotationsInStrengthen, // Pass option
                    correction.title, // Overall title
                    i // Pass essay index for multi-file export naming
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
                     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error // remark-docx types might be outdated or incomplete
                    const doc = await unified().use(remarkParse).use(remarkDocx, { output: "blob" }).process(markdownContentToExport);
                    saveAs(await doc.result as Blob, `${fileNameBase}.docx`);
                }
                 // Add a small delay if generating many PDFs to avoid rate limiting the service
                if (exportFormat === "pdf" && (parsedFullJsonContent.essays?.length || 0) > 1) await new Promise(resolve => setTimeout(resolve, 500));
            }
             if ((parsedFullJsonContent.essays?.length || 0) > 0) {
                alert(`已成功请求导出 ${parsedFullJsonContent.essays?.length} 篇习作。`);
            }

        } else {
            // Export single file (either non-batch, or selected essay in batch if exportAllEssays is false)
             const markdownContentToExport = generateRichMarkdownReport(
                correction.type?.endsWith("-batch") && parsedFullJsonContent.essays
                    ? { // Construct the JSON structure for the selected essay
                        question: parsedFullJsonContent.question,
                        referenceAnswer: parsedFullJsonContent.referenceAnswer,
                        interpretation: parsedFullJsonContent.interpretation,
                        ...parsedFullJsonContent.essays[selectedEssayIndex], // Spread the specific essay's details
                      }
                    : parsedFullJsonContent, // Use full JSON for non-batch
                SCORE_LABELS,
                showOriginalInPureUpgrade,
                showAnnotationsInPureUpgrade,
                showOriginalInStrengthen, // Pass option
                showAnnotationsInStrengthen, // Pass option
                correction.title, // Overall title
                correction.type?.endsWith("-batch") ? selectedEssayIndex : undefined // Pass index for batch single export
            );

            const fileNameBase = correction.title.replace(/\s+/g, "_") +
                                 (correction.type?.endsWith("-batch") && !exportAllEssays ? `_习作_${selectedEssayIndex + 1}` : '_批改记录');


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
                 // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error // remark-docx types might be outdated or incomplete
                const doc = await unified().use(remarkParse).use(remarkDocx, { output: "blob" }).process(markdownContentToExport);
                saveAs(await doc.result as Blob, `${fileNameBase}.docx`);
            }
        }
        setOpenExportDialog(false);
    } catch (error) {
        console.error("导出错误:", error);
        alert(`导出失败: ${error instanceof Error ? error.message : "未知错误"}. 请重试或选择其他格式.`);
    } finally {
        setLoadingExport(false);
    }
}
