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
import { toast } from "sonner"

import { useState, useRef } from "react"
import { Loader2 } from "lucide-react"
import imageCompression from 'browser-image-compression';

export default function CreatePage() {
    // 状态管理
    const [originalText, setOriginalText] = useState("")
    const [referenceText, setReferenceText] = useState("")
    const [essayText, setEssayText] = useState("")
    const [isOriginalOCRLoading, setIsOriginalOCRLoading] = useState(false)
    const [isReferenceOCRLoading, setIsReferenceOCRLoading] = useState(false)
    const [isEssayOCRLoading, setIsEssayOCRLoading] = useState(false)
    
    // 文件输入引用
    const originalFileInputRef = useRef<HTMLInputElement>(null)
    const referenceFileInputRef = useRef<HTMLInputElement>(null)
    const essayFileInputRef = useRef<HTMLInputElement>(null)

    // OCR处理函数 - 使用后端API
    const handleOCR = async (file: File, textSetter: (text: string) => void, loadingSetter: (loading: boolean) => void) => {
        if (!file) return

        const maxSizeMB = 1;
        const options = {
            maxSizeMB: maxSizeMB,
            maxWidthOrHeight: 1920, // Optional: resize the image if needed
            useWebWorker: true,
        }

        let processedFile = file;

        try {
            loadingSetter(true)

            // Check file size
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast.info(`图片大小超过 ${maxSizeMB}MB，正在尝试压缩...`);
                try {
                    processedFile = await imageCompression(file, options);
                    toast.success('图片压缩成功');
                } catch (compressionError) {
                    console.error('Image compression error:', compressionError);
                    toast.error('图片压缩失败，请尝试上传更小的图片');
                    loadingSetter(false);
                    return; // Stop if compression fails
                }
            }

            const formData = new FormData()
            formData.append('file', processedFile, file.name) // Use processedFile but keep original name

            // 使用后端API处理OCR请求
            const response = await fetch('/api/ocr', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (response.ok && data.success) {
                // 设置文本（后端已经处理了换行符）
                textSetter(data.text)
                toast.success('文字识别成功')
            } else {
                 // Handle specific backend error for large files
                if (response.status === 413) {
                     toast.error(data.error || '图片文件过大，请压缩后重试');
                } else {
                    throw new Error(data.error || 'OCR识别失败')
                }
            }
        } catch (error) {
            console.error('OCR Error:', error)
            toast.error(`文字识别失败: ${error instanceof Error ? error.message : '请重试'}`)
        } finally {
            loadingSetter(false)
        }
    }

    // 创建OCR按钮组件
    const OCRButton = ({ 
        isLoading, 
        onClick 
    }: { 
        isLoading: boolean, 
        onClick: () => void 
    }) => (
        <Button
            type="button"
            className="flex items-center gap-1 text-sm"
            variant="outline"
            disabled={isLoading}
            onClick={onClick}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    识别中...
                </>
            ) : (
                <>
                    <ScanText className="h-4 w-4" />
                    文字识别
                </>
            )}
        </Button>
    )

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
                            <Label htmlFor="original-text" className="text-md">原题题干</Label>
                            <Textarea 
                                placeholder="在这里输入原题题干…" 
                                id="original-text" 
                                className="max-h-[7lh]"
                                value={originalText}
                                onChange={(e) => setOriginalText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={originalFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleOCR(file, setOriginalText, setIsOriginalOCRLoading)
                                        // Reset file input value to allow re-selecting the same file
                                        if (e.target) {
                                            e.target.value = ''
                                        }
                                    }}
                                />
                                <OCRButton 
                                    isLoading={isOriginalOCRLoading}
                                    onClick={() => originalFileInputRef.current?.click()}
                                />
                            </div>
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="reference-text" className="text-md">参考范文 <span className="text-sm text-muted-foreground">*可选</span></Label>
                            <Textarea 
                                placeholder="在这里输入参考范文…" 
                                id="reference-text" 
                                className="max-h-[7lh]" 
                                value={referenceText}
                                onChange={(e) => setReferenceText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={referenceFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleOCR(file, setReferenceText, setIsReferenceOCRLoading)
                                        // Reset file input value to allow re-selecting the same file
                                        if (e.target) {
                                            e.target.value = ''
                                        }
                                    }}
                                />
                                <OCRButton 
                                    isLoading={isReferenceOCRLoading}
                                    onClick={() => referenceFileInputRef.current?.click()}
                                />
                            </div>
                        </div>
                        <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label htmlFor="essay-type" className="text-md">作文类型</Label>
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
                            <Label htmlFor="essay-text" className="text-md">录入习作</Label>
                            <Textarea 
                                placeholder="在这里输入你的作文…" 
                                id="essay-text" 
                                className="max-h-[14lh]" 
                                value={essayText}
                                onChange={(e) => setEssayText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={essayFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleOCR(file, setEssayText, setIsEssayOCRLoading)
                                        // Reset file input value to allow re-selecting the same file
                                        if (e.target) {
                                            e.target.value = ''
                                        }
                                    }}
                                />
                                <OCRButton 
                                    isLoading={isEssayOCRLoading}
                                    onClick={() => essayFileInputRef.current?.click()}
                                />
                            </div>
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
                    <div className="grid w-auto max-w-3xl gap-1.5">
                            <Label className="text-md">选择模型</Label>
                            <Select defaultValue="gpt4">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="选择模型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt4">GPT-4o</SelectItem>
                                    <SelectItem value="llama">Meta Llama</SelectItem>
                                    <SelectItem value="deepseek">Deepseek-v3</SelectItem>
                                    <SelectItem value="gemini">Google Gemini</SelectItem>
                                    <SelectItem value="qwen">通义千问</SelectItem>
                                </SelectContent>
                            </Select>
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