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

export default function CreatePage() {
    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <h1 className="text-2xl font-bold tracking-tight">新建批改任务</h1>
            <Separator />

            <h2 className="text-xl font-bold tracking-tight">1.&nbsp;&nbsp;题干录入</h2>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">1.1&nbsp;&nbsp;原题题干</Label>
                <Textarea placeholder="在这里输入原题题干…" id="message-2" className="max-h-[7lh]" />
            </div>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">1.2&nbsp;&nbsp;参考范文 <span className="text-sm text-muted-foreground">*可选</span></Label>
                <Textarea placeholder="在这里输入参考范文…" id="message-2" className="max-h-[7lh]" />
            </div>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">1.3&nbsp;&nbsp;作文类型</Label>
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
            <Separator />

            <h2 className="text-xl font-bold tracking-tight">2.&nbsp;&nbsp;文章录入</h2>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">2.1&nbsp;&nbsp;录入习作</Label>
                <Textarea placeholder="在这里输入你的作文…" id="message-2" className="max-h-[7lh]" />
            </div>
            <Separator />

            <h2 className="text-xl font-bold tracking-tight">3.&nbsp;&nbsp;批改选项</h2>
            <div className="items-top flex space-x-2">
                <Checkbox id="terms1" />
                <div className="grid gap-1.5 leading-none">
                    <label
                        htmlFor="terms1"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Accept terms and conditions
                    </label>
                    <p className="text-sm text-muted-foreground">
                        You agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}