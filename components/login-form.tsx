'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { IconBrandGithub } from "@tabler/icons-react";
import { handleEmailLogin } from "@/app/actions";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      await handleEmailLogin(formData);
    } finally {
      setIsLoading(false);
    }
  }

  // 响应式对话框组件，用于显示服务条款
  function TermsDialog() {
    if (isDesktop) {
      return (
        <Dialog open={openTerms} onOpenChange={setOpenTerms}>
          <DialogTrigger asChild>
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              服务条款
            </a>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>墨灵 (Inkcraft) 服务条款</DialogTitle>
              <DialogDescription>生效日期：2025年5月26日</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <h3 className="text-lg font-semibold">欢迎使用墨灵</h3>
              <p className="text-sm text-muted-foreground">
                墨灵 (Inkcraft) 提供AI驱动的作文批改服务，以下条款约束您对本网站的使用。
              </p>
              <h4 className="mt-4 text-md font-semibold">1. 服务内容</h4>
              <p className="text-sm">
                墨灵提供在线作文批改服务，用户可通过邮箱或第三方登录（Google、GitHub、微信、钉钉）提交作文并获取AI反馈。
              </p>
              <h4 className="mt-4 text-md font-semibold">2. 用户资格</h4>
              <p className="text-sm">
                本服务面向学生和教师，无年龄限制。您需提供真实信息注册账户，并对账户安全负责。
              </p>
              <h4 className="mt-4 text-md font-semibold">3. 用户内容</h4>
              <p className="text-sm">
                您提交的作文（“用户内容”）由您拥有。我们获得非独占许可，仅用于提供服务和改进AI算法。Google可能使用部分数据进行分析改进，但我们不会主动共享给其他第三方。
              </p>
              <h4 className="mt-4 text-md font-semibold">4. 可接受使用</h4>
              <p className="text-sm">
                禁止提交违法、侵权或不当内容（如色情、暴力内容），或干扰网站功能。
              </p>
              <h4 className="mt-4 text-md font-semibold">5. 第三方服务</h4>
              <p className="text-sm">
                本网站使用Google、GitHub、微信、钉钉进行身份验证，爱发电处理支付，其隐私政策适用。
              </p>
              <h4 className="mt-4 text-md font-semibold">6. 终止</h4>
              <p className="text-sm">
                违反条款可能导致账户暂停或终止。您可随时联系我们删除账户。
              </p>
              <h4 className="mt-4 text-md font-semibold">7. 责任限制</h4>
              <p className="text-sm">
                本网站按“现状”提供，不对间接或后果性损害负责。
              </p>
              <h4 className="mt-4 text-md font-semibold">8. 联系方式</h4>
              <p className="text-sm">
                邮箱：support@inkcraft.cn
              </p>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={openTerms} onOpenChange={setOpenTerms}>
        <DrawerTrigger asChild>
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            服务条款
          </a>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>墨灵 (Inkcraft) 服务条款</DrawerTitle>
            <DrawerDescription>生效日期：2025年5月26日</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 max-h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">欢迎使用墨灵</h3>
            <p className="text-sm text-muted-foreground">
              墨灵 (Inkcraft) 提供AI驱动的作文批改服务，以下条款约束您对本网站的使用。
            </p>
            <h4 className="mt-4 text-md font-semibold">1. 服务内容</h4>
            <p className="text-sm">
              墨灵提供在线作文批改服务，用户可通过邮箱或第三方登录（Google、GitHub、微信、钉钉）提交作文并获取AI反馈。
            </p>
            <h4 className="mt-4 text-md font-semibold">2. 用户资格</h4>
            <p className="text-sm">
              本服务面向学生和教师，无年龄限制。您需提供真实信息注册账户，并对账户安全负责。
            </p>
            <h4 className="mt-4 text-md font-semibold">3. 用户内容</h4>
            <p className="text-sm">
              您提交的作文（“用户内容”）由您拥有。我们获得非独占许可，仅用于提供服务和改进AI算法。Google可能使用部分数据进行分析改进，但我们不会主动共享给其他第三方。
            </p>
            <h4 className="mt-4 text-md font-semibold">4. 可接受使用</h4>
            <p className="text-sm">
              禁止提交违法、侵权或不当内容（如色情、暴力内容），或干扰网站功能。
            </p>
            <h4 className="mt-4 text-md font-semibold">5. 第三方服务</h4>
            <p className="text-sm">
              本网站使用Google、GitHub、微信、钉钉进行身份验证，爱发电处理支付，其隐私政策适用。
            </p>
            <h4 className="mt-4 text-md font-semibold">6. 终止</h4>
            <p className="text-sm">
              违反条款可能导致账户暂停或终止。您可随时联系我们删除账户。
            </p>
            <h4 className="mt-4 text-md font-semibold">7. 责任限制</h4>
            <p className="text-sm">
              本网站按“现状”提供，不对间接或后果性损害负责。
            </p>
            <h4 className="mt-4 text-md font-semibold">8. 联系方式</h4>
            <p className="text-sm">
              邮箱：support@inkcraft.cn
            </p>
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // 响应式对话框组件，用于显示隐私政策
  function PrivacyDialog() {
    if (isDesktop) {
      return (
        <Dialog open={openPrivacy} onOpenChange={setOpenPrivacy}>
          <DialogTrigger asChild>
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              隐私政策
            </a>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>墨灵 (Inkcraft) 隐私政策</DialogTitle>
              <DialogDescription>生效日期：2025年5月26日</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <h3 className="text-lg font-semibold">隐私保护承诺</h3>
              <p className="text-sm text-muted-foreground">
                墨灵 (Inkcraft) 重视您的隐私，以下说明我们如何处理您的信息。
              </p>
              <h4 className="mt-4 text-md font-semibold">1. 收集的信息</h4>
              <p className="text-sm">
                我们收集：
                - 个人信息：邮箱、支付信息（通过爱发电）。
                - 用户内容：您提交的作文。
                - 技术数据：IP地址、浏览器类型。
              </p>
              <h4 className="mt-4 text-md font-semibold">2. 信息用途</h4>
              <p className="text-sm">
                我们使用信息来：
                - 提供AI作文批改服务。
                - 发送登录链接或服务通知。
                - 改进网站功能和用户体验。
              </p>
              <h4 className="mt-4 text-md font-semibold">3. 信息共享</h4>
              <p className="text-sm">
                我们可能与以下第三方共享信息：
                - Google、GitHub、微信、钉钉（身份验证）。
                - 爱发电（支付处理）。
                - Vercel和Supabase（数据存储）。
                Google可能使用部分数据改进其服务，但我们不会主动共享给其他第三方。
              </p>
              <h4 className="mt-4 text-md font-semibold">4. 数据存储与安全</h4>
              <p className="text-sm">
                数据存储于 Vercel 和 Supabase ，我们采取合理措施保护数据，但无法保证绝对安全。
              </p>
              <h4 className="mt-4 text-md font-semibold">5. 数据保留</h4>
              <p className="text-sm">
                我们仅在提供服务或法律要求的最短时间内保留数据。您可联系我们删除账户。
              </p>
              <h4 className="mt-4 text-md font-semibold">6. 您的权利</h4>
              <p className="text-sm">
                您可：
                - 访问、更正或删除个人信息。
                - 联系我们退出某些数据处理。
              </p>
              <h4 className="mt-4 text-md font-semibold">7. 第三方链接</h4>
              <p className="text-sm">
                本网站包含Google、GitHub、微信、钉钉、爱发电链接，其隐私政策适用。
              </p>
              <h4 className="mt-4 text-md font-semibold">8. 政策更新</h4>
              <p className="text-sm">
                我们可能更新本政策，修改将在网站公布后生效。
              </p>
              <h4 className="mt-4 text-md font-semibold">9. 联系方式</h4>
              <p className="text-sm">
                邮箱：support@inkcraft.cn
              </p>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={openPrivacy} onOpenChange={setOpenPrivacy}>
        <DrawerTrigger asChild>
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            隐私政策
          </a>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>墨灵 (Inkcraft) 隐私政策</DrawerTitle>
            <DrawerDescription>生效日期：2025年5月26日</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 max-h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">隐私保护承诺</h3>
            <p className="text-sm text-muted-foreground">
              墨灵 (Inkcraft) 重视您的隐私，以下说明我们如何处理您的信息。
            </p>
            <h4 className="mt-4 text-md font-semibold">1. 收集的信息</h4>
            <p className="text-sm">
              我们收集：
              - 个人信息：邮箱、支付信息（通过爱发电）。
              - 用户内容：您提交的作文。
              - 技术数据：IP地址、浏览器类型。
            </p>
            <h4 className="mt-4 text-md font-semibold">2. 信息用途</h4>
            <p className="text-sm">
              我们使用信息来：
              - 提供AI作文批改服务。
              - 发送登录链接或服务通知。
              - 改进网站功能和用户体验。
            </p>
            <h4 className="mt-4 text-md font-semibold">3. 信息共享</h4>
            <p className="text-sm">
              我们可能与以下第三方共享信息：
              - Google、GitHub、微信、钉钉（身份验证）。
              - 爱发电（支付处理）。
              - Vercel和Supabase（数据存储）。
              Google可能使用部分数据改进其服务，但我们不会主动共享给其他第三方。
            </p>
            <h4 className="mt-4 text-md font-semibold">4. 数据存储与安全</h4>
            <p className="text-sm">
              数据存储于美国（Vercel和Supabase），我们采取合理措施保护数据，但无法保证绝对安全。
            </p>
            <h4 className="mt-4 text-md font-semibold">5. 数据保留</h4>
            <p className="text-sm">
              我们仅在提供服务或法律要求的最短时间内保留数据。您可联系我们删除账户。
            </p>
            <h4 className="mt-4 text-md font-semibold">6. 您的权利</h4>
            <p className="text-sm">
              您可：
              - 访问、更正或删除个人信息。
              - 联系我们退出某些数据处理。
            </p>
            <h4 className="mt-4 text-md font-semibold">7. 第三方链接</h4>
            <p className="text-sm">
              本网站包含Google、GitHub、微信、钉钉、爱发电链接，其隐私政策适用。
            </p>
            <h4 className="mt-4 text-md font-semibold">8. 政策更新</h4>
            <p className="text-sm">
              我们可能更新本政策，修改将在网站公布后生效。
            </p>
            <h4 className="mt-4 text-md font-semibold">9. 联系方式</h4>
            <p className="text-sm">
              邮箱：support@inkcraft.cn
            </p>
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(new FormData(e.currentTarget));
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">登录</h1>
                <p className="text-muted-foreground text-balance">
                  登录到您的墨灵账户
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "发送中..." : "获取登录链接"}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  通过第三方登录
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => signIn("google", { redirectTo: "/dashboard" })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">通过 Google 登录</span>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => signIn("github", { redirectTo: "/dashboard" })}
                >
                  <IconBrandGithub />
                  <span className="sr-only">通过 Github 登录</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                新用户首次登录自动注册账号。
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
      <div className="text-muted-foreground text-center text-xs text-balance">
        点击继续即表示您同意我们的 <TermsDialog /> 和 <PrivacyDialog />。
      </div>
    </div>
  );
}

