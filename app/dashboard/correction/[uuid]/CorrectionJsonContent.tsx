/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react"; // Added useState
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Radar as RadarIcon,
  BookOpenText, // Icon for Origin
  Lightbulb,    // Icon for Analysis
  ListChecks,   // Icon for Topic Material
  ArrowUpCircle, // Icon for Writing Upgrade
  FileSignature, // Generic for Score (can be changed)
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
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import { Label } from "@/components/ui/label";       // Added Label

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const SectionTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <h2 className={`text-xl font-semibold mt-6 mb-3 first:mt-0 ${className || ''}`}>
    {children}
  </h2>
);

const SubSectionTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <h3 className={`text-lg font-medium mt-4 mb-2 ${className || ''}`}>
    {children}
  </h3>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CorrectionJsonContent({ data }: { data: any }) {
  const {
    question,
    answer,
    score_dimensions,
    interpretation,
    upgradation,
    pureUpgradation,
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
  const scoreLabels: { [key: string]: string } = {
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

  const radarData = scoreKeys.map((key) => ({
    dimension: scoreLabels[key] || key,
    score: score_dimensions[key]?.score || 0,
  }));

  // State for pure_upgrade_text options
  const [showOriginalInPureUpgrade, setShowOriginalInPureUpgrade] = useState(true);
  const [showAnnotationsInPureUpgrade, setShowAnnotationsInPureUpgrade] = useState(true);


  return (
    <Tabs defaultValue="origin" className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto">
        <TabsTrigger value="origin">原文与续写</TabsTrigger>
        <TabsTrigger value="score">评分维度</TabsTrigger>
        <TabsTrigger value="analysis">写作解析</TabsTrigger>
        <TabsTrigger value="topic_material">话题语料</TabsTrigger>
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
                <div className="whitespace-pre-line font-serif text-lg leading-relaxed p-1 clear-float"> {/* Removed bg, added drop-cap related classes */}
                  <p className="drop-cap">{question}</p>
                </div>
              </>
            )}
            {answer && (
              <>
                <SectionTitle className="mt-8">我的续写</SectionTitle>
                <div className="whitespace-pre-line font-serif text-lg leading-relaxed p-1 clear-float"> {/* Removed bg, added drop-cap related classes */}
                  <p className="drop-cap">{answer}</p>
                </div>
              </>
            )}
            {!question && !answer && <div>暂无原文或续写内容。</div>}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab2: 评分维度 */}
      <TabsContent value="score">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <RadarIcon className="h-5 w-5 text-primary" /> {/* Icon size adjusted */}
            <CardTitle>评分维度解析</CardTitle>
          </CardHeader>
          <CardContent>
            {score_dimensions && scoreKeys.length > 0 ? (
              <div className="space-y-8">
                <div>
                  <SectionTitle className="text-center mb-4">综合得分雷达图</SectionTitle>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[300px]"
                      >
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <PolarAngleAxis
                            dataKey="dimension"
                            tick={{ fill: "currentColor", fontSize: 12 }}
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
                          {/* Removed Badge, using simple span */}
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
                          <div className="text-sm text-muted-foreground pt-2 border-t mt-2">
                            {score_dimensions[key].explaination}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>暂无评分维度信息。</div>
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
                <p className="text-muted-foreground whitespace-pre-line">{preface.content}</p>
                <Separator className="my-4" />
              </>
            )}
            {Array.isArray(guiding_problems) && guiding_problems.length > 0 && (
              <>
                <SectionTitle>关键问题导入</SectionTitle>
                <ol className="list-decimal ml-6 space-y-2">
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
                <ul className="space-y-3">
                  {paragraph_analysis.map(
                    (item: { original_text: string; interpretation: string }, idx: number) => (
                      <li key={idx} className="p-3 border rounded-md">
                        <p className="font-medium text-primary mb-1">原文片段:</p>
                        <blockquote className="pl-3 italic border-l-2 border-primary-foreground text-muted-foreground mb-2">
                          {item.original_text}
                        </blockquote>
                        <p className="font-medium text-green-700 dark:text-green-500 mb-1">解析:</p>
                        <p className="text-sm">{item.interpretation}</p>
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
                <ol className="list-decimal ml-6 space-y-3">
                  {guiding_problems.map(
                    (item: { question: string; answer?: string }, idx: number) => (
                      <li key={idx}>
                        <p className="font-medium">{item.question}</p>
                        {item.answer && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{item.answer}</p>}
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
                <ol className="list-decimal ml-6 space-y-2">
                  {writing_framework_construction.sections.map(
                    (section: { title?: string, points: string[] }, idx: number) => (
                      <li key={idx}>
                        {section.title && <p className="font-medium">{section.title}</p>}
                        {Array.isArray(section.points) && section.points.length > 0 && (
                          <ul className="list-disc ml-5 mt-1 text-sm text-muted-foreground">
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
              <div>暂无写作解析信息。</div>
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
                              <p><strong className="text-primary">{v.word}</strong> {v.chinese_meaning && <span className="text-sm text-muted-foreground">({v.chinese_meaning})</span>}</p>
                              {v.explaination && <p className="text-sm my-1">{v.explaination}</p>}
                              {v.example_sentence && <p className="text-xs text-gray-500 dark:text-gray-400 italic">e.g.: {v.example_sentence}</p>}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {Array.isArray(topic.phrases) && topic.phrases.length > 0 && (
                      <>
                        <SubSectionTitle>常用短语</SubSectionTitle>
                        {/* Changed ul styling to match vocabulary for consistency */}
                        <ul className="space-y-3">
                          {topic.phrases.map((p: any, i: number) => (
                            <li key={i} className="p-3 border rounded-md">
                              {typeof p === 'object' && p !== null ? (
                                <>
                                  <p>
                                    <strong className="text-primary">{p.phrase}</strong>
                                    {p.chinese_meaning && <span className="text-sm text-muted-foreground"> ({p.chinese_meaning})</span>}
                                  </p>
                                  {p.explaination && <p className="text-sm my-1">{p.explaination}</p>}
                                  {p.example_sentence && <p className="text-xs text-gray-500 dark:text-gray-400 italic">e.g.: {p.example_sentence}</p>}
                                </>
                              ) : (
                                // Fallback for simple string phrases
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
                        {/* Assuming useful_sentences are still strings. If they also change, this needs similar adaptation. */}
                        <ul className="list-disc ml-6 space-y-1 text-sm">
                          {topic.useful_sentences.map((s: any, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </>
                    )}
                    {topicIdx < vocabulary_and_phrases_for_continuation.topics.length - 1 && <Separator className="my-6" />}
                  </div>
                )
              )
            ) : (
              <div>暂无话题语料信息。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab5: 续写升级 */}
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
                <ul className="space-y-3">
                  {vocabulary_upgradation.map((item, idx) => (
                    <li key={idx} className="p-3 border rounded-md">
                      <p>
                        <span className="font-medium text-gray-600 dark:text-gray-400">{item.original_word}</span> → <strong className="text-green-700 dark:text-green-500">{item.upgraded_word}</strong>
                        <span className="text-sm text-muted-foreground ml-2">({item.chinese_meaning})</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">e.g.: {item.example_sentence}</p>
                    </li>
                  ))}
                </ul>
                <Separator className="my-6" />
              </>
            )}
            {Array.isArray(phrase_upgradation) && phrase_upgradation.length > 0 && (
              <>
                <SectionTitle>短语升级</SectionTitle>
                <ul className="space-y-3">
                  {phrase_upgradation.map((item, idx) => (
                    <li key={idx} className="p-3 border rounded-md">
                      <p className="font-medium text-gray-600 dark:text-gray-400">{item.original_phrase}</p>
                      <p className="my-1">→ <strong className="text-green-700 dark:text-green-500">{item.upgraded_phrase}</strong></p>
                      <p className="text-sm text-muted-foreground">
                        {item.english_explanation} ({item.chinese_meaning})
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">e.g.: {item.example_sentence}</p>
                    </li>
                  ))}
                </ul>
                <Separator className="my-6" />
              </>
            )}
            {Array.isArray(sentence_upgradation) && sentence_upgradation.length > 0 && (
              <>
                <SectionTitle>句型升级</SectionTitle>
                <ul className="space-y-3">
                  {sentence_upgradation.map((item, idx) => (
                    <li key={idx} className="p-3 border rounded-md">
                      <p className="font-medium text-gray-600 dark:text-gray-400">{item.original_sentence}</p>
                      <p className="my-1">→ <strong className="text-green-700 dark:text-green-500">{item.upgraded_sentence}</strong></p>
                      <p className="text-sm text-muted-foreground">{item.explanation}</p>
                    </li>
                  ))}
                </ul>
                <Separator className="my-6" />
              </>
            )}
            {Array.isArray(detail_description_upgradation) && detail_description_upgradation.length > 0 && (
              <>
                <SectionTitle>细节描写升级</SectionTitle>
                <ul className="space-y-3">
                  {detail_description_upgradation.map((item, idx) => (
                    <li key={idx} className="p-3 border rounded-md">
                      <p className="font-medium text-gray-600 dark:text-gray-400">{item.original_description}</p>
                      <p className="my-1">→ <strong className="text-green-700 dark:text-green-500">{item.upgraded_description}</strong></p>
                      <p className="text-sm text-muted-foreground">{item.explanation}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(!vocabulary_upgradation || vocabulary_upgradation.length === 0) && (!phrase_upgradation || phrase_upgradation.length === 0) && (!sentence_upgradation || sentence_upgradation.length === 0) && (!detail_description_upgradation || detail_description_upgradation.length === 0) && (
              <div>暂无续写升级建议。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab6: 升格文纯享版 */}
      <TabsContent value="pure_upgrade_text">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <CardTitle>升格文纯享版</CardTitle>
          </CardHeader>
          {/* CardContent for pure upgrade now has a dark background and white text */}
          <CardContent className="text-slate-100 rounded-b-lg p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOriginalPure"
                  checked={showOriginalInPureUpgrade}
                  onCheckedChange={(checked) => setShowOriginalInPureUpgrade(!!checked)}
                  className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="showOriginalPure" className="text-sm font-medium text-slate-300">
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
                <Label htmlFor="showAnnotationsPure" className="text-sm font-medium text-slate-300">
                  显示批注
                </Label>
              </div>
            </div>

            {Array.isArray(pureUpgradation) && pureUpgradation.length > 0 ? (
              <div className="leading-relaxed text-base space-y-1">
                {pureUpgradation.map(
                  (item: { sentence: string; upgradation: string; comment: string; }, idx: number) => (
                    <React.Fragment key={idx}>
                      {showOriginalInPureUpgrade && (
                        <span className="block text-xs text-slate-400 italic mb-0.5 pl-1">
                          (原文: {item.sentence})
                        </span>
                      )}
                      <span
                        className="text-slate-50 font-medium" // Main upgraded text is brighter
                      // title={showOriginalInPureUpgrade ? `原文: ${item.sentence}` : undefined} // Alternative way to show original
                      >
                        {item.upgradation}
                      </span>
                      {showAnnotationsInPureUpgrade && item.comment && (
                        <span
                          className="ml-1.5 mr-0.5 text-[0.7rem] leading-none text-cyan-300 bg-cyan-800/60 ring-1 ring-cyan-700/70 px-1.5 py-0.5 rounded-sm align-baseline"
                        >
                          {item.comment}
                        </span>
                      )}
                      {' '}
                    </React.Fragment>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">暂无升格文内容。</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}