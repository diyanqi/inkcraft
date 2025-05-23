'use client';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { IconBrandGithub } from "@tabler/icons-react";
import { handleEmailLogin } from "@/app/actions"
import { useState } from "react"

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      await handleEmailLogin(formData)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Detailed Content for Policies ---
  // **IMPORTANT:** This is a draft based on your input. You MUST replace placeholders and ideally have it reviewed by a legal professional.
  const termsContent = (
    <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto pr-4 text-sm"> {/* Added max-height, overflow, and smaller text size */}
      <h2>服务条款</h2>
      <p>最后更新日期: [请填写日期]</p>
      <p>欢迎使用 inkcraft | 墨灵 的AI作文批改服务（以下简称“服务”）。在使用本服务之前，请仔细阅读本服务条款。</p>

      <h3>1. 接受条款</h3>
      <p>通过访问或使用本服务，您确认您已阅读、理解并同意遵守本服务条款的所有规定。如果您不同意本服务条款的任何部分，您不得使用本服务。</p>

      <h3>2. 服务描述</h3>
      <p>本服务利用人工智能技术对用户提交的作文进行分析和提供批改反馈。我们致力于提供有益的指导，但请理解，AI批改结果是基于算法生成，可能存在局限性，仅供参考，不能替代专业的教育指导或人工批改。</p>

      <h3>3. 用户账户</h3>
      <p>您可以通过邮箱登录使用本服务。您有责任维护您的账户信息的保密性，并对您账户下发生的所有活动负责。您同意立即通知我们任何未经授权使用您账户的情况。</p>

      <h3>4. 用户义务与行为规范</h3>
      <ul>
        <li>您必须提供真实、准确、完整的注册信息（如邮箱）。</li>
        <li>您提交的作文内容必须是您原创或您拥有合法使用权的作品。</li>
        <li>您提交的内容不得包含任何非法、侵权、诽谤、威胁、淫秽、色情、欺诈、侵犯隐私或任何其他违反法律法规或本服务条款的内容。</li>
        <li>您不得使用服务进行任何非法活动或违反任何适用法律。</li>
        <li>您不得干扰或破坏服务或连接到服务的服务器或网络。</li>
        <li>您不得尝试未经授权访问服务的任何部分、其他用户的账户或连接到服务的系统或网络。</li>
        <li>您不得提交大量无意义、重复或用于测试AI极限的内容，以避免滥用服务资源。</li>
      </ul>

      <h3>5. 知识产权</h3>
      <p>您提交的作文内容的版权归您所有。通过提交作文，您授予 inkcraft | 墨灵 一个全球性、非独占、免版税、可再许可、可转让的许可，以便我们为提供和运营本服务（包括将内容发送给第三方AI提供商进行处理）而使用、复制、修改、分发、存储和处理您的作文内容。此许可仅限于提供和改进本服务的目的。</p>
      <p>服务的AI批改反馈、界面、设计、技术、软件、商标、服务标志以及所有其他内容和知识产权均归 inkcraft | 墨灵 或其许可方所有，受版权、商标和其他知识产权法律保护。未经我们明确书面许可，您不得复制、修改、分发、出售或出租服务的任何部分或其知识产权。</p>

      <h3>6. 第三方AI模型与数据处理</h3>
      <p>为了提供作文批改服务，我们依赖于第三方人工智能模型提供商的技术。这意味着您提交的作文内容将会被发送给这些提供商进行处理。我们目前使用的（包括但不限于）第三方提供商包括：Google, OpenAI, DeepSeek, SiliconFlow。</p>
      <p>请注意，这些第三方提供商有其独立的服务条款和隐私政策，他们对您发送给他们的数据的处理受其自身政策的约束。虽然我们会努力采取合理的措施（例如，通常不会将您的个人身份信息与作文内容直接关联发送给第三方）来保护您的隐私，但我们无法控制第三方提供商如何使用或处理他们接收到的数据。**您理解并同意，通过使用本服务提交作文，您即授权我们将您的作文内容发送给上述及其他可能使用的第三方AI提供商，并接受这些第三方提供商各自的服务条款和隐私政策中关于数据处理的规定。** inkcraft | 墨灵 不对第三方提供商的数据处理行为承担责任。</p>

      <h3>7. 隐私政策</h3>
      <p>我们如何收集、使用和保护您的个人信息，详见我们的《隐私政策》。您使用本服务即表示您同意我们的《隐私政策》。</p>

      <h3>8. 免责声明</h3>
      <p>本服务按“现状”和“可用”的基础提供，不提供任何明示或暗示的保证，包括但不限于适销性、特定用途的适用性、非侵权性或准确性的保证。inkcraft | 墨灵 不保证服务将不间断、及时、安全或无错误。您使用本服务的风险由您自行承担。</p>
      <p>我们不对AI批改结果的准确性、完整性、可靠性、适用性或时效性作出任何保证。您依赖AI批改结果的风险完全由您承担。</p>

      <h3>9. 责任限制</h3>
      <p>在适用法律允许的最大范围内，inkcraft | 墨灵 及其关联公司、董事、员工或代理不对因您访问或使用（或无法访问或使用）服务而产生的任何直接、间接、附带、特殊、惩罚性或后果性损害（包括但不限于利润损失、数据丢失、业务中断）负责，即使我们已被告知发生此类损害的可能性。</p>

      <h3>10. 赔偿</h3>
      <p>您同意赔偿并使 inkcraft | 墨灵 及其关联公司、董事、员工和代理免受因您违反本服务条款或您使用服务（包括您提交的内容）而引起的任何索赔、责任、损害、损失和费用（包括合理的律师费）的损害。</p>

      <h3>11. 服务变更与终止</h3>
      <p>我们保留随时修改、暂停或终止服务（或其任何部分）的权利，恕不另行通知。我们不对服务的任何修改、暂停或终止向您或任何第三方承担责任。</p>
      <p>如果我们合理认为您违反了本服务条款，我们保留暂停或终止您的账户和访问服务的权利，恕不另行通知。</p>

      <h3>12. 完整协议</h3>
      <p>本服务条款构成您与 inkcraft | 墨灵 之间关于服务使用的完整协议，并取代您与我们之间之前关于服务的任何协议。</p>

      <h3>13. 联系方式</h3>
      <p>如果您对本服务条款有任何疑问，请通过 [您的联系邮箱或页面] 联系我们。</p>
    </div>
  );

  const privacyContent = (
    <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto pr-4 text-sm"> {/* Added max-height, overflow, and smaller text size */}
      <h2>隐私政策</h2>
      <p>最后更新日期: [请填写日期]</p>
      <p>本隐私政策描述了 inkcraft | 墨灵（以下简称“我们”）如何收集、使用、披露和保护您在使用我们的AI作文批改服务时提供的信息。</p>

      <h3>1. 我们收集的信息</h3>
      <p>我们收集的信息类型取决于您如何使用我们的服务：</p>
      <ul>
        <li>**您直接提供的信息:**
          <ul>
            <li>**账户信息:** 当您通过邮箱登录时，我们会收集您的邮箱地址。</li>
            <li>**作文内容:** 当您提交作文进行批改时，我们会收集您提交的作文文本内容。</li>
          </ul>
        </li>
        <li>**自动收集的信息:**
          <ul>
            <li>**使用数据:** 我们收集有关您如何访问和使用服务的信息，例如您访问的页面、使用时长、功能使用情况等。</li>
            <li>**设备和连接信息:** 我们可能会收集有关您的设备的信息，例如设备类型、操作系统、浏览器类型、IP地址。**我们收集您的IP地址用于安全目的、诊断服务问题、分析用户地理分布（非精确位置）以及防止滥用。**</li>
          </ul>
        </li>
        <li>**Cookie和跟踪技术:** 我们使用Cookie和类似的跟踪技术（如像素标签）来跟踪您在我们服务上的活动并存储某些信息。Cookie是存储在您设备上的小文件。我们使用这些技术主要用于：
          <ul>
            <li>**认证:** 识别您并保持您的登录状态。</li>
            <li>**分析:** 了解用户如何使用服务，以便我们改进服务。</li>
            <li>**个性化:** 根据您的使用习惯提供更个性化的体验（如果未来实现相关功能）。</li>
          </ul>
          您可以通过浏览器设置拒绝Cookie，但这可能会影响服务的某些功能。
        </li>
      </ul>

      <h3>2. 信息的使用</h3>
      <p>我们将收集的信息用于以下目的：</p>
      <ul>
        <li>**提供和运营服务:** 处理您的作文并提供AI批改反馈，维护服务的正常运行。</li>
        <li>**改进服务:** 基于使用数据和用户反馈来分析服务性能，识别问题，并开发新功能和改进现有功能。**请注意，我们不会主动使用您提交的作文内容的本身来训练我们自己的AI模型。**</li>
        <li>**沟通:** 与您沟通有关您的账户、服务更新、安全警报、技术支持以及您可能感兴趣的推广信息（如果您选择接收）。</li>
        <li>**安全和欺诈预防:** 监控和分析服务使用情况，检测和防止欺诈、滥用和非法活动。</li>
        <li>**遵守法律义务:** 遵守适用的法律法规和法律程序。</li>
      </ul>

      <h3>3. 信息共享与披露</h3>
      <p>我们可能在以下情况下共享或披露您的信息：</p>
      <ul>
        <li>**第三方AI模型提供商:** **这是服务核心功能的一部分。** 为了提供作文批改服务，我们将您提交的作文内容发送给第三方AI模型提供商进行处理。这些提供商包括（但不限于）：Google, OpenAI, DeepSeek, SiliconFlow。这些提供商对数据的处理受其各自的隐私政策和条款约束。**如前所述，虽然我们不会主动使用您的作文内容训练我们自己的模型，但这些第三方提供商可能会根据其政策使用发送给他们的数据进行模型训练或改进。通过使用服务，您明确同意此种数据共享和处理方式，并理解 inkcraft | 墨灵 不对第三方提供商的数据实践负责。**</li>
        <li>**其他服务提供商:** 我们可能与第三方服务提供商合作，以协助我们运营、提供、分析和改进服务，例如托管服务、数据存储、分析服务等。这些服务提供商只能在为我们提供服务的必要范围内访问您的个人信息，并有合同义务对信息保密。</li>
        <li>**法律要求和权利保护:** 如果我们真诚地相信法律要求或为了保护我们的权利、财产或安全，或他人的权利、财产或安全，我们可能会披露您的信息。这包括响应法院命令、传票、政府请求或调查。</li>
        <li>**业务转让:** 如果我们参与合并、收购、资产出售、融资、清算或破产，您的信息可能会作为交易的一部分被转移。</li>
        <li>**经您同意:** 在您明确同意的情况下，我们可能与第三方共享您的信息。</li>
        <li>**汇总或匿名化数据:** 我们可能共享不识别您个人身份的汇总或匿名化信息，用于分析、研究或营销目的。</li>
      </ul>

      <h3>4. 数据安全</h3>
      <p>我们采取合理的物理、技术和管理措施来保护我们收集的个人信息，防止未经授权的访问、使用、披露、更改或销毁。然而，没有任何互联网传输或电子存储系统是100%安全的。因此，我们不能保证您的信息的绝对安全。</p>

      <h3>5. 数据保留</h3>
      <p>我们将在实现收集目的所需的时间内保留您的个人信息，包括为了履行法律义务、解决争议、执行协议以及提供服务。保留期限取决于信息的类型和使用目的。</p>

      <h3>6. 您的权利</h3>
      <p>根据您所在的司法管辖区法律，您可能对您的个人信息拥有某些权利，包括：</p>
      <ul>
        <li>访问您的个人信息。</li>
        <li>更正不准确的个人信息。</li>
        <li>删除您的个人信息。</li>
        <li>限制或反对处理您的个人信息。</li>
        <li>接收您的个人信息的副本（数据可移植性）。</li>
        <li>撤回同意（如果处理基于同意）。</li>
      </ul>
      <p>要行使这些权利，请通过 [您的联系邮箱或页面] 联系我们。我们可能会要求您验证身份后处理您的请求。</p>

      <h3>7. 儿童隐私</h3>
      <p>我们的服务不直接面向儿童。尽管我们没有严格的年龄门槛，但我们不会故意收集13岁以下（或适用法律规定的其他年龄）儿童的个人身份信息。如果您是家长或监护人，并且认为您的孩子向我们提供了个人信息，请通过 [您的联系邮箱或页面] 联系我们，我们将采取措施删除此类信息。</p>

      <h3>8. 国际数据传输</h3>
      <p>由于我们使用的第三方AI提供商可能是全球性的公司，您提交的作文内容和您的其他信息可能会被传输到您所在国家/地区以外的服务器进行处理和存储。这些国家/地区的数据保护法律可能与您所在国家/地区不同。通过使用服务，您同意此类国际传输。</p>

      <h3>9. 本隐私政策的变更</h3>
      <p>我们可能会不时更新本隐私政策，以反映我们的实践变化或法律要求。修改后的隐私政策将在本页面发布，并自发布之日起生效。建议您定期查看本隐私政策以了解任何更改。您在隐私政策修改后继续使用服务，即表示您接受修改后的政策。</p>

      <h3>10. 联系方式</h3>
      <p>如果您对本隐私政策或我们的数据处理实践有任何疑问或疑虑，请通过以下方式联系我们：</p>
      <p>[您的联系邮箱或页面]</p>
    </div>
  );
  // --- End Detailed Content ---


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">登录</h1>
                <p className="text-muted-foreground text-balance">
                  登录到您的账户
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
                <Button variant="outline" type="button" className="w-full" onClick={() => signIn("google", { redirectTo: "/dashboard" })}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">通过 Google 登录</span>
                </Button>
                <Button variant="outline" type="button" className="w-full" onClick={() => signIn("github", { redirectTo: "/dashboard" })}>
                  <IconBrandGithub className="mr-2 h-4 w-4" />
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
              src="http://t.alcy.cc/fj"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        点击继续即表示您同意我们的
        {/* Terms of Service Dialog Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <a href="#" className="underline underline-offset-4 hover:text-primary" onClick={(e) => e.preventDefault()}>服务条款</a> {/* Prevent default link behavior */}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]"> {/* Adjust max-width as needed */}
            <DialogHeader>
              <DialogTitle>服务条款</DialogTitle>
              <DialogDescription>
                请仔细阅读我们的服务条款。
              </DialogDescription>
            </DialogHeader>
            {termsContent} {/* Display the terms content */}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  关闭
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {" "}和
        {/* Privacy Policy Dialog Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <a href="#" className="underline underline-offset-4 hover:text-primary" onClick={(e) => e.preventDefault()}>隐私政策</a> {/* Prevent default link behavior */}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]"> {/* Adjust max-width as needed */}
            <DialogHeader>
              <DialogTitle>隐私政策</DialogTitle>
              <DialogDescription>
                了解我们如何处理您的个人信息。
              </DialogDescription>
            </DialogHeader>
            {privacyContent} {/* Display the privacy content */}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  关闭
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        。
      </div>
    </div>
  )
}
