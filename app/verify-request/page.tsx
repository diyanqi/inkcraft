'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconBrandApple, IconBrandGmail, IconBrandNotion, IconBrandQq } from "@tabler/icons-react"

export default function RegisterPage() {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-3xl">
                <div className={cn("flex flex-col gap-6")}>
                    <Card className="overflow-hidden p-0">
                        <CardContent className="grid p-0 md:grid-cols-2">
                            <form className="p-6 md:p-8">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col items-center text-center">
                                        <h1 className="text-2xl font-bold">完成</h1>
                                        <p className="text-muted-foreground text-balance">
                                            登录链接已发送到您的邮箱，<br />链接在 5 分钟内有效。
                                        </p>
                                    </div>
                                    <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                        <span className="bg-card text-muted-foreground relative z-10 px-2">
                                            快速打开邮箱
                                        </span>
                                    </div>
                                    <div className="grid gap-4">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full"
                                            onClick={() => window.open('https://mail.qq.com', '_blank')}
                                        >
                                            <IconBrandQq />
                                            QQ 邮箱
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full"
                                            onClick={() => window.open('https://mail.163.com', '_blank')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="45.511 0 932.979 1046.756" fill="currentColor"><g><path d="m364.089 11.378c-62.578 11.378-73.956 22.755-73.956 56.889 0 28.444 0 28.444 62.578 22.755 85.333-11.378 301.511-11.378 341.333 5.69 45.512 17.066 62.578 51.2 68.267 130.844 11.378 85.333-17.067 119.466-96.711 119.466-28.444 0-119.467 5.69-199.111 5.69-176.356 5.688-182.045 0-187.733-136.534 0-51.2-5.69-96.711-11.378-102.4-11.378-22.756-56.89-17.068-68.268 11.378-11.378 28.444-17.067 142.222 0 210.488 17.067 79.645 39.822 102.4 119.467 108.09 56.889 5.688 68.266 11.377 51.2 22.755-34.134 39.822-153.6 91.022-227.556 91.022-56.889 0-85.333 22.756-73.955 62.578 11.377 39.822 91.022 34.133 233.244-17.067 51.2-17.066 153.6-102.4 182.045-142.222 22.755-34.133 22.755-34.133 142.222-34.133 147.91 0 199.11-11.378 221.866-73.956 22.756-51.2 22.756-85.333 5.69-164.978-28.445-130.844-45.512-147.91-153.6-176.355-51.2-11.378-273.067-11.378-335.645 0zm0 0"/><path d="m358.4 193.422c-5.689 11.378-5.689 22.756-5.689 39.822 5.689 17.067 17.067 17.067 159.289 17.067h153.6l5.689-34.133c5.689-39.822 11.378-34.134-159.289-39.822-96.711 0-142.222 5.688-153.6 17.066zm216.178 261.69c-22.756 11.377-28.445 22.755-22.756 45.51 5.69 28.445-11.378 39.822-130.844 119.467-85.334 56.889-164.978 96.711-210.49 113.778-136.532 39.822-164.977 56.889-130.844 96.71 51.2 62.579 278.756-56.888 529.067-267.377 51.2-45.511 102.4-45.511 125.156 5.689 11.377 28.444 22.755 34.133 56.889 34.133 91.022 0 113.777 102.4 51.2 193.422-62.578 91.023-176.356 136.534-250.312 96.712-34.133-17.067-39.822-17.067-45.51 0-11.378 22.755 17.066 85.333 45.51 113.777 45.512 39.823 182.045 0 284.445-91.022 62.578-56.889 85.333-96.711 91.022-170.667 11.379-136.533-96.711-267.377-238.933-284.444-39.822-5.689-79.645-5.689-96.711-11.378-17.067 0-39.823 0-56.89 5.69zm0 0"/><path d="m625.778 676.978c-164.978 130.844-307.2 210.489-443.734 250.31-79.644 17.069-85.333 96.712-5.688 96.712 45.51 0 187.733-56.889 261.688-113.778 39.823-28.444 79.645-45.51 91.023-45.51s22.755-5.69 22.755-17.068 34.134-45.51 68.267-79.644c113.778-96.711 119.467-102.4 102.4-125.156-22.756-22.755-28.445-17.066-96.711 34.134zm0 0"/></g></svg>
                                            网易邮箱
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full"
                                            onClick={() => window.open('https://www.icloud.com/mail', '_blank')}
                                        >
                                            <IconBrandApple />
                                            iCloud
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full"
                                            onClick={() => window.open('https://outlook.live.com/mail', '_blank')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 2499.6 2500" fill="currentColor"><path d="M1187.9 1187.9H0V0h1187.9v1187.9zm1311.7 0H1311.6V0h1187.9v1187.9zM1187.9 2500H0V1312.1h1187.9V2500zm1311.7 0H1311.6V1312.1h1187.9V2500z"/></svg>
                                            Outlook
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full"
                                            onClick={() => window.open('https://mail.google.com', '_blank')}
                                        >
                                            <IconBrandGmail />
                                            Gmail
                                        </Button>
                                    </div>
                                    <div className="text-center text-sm">
                                        未收到邮件?{" "}请检查<b>垃圾箱</b>或
                                        <a href="/login" className="underline underline-offset-4">
                                            重新发送
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
            </div>
        </div>
    )
}
