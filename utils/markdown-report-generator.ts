// utils/markdown-report-generator.ts

import { findContextSimple, mdBlockquote } from "@/utils/markdown-utils";
import { CorrectionJson } from "@/types/correction";

// This function now takes a complete "single essay equivalent" JSON
export function generateRichMarkdownReport(
    data: CorrectionJson,
    scoreLabels: { [key: string]: string },
    showOriginalInPure: boolean,
    showAnnotationsInPure: boolean,
    showOriginalInStrengthen: boolean,
    showAnnotationsInStrengthen: boolean,
    overallTitle: string,
    essayIndex?: number
): string {
    let md = `# ${overallTitle}${essayIndex !== undefined ? ` - 习作 ${essayIndex + 1}` : ''}\n\n`;
    md += "## 一、原文与我的续写\n\n";

    const {
        question,
        answer,
        score_dimensions,
        interpretation,
        upgradation,
        pureUpgradation,
        strengthenFoundation,
    } = data;
    const studentAnswerText = answer || "";

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

    md += "## 五、夯实基础\n\n";
     if (Array.isArray(strengthenFoundation) && strengthenFoundation.length > 0) {
        strengthenFoundation.forEach((item, idx) => {
            md += `- 原句: \`${item.sentence}\`\n`;
            md += `  纠错: **${item.correction}**\n`;
            if (showAnnotationsInStrengthen && item.comment) md += `  - 批注: ${item.comment}\n`;
            if (showOriginalInStrengthen) {
                 const context = findContextSimple(studentAnswerText, item.sentence);
                 if (context) md += `  - 原文参考: ...${context.prefix}${context.match}${context.suffix}...\n`;
            }
        });
        md += "\n";
    } else {
        md += "_暂无基础纠正内容。_\n\n";
    }

    md += "## 六、表达方式升级建议\n\n";
    const {
        vocabulary_upgradation,
        phrase_upgradation,
        sentence_upgradation,
        detail_description_upgradation,
    } = upgradation || {};

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

    md += "## 七、升格文纯享版\n\n";
    if (Array.isArray(pureUpgradation) && pureUpgradation.length > 0) {
        let pureTextContent = "";
        pureUpgradation.forEach((item: { sentence: string; upgradation: string; comment?: string; }) => {
            if (showOriginalInPure && item.sentence) {
                pureTextContent += `(${item.sentence}) `;
            }
            pureTextContent += `**${item.upgradation}**`;
            if (showAnnotationsInPure && item.comment) {
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