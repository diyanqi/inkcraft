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

            <h2 className="text-xl font-bold tracking-tight">1&nbsp;&nbsp;题干录入</h2>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="title" className="text-md">1.1&nbsp;&nbsp;标题 <span className="text-sm text-muted-foreground">*可选</span></Label>
                <input
                    type="text"
                    id="title"
                    placeholder="留白以自动生成"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">1.2&nbsp;&nbsp;原题题干</Label>
                <Textarea placeholder="在这里输入原题题干…" id="message-2" className="max-h-[7lh]" />
            </div>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">1.3&nbsp;&nbsp;参考范文 <span className="text-sm text-muted-foreground">*可选</span></Label>
                <Textarea placeholder="在这里输入参考范文…" id="message-2" className="max-h-[7lh]" />
            </div>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">1.4&nbsp;&nbsp;作文类型</Label>
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

            <h2 className="text-xl font-bold tracking-tight">2&nbsp;&nbsp;文章录入</h2>
            <div className="grid w-auto max-w-3xl gap-1.5">
                <Label htmlFor="message-1" className="text-md">2.1&nbsp;&nbsp;录入习作</Label>
                <Textarea placeholder="在这里输入你的作文…" id="message-2" className="max-h-[7lh]" />
            </div>
            <Separator />

            <h2 className="text-xl font-bold tracking-tight">3&nbsp;&nbsp;批改选项</h2>
            <Label className="text-md">3.1&nbsp;&nbsp;内容设定</Label>
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
                <Label className="text-md">3.2&nbsp;&nbsp;讲解语气 <span className="text-sm text-muted-foreground">*实验性</span></Label>
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

            <div className="flex justify-end mt-8">
                <button
                    type="button"
                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    开始批改
                </button>
            </div>
        </div>
    )
}