import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Radar } from "lucide-react";

export default function CorrectionJsonContent({ data }: { data: any }) {
    // Corrected destructuring based on the JSON structure
    const {
        question,
        answer,
        score_dimensions,
        interpretation, // interpretation is an object
        upgradation, // upgradation is an object
        pureUpgradation // pureUpgradation is an array at the top level
    } = data;

    // Destructure nested objects/arrays from interpretation and upgradation
    const {
        preface,
        guiding_problems,
        paragraph_analysis,
        writing_framework_construction,
        vocabulary_and_phrases_for_continuation
    } = interpretation || {}; // Use default empty object in case interpretation is null/undefined

    const {
        vocabulary_upgradation,
        phrase_upgradation, // Add phrase_upgradation here
        sentence_upgradation,
        detail_description_upgradation
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
        literary_competence_teacher_evaluation: "文学素养与教师评价"
    };

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
                        <CardTitle>原文</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Added check for question */}
                        {question && <div className="whitespace-pre-line mb-4">{question}</div>}
                        <Separator />
                        {/* Added check for answer */}
                        {answer && (
                             <div className="mt-4">
                                <span className="font-bold">续写：</span>
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
                         {/* Added check for score_dimensions */}
                        {score_dimensions && scoreKeys.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {scoreKeys.map((key: string) => (
                                    <div key={key} className="flex flex-col gap-1 border rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{scoreLabels[key] || key}</Badge>
                                            {/* Added check for score_dimensions[key] */}
                                            {score_dimensions[key] && (
                                                 <span className="text-lg font-bold text-green-600">{score_dimensions[key].score}分</span>
                                            )}
                                        </div>
                                         {/* Added check for score_dimensions[key] and explaination */}
                                        {score_dimensions[key]?.explaination && (
                                             <div className="text-sm text-muted-foreground">{score_dimensions[key].explaination}</div>
                                        )}
                                    </div>
                                ))}
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
                                <span className="font-bold">前言：</span>
                                <span>{preface.content}</span>
                            </div>
                        )}
                        {/* Corrected access for guiding_problems */}
                        {Array.isArray(guiding_problems) && guiding_problems.length > 0 && (
                            <div className="mb-4">
                                <span className="font-bold">引导问题：</span>
                                <ul className="list-disc ml-6">
                                    {guiding_problems.map((item: { question: string; answer?: string }, idx: number) => (
                                        <li key={idx} className="mb-1">
                                            <span className="font-semibold">{item.question}</span>
                                            {item.answer && <>：{item.answer}</>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Corrected access for paragraph_analysis */}
                        {Array.isArray(paragraph_analysis) && paragraph_analysis.length > 0 && (
                            <div className="mb-4">
                                <span className="font-bold">段落解析：</span>
                                <ul className="list-disc ml-6">
                                    {paragraph_analysis.map((item: { original_text: string; interpretation: string }, idx: number) => (
                                        <li key={idx} className="mb-2">
                                            <span className="text-muted-foreground">{item.original_text}</span>
                                            <br />
                                            <span>{item.interpretation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Corrected access for writing_framework_construction */}
                        {writing_framework_construction?.sections?.length > 0 && (
                            <div>
                                <span className="font-bold">写作框架：</span>
                                <ol className="list-decimal ml-6">
                                    {writing_framework_construction.sections.map((section: { points: string[] }, idx: number) => (
                                        <li key={idx}>
                                            <ul className="list-disc ml-4">
                                                {Array.isArray(section.points) && section.points.map((point: string, i: number) => (
                                                    <li key={i}>{point}</li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
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
                        {/* 话题词汇、短语、句型 */}
                         {/* Corrected access for vocabulary_and_phrases_for_continuation */}
                        {vocabulary_and_phrases_for_continuation?.topics?.length > 0 && (
                            <div className="mb-4">
                                <span className="font-bold">话题词汇与表达：</span>
                                {vocabulary_and_phrases_for_continuation.topics.map((topic: {
                                    topic_name: string;
                                    vocabulary?: {
                                        word: string;
                                        explaination: string;
                                        chinese_meaning: string;
                                        example_sentence: string;
                                    }[];
                                    phrases?: string[];
                                    useful_sentences?: string[];
                                }, idx: number) => (
                                    <div key={idx} className="mb-2">
                                        <span className="font-semibold">{topic.topic_name}</span>
                                        {/* Added check for vocabulary */}
                                        {Array.isArray(topic.vocabulary) && topic.vocabulary.length > 0 && (
                                            <ul className="list-disc ml-6">
                                                {topic.vocabulary.map((v: { word: string; explaination: string; chinese_meaning: string; example_sentence: string; }, i: number) => (
                                                    <li key={i}>
                                                        <span className="font-bold">{v.word}</span>：{v.chinese_meaning}（{v.explaination}）<br />
                                                        <span className="text-muted-foreground">例句：{v.example_sentence}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {/* Added check for phrases */}
                                        {Array.isArray(topic.phrases) && topic.phrases.length > 0 && (
                                            <div>
                                                <span className="font-semibold">短语：</span>
                                                <ul className="list-disc ml-6">
                                                    {topic.phrases.map((p: string, i: number) => (
                                                        <li key={i}>{p}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {/* Added check for useful_sentences */}
                                        {Array.isArray(topic.useful_sentences) && topic.useful_sentences.length > 0 && (
                                            <div>
                                                <span className="font-semibold">实用句型：</span>
                                                <ul className="list-disc ml-6">
                                                    {topic.useful_sentences.map((s: string, i: number) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 单词升级 */}
                         {/* Corrected access for vocabulary_upgradation */}
                        {Array.isArray(vocabulary_upgradation) && vocabulary_upgradation.length > 0 && (
                            <div className="mb-4">
                                <span className="font-bold">单词升级：</span>
                                <ul className="list-disc ml-6">
                                    {vocabulary_upgradation.map((item: { original_word: string; upgraded_word: string; chinese_meaning: string; example_sentence: string }, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-bold">{item.original_word}</span> → <span className="text-green-700">{item.upgraded_word}</span>（{item.chinese_meaning}）<br />
                                            <span className="text-muted-foreground">例句：{item.example_sentence}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Added Phrase Upgradation */}
                        {/* Corrected access for phrase_upgradation */}
                        {Array.isArray(phrase_upgradation) && phrase_upgradation.length > 0 && (
                             <div className="mb-4">
                                <span className="font-bold">短语升级：</span>
                                <ul className="list-disc ml-6">
                                    {phrase_upgradation.map((item: { original_phrase: string; upgraded_phrase: string; english_explanation: string; chinese_meaning: string; example_sentence: string }, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-bold">{item.original_phrase}</span> → <span className="text-green-700">{item.upgraded_phrase}</span>（{item.chinese_meaning}）<br />
                                            <span className="text-muted-foreground">解释：{item.english_explanation}</span><br />
                                            <span className="text-muted-foreground">例句：{item.example_sentence}</span>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        )}

                        {/* 句型升级 */}
                         {/* Corrected access for sentence_upgradation */}
                        {Array.isArray(sentence_upgradation) && sentence_upgradation.length > 0 && (
                            <div className="mb-4">
                                <span className="font-bold">句型升级：</span>
                                <ul className="list-disc ml-6">
                                    {sentence_upgradation.map((item: { original_sentence: string; upgraded_sentence: string; explanation: string }, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-bold">{item.original_sentence}</span> → <span className="text-green-700">{item.upgraded_sentence}</span><br />
                                            <span className="text-muted-foreground">{item.explanation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 细节升级 */}
                         {/* Corrected access for detail_description_upgradation */}
                        {Array.isArray(detail_description_upgradation) && detail_description_upgradation.length > 0 && (
                            <div className="mb-4">
                                <span className="font-bold">细节描写升级：</span>
                                <ul className="list-disc ml-6">
                                    {detail_description_upgradation.map((item: { original_description: string; upgraded_description: string; explanation: string }, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-bold">{item.original_description}</span> → <span className="text-green-700">{item.upgraded_description}</span><br />
                                            <span className="text-muted-foreground">{item.explanation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* 纯升级 */}
                         {/* Corrected access for pureUpgradation - this was already correct as it's top-level */}
                        {Array.isArray(pureUpgradation) && pureUpgradation.length > 0 && (
                            <div>
                                <span className="font-bold">原句升级：</span>
                                <ul className="list-disc ml-6">
                                    {pureUpgradation.map((item: { sentence: string; upgradation: string; comment: string }, idx: number) => (
                                        <li key={idx}>
                                            <span className="font-bold">{item.sentence}</span> → <span className="text-green-700">{item.upgradation}</span><br />
                                            <span className="text-muted-foreground">{item.comment}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}