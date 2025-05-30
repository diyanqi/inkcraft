// components/auth/privacy-dialog.tsx
'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Although Trigger is handled in parent, keep import if needed elsewhere
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger, // Although Trigger is handled in parent, keep import if needed elsewhere
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
// import { useState } from "react"; // useState is not used locally in this component

interface PrivacyDialogProps {
  // Props to control the open state from the parent component
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyDialog({ open, onOpenChange }: PrivacyDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Note: The open state is controlled by the parent LoginForm component
  // const [open, setOpen] = useState(false); // Removed local state

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* Trigger is handled in the parent component */}
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>墨灵 (Inkcraft) 隐私政策</DialogTitle>
            <DialogDescription>生效日期：2025年5月26日</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto text-sm leading-relaxed">
            <h3 className="text-base font-semibold mt-2">1. 引言与承诺</h3>
            <p className="text-muted-foreground">
              墨灵 (Inkcraft) 深知个人信息对您的重要性，并承诺保护您的隐私。本隐私政策（以下简称“本政策”）旨在说明我们在您使用墨灵服务时如何收集、使用、存储、共享和保护您的个人信息。请您在使用本服务前仔细阅读并理解本政策。如果您不同意本政策的任何内容，请立即停止使用本服务。您使用本服务的行为即表示您同意本政策的全部内容。
            </p>

            <h3 className="text-base font-semibold mt-4">2. 我们收集的信息</h3>
            <p>
              为了向您提供服务，我们可能收集以下类型的个人信息：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**您直接提供的信息：**
                  <ul className="list-circle list-inside ml-4">
                    <li>**账户信息：** 当您通过邮箱或第三方账户（如Google、GitHub、微信、钉钉）注册或登录时，我们收集您的邮箱地址以及第三方授权提供的相关信息（如昵称、头像等）。</li>
                    <li>**用户内容：** 您在使用AI作文批改功能时提交的作文、文本或其他任何形式的内容。</li>
                    <li>**支付信息：** 当您通过爱发电等第三方支付平台进行支付时，支付处理方会收集您的支付信息。我们通常不会直接收集您的详细支付卡信息，但可能会收到支付状态、交易金额等信息。</li>
                    <li>**沟通信息：** 您通过邮件或其他方式与我们联系时提供的信息，如您的姓名、邮箱地址以及您咨询或反馈的内容。</li>
                  </ul>
                </li>
                 <li>**我们在您使用服务过程中自动收集的信息：**
                  <ul className="list-circle list-inside ml-4">
                    <li>**技术数据：** 包括您的IP地址、浏览器类型和版本、操作系统、设备信息、访问日期和时间、访问的页面、在网站上的活动（如点击、浏览时长）等。</li>
                    <li>**使用数据：** 关于您如何使用本服务的信息，例如批改次数、使用的功能等。</li>
                    <li>**Cookie及类似技术：** 我们可能使用Cookie、像素标签、Web Beacon等技术来收集信息，用于记住您的偏好、维持登录状态、分析网站流量和用户行为、改进服务等。您可以通过浏览器设置管理或拒绝Cookie，但这可能会影响您使用本服务的某些功能。</li>
                  </ul>
                </li>
              </ul>
            </p>
             


            <h3 className="text-base font-semibold mt-4">3. 信息的使用目的</h3>
            <p>
              我们收集您的信息主要用于以下目的：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**提供和维护本服务：** 包括处理您的登录请求、提供AI作文批改功能、确保服务的正常运行。</li>
                <li>**改进和优化服务：** 分析用户行为和使用数据，以了解用户需求，优化界面设计，提升AI批改算法的准确性和效率，开发新功能。</li>
                <li>**与您沟通：** 向您发送重要的服务通知（如登录链接）、更新信息、安全警报以及您请求的信息。</li>
                <li>**个性化用户体验：** 根据您的使用习惯和偏好，为您提供更相关的服务内容。</li>
                <li>**安全与防欺诈：** 检测和防止潜在的欺诈、滥用、非法活动以及违反服务条款的行为，保护您和其他用户的安全。</li>
                <li>**遵守法律义务：** 根据适用的法律法规、法院命令或政府机构的要求，处理您的信息。</li>
                <li>**内部运营：** 进行内部研究、数据分析、审计等，以管理和运营我们的业务。</li>
              </ul>
            </p>
            

            <h3 className="text-base font-semibold mt-4">4. 信息的共享与披露</h3>
            <p>
              我们承诺不会将您的个人信息出售给第三方。我们仅在以下情况下，并出于本政策所述的目的，可能与第三方共享您的信息：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**服务提供商：** 我们与提供技术、支付、数据存储、托管、分析、客户服务等服务的第三方合作。这些第三方只能在为我们提供服务所必需的范围内访问您的个人信息，并受合同义务约束，要求其采取适当的安全措施保护您的信息。主要的服务提供商包括：
                  <ul className="list-circle list-inside ml-4">
                    <li>身份验证：Google、GitHub、微信、钉钉</li>
                    <li>支付处理：爱发电</li>
                    <li>数据存储与托管：Vercel、Supabase</li>
                    <li>【请补充其他可能共享数据的第三方，如用于网站分析的工具】</li>
                  </ul>
                </li>
                <li>**法律要求：** 当我们真诚地相信为了遵守法律法规、法院命令、政府请求、传票或法律程序是必要时，我们可能会披露您的信息。</li>
                <li>**保护权利与安全：** 为了执行我们的服务条款，调查潜在的违规行为，检测、预防或处理欺诈、安全或技术问题，或保护我们、用户或公众的权利、财产或安全，我们可能会披露您的信息。</li>
                <li>**业务转移：** 如果我们进行合并、收购、资产出售或破产，您的个人信息可能会作为交易的一部分转移给新的实体。在这种情况下，我们将尽力确保您的信息继续受到保护，并通知您相关的变更。</li>
                <li>**经您同意：** 在获得您的明确同意后，我们可能与第三方共享您的信息。</li>
              </ul>
            </p>
            <p className="mt-2">
              请注意，为改进服务，我们的技术提供商（如Google）可能会使用部分数据进行分析改进，但我们不会主动将您的用户内容共享给除为提供服务所必需的第三方以外的其他方。
            </p>

            <h3 className="text-base font-semibold mt-4">5. 数据存储与国际传输</h3>
            <p>
              我们收集的您的信息可能存储在我们的服务提供商（如 Vercel 和 Supabase）位于美国或其他国家/地区的服务器上。
            </p>
            <p className="mt-2">
              【重要提示：如果你的用户可能来自中国大陆以外，特别是欧盟等有严格数据保护法律的地区，需要说明数据会传输到美国或其他地区，并提及采取了哪些合法机制来确保数据传输的合规性，例如是否使用了标准合同条款 (SCCs)。】
            </p>
            

            <h3 className="text-base font-semibold mt-4">6. 数据安全</h3>
            <p>
              我们采取合理的物理、技术和管理措施来保护您的个人信息免遭未经授权的访问、使用、披露、修改或破坏。这些措施可能包括使用加密技术、访问控制、安全审计、员工培训等。然而，互联网传输或电子存储方法并非100%安全，我们无法保证您的信息绝对安全。
            </p>
            <p className="mt-2">
              如果发生个人信息泄露事件，我们将根据法律法规的要求，及时通知您并向相关监管机构报告。
            </p>

            <h3 className="text-base font-semibold mt-4">7. 数据保留</h3>
            <p>
              我们仅在为您提供服务所需的时间内，或根据法律法规的要求，保留您的个人信息。数据保留期限取决于信息的类型、用途以及法律或业务需求。
            </p>
            <p className="mt-2">
              【重要提示：此处可以尝试更具体地说明不同类型数据的保留策略，例如：】
            </p>
             <p className="mt-2 italic text-muted-foreground">
               例如，您的账户信息在您账户有效期间会一直保留；您提交的作文内容在您使用服务期间会保留，以便为您提供批改历史等功能，您删除账户后，相关用户内容将在合理的时间内（例如，【请填写具体时间，如30天】）从我们的活动数据库中删除，但可能在备份系统中保留更长时间，最终将被安全销毁。与支付相关的记录将根据适用的财务和税务法律法规进行保留。
            </p>
             


            <h3 className="text-base font-semibold mt-4">8. 您的权利</h3>
            <p>
              根据适用的法律法规，您可能对您的个人信息享有以下权利：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**访问权：** 您有权获取我们持有的关于您的个人信息副本。</li>
                <li>**更正权：** 如果您发现我们持有的关于您的个人信息不准确或不完整，您有权要求我们进行更正。</li>
                <li>**删除权：** 在某些情况下，您有权要求我们删除您的个人信息。</li>
                <li>**限制处理权：** 在某些情况下，您有权要求我们限制对您个人信息的处理。</li>
                <li>**数据可移植权：** 在某些情况下，您有权接收您提供给我们的个人信息，并有权将这些信息传输给第三方。</li>
                <li>**反对权：** 在某些情况下，您有权反对我们处理您的个人信息。</li>
                <li>**撤回同意权：** 如果我们基于您的同意处理您的个人信息，您有权随时撤回您的同意，但这不影响撤回前基于同意进行的处理的合法性。</li>
              </ul>
            </p>
            <p className="mt-2">
              如需行使上述权利，请通过本政策提供的联系方式与我们联系。为了保护您的信息安全，我们可能会在处理您的请求前验证您的身份。
            </p>

            <h3 className="text-base font-semibold mt-4">9. 儿童隐私</h3>
             
            <p className="mt-2 italic text-muted-foreground">
               本服务面向所有希望改进写作的用户，包括学生。如果您是未满14周岁的未成年人（或其他当地法律规定的年龄），请在您的父母或法定监护人的指导和同意下使用本服务。我们不会在明知的情况下收集未满14周岁未成年人的个人信息，除非获得其父母或法定监护人的同意。如果您的监护人认为我们未经同意收集了未成年人的个人信息，请通过本政策提供的联系方式与我们联系，我们将尽快删除相关数据。
            </p>
             

            <h3 className="text-base font-semibold mt-4">10. 第三方网站链接</h3>
            <p>
              本服务可能包含指向第三方网站或服务的链接，例如Google、GitHub、微信、钉钉、爱发电等。这些第三方网站或服务有其自己的隐私政策，我们不对其隐私实践负责。建议您在访问这些第三方网站或服务时仔细阅读其隐私政策。
            </p>

            <h3 className="text-base font-semibold mt-4">11. 政策的更新</h3>
            <p>
              我们可能会根据业务发展、法律法规变化或用户反馈等因素更新本政策。本政策的任何修改都将通过在网站上发布更新版本的方式通知您。修改后的政策将在发布后生效。建议您定期查看本政策，以了解我们如何保护您的信息。您在政策更新后继续使用本服务的，即表示您已阅读、理解并同意接受修改后的政策。
            </p>

            <h3 className="text-base font-semibold mt-4">12. 联系我们</h3>
            <p>
              如果您对本隐私政策或您的个人信息有任何疑问、意见或请求，请通过以下方式与我们联系：
            </p>
            <p className="mt-1">
              邮箱：support@inkcraft.cn
            </p>
             <p className="mt-1">
              地址：【请填写你的联系地址，如果需要】
            </p>
          </div>
        </DialogContent> {/* <-- Added missing closing tag here */}
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* Trigger is handled in the parent component */}
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>墨灵 (Inkcraft) 隐私政策</DrawerTitle>
          <DrawerDescription>生效日期：2025年5月26日</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 max-h-[60vh] overflow-y-auto text-sm leading-relaxed">
           <h3 className="text-base font-semibold mt-2">1. 引言与承诺</h3>
            <p className="text-muted-foreground">
              墨灵 (Inkcraft) 深知个人信息对您的重要性，并承诺保护您的隐私。本隐私政策（以下简称“本政策”）旨在说明我们在您使用墨灵服务时如何收集、使用、存储、共享和保护您的个人信息。请您在使用本服务前仔细阅读并理解本政策。如果您不同意本政策的任何内容，请立即停止使用本服务。您使用本服务的行为即表示您同意本政策的全部内容。
            </p>

            <h3 className="text-base font-semibold mt-4">2. 我们收集的信息</h3>
            <p>
              为了向您提供服务，我们可能收集以下类型的个人信息：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**您直接提供的信息：**
                  <ul className="list-circle list-inside ml-4">
                    <li>**账户信息：** 当您通过邮箱或第三方账户（如Google、GitHub、微信、钉钉）注册或登录时，我们收集您的邮箱地址以及第三方授权提供的相关信息（如昵称、头像等）。</li>
                    <li>**用户内容：** 您在使用AI作文批改功能时提交的作文、文本或其他任何形式的内容。</li>
                    <li>**支付信息：** 当您通过爱发电等第三方支付平台进行支付时，支付处理方会收集您的支付信息。我们通常不会直接收集您的详细支付卡信息，但可能会收到支付状态、交易金额等信息。</li>
                    <li>**沟通信息：** 您通过邮件或其他方式与我们联系时提供的信息，如您的姓名、邮箱地址以及您咨询或反馈的内容。</li>
                  </ul>
                </li>
                 <li>**我们在您使用服务过程中自动收集的信息：**
                  <ul className="list-circle list-inside ml-4">
                    <li>**技术数据：** 包括您的IP地址、浏览器类型和版本、操作系统、设备信息、访问日期和时间、访问的页面、在网站上的活动（如点击、浏览时长）等。</li>
                    <li>**使用数据：** 关于您如何使用本服务的信息，例如批改次数、使用的功能等。</li>
                    <li>**Cookie及类似技术：** 我们可能使用Cookie、像素标签、Web Beacon等技术来收集信息，用于记住您的偏好、维持登录状态、分析网站流量和用户行为、改进服务等。您可以通过浏览器设置管理或拒绝Cookie，但这可能会影响您使用本服务的某些功能。</li>
                  </ul>
                </li>
              </ul>
            </p>
             


            <h3 className="text-base font-semibold mt-4">3. 信息的使用目的</h3>
            <p>
              我们收集您的信息主要用于以下目的：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**提供和维护本服务：** 包括处理您的登录请求、提供AI作文批改功能、确保服务的正常运行。</li>
                <li>**改进和优化服务：** 分析用户行为和使用数据，以了解用户需求，优化界面设计，提升AI批改算法的准确性和效率，开发新功能。</li>
                <li>**与您沟通：** 向您发送重要的服务通知（如登录链接）、更新信息、安全警报以及您请求的信息。</li>
                <li>**个性化用户体验：** 根据您的使用习惯和偏好，为您提供更相关的服务内容。</li>
                <li>**安全与防欺诈：** 检测和防止潜在的欺诈、滥用、非法活动以及违反服务条款的行为，保护您和其他用户的安全。</li>
                <li>**遵守法律义务：** 根据适用的法律法规、法院命令或政府机构的要求，处理您的信息。</li>
                <li>**内部运营：** 进行内部研究、数据分析、审计等，以管理和运营我们的业务。</li>
              </ul>
            </p>
            

            <h3 className="text-base font-semibold mt-4">4. 信息的共享与披露</h3>
            <p>
              我们承诺不会将您的个人信息出售给第三方。我们仅在以下情况下，并出于本政策所述的目的，可能与第三方共享您的信息：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**服务提供商：** 我们与提供技术、支付、数据存储、托管、分析、客户服务等服务的第三方合作。这些第三方只能在为我们提供服务所必需的范围内访问您的个人信息，并受合同义务约束，要求其采取适当的安全措施保护您的信息。主要的服务提供商包括：
                  <ul className="list-circle list-inside ml-4">
                    <li>身份验证：Google、GitHub、微信、钉钉</li>
                    <li>支付处理：爱发电</li>
                    <li>数据存储与托管：Vercel、Supabase</li>
                    <li>【请补充其他可能共享数据的第三方，如用于网站分析的工具】</li>
                  </ul>
                </li>
                <li>**法律要求：** 当我们真诚地相信为了遵守法律法规、法院命令、政府请求、传票或法律程序是必要时，我们可能会披露您的信息。</li>
                <li>**保护权利与安全：** 为了执行我们的服务条款，调查潜在的违规行为，检测、预防或处理欺诈、安全或技术问题，或保护我们、用户或公众的权利、财产或安全，我们可能会披露您的信息。</li>
                <li>**业务转移：** 如果我们进行合并、收购、资产出售或破产，您的个人信息可能会作为交易的一部分转移给新的实体。在这种情况下，我们将尽力确保您的信息继续受到保护，并通知您相关的变更。</li>
                <li>**经您同意：** 在获得您的明确同意后，我们可能与第三方共享您的信息。</li>
              </ul>
            </p>
            <p className="mt-2">
              请注意，为改进服务，我们的技术提供商（如Google）可能会使用部分数据进行分析改进，但我们不会主动将您的用户内容共享给除为提供服务所必需的第三方以外的其他方。
            </p>

            <h3 className="text-base font-semibold mt-4">5. 数据存储与国际传输</h3>
            <p>
              我们收集的您的信息可能存储在我们的服务提供商（如 Vercel 和 Supabase）位于美国或其他国家/地区的服务器上。
            </p>
            <p className="mt-2">
              【重要提示：如果你的用户可能来自中国大陆以外，特别是欧盟等有严格数据保护法律的地区，需要说明数据会传输到美国或其他地区，并提及采取了哪些合法机制来确保数据传输的合规性，例如是否使用了标准合同条款 (SCCs)。】
            </p>
            

            <h3 className="text-base font-semibold mt-4">6. 数据安全</h3>
            <p>
              我们采取合理的物理、技术和管理措施来保护您的个人信息免遭未经授权的访问、使用、披露、修改或破坏。这些措施可能包括使用加密技术、访问控制、安全审计、员工培训等。然而，互联网传输或电子存储方法并非100%安全，我们无法保证您的信息绝对安全。
            </p>
            <p className="mt-2">
              如果发生个人信息泄露事件，我们将根据法律法规的要求，及时通知您并向相关监管机构报告。
            </p>

            <h3 className="text-base font-semibold mt-4">7. 数据保留</h3>
            <p>
              我们仅在为您提供服务所需的时间内，或根据法律法规的要求，保留您的个人信息。数据保留期限取决于信息的类型、用途以及法律或业务需求。
            </p>
            <p className="mt-2">
              【重要提示：此处可以尝试更具体地说明不同类型数据的保留策略，例如：】
            </p>
             <p className="mt-2 italic text-muted-foreground">
               例如，您的账户信息在您账户有效期间会一直保留；您提交的作文内容在您使用服务期间会保留，以便为您提供批改历史等功能，您删除账户后，相关用户内容将在合理的时间内（例如，【请填写具体时间，如30天】）从我们的活动数据库中删除，但可能在备份系统中保留更长时间，最终将被安全销毁。与支付相关的记录将根据适用的财务和税务法律法规进行保留。
            </p>
             


            <h3 className="text-base font-semibold mt-4">8. 您的权利</h3>
            <p>
              根据适用的法律法规，您可能对您的个人信息享有以下权利：
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>**访问权：** 您有权获取我们持有的关于您的个人信息副本。</li>
                <li>**更正权：** 如果您发现我们持有的关于您的个人信息不准确或不完整，您有权要求我们进行更正。</li>
                <li>**删除权：** 在某些情况下，您有权要求我们删除您的个人信息。</li>
                <li>**限制处理权：** 在某些情况下，您有权要求我们限制对您个人信息的处理。</li>
                <li>**数据可移植权：** 在某些情况下，您有权接收您提供给我们的个人信息，并有权将这些信息传输给第三方。</li>
                <li>**反对权：** 在某些情况下，您有权反对我们处理您的个人信息。</li>
                <li>**撤回同意权：** 如果我们基于您的同意处理您的个人信息，您有权随时撤回您的同意，但这不影响撤回前基于同意进行的处理的合法性。</li>
              </ul>
            </p>
            <p className="mt-2">
              如需行使上述权利，请通过本政策提供的联系方式与我们联系。为了保护您的信息安全，我们可能会在处理您的请求前验证您的身份。
            </p>

            <h3 className="text-base font-semibold mt-4">9. 儿童隐私</h3>
             
            <p className="mt-2 italic text-muted-foreground">
               本服务面向所有希望改进写作的用户，包括学生。如果您是未满14周岁的未成年人（或其他当地法律规定的年龄），请在您的父母或法定监护人的指导和同意下使用本服务。我们不会在明知的情况下收集未满14周岁未成年人的个人信息，除非获得其父母或法定监护人的同意。如果您的监护人认为我们未经同意收集了未成年人的个人信息，请通过本政策提供的联系方式与我们联系，我们将尽快删除相关数据。
            </p>
             

            <h3 className="text-base font-semibold mt-4">10. 第三方网站链接</h3>
            <p>
              本服务可能包含指向第三方网站或服务的链接，例如Google、GitHub、微信、钉钉、爱发电等。这些第三方网站或服务有其自己的隐私政策，我们不对其隐私实践负责。建议您在访问这些第三方网站或服务时仔细阅读其隐私政策。
            </p>

            <h3 className="text-base font-semibold mt-4">11. 政策的更新</h3>
            <p>
              我们可能会根据业务发展、法律法规变化或用户反馈等因素更新本政策。本政策的任何修改都将通过在网站上发布更新版本的方式通知您。修改后的政策将在发布后生效。建议您定期查看本政策，以了解我们如何保护您的信息。您在政策更新后继续使用本服务的，即表示您已阅读、理解并同意接受修改后的政策。
            </p>

            <h3 className="text-base font-semibold mt-4">12. 联系我们</h3>
            <p>
              如果您对本隐私政策或您的个人信息有任何疑问、意见或请求，请通过以下方式与我们联系：
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
