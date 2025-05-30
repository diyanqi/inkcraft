// app/dashboard/correction/[uuid]/page.tsx

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
import { Switch } from "@/components/ui/switch";
// Removed unified, remarkParse, remarkDocx, saveAs - now in utils/correction-export
import CorrectionMarkdownContent from "@/components/correction-show-page/correction-markdown-content";
import CorrectionJsonContent from "@/components/correction-show-page/correction-json-content";
// Removed findContextSimple, mdBlockquote - now in utils/markdownUtils (imported by export util)
import { cn } from "@/lib/utils"; // For Combobox
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandList,
    CommandItem,
    CommandInput, // <-- Import CommandItem
} from "@/components/ui/command"; // For Combobox
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"; // For Combobox

// Import the custom hook and export utility
import { useCorrection } from "@/hooks/use-correction";
import { exportCorrectionReport } from "@/utils/correction-export";
// Import types and constants
import { SCORE_LABELS } from "@/types/correction";


// Markdown components definition (kept here as fallback for plain markdown content)
// If CorrectionMarkdownContent is the *only* place using these, move them there.
// Given the original code defined them here and passed them, keeping them here
// or moving them to a shared place (if other pages use them) is an option.
// For now, let's keep them here as they were originally defined in the page.
// Note: The 'any' suppression might be related to the types expected by react-markdown's Components.
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

    // Use the custom hook for data fetching and state management
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

    // Local state for export dialog and display options
    const [exportFormat, setExportFormat] = useState("md");
    const [loadingExport, setLoadingExport] = useState(false);
    const [openExportDialog, setOpenExportDialog] = useState(false);
    const [showOriginalInPureUpgrade, setShowOriginalInPureUpgrade] = useState(true);
    const [showAnnotationsInPureUpgrade, setShowAnnotationsInPureUpgrade] = useState(true);
    const [exportAllEssays, setExportAllEssays] = useState(false); // For export dialog switch

    // Added states for Strengthen Foundation display options
    const [showOriginalInStrengthen, setShowOriginalInStrengthen] = useState(true);
    const [showAnnotationsInStrengthen, setShowAnnotationsInStrengthen] = useState(true);


    // Combobox states
    const [comboboxOpen, setComboboxOpen] = React.useState(false);

    const essayOptions = parsedFullJsonContent?.essays?.map((_, index) => ({
        value: index.toString(),
        label: `习作 ${index + 1}`,
    })) || [];

    const handleExportClick = () => {
         if (!correction || !parsedFullJsonContent) return;

        exportCorrectionReport({
            correction,
            parsedFullJsonContent,
            exportFormat,
            exportAllEssays,
            selectedEssayIndex,
            showOriginalInPureUpgrade,
            showAnnotationsInPureUpgrade,
            showOriginalInStrengthen, // Pass new option
            showAnnotationsInStrengthen, // Pass new option
            setLoadingExport,
            setOpenExportDialog,
        });
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

    // Current essay score display (only show if batch and essay selected)
    const currentEssayDisplayScore = isBatchCorrection && parsedFullJsonContent?.essays && parsedFullJsonContent.essays.length > selectedEssayIndex && selectedEssayIndex >= 0
        ? parsedFullJsonContent.essays[selectedEssayIndex].score
        : undefined; // Undefined means don't show this specific score

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
                         showOriginalInStrengthen={showOriginalInStrengthen} // Pass new state
                        setShowOriginalInStrengthen={setShowOriginalInStrengthen} // Pass new state setter
                        showAnnotationsInStrengthen={showAnnotationsInStrengthen} // Pass new state
                        setShowAnnotationsInStrengthen={setShowAnnotationsInStrengthen} // Pass new state setter
                    />
                ) : !isBatchCorrection && correction.content ? ( // Fallback for non-JSON single correction
                    // Fix: Remove the components prop
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
