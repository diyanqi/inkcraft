// utils/slidev-presentation-generator.ts

import { mdBlockquote } from "@/utils/markdown-utils"; // Assuming this correctly formats text as > text
import { CorrectionJson } from "@/types/correction";

interface GuidingProblem {
    question: string;
    answer?: string;
}

interface ParagraphAnalysis {
    original_text: string;
    interpretation: string;
}

interface VocabularyItem {
    word: string;
    chinese_meaning?: string;
    explaination?: string;
    example_sentence?: string;
}

interface PhraseItem {
    phrase: string;
    chinese_meaning?: string;
    explaination?: string;
    example_sentence?: string;
}

interface TopicVocabulary {
    topic_name: string;
    vocabulary?: VocabularyItem[];
    phrases?: (string | PhraseItem)[];
    useful_sentences?: string[];
}

// Generates Slidev presentation content
export function generateSlidevPresentation(
    data: CorrectionJson,
    overallTitle: string,
    author?: string
): string {
    // Enhanced frontmatter based on the example
    let slidevContent = `---
#theme: seriph
theme: default # Or try seriph, geist, shibainu etc. after installing them
#background: https://cover.sli.dev # Using the example background
background: /bg-common-course.png # Or keep your custom background
title: ${overallTitle}
info: |
  ## ${overallTitle}
  通用教学演示 - 由Slidev强力驱动
  ${author ? `作者: ${author}` : ''}
class: text-center # Apply to the first slide (cover)
drawings:
  persist: false
transition: slide-left # Default transition for slides
mdc: true # Enable MDC syntax
highlighter: shiki # Explicitly set shiki for code blocks if needed
lineNumbers: false # Default for code blocks
---

# ${overallTitle}
## 通用教学演示

${author ? `\n<div class="pt-12">\n  <span class="text-xl opacity-75">${author}</span>\n</div>\n` : ''}

<div @click="$slidev.nav.next" class="mt-12 py-1 cursor-pointer" hover="bg-white op-10 rounded">
  按空格键进入下一页 <carbon:arrow-right class="inline"/>
</div>

<div class="abs-br m-6 flex gap-3 text-xl">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="slidev-icon-btn opacity-50 !border-none !hover:text-primary">
    <carbon:edit />
  </button>
  <a href="https://github.com/slidevjs/slidev" target="_blank" alt="GitHub"
    class="slidev-icon-btn opacity-50 !border-none !hover:text-primary">
    <carbon:logo-github />
  </a>
</div>

<!-- 
封面幻灯片备注：
- 这是演示的起始页。
- 主题和背景可以在 frontmatter 中配置。
-->

`;

    const {
        question,
        interpretation,
    } = data;

    // Slide: 真题回顾 (Question)
    if (question) {
        slidevContent += `---
layout: default
class: slide-content # Common class for content padding
---

# 真题回顾

<div class="prose prose-lg mt-6">
${mdBlockquote(question)}
</div>

<!-- 
真题回顾备注：
- 展示原始问题。
- 使用 blockquote 格式化。
-->

`;
    }

    // Section: 写作思路与解析 (Interpretation)
    if (interpretation) {
        slidevContent += `---
layout: section
class: 'text-center'
---

# 写作思路与解析

<!-- 
分节幻灯片备注：
- 标志着“写作思路与解析”部分的开始。
-->

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
            const prefaceParagraphs = preface.content
                .split('\n')
                .filter((p: string) => p.trim() !== '')
                .map((p: string) => p.trim()) // Trim each paragraph
                .join('\n\n');

            slidevContent += `---
layout: default
class: slide-content
---
## 前言概述

<div class="prose mt-4">
${prefaceParagraphs}
</div>

<!-- 
前言概述备注：
- 介绍写作任务的背景和主要内容。
-->

`;
        }

        // Slides: 关键问题导入 (Guiding Problems - Questions)
        if (Array.isArray(guiding_problems) && guiding_problems.length > 0) {
            slidevContent += `---
layout: default
class: slide-content
---
## 关键问题导入

<v-clicks>

`;
            guiding_problems.forEach((item: GuidingProblem) => {
                slidevContent += `- ${item.question.trim()}\n`;
            });
            slidevContent += `</v-clicks>\n\n`;

            // Slides: 关键问题解答 (Guiding Problems - Answers)
            guiding_problems.forEach((item: GuidingProblem, index: number) => {
                slidevContent += `---
layout: default
class: slide-content slide-qa
level: 3 # For TOC generation
title: "关键问题 ${index + 1} 解答" # For TOC generation
---
### <mdi:chat-question-outline class="inline text-primary mr-1"/> 问题: ${item.question.trim()}

<div class="mt-4">
  <span class="font-semibold text-lg text-secondary">解答:</span>
`;
                if (item.answer) {
                    const answerLines = item.answer.split('\n').filter((l: string) => l.trim() !== '');
                    if (answerLines.length > 0) {
                        slidevContent += "\n  <v-clicks class=\"mt-2 list-disc list-inside pl-2 prose\">\n\n";
                        answerLines.forEach(line => {
                            slidevContent += `    - ${line.trim()}\n`;
                        });
                        slidevContent += "\n  </v-clicks>\n";
                    } else {
                        slidevContent += `  <p class="opacity-60 italic mt-2">暂无详细解答。</p>\n`;
                    }
                } else {
                    slidevContent += `  <p class="opacity-60 italic mt-2">暂无解答。</p>\n`;
                }
                slidevContent += "</div>\n\n";
            });
        }


        // Slides: 原文段落解析 (Paragraph Analysis)
        if (Array.isArray(paragraph_analysis) && paragraph_analysis.length > 0) {
            slidevContent += `---
layout: section
class: 'text-center'
---

# 原文段落解析
<div class="opacity-75 text-lg -mt-2"> (针对共同阅读的原始文本) </div>

<!-- 
分节幻灯片备注：
- 标志着“原文段落解析”部分的开始。
-->

`;
            paragraph_analysis.forEach((item: ParagraphAnalysis, idx: number) => {
                slidevContent += `---
layout: default
class: slide-content
level: 3
title: "原文片段 ${idx + 1} 解析"
---
### 原文片段 ${idx + 1}

<div class="prose mt-4 mb-6 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg shadow">
${mdBlockquote(item.original_text)}
</div>

**<mdi:lightbulb-on-outline class="inline text-primary mr-1"/> 解析:**
<v-clicks depth="1" class="mt-2 list-disc list-inside prose">

`;
                const interpretationPoints = item.interpretation.split('\n').filter(p => p.trim() !== '');
                interpretationPoints.forEach(point => {
                    slidevContent += `- ${point.trim()}\n`;
                });
                slidevContent += `</v-clicks>\n\n`;
            });
        }

        // Slide: 续写框架构建 (Writing Framework Construction)
        if (writing_framework_construction?.sections?.length > 0) {
            slidevContent += `---
layout: default
class: slide-content
---
## <mdi:sitemap class="inline text-primary mr-1"/> 续写框架构建

<div class="mt-4 prose">
<v-clicks depth="2">

`;
            writing_framework_construction.sections.forEach((section: { title?: string, points: string[] }) => {
                slidevContent += `### ${section.title || '章节要点'}\n`;
                if (Array.isArray(section.points) && section.points.length > 0) {
                    section.points.forEach((point: string) => {
                        slidevContent += `  - ${point.trim()}\n`;
                    });
                }
                slidevContent += "\n";
            });
            slidevContent += `</v-clicks>
</div>

<!-- 
续写框架构建备注：
- 提供写作的结构和要点。
- 使用 v-clicks depth="2" 实现分步显示。
-->

`;
        }


        // Section: 话题相关语料积累 (Vocabulary and Phrases)
        if (vocabulary_and_phrases_for_continuation?.topics?.length > 0) {
            slidevContent += `---
layout: section
class: 'text-center'
---

# <mdi:book-open-page-variant-outline class="inline mr-1"/> 话题相关语料积累

<!-- 
分节幻灯片备注：
- 标志着“话题相关语料积累”部分的开始。
-->

`;
            vocabulary_and_phrases_for_continuation.topics.forEach((topic: TopicVocabulary) => {
                slidevContent += `---
layout: default
class: 'slide-content slide-vocab-topic'
level: 3
title: "语料: ${topic.topic_name}"
---
## <span class="text-2xl font-semibold text-primary">${topic.topic_name}</span>

<div class="mt-6 grid gap-6 md:grid-cols-2">
`;
                let topicContentAdded = false;

                let vocabHtml = "";
                if (Array.isArray(topic.vocabulary) && topic.vocabulary.length > 0) {
                    topicContentAdded = true;
                    vocabHtml += "<div>\n"; // Column div
                    vocabHtml += "  <h3 class=\"text-lg font-semibold mb-2 text-secondary\"><mdi:format-letter-case class=\"inline mr-1\"/> 核心词汇</h3>\n  <v-clicks class=\"space-y-3\">\n\n";
                    topic.vocabulary.forEach((v: VocabularyItem) => {
                        vocabHtml += `    <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-md shadow-sm">\n`;
                        vocabHtml += `      <span class="font-medium text-md text-primary-dark">${v.word}</span>`;
                        if (v.chinese_meaning) vocabHtml += ` <span class="text-sm opacity-75">(${v.chinese_meaning})</span>`;
                        vocabHtml += "\n";
                        if (v.explaination) vocabHtml += `      <div class="text-sm opacity-85 pl-2 mt-1"><span class="font-semibold">释义:</span> ${v.explaination}</div>\n`;
                        if (v.example_sentence) vocabHtml += `      <div class="text-sm opacity-85 pl-2 italic mt-1"><span class="font-semibold">例句:</span> ${v.example_sentence}</div>\n`;
                        vocabHtml += `    </div>\n`;
                    });
                    vocabHtml += "  </v-clicks>\n</div>\n\n"; // Close column div
                }

                let phrasesHtml = "";
                if (Array.isArray(topic.phrases) && topic.phrases.length > 0) {
                    topicContentAdded = true;
                    phrasesHtml += "<div>\n"; // Column div
                    phrasesHtml += "  <h3 class=\"text-lg font-semibold mb-2 text-secondary\"><mdi:chat-processing-outline class=\"inline mr-1\"/> 常用短语</h3>\n  <v-clicks class=\"space-y-3\">\n\n";
                    topic.phrases.forEach((p: string | PhraseItem) => {
                        const phraseText = typeof p === 'object' ? p.phrase : String(p);
                        phrasesHtml += `    <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-md shadow-sm">\n`;
                        phrasesHtml += `      <span class="font-medium text-md text-primary-dark">${phraseText}</span>`;
                        if (typeof p === 'object' && p.chinese_meaning) phrasesHtml += ` <span class="text-sm opacity-75">(${p.chinese_meaning})</span>`;
                        phrasesHtml += "\n";
                        if (typeof p === 'object' && p.explaination) phrasesHtml += `      <div class="text-sm opacity-85 pl-2 mt-1"><span class="font-semibold">释义:</span> ${p.explaination}</div>\n`;
                        if (typeof p === 'object' && p.example_sentence) phrasesHtml += `      <div class="text-sm opacity-85 pl-2 italic mt-1"><span class="font-semibold">例句:</span> ${p.example_sentence}</div>\n`;
                        phrasesHtml += `    </div>\n`;
                    });
                    phrasesHtml += "  </v-clicks>\n</div>\n\n"; // Close column div
                }
                
                // Add vocab and phrases HTML to slide content
                slidevContent += vocabHtml;
                slidevContent += phrasesHtml;
                
                slidevContent += "</div>\n"; // Close grid

                if (Array.isArray(topic.useful_sentences) && topic.useful_sentences.length > 0) {
                    topicContentAdded = true;
                    slidevContent += "<div class=\"mt-6\">\n"; // Add margin if grid was used
                    slidevContent += "  <h3 class=\"text-lg font-semibold mb-2 text-secondary\"><mdi:text-box-multiple-outline class=\"inline mr-1\"/> 实用句型</h3>\n  <v-clicks class=\"mt-3 list-disc list-inside prose prose-sm\">\n\n";
                    topic.useful_sentences.forEach((s: string) => {
                        slidevContent += `    - ${s}\n`;
                    });
                    slidevContent += "  </v-clicks>\n</div>\n\n";
                }


                if (!topicContentAdded) {
                    slidevContent += `<p class="opacity-60 italic mt-8 text-center">此话题下暂无详细语料。</p>\n\n`;
                }
                slidevContent += `
<!-- 
语料积累备注：
- 话题: ${topic.topic_name}
- 包含核心词汇、常用短语和实用句型。
-->
`;
            });
        }
    } else {
         slidevContent += `---
layout: default
class: slide-content text-center
---

# 写作思路与解析

<div class="mt-8">
  <mdi:information-outline class="text-3xl text-amber-500 inline-block mb-2" />
  <p class="opacity-75 italic">暂无写作解析信息。</p>
</div>

`;
         slidevContent += `---
layout: default
class: slide-content text-center
---

# <mdi:book-open-page-variant-outline class="inline mr-1"/> 话题相关语料积累

<div class="mt-8">
  <mdi:information-outline class="text-3xl text-amber-500 inline-block mb-2" />
  <p class="opacity-75 italic">暂无话题语料信息。</p>
</div>

`;
    }

    // End Slide
    slidevContent += `---
layout: end
class: 'text-center'
#background: https://source.unsplash.com/collection/94734566/1920x1080 
---

# 感谢观看!

<div class="mt-8">
  <p>本演示文稿使用 <a href="https://sli.dev/" target="_blank" class="text-primary hover:underline">Slidev</a> 构建</p>
</div>

<PoweredBySlidev class="abs-br m-6" />
<!-- Add this component to your ./components/ directory or install as a global component -->
<!-- Component: ./components/PoweredBySlidev.vue -->
<!--
<template>
  <div class="text-xs opacity-50">
    Powered by <a href="https://sli.dev" target="_blank" class="!border-none !hover:text-primary">Slidev</a>
  </div>
</template>
-->

<!-- 
结束幻灯片备注：
- 感谢观众。
- 可以添加联系方式或下一步行动指引。
-->
`;

    return slidevContent;
}

// Example of a common style class you might define in a global style sheet (e.g., style.css or in <style global>)
/*
In your global styles (e.g., ./styles/index.ts or a <style> block in App.vue/main.ts for global CSS):

.slide-content {
  @apply px-10 py-8; // Example padding using UnoCSS/Tailwind
}

// If not using UnoCSS, define it in a global .css file linked in main.ts or index.html:
// .slide-content {
//   padding-left: 2.5rem; /* 40px */
//   padding-right: 2.5rem; /* 40px */
//   padding-top: 2rem; /* 32px */
//   padding-bottom: 2rem; /* 32px */
// }

// Define primary/secondary colors (if using 'default' theme, these might already be set or you can override)
// :root {
//   --slidev-theme-primary: #3b82f6; /* Example blue */
//   --slidev-theme-secondary: #10b981; /* Example green */
//   --slidev-theme-primary-dark: #2563eb; /* Darker shade for text on light bg */
// }

// You'll need to install iconify for the mdi: icons:
// npm i -D @iconify-json/carbon @iconify-json/mdi

// And potentially a component like PoweredBySlidev
// Create ./components/PoweredBySlidev.vue
/*
<template>
  <div :class="['text-xs opacity-60', $attrs.class]">
    Powered by <a href="https://sli.dev" target="_blank" class="!border-none !hover:text-$slidev-theme-primary">Slidev</a>
  </div>
</template>
*/