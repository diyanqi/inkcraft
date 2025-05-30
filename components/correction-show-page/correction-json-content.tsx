// app/dashboard/correction/[uuid]/CorrectionJsonContent.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Radar as RadarIcon,
  BookOpenText,
  Lightbulb,
  ListChecks,
  ArrowUpCircle,
  FileSignature,
  Hammer,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar as RechartsRadar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { findContextSimple } from "@/utils/markdown-utils";
import { CorrectionJson } from "@/types/correction"; // Import CorrectionJson type

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h2 className={`text-xl font-semibold mt-6 mb-3 first:mt-0 ${className || ''}`}>
    {children}
  </h2>
);

const SubSectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h3 className={`text-lg font-medium mt-4 mb-2 ${className || ''}`}>
    {children}
  </h3>
);

const ParagraphRenderer: React.FC<{ text: string; useDropCap: boolean }> = ({ text, useDropCap }) => {
  if (!text) return null;
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  return (
    <div className="font-serif text-lg leading-relaxed flow-root">
      {paragraphs.map((para, index) => (
        <p
          key={index}
          className={`indent-8 mb-4 ${index === 0 && useDropCap ? 'drop-cap' : ''}`}
        >
          {para}
        </p>
      ))}
    </div>
  );
};

interface CorrectionJsonContentProps {
  data: CorrectionJson; // Use the imported type
  scoreLabels: { [key: string]: string };
  showOriginalInPureUpgrade: boolean;
  setShowOriginalInPureUpgrade: (value: boolean) => void;
  showAnnotationsInPureUpgrade: boolean;
  setShowAnnotationsInPureUpgrade: (value: boolean) => void;
  showOriginalInStrengthen: boolean; // Added prop
  setShowOriginalInStrengthen: (value: boolean) => void; // Added prop
  showAnnotationsInStrengthen: boolean; // Added prop
  setShowAnnotationsInStrengthen: (value: boolean) => void; // Added prop
}

export default function CorrectionJsonContent({
  data,
  scoreLabels,
  showOriginalInPureUpgrade,
  setShowOriginalInPureUpgrade,
  showAnnotationsInPureUpgrade,
  setShowAnnotationsInPureUpgrade,
  showOriginalInStrengthen, // Added prop
  setShowOriginalInStrengthen, // Added prop
  showAnnotationsInStrengthen, // Added prop
  setShowAnnotationsInStrengthen, // Added prop
}: CorrectionJsonContentProps) {
  const {
    question,
    answer, // answer can be string | undefined
    score_dimensions,
    interpretation,
    upgradation,
    pureUpgradation,
    strengthenFoundation, // Added
  } = data;

  const {
    preface,
    guiding_problems,
    paragraph_analysis,
    writing_framework_construction,
    vocabulary_and_phrases_for_continuation,
  } = interpretation || {};

  const {
    vocabulary_upgradation,
    phrase_upgradation,
    sentence_upgradation,
    detail_description_upgradation,
  } = upgradation || {};

  const scoreKeys = Object.keys(score_dimensions || {});

  const radarData = scoreKeys.map((key) => ({
    dimension: scoreLabels[key] || key,
    score: score_dimensions[key]?.score || 0,
    fullMark: 15, // Assuming max score is 15 for radar chart scaling
  }));

  // Ensure answer is a string for findContextSimple
  const studentAnswerText = answer || '';


  return (
    <Tabs defaultValue="origin" className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-7 h-auto">
        <TabsTrigger value="origin">原文与续写</TabsTrigger>
        <TabsTrigger value="score">评分维度</TabsTrigger>
        <TabsTrigger value="analysis">写作解析</TabsTrigger>
        <TabsTrigger value="topic_material">话题语料</TabsTrigger>
        <TabsTrigger value="strengthen_foundation">夯实基础</TabsTrigger> {/* Added new tab */}
        <TabsTrigger value="writing_upgrade">续写升级</TabsTrigger>
        <TabsTrigger value="pure_upgrade_text">升格文纯享版</TabsTrigger>
      </TabsList>

      {/* Tab1: 原文与续写 */}
      <TabsContent value="origin">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BookOpenText className="h-5 w-5 text-primary" />
            <CardTitle>原文与我的续写</CardTitle>
          </CardHeader>
          <CardContent>
            {question && (
              <>
                <SectionTitle>真题回顾</SectionTitle>
                <ParagraphRenderer text={question} useDropCap={false} />
              </>
            )}
            {answer && (
              <>
                <SectionTitle className="mt-8">我的续写</SectionTitle>
                <ParagraphRenderer text={answer} useDropCap={false} />
              </>
            )}
            {!question && !answer && <div className="text-foreground/80">暂无原文或续写内容。</div>}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab2: 评分维度 */}
      <TabsContent value="score">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <RadarIcon className="h-5 w-5 text-primary" />
            <CardTitle>评分维度解析</CardTitle>
          </CardHeader>
          <CardContent>
            {score_dimensions && scoreKeys.length > 0 ? (
              <div className="space-y-8">
                <div>
                  <SectionTitle className="text-center mb-4">综合得分雷达图</SectionTitle>
                  <div className="h-[300px] w-full sm:h-[350px] md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[400px]"
                      >
                        <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                          <PolarGrid />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <PolarAngleAxis
                            dataKey="dimension"
                            tick={{ fill: "currentColor", fontSize: 11 }}
                            tickFormatter={(value) => value.length > 5 ? (value.match(/.{1,5}/g)?.join('\n') || value) : value}
                          />
                          <RechartsRadar
                            name="得分"
                            dataKey="score"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.6}
                            stroke="hsl(var(--primary))"
                            dot={{ r: 4, fillOpacity: 1, fill: "hsl(var(--primary))" }}
                          />
                        </RadarChart>
                      </ChartContainer>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <SectionTitle>各维度详细得分</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scoreKeys.map((key: string) => (
                      <div
                        key={key}
                        className="flex flex-col gap-2 border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-medium text-foreground">
                            {scoreLabels[key] || key}
                          </span>
                          {score_dimensions[key] && (
                            <span className="text-xl font-bold text-green-600">
                              {score_dimensions[key].score}分
                            </span>
                          )}
                        </div>
                        {score_dimensions[key]?.explaination && (
                          <div className="text-sm text-foreground/80 pt-2 border-t mt-2">
                            {score_dimensions[key].explaination}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-foreground/80">暂无评分维度信息。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab3: 写作解析 */}
      <TabsContent value="analysis">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>写作思路与解析</CardTitle>
          </CardHeader>
          <CardContent>
            {preface?.content && (
              <>
                <SectionTitle>前言概述</SectionTitle>
                <p className="text-foreground/90 whitespace-pre-line">{preface.content}</p>
                <Separator className="my-4" />
              </>
            )}
            {Array.isArray(guiding_problems) && guiding_problems.length > 0 && (
              <>
                <SectionTitle>关键问题导入</SectionTitle>
                <ol className="list-decimal ml-6 space-y-2 text-foreground/90">
                  {guiding_problems.map(
                    (item: { question: string }, idx: number) => (
                      <li key={idx}><span className="font-medium">{item.question}</span></li>
                    )
                  )}
                </ol>
                <Separator className="my-4" />
              </>
            )}
            {Array.isArray(paragraph_analysis) && paragraph_analysis.length > 0 && (
              <>
                <SectionTitle>原文段落解析</SectionTitle>
                <ul className="space-y-4">
                  {paragraph_analysis.map(
                    (item: { original_text: string; interpretation: string }, idx: number) => (
                      <li key={idx} className="bg-card p-4 border rounded-lg shadow-sm space-y-2">
                        <div>
                          <p className="font-semibold text-primary mb-1">原文片段:</p>
                          <blockquote className="pl-4 italic border-l-4 border-accent text-foreground/90 py-2 bg-muted/30 rounded-r-md">
                            {item.original_text}
                          </blockquote>
                        </div>
                        <div>
                          <p className="font-semibold text-primary mb-1">
                            解析:
                          </p>
                          <p className="text-sm text-foreground/90">{item.interpretation}</p>
                        </div>
                      </li>
                    )
                  )}
                </ul>
                <Separator className="my-4" />
              </>
            )}
            {Array.isArray(guiding_problems) && guiding_problems.length > 0 && (
              <>
                <SectionTitle>关键问题解答</SectionTitle>
                <ol className="list-decimal ml-6 space-y-3 text-foreground/90">
                  {guiding_problems.map(
                    (item: { question: string; answer?: string }, idx: number) => (
                      <li key={idx}>
                        <p className="font-medium">{item.question}</p>
                        {item.answer && <p className="text-sm text-foreground/80 mt-1 whitespace-pre-line">{item.answer}</p>}
                      </li>
                    )
                  )}
                </ol>
                <Separator className="my-4" />
              </>
            )}
            {writing_framework_construction?.sections?.length > 0 && (
              <>
                <SectionTitle>续写框架构建</SectionTitle>
                <ol className="list-decimal ml-6 space-y-2 text-foreground/90">
                  {writing_framework_construction.sections.map(
                    (section: { title?: string, points: string[] }, idx: number) => (
                      <li key={idx}>
                        {section.title && <p className="font-medium">{section.title}</p>}
                        {Array.isArray(section.points) && section.points.length > 0 && (
                          <ul className="list-disc ml-5 mt-1 text-sm text-foreground/80">
                            {section.points.map((point: string, i: number) => <li key={i}>{point}</li>)}
                          </ul>
                        )}
                      </li>
                    )
                  )}
                </ol>
              </>
            )}
            {(!preface?.content && (!guiding_problems || guiding_problems.length === 0) && (!paragraph_analysis || paragraph_analysis.length === 0) && (!writing_framework_construction?.sections || writing_framework_construction.sections.length === 0)) && (
              <div className="text-foreground/80">暂无写作解析信息。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab4: 话题语料 */}
      <TabsContent value="topic_material">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <CardTitle>话题相关语料积累</CardTitle>
          </CardHeader>
          <CardContent>
            {vocabulary_and_phrases_for_continuation?.topics?.length > 0 ? (
              vocabulary_and_phrases_for_continuation.topics.map(
                (topic: any, topicIdx: number) => (
                  <div key={topicIdx} className="mb-6">
                    <SectionTitle>{topic.topic_name}</SectionTitle>
                    {Array.isArray(topic.vocabulary) && topic.vocabulary.length > 0 && (
                      <>
                        <SubSectionTitle>核心词汇</SubSectionTitle>
                        <ul className="space-y-3">
                          {topic.vocabulary.map((v: any, i: number) => (
                            <li key={i} className="p-3 border rounded-md">
                              <p><strong className="text-primary">{v.word}</strong></p>
                              {v.explaination && (
                                <p className="text-sm my-1 text-foreground/90">
                                  {v.explaination}
                                  {v.chinese_meaning && <span className="text-sm text-foreground/80"> ({v.chinese_meaning})</span>}
                                </p>
                              )}
                              {!v.explaination && v.chinese_meaning && (
                                <p className="text-sm my-1 text-foreground/80">({v.chinese_meaning})</p>
                              )}
                              {v.example_sentence && (
                                <div className="mt-1 flex items-start text-xs text-foreground/70">
                                  <span className="font-semibold mr-1.5 opacity-80 shrink-0">例句:</span>
                                  <span className="italic">{v.example_sentence}</span>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {Array.isArray(topic.phrases) && topic.phrases.length > 0 && (
                      <>
                        <SubSectionTitle>常用短语</SubSectionTitle>
                        <ul className="space-y-3">
                          {topic.phrases.map((p: any, i: number) => (
                            <li key={i} className="p-3 border rounded-md">
                              {typeof p === 'object' && p !== null ? (
                                <>
                                  <p><strong className="text-primary">{p.phrase}</strong></p>
                                  {p.explaination && (
                                    <p className="text-sm my-1 text-foreground/90">
                                      {p.explaination}
                                      {p.chinese_meaning && <span className="text-sm text-foreground/80"> ({p.chinese_meaning})</span>}
                                    </p>
                                  )}
                                  {!p.explaination && p.chinese_meaning && (
                                    <p className="text-sm my-1 text-foreground/80">({p.chinese_meaning})</p>
                                  )}
                                  {p.example_sentence && (
                                    <div className="mt-1 flex items-start text-xs text-foreground/70">
                                      <span className="font-semibold mr-1.5 opacity-80 shrink-0">例句:</span>
                                      <span className="italic">{p.example_sentence}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p><strong className="text-primary">{String(p)}</strong></p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {Array.isArray(topic.useful_sentences) && topic.useful_sentences.length > 0 && (
                      <>
                        <SubSectionTitle>实用句型</SubSectionTitle>
                        <ul className="space-y-3">
                          {topic.useful_sentences.map((s: string, i: number) => (
                            <li key={i} className="p-3 border rounded-md text-sm text-foreground/90">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {topicIdx < vocabulary_and_phrases_for_continuation.topics.length - 1 && <Separator className="my-6" />}
                  </div>
                )
              )
            ) : (
              <div className="text-foreground/80">暂无话题语料信息。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab5: 夯实基础 */}
      <TabsContent value="strengthen_foundation">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Hammer className="h-5 w-5 text-primary" />
            <CardTitle>夯实基础</CardTitle>
          </CardHeader>
          <CardContent className="rounded-b-lg p-6">
             <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOriginalStrengthen"
                  checked={showOriginalInStrengthen}
                  onCheckedChange={(checked) => setShowOriginalInStrengthen(!!checked)}
                  className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="showOriginalStrengthen" className="text-sm font-medium text-foreground/80">
                  原文对照
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showAnnotationsStrengthen"
                  checked={showAnnotationsInStrengthen}
                  onCheckedChange={(checked) => setShowAnnotationsInStrengthen(!!checked)}
                  className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="showAnnotationsStrengthen" className="text-sm font-medium text-foreground/80">
                  显示批注
                </Label>
              </div>
            </div>
            {Array.isArray(strengthenFoundation) && strengthenFoundation.length > 0 ? (
              <>
                <SectionTitle>基础纠错</SectionTitle>
                <ul className="space-y-4">
                  {strengthenFoundation.map(
                    (item: { sentence: string; correction: string; comment?: string }, idx: number) => {
                      // Pass studentAnswerText (string) to findContextSimple
                      const contextParts = showOriginalInStrengthen ? findContextSimple(studentAnswerText, item.sentence) : null;
                      return (
                        <li key={idx} className="p-3 border rounded-md">
                          <p className="font-medium text-foreground/80">{item.sentence}</p>
                          <p className="my-1">→ <strong className="text-green-600 dark:text-green-500">{item.correction}</strong></p>
                          {showAnnotationsInStrengthen && item.comment && <p className="text-sm text-foreground/90">{item.comment}</p>}
                          {contextParts && (
                            <div className="mt-2 text-xs text-foreground/70 p-2 bg-muted/40 rounded">
                              <p className="font-semibold mb-0.5 text-foreground/80">原文片段参考:</p>
                              <p className="italic">
                                {contextParts.prefix}
                                <mark className="bg-primary/20 text-primary font-semibold px-0.5 rounded not-italic">{contextParts.match}</mark>
                                {contextParts.suffix}
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    }
                  )}
                </ul>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">暂无基础纠正内容。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>


      {/* Tab6: 续写升级 */}
      <TabsContent value="writing_upgrade">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            <CardTitle>表达方式升级建议</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(vocabulary_upgradation) && vocabulary_upgradation.length > 0 && (
              <>
                <SectionTitle>词汇升级</SectionTitle>
                <ul className="space-y-4">
                  {vocabulary_upgradation.map((item, idx) => {
                     // Pass studentAnswerText (string) to findContextSimple
                    const contextParts = findContextSimple(studentAnswerText, item.original_word);
                    return (
                      <li key={idx} className="p-3 border rounded-md">
                        <p>
                          <span className="font-medium text-foreground/80">{item.original_word}</span> → <strong className="text-green-600 dark:text-green-500">{item.upgraded_word}</strong>
                        </p>
                        {item.english_explanation && <p className="text-sm text-foreground/90 mt-1">{item.english_explanation}</p>}
                        {item.chinese_meaning && <p className="text-sm text-foreground/80 mt-0.5">({item.chinese_meaning})</p>}
                        {item.example_sentence && (
                          <div className="mt-1 flex items-start text-xs text-foreground/70">
                            <span className="font-semibold mr-1.5 opacity-80 shrink-0">例句:</span>
                            <span className="italic">{item.example_sentence}</span>
                          </div>
                        )}
                        {contextParts && (
                          <div className="mt-2 text-xs text-foreground/70 p-2 bg-muted/40 rounded">
                            <p className="font-semibold mb-0.5 text-foreground/80">原文片段参考:</p>
                            <p className="italic">
                              {contextParts.prefix}
                              <mark className="bg-primary/20 text-primary font-semibold px-0.5 rounded not-italic">{contextParts.match}</mark>
                              {contextParts.suffix}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <Separator className="my-6" />
              </>
            )}
            {Array.isArray(phrase_upgradation) && phrase_upgradation.length > 0 && (
              <>
                <SectionTitle>短语升级</SectionTitle>
                <ul className="space-y-4">
                  {phrase_upgradation.map((item, idx) => {
                     // Pass studentAnswerText (string) to findContextSimple
                    const contextParts = findContextSimple(studentAnswerText, item.original_phrase);
                    return (
                      <li key={idx} className="p-3 border rounded-md">
                        <p className="font-medium text-foreground/80">{item.original_phrase}</p>
                        <p className="my-1">→ <strong className="text-green-600 dark:text-green-500">{item.upgraded_phrase}</strong></p>
                        <p className="text-sm text-foreground/90">
                          {item.english_explanation}
                          {item.chinese_meaning && <span className="text-foreground/80"> ({item.chinese_meaning})</span>}
                        </p>
                        {item.example_sentence && (
                          <div className="mt-1 flex items-start text-xs text-foreground/70">
                            <span className="font-semibold mr-1.5 opacity-80 shrink-0">例句:</span>
                            <span className="italic">{item.example_sentence}</span>
                          </div>
                        )}
                        {contextParts && (
                          <div className="mt-2 text-xs text-foreground/70 p-2 bg-muted/40 rounded">
                            <p className="font-semibold mb-0.5 text-foreground/80">原文片段参考:</p>
                            <p className="italic">
                              {contextParts.prefix}
                              <mark className="bg-primary/20 text-primary font-semibold px-0.5 rounded not-italic">{contextParts.match}</mark>
                              {contextParts.suffix}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <Separator className="my-6" />
              </>
            )}
            {Array.isArray(sentence_upgradation) && sentence_upgradation.length > 0 && (
              <>
                <SectionTitle>句型升级</SectionTitle>
                <ul className="space-y-4">
                  {sentence_upgradation.map((item, idx) => {
                     // Pass studentAnswerText (string) to findContextSimple
                    const contextParts = findContextSimple(studentAnswerText, item.original_sentence);
                    return (
                      <li key={idx} className="p-3 border rounded-md">
                        <p className="font-medium text-foreground/80">{item.original_sentence}</p>
                        <p className="my-1">→ <strong className="text-green-600 dark:text-green-500">{item.upgraded_sentence}</strong></p>
                        <p className="text-sm text-foreground/90">{item.explanation}</p>
                        {item.example_sentence && (
                          <div className="mt-1 flex items-start text-xs text-foreground/70">
                            <span className="font-semibold mr-1.5 opacity-80 shrink-0">例句:</span>
                            <span className="italic">{item.example_sentence}</span>
                          </div>
                        )}
                        {contextParts && (
                          <div className="mt-2 text-xs text-foreground/70 p-2 bg-muted/40 rounded">
                            <p className="font-semibold mb-0.5 text-foreground/80">原文片段参考:</p>
                            <p className="italic">
                              {contextParts.prefix}
                              <mark className="bg-primary/20 text-primary font-semibold px-0.5 rounded not-italic">{contextParts.match}</mark>
                              {contextParts.suffix}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <Separator className="my-6" />
              </>
            )}
            {Array.isArray(detail_description_upgradation) && detail_description_upgradation.length > 0 && (
              <>
                <SectionTitle>细节描写升级</SectionTitle>
                <ul className="space-y-4">
                  {detail_description_upgradation.map((item, idx) => {
                     // Pass studentAnswerText (string) to findContextSimple
                    const contextParts = findContextSimple(studentAnswerText, item.original_description);
                    return (
                      <li key={idx} className="p-3 border rounded-md">
                        <p className="font-medium text-foreground/80">{item.original_description}</p>
                        <p className="my-1">→ <strong className="text-green-600 dark:text-green-500">{item.upgraded_description}</strong></p>
                        <p className="text-sm text-foreground/90">{item.explanation}</p>
                        {item.example_sentence && (
                          <div className="mt-1 flex items-start text-xs text-foreground/70">
                            <span className="font-semibold mr-1.5 opacity-80 shrink-0">例句:</span>
                            <span className="italic">{item.example_sentence}</span>
                          </div>
                        )}
                        {contextParts && (
                          <div className="mt-2 text-xs text-foreground/70 p-2 bg-muted/40 rounded">
                            <p className="font-semibold mb-0.5 text-foreground/80">原文片段参考:</p>
                            <p className="italic">
                              {contextParts.prefix}
                              <mark className="bg-primary/20 text-primary font-semibold px-0.5 rounded not-italic">{contextParts.match}</mark>
                              {contextParts.suffix}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {(!vocabulary_upgradation || vocabulary_upgradation.length === 0) && (!phrase_upgradation || phrase_upgradation.length === 0) && (!sentence_upgradation || sentence_upgradation.length === 0) && (!detail_description_upgradation || detail_description_upgradation.length === 0) && (
              <div className="text-foreground/80">暂无续写升级建议。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab7: 升格文纯享版 */}
      <TabsContent value="pure_upgrade_text">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <CardTitle>升格文纯享版</CardTitle>
          </CardHeader>
          <CardContent className="rounded-b-lg p-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOriginalPure"
                  checked={showOriginalInPureUpgrade}
                  onCheckedChange={(checked) => setShowOriginalInPureUpgrade(!!checked)}
                  className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="showOriginalPure" className="text-sm font-medium text-foreground/80">
                  原文对照
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showAnnotationsPure"
                  checked={showAnnotationsInPureUpgrade}
                  onCheckedChange={(checked) => setShowAnnotationsInPureUpgrade(!!checked)}
                  className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="showAnnotationsPure" className="text-sm font-medium text-foreground/80">
                  显示批注
                </Label>
              </div>
            </div>
            {Array.isArray(pureUpgradation) && pureUpgradation.length > 0 ? (
              <div className="leading-relaxed text-base font-serif">
                {pureUpgradation.map(
                  // Ensure item type matches the array type
                  (item: { sentence: string; upgradation: string; comment?: string; }, idx: number) => (
                    <React.Fragment key={idx}>
                      {showOriginalInPureUpgrade && item.sentence && (
                        <span className="text-xs text-muted-foreground italic mr-1 opacity-90">
                          ({item.sentence})
                        </span>
                      )}
                      <span className="text-foreground font-medium">
                        {item.upgradation}
                      </span>
                      {showAnnotationsInPureUpgrade && item.comment && ( // Check if item.comment exists
                        <span className="ml-1 mr-0.5 text-[0.7rem] leading-none text-blue-600 dark:text-blue-400 italic px-0.5 align-baseline">
                          ({item.comment})
                        </span>
                      )}
                      {' '}
                    </React.Fragment>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">暂无升格文内容。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
