// utils/slidev-presentation-generator.ts

import { mdBlockquote } from "@/utils/markdown-utils";
import { CorrectionJson } from "@/types/correction";

// Generates Slidev presentation content for public/common parts
export function generateSlidevPresentation(
    data: CorrectionJson, // Contains question and interpretation
    overallTitle: string
): string {
    let slidevContent = `---
layout: cover
#theme: seriph
#class: 'text-center'
# Apply a theme or custom styles if needed. See https://sli.dev/themes/use.html
# For example, to try a different theme:
# theme: apple-basic
# Or install a community theme:
# npm i slidev-theme-dracula
# theme: dracula
---

# ${overallTitle}
## 通用教学演示

`;

    const {
        question,
        interpretation,
    } = data;

    // Slide: 真题回顾 (Question)
    if (question) {
        slidevContent += `---
layout: default
---

# 真题回顾

${mdBlockquote(question)}

`;
    }

    // Section: 写作思路与解析 (Interpretation)
    if (interpretation) {
        slidevContent += `---
layout: section
---

# 写作思路与解析

`;
        const {
            preface,
            guiding_problems,
            paragraph_analysis,
            writing_framework_construction,
            vocabulary_and_phrases_for_continuation,
        } = interpretation;

        // Slide: 前言概述 (Preface)
        if (preface?.content) {
            slidevContent += `---
layout: default
---
## 前言概述

${mdBlockquote(preface.content.split('\n').filter((p: string) => p.trim() !== '').map((p: any) => `> ${p}`).join('\n\n'))}

`;
        }

        // Slides: 关键问题导入 (Guiding Problems - Questions)
        if (Array.isArray(guiding_problems) && guiding_problems.length > 0) {
            slidevContent += `---
layout: default
---
## 关键问题导入

<v-clicks>

`;
            guiding_problems.forEach((item: { question: string }) => {
                slidevContent += `- ${item.question}\n`;
            });
            slidevContent += `</v-clicks>\n\n`;

            // Slides: 关键问题解答 (Guiding Problems - Answers, one Q&A per slide for answers)
            guiding_problems.forEach((item: { question: string; answer?: string }) => {
                slidevContent += `---
layout: default
---
### 问题: ${item.question}

**解答:**
`;
                if (item.answer) {
                    const answerLines = item.answer.split('\n').filter((l: string) => l.trim() !== '');
                    if (answerLines.length > 0) {
                        slidevContent += "\n<v-clicks>\n\n"; // Reveal answer points one by one
                        answerLines.forEach(line => {
                            slidevContent += `- ${line}\n`;
                        });
                        slidevContent += "\n</v-clicks>\n";
                    } else {
                        slidevContent += "\n_暂无详细解答。_\n";
                    }
                } else {
                    slidevContent += "\n_暂无解答。_\n";
                }
                slidevContent += "\n";
            });
        }


        // Slides: 原文段落解析 (Paragraph Analysis)
        if (Array.isArray(paragraph_analysis) && paragraph_analysis.length > 0) {
            slidevContent += `---
layout: section
---

# 原文段落解析
## (针对共同阅读的原始文本)

`;
            paragraph_analysis.forEach((item: { original_text: string; interpretation: string }, idx: number) => {
                slidevContent += `---
layout: default
---
### 原文片段 ${idx + 1}

${mdBlockquote(item.original_text)}

**解析:**
<v-clicks depth="1">

`;
                const interpretationPoints = item.interpretation.split('\n').filter(p => p.trim() !== '');
                interpretationPoints.forEach(point => {
                    slidevContent += `- ${point}\n`;
                });
                slidevContent += `</v-clicks>\n\n`;
            });
        }

        // Slide: 续写框架构建 (Writing Framework Construction)
        if (writing_framework_construction?.sections?.length > 0) {
            slidevContent += `---
layout: default
---
## 续写框架构建

<v-clicks depth="2">

`;
            writing_framework_construction.sections.forEach((section: { title?: string, points: string[] }) => {
                slidevContent += `### ${section.title || '章节'}\n`;
                if (Array.isArray(section.points) && section.points.length > 0) {
                    section.points.forEach((point: string) => {
                        slidevContent += `  - ${point}\n`;
                    });
                }
                slidevContent += "\n";
            });
            slidevContent += `</v-clicks>\n\n`;
        }


        // Section: 话题相关语料积累 (Vocabulary and Phrases)
        if (vocabulary_and_phrases_for_continuation?.topics?.length > 0) {
            slidevContent += `---
layout: section
---

# 话题相关语料积累

`;
            vocabulary_and_phrases_for_continuation.topics.forEach((topic: any) => {
                slidevContent += `---
layout: default
---
## 话题: ${topic.topic_name}

`;
                let topicContentAdded = false;
                if (Array.isArray(topic.vocabulary) && topic.vocabulary.length > 0) {
                    topicContentAdded = true;
                    slidevContent += "### 核心词汇\n<v-clicks>\n\n";
                    topic.vocabulary.forEach((v: any) => {
                        slidevContent += `- **${v.word}**`;
                        if (v.chinese_meaning) slidevContent += ` <span class="opacity-75">(${v.chinese_meaning})</span>`;
                        slidevContent += "\n";
                        if (v.explaination) slidevContent += `  - <span class="text-sm opacity-70">解释: ${v.explaination}</span>\n`;
                        if (v.example_sentence) slidevContent += `  - <span class="text-sm opacity-70">例句: *${v.example_sentence}*</span>\n`;
                    });
                    slidevContent += "</v-clicks>\n\n";
                }
                if (Array.isArray(topic.phrases) && topic.phrases.length > 0) {
                    topicContentAdded = true;
                    slidevContent += "### 常用短语\n<v-clicks>\n\n";
                    topic.phrases.forEach((p: any) => {
                        const phraseText = typeof p === 'object' ? p.phrase : String(p);
                        slidevContent += `- **${phraseText}**`;
                        if (typeof p === 'object' && p.chinese_meaning) slidevContent += ` <span class="opacity-75">(${p.chinese_meaning})</span>`;
                        slidevContent += "\n";
                        if (typeof p === 'object' && p.explaination) slidevContent += `  - <span class="text-sm opacity-70">解释: ${p.explaination}</span>\n`;
                        if (typeof p === 'object' && p.example_sentence) slidevContent += `  - <span class="text-sm opacity-70">例句: *${p.example_sentence}*</span>\n`;
                    });
                    slidevContent += "</v-clicks>\n\n";
                }
                if (Array.isArray(topic.useful_sentences) && topic.useful_sentences.length > 0) {
                    topicContentAdded = true;
                    slidevContent += "### 实用句型\n<v-clicks>\n\n";
                    topic.useful_sentences.forEach((s: any) => {
                        slidevContent += `- ${s}\n`;
                    });
                    slidevContent += "</v-clicks>\n\n";
                }
                if (!topicContentAdded) {
                    slidevContent += "_此话题下暂无详细语料。_\n\n";
                }
            });
        }
    } else {
         slidevContent += `---
layout: default
---

# 写作思路与解析

_暂无写作解析信息。_

`;
         slidevContent += `---
layout: default
---

# 话题相关语料积累

_暂无话题语料信息。_

`;
    }

    // End Slide
    slidevContent += `---
layout: end
# class: 'text-center'
---

# 感谢观看

`;

    return slidevContent;
}