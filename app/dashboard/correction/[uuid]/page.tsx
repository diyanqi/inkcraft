/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState, useMemo } from "react"; // Added useMemo
import { useRouter, useParams } from "next/navigation";
import type { Components } from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"; // Added Check, ChevronsUpDown
import { Switch } from "@/components/ui/switch"; // Added Switch
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkDocx from "remark-docx";
import { saveAs } from "file-saver";
import CorrectionMarkdownContent from "./CorrectionMarkdownContent";
import CorrectionJsonContent from "./CorrectionJsonContent";
import { findContextSimple, mdBlockquote } from "@/utils/markdownUtils";
import { cn } from "@/lib/utils"; // For Combobox
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"; // For Combobox
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"; // For Combobox


interface Correction {
    uuid: string;
    title: string;
    icon: string;
    model: string;
    content: string; // JSON string
    score: number; // Overall score (average for batch)
    user_email: string;
    created_at: string;
    updated_at: string;
    type: string; // e.g., "gaokao-english-continuation" or "gaokao-english-continuation-batch"
}

// Type for the main JSON content structure
interface CorrectionJson {
    question: string;
    referenceAnswer?: string;
    interpretation?: any; // Shared interpretation
    // For single essay
    answer?: string;
    score_dimensions?: any;
    // 'score' for single essay is at the top-level Correction interface
    upgradation?: any;
    pureUpgradation?: any;
    // For batch essays
    essays?: EssayItem[];
}

// Type for individual essay item in batch mode
interface EssayItem {
    answer: string;
    score_dimensions: any;
    score: number; // Individual essay score
    upgradation?: any;
    pureUpgradation?: any;
}


const SCORE_LABELS: { [key: string]: string } = {
    relevance_and_accuracy: "相关性与准确性",
    plot_plausibility_completeness: "情节合理与完整",
    vocabulary_richness: "词汇丰富度",
    grammatical_accuracy: "语法准确性",
    sentence_variety: "句式多样性",
    cohesion_coherence: "衔接与连贯",
    originality_logicality: "创新与逻辑性",
    style_voice_consistency: "风格与视角一致",
    literary_competence_teacher_evaluation: "文学素养与教师评价",
};

// This function now takes a complete "single essay equivalent" JSON
function generateRichMarkdownReport(
    data: CorrectionJson, // This should now be the constructed displayJson
    scoreLabels: { [key: string]: string },
    showOriginalInPure: boolean,
    showAnnotationsInPure: boolean,
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


    // Upgradation and PureUpgradation are from selected/single essay
    md += "## 五、表达方式升级建议\n\n";
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
            // if (item.example_sentence) md += `  - 例句: *${item.example_sentence}*\n`; // Example sentence usually not needed here as upgraded_sentence is the example
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

    md += "## 六、升格文纯享版\n\n";
    if (Array.isArray(pureUpgradation) && pureUpgradation.length > 0) {
        let pureTextContent = "";
        pureUpgradation.forEach((item: { sentence: string; upgradation: string; comment: string; }) => {
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


export default function CorrectionDetailPage() {
    const router = useRouter();
    const params = useParams();
    const uuid = params?.uuid as string | undefined;
    const [loading, setLoading] = useState(true);
    const [correction, setCorrection] = useState<Correction | null>(null);
    const [error, setError] = useState("");
    const [exportFormat, setExportFormat] = useState("md");
    const [loadingExport, setLoadingExport] = useState(false);
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [showOriginalInPureUpgrade, setShowOriginalInPureUpgrade] = useState(true);
    const [showAnnotationsInPureUpgrade, setShowAnnotationsInPureUpgrade] = useState(true);

    // Batch specific states
    const [isBatchCorrection, setIsBatchCorrection] = useState(false);
    const [selectedEssayIndex, setSelectedEssayIndex] = useState<number>(0); // Default to first essay for batch
    const [parsedFullJsonContent, setParsedFullJsonContent] = useState<CorrectionJson | null>(null);
    const [exportAllEssays, setExportAllEssays] = useState(false); // For export dialog switch

    // Combobox states
    const [comboboxOpen, setComboboxOpen] = React.useState(false);


    useEffect(() => {
        async function fetchCorrection() {
            if (!uuid) {
                setError("无效的批改记录ID");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/correction/${uuid}`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: "获取批改记录失败" }));
                    throw new Error(errorData.message || `服务器错误: ${res.status}`);
                }
                const data = await res.json();
                if (!data.success) {
                    setError(data.message || "获取批改记录失败");
                } else {
                    const fetchedCorrection: Correction = data.data;
                    setCorrection(fetchedCorrection);
                    const isBatch = fetchedCorrection.type?.endsWith("-batch") || false;
                    setIsBatchCorrection(isBatch);

                    try {
                        const parsed: CorrectionJson = JSON.parse(fetchedCorrection.content);
                        setParsedFullJsonContent(parsed);
                        if (isBatch && parsed.essays && parsed.essays.length > 0) {
                            setSelectedEssayIndex(0); // Default to first essay
                        }
                    } catch (e) {
                        setParsedFullJsonContent(null); // Indicates plain markdown or error
                        console.warn("Correction content is not valid JSON or malformed:", e);
                        if (isBatch) setError("批量批改数据格式错误，无法解析习作列表。");
                    }
                }
            } catch (e: unknown) {
                setError(e instanceof Error ? `请求出错: ${e.message}` : "发生未知错误");
                console.error("Fetch correction error:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchCorrection();
    }, [uuid]);

    // Memoized current display JSON (for single or selected batch essay)
    const currentDisplayJson = useMemo((): CorrectionJson | null => {
        if (!parsedFullJsonContent) return null;

        if (isBatchCorrection) {
            if (parsedFullJsonContent.essays && parsedFullJsonContent.essays.length > selectedEssayIndex && selectedEssayIndex >= 0) {
                const selectedEssayData = parsedFullJsonContent.essays[selectedEssayIndex];
                return {
                    question: parsedFullJsonContent.question,
                    referenceAnswer: parsedFullJsonContent.referenceAnswer,
                    interpretation: parsedFullJsonContent.interpretation, // Shared
                    answer: selectedEssayData.answer,
                    score_dimensions: selectedEssayData.score_dimensions,
                    // individual score is part of selectedEssayData, overall is in `correction.score`
                    upgradation: selectedEssayData.upgradation,
                    pureUpgradation: selectedEssayData.pureUpgradation,
                };
            }
            return null; // Or some default if no essay selected / out of bounds
        } else {
            // For single correction, parsedFullJsonContent is already the display JSON
            return parsedFullJsonContent;
        }
    }, [parsedFullJsonContent, isBatchCorrection, selectedEssayIndex]);

    const getMarkdownForExport = (essayData?: EssayItem, essayIdx?: number): string => {
        if (!correction || !parsedFullJsonContent) return "";

        let dataForReport: CorrectionJson;

        if (isBatchCorrection) {
            if (essayData) { // Exporting a specific essay from batch
                 dataForReport = {
                    question: parsedFullJsonContent.question,
                    referenceAnswer: parsedFullJsonContent.referenceAnswer,
                    interpretation: parsedFullJsonContent.interpretation,
                    ...essayData, // Spread the specific essay's details
                };
            } else if (currentDisplayJson) { // Exporting currently selected essay from batch
                dataForReport = currentDisplayJson;
            } else {
                return ""; // Should not happen if UI is correct
            }
        } else if (currentDisplayJson) { // Single correction mode
            dataForReport = currentDisplayJson;
        } else {
            // Fallback for plain markdown content (not JSON)
             return `# ${correction.title}\n\n` +
                `- 模型: ${correction.model}\n` +
                `- 分数: ${correction.score}\n` +
                `- 创建时间: ${new Date(correction.created_at).toLocaleString()}\n\n` +
                `${correction.content}`;
        }
        
        return generateRichMarkdownReport(
            dataForReport,
            SCORE_LABELS,
            showOriginalInPureUpgrade,
            showAnnotationsInPureUpgrade,
            correction.title, // Overall title
            essayIdx // Pass essay index for multi-file export naming
        );
    };


    const handleExport = async () => {
        if (!correction || !parsedFullJsonContent) return;
        setLoadingExport(true);

        try {
            if (isBatchCorrection && exportAllEssays) {
                // Export all essays as separate files
                for (let i = 0; i < (parsedFullJsonContent.essays?.length || 0); i++) {
                    const essayItem = parsedFullJsonContent.essays![i];
                    const markdownContentToExport = getMarkdownForExport(essayItem, i);
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
                        // @ts-expect-error
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
                const markdownContentToExport = getMarkdownForExport(
                    isBatchCorrection && parsedFullJsonContent.essays ? parsedFullJsonContent.essays[selectedEssayIndex] : undefined,
                    isBatchCorrection ? selectedEssayIndex : undefined
                );

                const fileNameBase = correction.title.replace(/\s+/g, "_") +
                                     (isBatchCorrection && !exportAllEssays ? `_习作_${selectedEssayIndex + 1}` : '_批改记录');


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
                    // @ts-expect-error
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
    };

    if (loading) { /* ... Skeleton UI (no change) ... */
        return (
            <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <Skeleton className="h-8 w-[200px]" />
                        <div className="ml-auto">
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[120px]" />
                    </div>
                </header>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[95%]" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-4 w-[92%]" />
                </div>
            </article>
        );
    }
    if (error) return <div className="text-red-500 text-center mt-10 p-4">{error}</div>;
    if (!correction) return <div className="text-center mt-10">未找到批改记录</div>;

    const markdownComponents: Components = { /* ... (no change) ... */
        h1: ({ node: _node, ...props }) => <h1 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0" {...props} />,
        h2: ({ node: _node, ...props }) => <h2 className="mt-10 scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0" {...props} />,
        h3: ({ node: _node, ...props }) => <h3 className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight" {...props} />,
        h4: ({ node: _node, ...props }) => <h4 className="mt-6 scroll-m-20 text-base font-semibold tracking-tight" {...props} />,
        p: ({ node: _node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
        a: ({ node: _node, ...props }) => <a className="font-medium text-primary underline underline-offset-4" {...props} />,
        blockquote: ({ node: _node, ...props }) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />,
        ul: ({ node: _node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
        ol: ({ node: _node, ...props }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />,
        li: ({ node: _node, ...props }) => <li className="mt-2" {...props} />,
        table: ({ node: _node, ...props }) => (
            <div className="my-6 w-full overflow-y-auto">
                <table className="w-full" {...props} />
            </div>
        ),
        thead: ({ node: _node, ...props }) => <thead {...props} />,
        tbody: ({ node: _node, ...props }) => <tbody {...props} />,
        tr: ({ node: _node, ...props }) => <tr className="m-0 border-t p-0 even:bg-muted" {...props} />,
        th: ({ node: _node, ...props }) => <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
        td: ({ node: _node, ...props }) => <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
        pre: ({ node: _node, children, ...props }) => (
            <pre className="mt-6 mb-4 overflow-x-auto rounded-lg border bg-black py-4" {...props}>
                {children}
            </pre>
        ),
        strong: ({ node: _node, ...props }) => <strong className="font-semibold" {...props} />,
        em: ({ node: _node, ...props }) => <em className="italic" {...props} />,
        hr: ({ node: _node, ...props }) => <hr className="my-4 md:my-8 border-border" {...props} />,
    };

    const essayOptions = parsedFullJsonContent?.essays?.map((_, index) => ({
        value: index.toString(),
        label: `习作 ${index + 1}`,
    })) || [];

    const currentEssayDisplayScore = isBatchCorrection && parsedFullJsonContent?.essays && parsedFullJsonContent.essays[selectedEssayIndex]
        ? parsedFullJsonContent.essays[selectedEssayIndex].score
        : correction.score; // Fallback to overall score for single or if specific not found

    return (
        <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
                <div className="flex items-start sm:items-center gap-4 mb-4 flex-col sm:flex-row">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">{correction.icon}</span>
                        <h1 className="text-3xl font-bold">{correction.title}</h1>
                    </div>
                    <div className="ml-0 sm:ml-auto text-2xl font-bold text-green-600 self-start sm:self-center">
                        {isBatchCorrection ? `平均 ${correction.score} 分` : `${correction.score} 分`}
                    </div>
                </div>

                {isBatchCorrection && parsedFullJsonContent?.essays && parsedFullJsonContent.essays.length > 0 && (
                    <div className="mb-4 flex items-center gap-4">
                        <Label htmlFor="essay-selector">选择习作查看详情:</Label>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboboxOpen}
                                    className="w-[150px] justify-between"
                                    id="essay-selector"
                                >
                                    {selectedEssayIndex !== undefined && essayOptions.find(opt => opt.value === selectedEssayIndex.toString())
                                        ? essayOptions.find(opt => opt.value === selectedEssayIndex.toString())?.label
                                        : "选择习作..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[150px] p-0">
                                <Command>
                                    <CommandInput placeholder="搜索习作..." />
                                    <CommandList>
                                        <CommandEmpty>未找到习作。</CommandEmpty>
                                        <CommandGroup>
                                            {essayOptions.map((option) => (
                                                <CommandItem
                                                    key={option.value}
                                                    value={option.label} // Search by label
                                                    onSelect={() => {
                                                        setSelectedEssayIndex(parseInt(option.value));
                                                        setComboboxOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedEssayIndex.toString() === option.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedEssayIndex !== undefined && parsedFullJsonContent.essays[selectedEssayIndex] && (
                             <span className="text-lg font-semibold text-blue-600">
                                当前习作: {parsedFullJsonContent.essays[selectedEssayIndex].score} 分
                            </span>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                    <div>模型：{correction.model}</div>
                    <Separator orientation="vertical" className="h-auto" />
                    <div>创建时间：{new Date(correction.created_at).toLocaleString()}</div>
                    <Separator orientation="vertical" className="h-auto" />
                    <div>用户：{correction.user_email}</div>
                </div>
                <div className="flex flex-wrap gap-x-6 -mb-3 mt-3">
                    <div className="ml-auto">
                        <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
                            <DialogTrigger asChild>
                                <Button variant="secondary">导出</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>导出报告</DialogTitle>
                                    <DialogDescription>
                                        选择格式并导出。{isBatchCorrection ? "可选择导出当前选中或所有习作。" : ""}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="export-format" className="text-right col-span-1">
                                            格式
                                        </Label>
                                        <Select onValueChange={setExportFormat} value={exportFormat}>
                                            <SelectTrigger id="export-format" className="col-span-3">
                                                <SelectValue placeholder="选择格式" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="md">Markdown (.md)</SelectItem>
                                                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                                <SelectItem value="docx">Word (.docx)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {isBatchCorrection && (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="export-all" className="text-right col-span-1">
                                                范围
                                            </Label>
                                            <div className="col-span-3 flex items-center space-x-2">
                                                <Switch
                                                    id="export-all"
                                                    checked={exportAllEssays}
                                                    onCheckedChange={setExportAllEssays}
                                                />
                                                <Label htmlFor="export-all">
                                                    {exportAllEssays ? "导出所有习作 (每个习作一个文件)" : "仅导出当前选中习作"}
                                                </Label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" onClick={() => setOpenExportDialog(false)}>
                                            取消
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" onClick={handleExport} disabled={loadingExport}>
                                        {loadingExport ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />导出中...</> : "确认导出"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>
            <Separator />
            <div className="mt-6 prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none">
                {currentDisplayJson ? (
                    <CorrectionJsonContent
                        data={currentDisplayJson}
                        scoreLabels={SCORE_LABELS}
                        showOriginalInPureUpgrade={showOriginalInPureUpgrade}
                        setShowOriginalInPureUpgrade={setShowOriginalInPureUpgrade}
                        showAnnotationsInPureUpgrade={showAnnotationsInPureUpgrade}
                        setShowAnnotationsInPureUpgrade={setShowAnnotationsInPureUpgrade}
                    />
                ) : !isBatchCorrection && correction.content ? ( // Fallback for non-JSON single correction
                    <CorrectionMarkdownContent content={correction.content} components={markdownComponents} />
                ) : (
                    <div className="text-center py-10">
                        {isBatchCorrection ? "请选择一篇习作查看详情。" : "无法加载批改内容。"}
                    </div>
                )}
            </div>
        </article>
    );
}