// components/auth/terms-dialog.tsx
'use client';

import { Button } from "@/components/ui/button";
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
import { useState } from "react";

interface TermsDialogProps {
  // Props to control the open state from the parent component
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Note: The open state is controlled by the parent LoginForm component
  // const [open, setOpen] = useState(false); // Removed local state

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Trigger is handled in the parent component */}
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>墨灵 (Inkcraft) 服务条款</DialogTitle>
            <DialogDescription>生效日期：2025年5月26日</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto text-sm leading-relaxed">
            <h3 className="text-base font-semibold mt-2">1. 欢迎使用墨灵</h3>
            <p className="text-muted-foreground">
              欢迎访问并使用墨灵 (Inkcraft) 提供的AI驱动作文批改服务（以下简称“本服务”）。本服务由 [你的公司名称或个人名称]（以下简称“我们”或“服务提供方”）运营。在使用本服务之前，请您务必仔细阅读并完全理解本服务条款（以下简称“本条款”）的所有内容。您使用本服务的行为，包括但不限于访问网站、注册账户、提交内容等，即表示您已充分阅读、理解并同意接受本条款的全部约束。如果您不同意本条款的任何内容，请立即停止使用本服务。
            </p>

            <h3 className="text-base font-semibold mt-4">2. 服务内容与范围</h3>
            <p>
              墨灵提供基于人工智能技术的在线作文批改服务，旨在辅助用户改进写作。本服务目前主要提供AI作文批改功能。我们保留随时增加、修改或终止部分或全部服务功能的权利，届时将通过网站公告或其他适当方式通知您。
            </p>
            <p className="mt-2">
              **服务限制与免责：** 您理解并同意，AI批改结果是基于算法模型的分析，仅供参考，不能替代人工的专业指导或评估。我们不对AI批改结果的准确性、完整性或适用性作任何明示或暗示的保证。对于因依赖AI批改结果而产生的任何直接或间接损失，我们不承担责任。
            </p>
             <p className="mt-2">
              **免费额度：** 新用户注册时可能获赠一定的免费使用额度。该额度仅为试用性质，不构成持续性的免费服务承诺。一旦额度用尽，用户需要通过付费方式继续使用服务（如果未来开放付费功能）。免费额度和付费服务在功能上目前没有区别，但未来可能会有所调整。
            </p>

            <h3 className="text-base font-semibold mt-4">3. 用户资格与账户安全</h3>
            <p>
              本服务面向所有希望改进写作的用户，无特定年龄限制。然而，如果您是未成年人，请在法定监护人的指导下使用本服务。
            </p>
            <p className="mt-2">
              您承诺提供真实、准确、完整的注册信息，并及时更新。您应对您的账户信息（包括但不限于邮箱、通过第三方登录的信息）及密码（如果适用）的安全负全部责任。您应妥善保管您的账户，任何通过您的账户进行的操作均视为您本人的行为。如发现任何未经授权使用您账户的情况，应立即通知我们。对于因您未能妥善保管账户信息而导致的任何损失，我们不承担责任。
            </p>

            <h3 className="text-base font-semibold mt-4">4. 用户内容</h3>
            <p>
              您通过本服务提交的作文、文本、图片或其他任何信息（以下简称“用户内容”）的所有权归您所有。
            </p>
            <p className="mt-2">
              为了提供和改进本服务，您在此授予我们一项全球范围内的、非独占的、免版税的、可转让的、可分许可的许可，允许我们存储、处理、分析、复制、修改、创作衍生作品、分发、公开展示和表演您的用户内容，但仅限于以下目的：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>向您提供AI作文批改服务；</li>
                <li>改进和优化我们的AI算法模型；</li>
                <li>进行内部数据分析和研究，以提升服务质量和用户体验。</li>
              </ul>
            </p>
             <p className="mt-2">
               我们承诺不会主动将您的用户内容共享给除为提供服务所必需的第三方（如数据存储服务商）以外的其他方，除非获得您的明确同意或根据法律法规要求。请注意，为改进服务，部分数据（可能包含用户内容的一部分）可能会被用于与我们的技术提供商（如Google）进行分析和模型训练，但我们会采取措施尽可能去标识化处理。
            </p>

            <h3 className="text-base font-semibold mt-4">5. 可接受使用与禁止行为</h3>
            <p>
              您承诺在使用本服务过程中遵守所有适用的法律法规以及本条款的规定。您不得利用本服务从事任何非法或不正当活动，包括但不限于：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>提交、发布、传播任何违反法律法规、侵犯第三方合法权益（包括知识产权、隐私权、名誉权等）、或包含色情、暴力、歧视、诽谤、欺诈等内容的信息；</li>
                <li>干扰、破坏本服务的正常运行，包括但不限于使用自动化脚本、爬虫、机器人等非人工方式访问或操作本服务；</li>
                <li>对本服务进行反向工程、反向汇编、反向编译或试图发现其源代码；</li>
                <li>未经授权访问或使用我们的系统或数据；</li>
                <li>传播病毒、恶意软件或其他有害程序；</li>
                <li>冒充他人或虚假表示与任何个人或实体的关联。</li>
              </ul>
            </p>

            <h3 className="text-base font-semibold mt-4">6. 第三方服务</h3>
            <p>
              本服务可能集成或链接至第三方服务，包括但不限于：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>身份验证服务：Google、GitHub、微信、钉钉</li>
                <li>支付处理服务：爱发电</li>
                <li>基础设施服务：Vercel、Supabase</li>
              </ul>
              您使用这些第三方服务时，需同时遵守其各自的服务条款和隐私政策。我们不对第三方服务的内容、功能或安全性负责。
            </p>

            <h3 className="text-base font-semibold mt-4">7. 服务中断与终止</h3>
            <p>
              我们保留因系统维护、升级、故障、不可抗力或其他原因暂停或中断部分或全部服务的权利。对于因此给您造成的任何不便或损失，我们不承担责任，但会尽力提前通知（如可能）。
            </p>
            <p className="mt-2">
              如果您违反本条款的任何规定，我们有权立即暂停或永久终止您的账户和对本服务的使用，无需事先通知。在这种情况下，您将无法继续使用本服务，我们也不承担任何退款或赔偿责任。
            </p>
            <p className="mt-2">
              您也可以随时联系我们要求删除您的账户，我们将根据隐私政策处理您的数据。
            </p>

            <h3 className="text-base font-semibold mt-4">8. 免责声明与责任限制</h3>
            <p>
              本服务按“现状”和“现有”基础提供，不作任何明示或暗示的保证，包括但不限于适销性、特定用途适用性、非侵权性等。我们不保证本服务将不间断、无错误、安全或可靠。
            </p>
            <p className="mt-2">
              在适用法律允许的最大范围内，对于因使用或无法使用本服务而产生的任何直接、间接、附带、特殊、惩罚性或后果性损害（包括但不限于利润损失、数据丢失、业务中断等），无论基于合同、侵权或其他任何法律理论，即使我们已被告知发生此类损害的可能性，我们均不承担责任。
            </p>
            <p className="mt-2 font-bold text-red-600">
              【重要提示：此处应根据实际情况和法律建议考虑是否设定责任上限。你之前表示不存在赔偿，但法律上完全排除责任可能无效。】
            </p>

            <h3 className="text-base font-semibold mt-4">9. 条款的修改</h3>
            <p>
              我们保留随时修改本条款的权利。修改后的条款将在网站上公布后生效。您在条款修改后继续使用本服务的，即表示您已阅读、理解并同意接受修改后的条款。如果您不同意修改后的条款，应立即停止使用本服务。
            </p>

            <h3 className="text-base font-semibold mt-4">10. 争议解决与适用法律</h3>
            <p className="font-bold text-red-600">
               【重要提示：此处需要你提供具体的争议解决方式和适用法律。例如：】
            </p>
            <p className="mt-2 italic text-muted-foreground">
              本条款的解释、效力及争议的解决，均适用中华人民共和国大陆地区的法律。因使用本服务而产生的或与本条款相关的任何争议，应首先通过友好协商解决；协商不成的，任何一方均有权向 [你的公司所在地或指定地，例如：你公司注册地或主要运营地所在的人民法院] 提起诉讼。
            </p>
             <p className="mt-2 font-bold text-red-600">
               【请务必根据你的实际情况和法律建议填写或修改上述争议解决条款。】
            </p>

            <h3 className="text-base font-semibold mt-4">11. 其他</h3>
            <p>
              本条款构成您与我们之间关于使用本服务的完整协议，取代您之前与我们达成的任何书面或口头协议。如果本条款的任何部分被认定为无效或不可执行，该部分应在法律允许的最大范围内予以解释，其余部分仍具有完全效力。我们未能执行本条款的任何权利或规定不构成对该权利或规定的放弃。
            </p>

            <h3 className="text-base font-semibold mt-4">12. 联系方式</h3>
            <p>
              如果您对本服务条款有任何疑问，请通过以下方式联系我们：
            </p>
            <p className="mt-1">
              邮箱：support@inkcraft.cn
            </p>
             <p className="mt-1">
              地址：【请填写你的联系地址，如果需要】
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* Trigger is handled in the parent component */}
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>墨灵 (Inkcraft) 服务条款</DrawerTitle>
          <DrawerDescription>生效日期：2025年5月26日</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 max-h-[60vh] overflow-y-auto text-sm leading-relaxed">
           <h3 className="text-base font-semibold mt-2">1. 欢迎使用墨灵</h3>
            <p className="text-muted-foreground">
              欢迎访问并使用墨灵 (Inkcraft) 提供的AI驱动作文批改服务（以下简称“本服务”）。本服务由 [你的公司名称或个人名称]（以下简称“我们”或“服务提供方”）运营。在使用本服务之前，请您务必仔细阅读并完全理解本服务条款（以下简称“本条款”）的所有内容。您使用本服务的行为，包括但不限于访问网站、注册账户、提交内容等，即表示您已充分阅读、理解并同意接受本条款的全部约束。如果您不同意本条款的任何内容，请立即停止使用本服务。
            </p>

            <h3 className="text-base font-semibold mt-4">2. 服务内容与范围</h3>
            <p>
              墨灵提供基于人工智能技术的在线作文批改服务，旨在辅助用户改进写作。本服务目前主要提供AI作文批改功能。我们保留随时增加、修改或终止部分或全部服务功能的权利，届时将通过网站公告或其他适当方式通知您。
            </p>
            <p className="mt-2">
              **服务限制与免责：** 您理解并同意，AI批改结果是基于算法模型的分析，仅供参考，不能替代人工的专业指导或评估。我们不对AI批改结果的准确性、完整性或适用性作任何明示或暗示的保证。对于因依赖AI批改结果而产生的任何直接或间接损失，我们不承担责任。
            </p>
             <p className="mt-2">
              **免费额度：** 新用户注册时可能获赠一定的免费使用额度。该额度仅为试用性质，不构成持续性的免费服务承诺。一旦额度用尽，用户需要通过付费方式继续使用服务（如果未来开放付费功能）。免费额度和付费服务在功能上目前没有区别，但未来可能会有所调整。
            </p>

            <h3 className="text-base font-semibold mt-4">3. 用户资格与账户安全</h3>
            <p>
              本服务面向所有希望改进写作的用户，无特定年龄限制。然而，如果您是未成年人，请在法定监护人的指导下使用本服务。
            </p>
            <p className="mt-2">
              您承诺提供真实、准确、完整的注册信息，并及时更新。您应对您的账户信息（包括但不限于邮箱、通过第三方登录的信息）及密码（如果适用）的安全负全部责任。您应妥善保管您的账户，任何通过您的账户进行的操作均视为您本人的行为。如发现任何未经授权使用您账户的情况，应立即通知我们。对于因您未能妥善保管账户信息而导致的任何损失，我们不承担责任。
            </p>

            <h3 className="text-base font-semibold mt-4">4. 用户内容</h3>
            <p>
              您通过本服务提交的作文、文本、图片或其他任何信息（以下简称“用户内容”）的所有权归您所有。
            </p>
            <p className="mt-2">
              为了提供和改进本服务，您在此授予我们一项全球范围内的、非独占的、免版税的、可转让的、可分许可的许可，允许我们存储、处理、分析、复制、修改、创作衍生作品、分发、公开展示和表演您的用户内容，但仅限于以下目的：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>向您提供AI作文批改服务；</li>
                <li>改进和优化我们的AI算法模型；</li>
                <li>进行内部数据分析和研究，以提升服务质量和用户体验。</li>
              </ul>
            </p>
             <p className="mt-2">
               我们承诺不会主动将您的用户内容共享给除为提供服务所必需的第三方（如数据存储服务商）以外的其他方，除非获得您的明确同意或根据法律法规要求。请注意，为改进服务，部分数据（可能包含用户内容的一部分）可能会被用于与我们的技术提供商（如Google）进行分析和模型训练，但我们会采取措施尽可能去标识化处理。
            </p>

            <h3 className="text-base font-semibold mt-4">5. 可接受使用与禁止行为</h3>
            <p>
              您承诺在使用本服务过程中遵守所有适用的法律法规以及本条款的规定。您不得利用本服务从事任何非法或不正当活动，包括但不限于：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>提交、发布、传播任何违反法律法规、侵犯第三方合法权益（包括知识产权、隐私权、名誉权等）、或包含色情、暴力、歧视、诽谤、欺诈等内容的信息；</li>
                <li>干扰、破坏本服务的正常运行，包括但不限于使用自动化脚本、爬虫、机器人等非人工方式访问或操作本服务；</li>
                <li>对本服务进行反向工程、反向汇编、反向编译或试图发现其源代码；</li>
                <li>未经授权访问或使用我们的系统或数据；</li>
                <li>传播病毒、恶意软件或其他有害程序；</li>
                <li>冒充他人或虚假表示与任何个人或实体的关联。</li>
              </ul>
            </p>

            <h3 className="text-base font-semibold mt-4">6. 第三方服务</h3>
            <p>
              本服务可能集成或链接至第三方服务，包括但不限于：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>身份验证服务：Google、GitHub、微信、钉钉</li>
                <li>支付处理服务：爱发电</li>
                <li>基础设施服务：Vercel、Supabase</li>
              </ul>
              您使用这些第三方服务时，需同时遵守其各自的服务条款和隐私政策。我们不对第三方服务的内容、功能或安全性负责。
            </p>

            <h3 className="text-base font-semibold mt-4">7. 服务中断与终止</h3>
            <p>
              我们保留因系统维护、升级、故障、不可抗力或其他原因暂停或中断部分或全部服务的权利。对于因此给您造成的任何不便或损失，我们不承担责任，但会尽力提前通知（如可能）。
            </p>
            <p className="mt-2">
              如果您违反本条款的任何规定，我们有权立即暂停或永久终止您的账户和对本服务的使用，无需事先通知。在这种情况下，您将无法继续使用本服务，我们也不承担任何退款或赔偿责任。
            </p>
            <p className="mt-2">
              您也可以随时联系我们要求删除您的账户，我们将根据隐私政策处理您的数据。
            </p>

            <h3 className="text-base font-semibold mt-4">8. 免责声明与责任限制</h3>
            <p>
              本服务按“现状”和“现有”基础提供，不作任何明示或暗示的保证，包括但不限于适销性、特定用途适用性、非侵权性等。我们不保证本服务将不间断、无错误、安全或可靠。
            </p>
            <p className="mt-2">
              在适用法律允许的最大范围内，对于因使用或无法使用本服务而产生的任何直接、间接、附带、特殊、惩罚性或后果性损害（包括但不限于利润损失、数据丢失、业务中断等），无论基于合同、侵权或其他任何法律理论，即使我们已被告知发生此类损害的可能性，我们均不承担责任。
            </p>
            <p className="mt-2 font-bold text-red-600">
              【重要提示：此处应根据实际情况和法律建议考虑是否设定责任上限。】
            </p>

            <h3 className="text-base font-semibold mt-4">9. 条款的修改</h3>
            <p>
              我们保留随时修改本条款的权利。修改后的条款将在网站上公布后生效。您在条款修改后继续使用本服务的，即表示您已阅读、理解并同意接受修改后的条款。如果您不同意修改后的条款，应立即停止使用本服务。
            </p>

            <h3 className="text-base font-semibold mt-4">10. 争议解决与适用法律</h3>
             <p className="font-bold text-red-600">
               【重要提示：此处需要你提供具体的争议解决方式和适用法律。】
            </p>
            <p className="mt-2 italic text-muted-foreground">
              本条款的解释、效力及争议的解决，均适用中华人民共和国大陆地区的法律。因使用本服务而产生的或与本条款相关的任何争议，应首先通过友好协商解决；协商不成的，任何一方均有权向 [你的公司所在地或指定地，例如：你公司注册地或主要运营地所在的人民法院] 提起诉讼。
            </p>
             <p className="mt-2 font-bold text-red-600">
               【请务必根据你的实际情况和法律建议填写或修改上述争议解决条款。】
            </p>

            <h3 className="text-base font-semibold mt-4">11. 其他</h3>
            <p>
              本条款构成您与我们之间关于使用本服务的完整协议，取代您之前与我们达成的任何书面或口头协议。如果本条款的任何部分被认定为无效或不可执行，该部分应在法律允许的最大范围内予以解释，其余部分仍具有完全效力。我们未能执行本条款的任何权利或规定不构成对该权利或规定的放弃。
            </p>

            <h3 className="text-base font-semibold mt-4">12. 联系方式</h3>
            <p>
              如果您对本服务条款有任何疑问，请通过以下方式联系我们：
            </p>
            <p className="mt-1">
              邮箱：support@inkcraft.cn
            </p>
             <p className="mt-1">
              地址：【请填写你的联系地址，如果需要】
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
