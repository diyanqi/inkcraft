'use client'

import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Check, ScanText } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useState, useRef } from "react"

export default function CreatePage() {
    const [originalText, setOriginalText] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleOCR = async (file: File) => {
        try {
            const formData = new FormData()
            formData.append('image', file)

            const response = await fetch('https://api.nn.ci/ocr/file/json', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()
            console.log(data);
            if (data.status === 200 && data.data) {
                setOriginalText(data.data.join('\n'))
            } else {
                throw new Error('OCR识别失败')
            }
        } catch (error) {
            console.error('OCR Error:', error)
            alert('文字识别失败，请重试')
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 第一个卡片：题干录入 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">题干录入</CardTitle>
                        <CardDescription>录入并匹配原题，提供精准化解析。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="title" className="text-md">标题 <span className="text-sm text-muted-foreground">*可选</span></Label>
                            <input
                                type="text"
                                id="title"
                                placeholder="留白以自动生成"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="message-1" className="text-md">原题题干</Label>
                            <Textarea 
                                placeholder="在这里输入原题题干…" 
                                id="message-2" 
                                className="max-h-[7lh]"
                                value={originalText}
                                onChange={(e) => setOriginalText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleOCR(file)
                                    }}
                                />
                                <Button
                                    type="button"
                                    className="flex items-center gap-1 text-sm"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ScanText/>
                                    文字识别
                                </Button>
                            </div>
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="message-1" className="text-md">参考范文 <span className="text-sm text-muted-foreground">*可选</span></Label>
                            <Textarea placeholder="在这里输入参考范文…" id="message-2" className="max-h-[7lh]" />
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="message-1" className="text-md">作文类型</Label>
                            <Select>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gaokao-english-continuation">高考英语 读后续写</SelectItem>
                                    <SelectItem value="gaokao-english-practical" disabled>高考英语 应用文</SelectItem>
                                    <SelectItem value="gaokao-chinese-composition" disabled>高考语文 作文</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 第二个卡片：文章录入 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">文章录入</CardTitle>
                        <CardDescription>录入待批改的作文，支持文字识别。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="message-1" className="text-md">录入习作</Label>
                            <Textarea placeholder="在这里输入你的作文…" id="message-2" className="max-h-[7lh]" />
                        </div>
                    </CardContent>
                </Card>

                {/* 第三个卡片：批改选项 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">批改选项</CardTitle>
                        <CardDescription>在这里自定义生成结果的展示内容。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Label className="text-md">内容设定</Label>
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms0" defaultChecked />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms0"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    题目解读
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    通读全文、了解背景、分析线索、展现思路。
                                </p>
                            </div>
                        </div>
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms1" defaultChecked />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms1"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    综合评价
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    词汇语法、情节内容、细节表达、创新思维。
                                </p>
                            </div>
                        </div>
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms2" defaultChecked />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms2"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    夯实基础
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    拼写修正、语法修正。
                                </p>
                            </div>
                        </div>
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms3" defaultChecked />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms3"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    进阶提升
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    高级词汇替换、高级句式替换。
                                </p>
                            </div>
                        </div>
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms4" defaultChecked />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms4"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    全文润色
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    逐句评析、改文纯享。
                                </p>
                            </div>
                        </div>
                        <div className="items-top flex space-x-2">
                            <Checkbox id="terms5" defaultChecked />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="terms5"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    提升方向
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    总结点评、展望未来。
                                </p>
                            </div>
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label className="text-md">讲解语气 <span className="text-sm text-muted-foreground">*实验性</span></Label>
                            <Select defaultValue="default">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="选择语气" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">默认</SelectItem>
                                    <SelectItem value="serious">一本正经</SelectItem>
                                    <SelectItem value="humorous">幽默风趣</SelectItem>
                                    <SelectItem value="sharp">犀利锐评</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end mt-8">
                <Button
                    type="button"
                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    <Check /> 开始批改
                </Button>
            </div>
        </div>
    )
}