/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import type { Components } from "react-markdown"; // Keep for MarkdownContent fallback
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
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
// Removed Switch as it's replaced by Select for export scope
import CorrectionMarkdownContent from "@/components/correction-show-page/correction-markdown-content";
import CorrectionJsonContent from "@/components/correction-show-page/correction-json-content";
import { cn } from "@/lib/utils"; // For Combobox
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandList,
    CommandItem,
    CommandInput,
} from "@/components/ui/command"; // For Combobox
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"; // For Combobox

// Import custom hook and export utility
import { useCorrection } from "@/hooks/use-correction";
import { exportCorrectionReport } from "@/utils/correction-export"; // Added generateSlidevPresentation
import { generateSlidevPresentation } from "@/utils/slidev-presentation-generator";
// Import types and constants
import { SCORE_LABELS } from "@/types/correction";
import { saveAs } from "file-saver"; // Import saveAs for presentation download

// Markdown components definition (kept here as fallback for plain markdown content)
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


export default function CorrectionDetailPage() {
    const params = useParams();
    const uuid = params?.uuid as string | undefined;

    const {
        loading,
        error,
        correction,
        parsedFullJsonContent,
        isBatchCorrection,
        selectedEssayIndex,
        setSelectedEssayIndex,
        currentDisplayJson,
    } = useCorrection(uuid);

    const [exportFormat, setExportFormat] = useState("md");
    const [loadingExport, setLoadingExport] = useState(false);
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [showOriginalInPureUpgrade, setShowOriginalInPureUpgrade] = useState(true);
    const [showAnnotationsInPureUpgrade, setShowAnnotationsInPureUpgrade] = useState(true);

    const [exportScope, setExportScope] = useState<string>("all_combined");

    const [showOriginalInStrengthen, setShowOriginalInStrengthen] = useState(true);
    const [showAnnotationsInStrengthen, setShowAnnotationsInStrengthen] = useState(true);

    const [comboboxOpen, setComboboxOpen] = React.useState(false);
    const [loadingPresentation, setLoadingPresentation] = useState(false);

    const essayOptions = parsedFullJsonContent?.essays?.map((_, index) => ({
        value: index.toString(),
        label: `习作 ${index + 1}`,
    })) || [];

    const exportFormContent = (
        <>
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
                    <Label htmlFor="export-scope" className="text-right col-span-1">
                        选项
                    </Label>
                    <Select onValueChange={setExportScope} value={exportScope}>
                        <SelectTrigger id="export-scope" className="col-span-3">
                            <SelectValue placeholder="选择导出范围" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_combined">导出所有 (整合至单文件)</SelectItem>
                            <SelectItem value="current">仅导出当前篇</SelectItem>
                            <SelectItem value="all_separate">导出所有 (每篇独立文件)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </>
    );

    const handleExportClick = () => {
        if (!correction || !parsedFullJsonContent) return;

        const shouldExportAll = exportScope === "all_combined" || exportScope === "all_separate";
        const combineFiles = exportScope === "all_combined";

        exportCorrectionReport({
            correction,
            parsedFullJsonContent,
            exportFormat,
            exportAllEssays: shouldExportAll,
            combineFiles: combineFiles,
            selectedEssayIndex,
            showOriginalInPureUpgrade,
            showAnnotationsInPureUpgrade,
            showOriginalInStrengthen,
            showAnnotationsInStrengthen,
            setLoadingExport,
            setOpenExportDialog,
        });
    };

    const handlePresentationExportClick = async () => {
        if (!correction || !parsedFullJsonContent) {
            alert("批改数据加载中或不存在，无法生成演示文稿。");
            return;
        }
        if (!parsedFullJsonContent.question && !parsedFullJsonContent.interpretation) {
            alert("缺少真题回顾或写作解析部分，无法生成通用演示文稿。");
            return;
        }

        setLoadingPresentation(true);
        try {
            const slidevContent = generateSlidevPresentation(
                parsedFullJsonContent, // Use the full parsed content for public parts (question, interpretation)
                correction.title
            );

            const fileNameBase = `${correction.title.replace(/\s+/g, "_")}_通用演示文稿`;
            const blob = new Blob([slidevContent], { type: "text/markdown;charset=utf-8" });
            saveAs(blob, `${fileNameBase}.md`);
            alert(`已成功生成通用演示文稿: ${fileNameBase}.md。您可以使用 Slidev 工具打开此文件。`);

        } catch (error) {
            console.error("生成演示文稿错误:", error);
            alert(`生成演示文稿失败: ${error instanceof Error ? error.message : "未知错误"}.`);
        } finally {
            setLoadingPresentation(false);
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
    if (error) return <div className="text-red-500 text-center mt-10 p-4">{error}</div>;
    if (!correction) return <div className="text-center mt-10">未找到批改记录</div>;

    const currentEssayDisplayScore = isBatchCorrection && parsedFullJsonContent?.essays && parsedFullJsonContent.essays.length > selectedEssayIndex && selectedEssayIndex >= 0
        ? parsedFullJsonContent.essays[selectedEssayIndex].score
        : undefined;

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
                        <Label htmlFor="essay-selector" className="shrink-0">选择习作查看详情:</Label>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboboxOpen}
                                    className="w-[150px] justify-between"
                                    id="essay-selector"
                                >
                                    {selectedEssayIndex !== undefined && essayOptions.find(opt => parseInt(opt.value) === selectedEssayIndex)
                                        ? essayOptions.find(opt => parseInt(opt.value) === selectedEssayIndex)?.label
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
                                                    value={option.label}
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
                        {currentEssayDisplayScore !== undefined && (
                            <span className="text-lg font-semibold text-blue-600">
                                当前习作: {currentEssayDisplayScore} 分
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
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={handlePresentationExportClick}
                            disabled={
                                loadingPresentation ||
                                !parsedFullJsonContent ||
                                (!parsedFullJsonContent.question && !parsedFullJsonContent.interpretation)
                            }
                        >
                            {loadingPresentation ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</> : "演示文稿 (公用)"}
                        </Button>
                        <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" disabled={!parsedFullJsonContent}>导出</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>导出报告</DialogTitle>
                                    <DialogDescription>
                                        选择导出格式和选项。
                                        {isBatchCorrection ? ` 可选择导出当前习作，或将所有习作整合为单一文件，或为每篇习作生成独立文件。` : ""}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    {exportFormContent}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" onClick={() => setOpenExportDialog(false)}>
                                            取消
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" onClick={handleExportClick} disabled={loadingExport || !parsedFullJsonContent}>
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
                        showOriginalInStrengthen={showOriginalInStrengthen}
                        setShowOriginalInStrengthen={setShowOriginalInStrengthen}
                        showAnnotationsInStrengthen={showAnnotationsInStrengthen}
                        setShowAnnotationsInStrengthen={setShowAnnotationsInStrengthen}
                    />
                ) : !isBatchCorrection && correction.content ? (
                    <CorrectionMarkdownContent content={correction.content} />
                ) : (
                    <div className="text-center py-10">
                        {isBatchCorrection ? "请选择一篇习作查看详情。" : "无法加载批改内容。"}
                    </div>
                )}
            </div>
        </article>
    );
}