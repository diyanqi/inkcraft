import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Radar } from "lucide-react";
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

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CorrectionJsonContent({ data }: { data: any }) {
  // Corrected destructuring based on the JSON structure
  const {
    question,
    answer,
    score_dimensions,
    interpretation, // interpretation is an object
    upgradation, // upgradation is an object
    pureUpgradation, // pureUpgradation is an array at the top level
  } = data;

  // Destructure nested objects/arrays from interpretation and upgradation
  const {
    preface,
    guiding_problems,
    paragraph_analysis,
    writing_framework_construction,
    vocabulary_and_phrases_for_continuation,
  } = interpretation || {}; // Use default empty object in case interpretation is null/undefined

  const {
    vocabulary_upgradation,
    phrase_upgradation, // Add phrase_upgradation here
    sentence_upgradation,
    detail_description_upgradation,
  } = upgradation || {}; // Use default empty object in case upgradation is null/undefined

  // 评分维度处理
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

  // 将评分维度数据转换为雷达图所需格式
  const radarData = scoreKeys.map((key) => ({
    dimension: scoreLabels[key] || key,
    score: score_dimensions[key]?.score || 0,
  }));

  return (
    <Tabs defaultValue="origin" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="origin">原文与续写</TabsTrigger>
        <TabsTrigger value="score">评分维度</TabsTrigger>
        <TabsTrigger value="analysis">写作解析</TabsTrigger>
        <TabsTrigger value="upgrade">表达升级</TabsTrigger>
      </TabsList>

      {/* Tab1: 原文与续写 */}
      <TabsContent value="origin">
        <Card>
          <CardHeader>
            <CardTitle>真题回顾</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Added check for question */}
            {question && (
              <div className="mb-4">
                <span className="font-bold">题目</span>
                <div className="whitespace-pre-line">{question}</div>
              </div>
            )}
            <Separator />
            {/* Added check for answer */}
            {answer && (
              <div className="mt-4">
                <span className="font-bold">我的续写</span>
                <div className="whitespace-pre-line">{answer}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab2: 评分维度 */}
      <TabsContent value="score">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Radar className="text-primary" />
            <CardTitle>评分维度</CardTitle>
          </CardHeader>
          <CardContent>
            {score_dimensions && scoreKeys.length > 0 ? (
              <div className="space-y-6">
                {/* 雷达图 */}
                <div className="h-[250px] w-[full]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartContainer
                      config={chartConfig}
                      className="mx-auto aspect-square max-h-[250px] w-[full]"
                    >
                      <RadarChart data={radarData} className="w-[full]">
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
                          dot={{
                            r: 4,
                            fillOpacity: 1,
                            fill: "hsl(var(--primary))",
                          }}
                        />
                      </RadarChart>
                    </ChartContainer>
                  </ResponsiveContainer>
                </div>

                {/* 详细得分卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scoreKeys.map((key: string) => (
                    <div
                      key={key}
                      className="flex flex-col gap-1 border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {scoreLabels[key] || key}
                        </Badge>
                        {score_dimensions[key] && (
                          <span className="text-lg font-bold text-green-600">
                            {score_dimensions[key].score}分
                          </span>
                        )}
                      </div>
                      {score_dimensions[key]?.explaination && (
                        <div className="text-sm text-muted-foreground">
                          {score_dimensions[key].explaination}
                        </div>
                      )}
                    </div>
                  ))}
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
          <CardHeader>
            <CardTitle>写作思路与解析</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Corrected access for preface */}
            {preface?.content && (
              <div className="mb-4">
                <span className="font-bold">前言</span>
                <br />
                <span>{preface.content}</span>
              </div>
            )}
            {/* Corrected access for guiding_problems */}
            {Array.isArray(guiding_problems) && guiding_problems.length > 0 && (
              <div className="mb-4">
                <span className="font-bold">问题导入</span>
                <ol className="list-decimal ml-6">
                  {guiding_problems.map(
                    (
                      item: { question: string; answer?: string },
                      idx: number
                    ) => (
                      <li key={idx} className="mb-1">
                        <span>{item.question}</span>
                        {/* {item.answer && <>：{item.answer}</>} */}
                      </li>
                    )
                  )}
                </ol>
              </div>
            )}
            {/* Corrected access for paragraph_analysis */}
            {Array.isArray(paragraph_analysis) &&
              paragraph_analysis.length > 0 && (
                <div className="mb-4">
                  <span className="font-bold">段落解析</span>
                  <ul className="list-disc ml-6">
                    {paragraph_analysis.map(
                      (
                        item: { original_text: string; interpretation: string },
                        idx: number
                      ) => (
                        <li key={idx} className="mb-2">
                          <span className="text-muted-foreground">
                            {item.original_text}
                          </span>
                          <br />
                          <span>{item.interpretation}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            {Array.isArray(guiding_problems) && guiding_problems.length > 0 && (
              <div className="mb-4">
                <span className="font-bold">问题解答</span>
                <ol className="list-decimal ml-6">
                  {guiding_problems.map(
                    (
                      item: { question: string; answer?: string },
                      idx: number
                    ) => (
                      <li key={idx} className="mb-1">
                        <span>{item.question}</span><br />
                        {item.answer && <>{item.answer}</>}
                      </li>
                    )
                  )}
                </ol>
              </div>
            )}
            {/* Corrected access for writing_framework_construction */}
            {writing_framework_construction?.sections?.length > 0 && (
              <div>
                <span className="font-bold">写作框架</span>
                <ol className="list-decimal ml-6">
                  {writing_framework_construction.sections.map(
                    (section: { points: string[] }, idx: number) => (
                      <li key={idx}>
                        {Array.isArray(section.points) &&
                          section.points.map((point: string, i: number) => (
                            <span key={i}>{point}<br /></span>
                          ))}
                      </li>
                    )
                  )}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab4: 表达升级 */}
      <TabsContent value="upgrade">
        <Card>
          <CardHeader>
            <CardTitle>词汇与表达升级</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            {/* 话题词汇、短语、句型 */}
            {/* Corrected access for vocabulary_and_phrases_for_continuation */}
            {vocabulary_and_phrases_for_continuation?.topics?.length > 0 && (
              <div className="mb-4">
                <span className="font-bold mb-4">话题词汇</span>
                {vocabulary_and_phrases_for_continuation.topics.map(
                  (
                    topic: {
                      topic_name: string;
                      vocabulary?: {
                        word: string;
                        explaination: string;
                        chinese_meaning: string;
                        example_sentence: string;
                      }[];
                      phrases?: string[];
                      useful_sentences?: string[];
                    },
                    idx: number
                  ) => (
                    <div key={idx} className="mb-2">
                      <span className="font-medium">{topic.topic_name}</span><br />
                      {/* Added check for vocabulary */}
                      <span className="font-semibold text-sm">词汇</span>
                      {Array.isArray(topic.vocabulary) &&
                        topic.vocabulary.length > 0 && (
                          <ul className="list-disc ml-6">
                            {topic.vocabulary.map(
                              (
                                v: {
                                  word: string;
                                  explaination: string;
                                  chinese_meaning: string;
                                  example_sentence: string;
                                },
                                i: number
                              ) => (
                                <li key={i}>
                                  <span className="font-medium">{v.word}</span><br />
                                  {v.explaination} &nbsp;&nbsp;&nbsp; {v.chinese_meaning}<br />
                                  <span className="text-muted-foreground">
                                    • e.g.: {v.example_sentence}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        )}
                      {/* Added check for phrases */}
                      {Array.isArray(topic.phrases) &&
                        topic.phrases.length > 0 && (
                          <div>
                            <span className="font-semibold text-sm">短语</span>
                            <ul className="list-disc ml-6">
                              {topic.phrases.map((p: string, i: number) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {/* Added check for useful_sentences */}
                      {Array.isArray(topic.useful_sentences) &&
                        topic.useful_sentences.length > 0 && (
                          <div>
                            <span className="font-semibold text-sm">实用句子</span>
                            <ul className="list-disc ml-6">
                              {topic.useful_sentences.map(
                                (s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* 单词升级 */}
            {/* Corrected access for vocabulary_upgradation */}
            <Separator className="mb-4" />
            {Array.isArray(vocabulary_upgradation) &&
              vocabulary_upgradation.length > 0 && (
                <div className="mb-4">
                  <span className="font-bold">词汇升级</span>
                  <ul className="list-disc ml-6">
                    {vocabulary_upgradation.map(
                      (
                        item: {
                          original_word: string;
                          upgraded_word: string;
                          chinese_meaning: string;
                          example_sentence: string;
                        },
                        idx: number
                      ) => (
                        <li key={idx}>
                          <span className="font-bold">
                            {item.original_word}
                          </span>{" "}
                          →{" "}
                          <span className="text-green-700">
                            {item.upgraded_word}
                          </span>
                          &nbsp;&nbsp;&nbsp;{item.chinese_meaning}<br />
                          <span className="text-muted-foreground">
                            e.g.: {item.example_sentence}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* Added Phrase Upgradation */}
            {/* Corrected access for phrase_upgradation */}
            <Separator className="mb-4" />
            {Array.isArray(phrase_upgradation) &&
              phrase_upgradation.length > 0 && (
                <div className="mb-4">
                  <span className="font-bold">词组升级</span>
                  <ul className="list-disc ml-6">
                    {phrase_upgradation.map(
                      (
                        item: {
                          original_phrase: string;
                          upgraded_phrase: string;
                          english_explanation: string;
                          chinese_meaning: string;
                          example_sentence: string;
                        },
                        idx: number
                      ) => (
                        <li key={idx}>
                          <span className="font-bold">
                            {item.original_phrase}
                          </span>{" "}<br />
                          →{" "}
                          <span className="text-green-700">
                            {item.upgraded_phrase}
                          </span>
                          <br />
                          <span className="text-muted-foreground">
                            • {item.english_explanation}&nbsp;&nbsp;&nbsp;{item.chinese_meaning}
                          </span>
                          <br />
                          <span className="text-muted-foreground">
                            • e.g.: {item.example_sentence}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* 句型升级 */}
            {/* Corrected access for sentence_upgradation */}
            <Separator className="mb-4" />
            {Array.isArray(sentence_upgradation) &&
              sentence_upgradation.length > 0 && (
                <div className="mb-4">
                  <span className="font-bold">句型升级</span>
                  <ul className="list-disc ml-6">
                    {sentence_upgradation.map(
                      (
                        item: {
                          original_sentence: string;
                          upgraded_sentence: string;
                          explanation: string;
                        },
                        idx: number
                      ) => (
                        <li key={idx}>
                          <span className="font-bold">
                            {item.original_sentence}
                          </span>{" "}<br />
                          →{" "}
                          <span className="text-green-700">
                            {item.upgraded_sentence}
                          </span>
                          <br />
                          <span className="text-muted-foreground">
                            {item.explanation}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* 细节升级 */}
            {/* Corrected access for detail_description_upgradation */}
            <Separator className="mb-4" />
            {Array.isArray(detail_description_upgradation) &&
              detail_description_upgradation.length > 0 && (
                <div className="mb-4">
                  <span className="font-bold">细节描写升级</span>
                  <ul className="list-disc ml-6">
                    {detail_description_upgradation.map(
                      (
                        item: {
                          original_description: string;
                          upgraded_description: string;
                          explanation: string;
                        },
                        idx: number
                      ) => (
                        <li key={idx}>
                          <span className="font-bold">
                            {item.original_description}
                          </span>{" "}<br />
                          →{" "}
                          <span className="text-green-700">
                            {item.upgraded_description}
                          </span>
                          <br />
                          <span className="text-muted-foreground">
                            {item.explanation}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* 纯升级 */}
            {/* Corrected access for pureUpgradation - this was already correct as it's top-level */}
            <Separator className="mb-4" />
            {Array.isArray(pureUpgradation) && pureUpgradation.length > 0 && (
              <div>
                <span className="font-bold">升格文纯享版</span>
                <ul className="list-disc ml-6">
                  {pureUpgradation.map(
                    (
                      item: {
                        sentence: string;
                        upgradation: string;
                        comment: string;
                      },
                      idx: number
                    ) => (
                      <li key={idx}>
                        <span className="font-bold">{item.sentence}</span> →{" "}
                        <span className="text-green-700">
                          {item.upgradation}
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          {item.comment}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
