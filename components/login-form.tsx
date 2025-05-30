// components/auth/login-form.tsx
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

// Import the new components
import { TermsDialog } from "./terms-dialog";
import { PrivacyDialog } from "./privacy-dialog";

// useMediaQuery is still needed here to pass down to the dialogs
import { useMediaQuery } from "@/hooks/use-media-query";


export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  // State to control the open/close of the dialogs/drawers
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  // useMediaQuery is used here and passed down
  const isDesktop = useMediaQuery("(min-width: 768px)");

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      await handleEmailLogin(formData);
      // Optional: Add success message or redirect here
    } catch (error) {
       console.error("Email login failed:", error);
       // Optional: Show error message to the user
    } finally {
      setIsLoading(false);
    }
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
                  disabled={isLoading} // Disable input while loading
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
                  disabled={isLoading} // Disable button while loading email login
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">通过 Google 登录</span>
                   Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => signIn("github", { redirectTo: "/dashboard" })}
                   disabled={isLoading} // Disable button while loading email login
                >
                  <IconBrandGithub className="w-4 h-4 mr-2" />
                  <span className="sr-only">通过 Github 登录</span>
                  Github
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                新用户首次登录自动注册账号。
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="http://t.alcy.cc/fj"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        点击继续即表示您同意我们的
        {/* Use the new components and pass state/setters */}
        <TermsDialog open={openTerms} onOpenChange={setOpenTerms} />
        和
        <PrivacyDialog open={openPrivacy} onOpenChange={setOpenPrivacy} />
        。
        {/* Add triggers for the dialogs/drawers */}
        <a href="#" onClick={(e) => { e.preventDefault(); setOpenTerms(true); }} className="underline underline-offset-4 hover:text-primary ml-1">
           服务条款
        </a>
         和
        <a href="#" onClick={(e) => { e.preventDefault(); setOpenPrivacy(true); }} className="underline underline-offset-4 hover:text-primary ml-1">
           隐私政策
        </a>
         。
      </div>
    </div>
  );
}
