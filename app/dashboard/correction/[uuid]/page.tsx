/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState } // React import for types
    from "react";
import { useRouter, useParams } from "next/navigation";
import type { Components } from "react-markdown"; // Import Components type
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
import { Loader2 } from "lucide-react";
import { unified } from "unified";
import remarkParse from "remark-parse"; // Corrected import name
import remarkDocx from "remark-docx"; // Corrected import name
import { saveAs } from "file-saver";
import CorrectionMarkdownContent from "./CorrectionMarkdownContent"; // Adjusted path
import CorrectionJsonContent from "./CorrectionJsonContent";   // Adjusted path
import { findContextSimple, mdBlockquote } from "@/utils/markdownUtils"; // Adjusted path

interface Correction {
    uuid: string;
    title: string;
    icon: string;
    model: string;
    content: string; // This can be a JSON string or plain Markdown
    score: number;
    user_email: string;
    created_at: string;
    updated_at: string;
}

// Define scoreLabels here or import if it becomes a shared constant
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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateRichMarkdownReport(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any, // This is the parsed JSON content
    scoreLabels: { [key: string]: string },
    studentAnswerText: string | undefined,
    showOriginalInPure: boolean,
    showAnnotationsInPure: boolean
): string {
    let md = "# 写作批改报告\n\n";
    const safeStudentAnswerText = studentAnswerText || "";

    const {
        question,
        answer,
        score_dimensions,
        interpretation,
        upgradation,
        pureUpgradation,
    } = data;

    // Tab1: 原文与续写
    md += "## 一、原文与我的续写\n\n";
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

    // Tab2: 评分维度
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

    // Tab3: 写作解析
    md += "## 三、写作思路与解析\n\n";
    const {
        preface,
        guiding_problems,
        paragraph_analysis,
        writing_framework_construction,
    } = interpretation || {};

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

    // Tab4: 话题语料
    md += "## 四、话题相关语料积累\n\n";
    const { vocabulary_and_phrases_for_continuation } = interpretation || {};
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

    // Tab5: 续写升级
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
            md += renderUpgradationItemContext(safeStudentAnswerText, item.original_word);
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
            md += renderUpgradationItemContext(safeStudentAnswerText, item.original_phrase);
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
            if (item.example_sentence) md += `  - 例句: *${item.example_sentence}*\n`;
            md += renderUpgradationItemContext(safeStudentAnswerText, item.original_sentence);
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
            if (item.example_sentence) md += `  - 例句: *${item.example_sentence}*\n`;
            md += renderUpgradationItemContext(safeStudentAnswerText, item.original_description);
        });
        md += "\n";
    }
    if (!hasUpgradeSuggestions) {
        md += "_暂无续写升级建议。_\n\n";
    }

    // Tab6: 升格文纯享版
    md += "## 六、升格文纯享版\n\n";
    if (Array.isArray(pureUpgradation) && pureUpgradation.length > 0) {
        let pureTextContent = "";
        pureUpgradation.forEach((item: { sentence: string; upgradation: string; comment: string; }) => {
            if (showOriginalInPure && item.sentence) {
                pureTextContent += `(${item.sentence}) `;
            }
            pureTextContent += `**${item.upgradation}**`; // Upgraded part in bold
            if (showAnnotationsInPure && item.comment) {
                pureTextContent += ` _[批注: ${item.comment}]_`; // Comment in italics
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
    const uuid = params?.uuid as string | undefined; // Ensure uuid can be undefined initially
    const [loading, setLoading] = useState(true);
    const [correction, setCorrection] = useState<Correction | null>(null);
    const [error, setError] = useState("");
    const [exportFormat, setExportFormat] = useState("md");
    const [loadingExport, setLoadingExport] = useState(false);
    const [openDialog, setOpenDialog] = useState(false); // Renamed to avoid conflict
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [jsonContent, setJsonContent] = useState<any | null>(null);

    // State lifted from CorrectionJsonContent
    const [showOriginalInPureUpgrade, setShowOriginalInPureUpgrade] = useState(true);
    const [showAnnotationsInPureUpgrade, setShowAnnotationsInPureUpgrade] = useState(true);


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
                if (!res.ok) { // Check response status
                    const errorData = await res.json().catch(() => ({ message: "获取批改记录失败，服务器错误" }));
                    throw new Error(errorData.message || `服务器错误: ${res.status}`);
                }
                const data = await res.json();
                if (!data.success) {
                    setError(data.message || "获取批改记录失败");
                } else {
                    setCorrection(data.data);
                    try {
                        const parsed = JSON.parse(data.data.content);
                        setJsonContent(parsed);
                    } catch (e) {
                        // If content is not valid JSON, keep jsonContent as null
                        // This means it's likely plain Markdown
                        setJsonContent(null);
                        console.warn("Correction content is not valid JSON, treating as plain Markdown.");
                    }
                }
            } catch (e: unknown) {
                if (e instanceof Error) {
                    setError(`请求出错: ${e.message}`);
                } else {
                    setError("发生未知错误");
                }
                console.error("Fetch correction error:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchCorrection();
    }, [uuid]);

    const getMarkdownForExport = (): string => {
        if (!correction) return "";

        if (jsonContent) {
            // Generate rich markdown from JSON content
            return generateRichMarkdownReport(
                jsonContent,
                SCORE_LABELS,
                correction.answer, // Pass student's original answer if available in jsonContent or correction
                showOriginalInPureUpgrade,
                showAnnotationsInPureUpgrade
            );
        }
        // Fallback to simple markdown from correction.content
        return `# ${correction.title}\n\n` +
            `- 模型: ${correction.model}\n` +
            `- 分数: ${correction.score}\n` +
            `- 创建时间: ${new Date(correction.created_at).toLocaleString()}\n` +
            `- 用户: ${correction.user_email}\n\n` +
            `${correction.content}`; // Assuming correction.content is Markdown here
    };


    const handleExport = async () => {
        if (!correction) return;

        setLoadingExport(true);
        try {
            const markdownContentToExport = getMarkdownForExport();

            if (exportFormat === "md") {
                const blob = new Blob([markdownContentToExport], { type: "text/markdown;charset=utf-8" });
                saveAs(blob, `${correction.title.replace(/\s+/g, "_")}_批改记录.md`);
            } else if (exportFormat === "pdf") {
                const response = await fetch("https://loose-randi-amzcd-498668ee.koyeb.app", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        markdown: markdownContentToExport,
                    }),
                });

                if (!response.ok) throw new Error(`PDF生成失败: ${response.statusText}`);
                const blob = await response.blob();
                saveAs(blob, `${correction.title.replace(/\s+/g, "_")}_批改记录.pdf`);

            } else if (exportFormat === "docx") {
                // @ts-expect-error remark-docx might need specific setup or types, ensure it's correctly installed and configured
                const processor = unified().use(remarkParse).use(remarkDocx, { output: "blob" });
                const doc = await processor.process(markdownContentToExport);
                const blob = await doc.result as Blob;
                saveAs(blob, `${correction.title.replace(/\s+/g, "_")}_批改记录.docx`);
            }
            setOpenDialog(false); // Close dialog on successful export
        } catch (error) {
            console.error("导出错误:", error);
            alert(`导出失败: ${error instanceof Error ? error.message : "未知错误"}. 请重试或选择其他格式.`);
        } finally {
            setLoadingExport(false);
        }
    };

    if (loading) {
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

    if (error) {
        return <div className="text-red-500 text-center mt-10 p-4">{error}</div>;
    }

    if (!correction) {
        return <div className="text-center mt-10">未找到批改记录</div>;
    }


    // Define the custom components for ReactMarkdown (used by CorrectionMarkdownContent)
    const markdownComponents: Components = {
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


    return (
        <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{correction.icon}</span>
                    <h1 className="text-3xl font-bold">{correction.title}</h1>
                    <div className="ml-auto text-2xl font-bold text-green-600">{correction.score} 分</div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                    <div>模型：{correction.model}</div>
                    <Separator orientation="vertical" className="h-auto" />
                    <div>创建时间：{new Date(correction.created_at).toLocaleString()}</div>
                    <Separator orientation="vertical" className="h-auto" />
                    <div>用户：{correction.user_email}</div>
                </div>
                <div className="flex flex-wrap gap-x-6 -mb-3 mt-3">
                    <div className="ml-auto">
                        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                            <DialogTrigger asChild>
                                <Button variant="secondary">导出</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>导出报告</DialogTitle>
                                    <DialogDescription>
                                        选择您需要的格式并导出批改报告。
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="export-format" className="text-right">
                                            导出格式
                                        </Label>
                                        <Select onValueChange={setExportFormat} value={exportFormat}>
                                            <SelectTrigger id="export-format" className="w-[230px]">
                                                <SelectValue placeholder="选择格式" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="md">Markdown (.md)</SelectItem>
                                                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                                <SelectItem value="docx">Word (.docx)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                                            取消
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" onClick={handleExport} disabled={loadingExport}>
                                        {loadingExport ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                正在导出...
                                            </>
                                        ) : (
                                            "确认导出"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </header>
            <Separator />
            <div className="mt-6 prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none">
                {jsonContent ? (
                    <CorrectionJsonContent
                        data={jsonContent}
                        scoreLabels={SCORE_LABELS}
                        showOriginalInPureUpgrade={showOriginalInPureUpgrade}
                        setShowOriginalInPureUpgrade={setShowOriginalInPureUpgrade}
                        showAnnotationsInPureUpgrade={showAnnotationsInPureUpgrade}
                        setShowAnnotationsInPureUpgrade={setShowAnnotationsInPureUpgrade}
                    />
                ) : (
                    <CorrectionMarkdownContent content={correction.content} components={markdownComponents} />
                )}
            </div>
        </article>
    );
}