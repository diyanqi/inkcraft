import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">注册</h1>
                                <p className="text-muted-foreground text-balance">
                                    创建您的账户
                                </p>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">邮箱</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">密码</Label>
                                </div>
                                <Input id="password" type="password" required />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password_confirm">确认密码</Label>
                                </div>
                                <Input id="password_confirm" type="password" required />
                            </div>
                            <Button type="submit" className="w-full">
                                注册
                            </Button>
                            <div className="text-center text-sm">
                                已有账户？{" "}
                                <a href="/login" className="underline underline-offset-4">
                                    立即登录
                                </a>
                            </div>
                        </div>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="https://t.alcy.cc/fj"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                点击继续即表示您同意我们的<a href="#">服务条款</a>{" "}
                和<a href="#">隐私政策</a>。
            </div>
        </div>
    )
}
