'use client'; // 标记为客户端组件

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from 'next/image'; // 导入 Next.js Image 组件
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// 注册 ScrollTrigger 插件，仅在客户端环境执行
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Data structure (assuming it's the same as the previous version)
const textSectionsData = [
  {
    tagline: "# 顶尖引擎",
    title: "小作坊，\n下料就是猛。",
    paragraphs: [
      "顶尖大语言模型，悉数汇聚。ChatGPT、DeepSeek等精尖引擎，无缝协作，为你所用。如同交响乐团指挥，让每个音符都精准落位。",
    ],
    tags: ["ChatGPT", "DeepSeek", "Gemini", "Claude"],
    image: "https://t.alcy.cc/fj",
  },
  {
    tagline: "# 写作辅助",
    title: "你的满分作文，\n妙笔自天成。",
    paragraphs: [
      "灵感涌现时，墨灵懂你的灵光一现；词不达意时，墨灵解你的欲言又止。写作之道，浑然天成。",
    ],
    tags: ["灵感", "表达", "流畅", "自然"],
    image: "https://t.alcy.cc/fj",
  },
  {
    tagline: "# 教育传承",
    title: "百年沉淀，\n智能新生。",
    paragraphs: [
      "源于百年教育智慧的精粹，融于前沿AI的敏锐洞察。传统教学与智能革新，在此相遇。",
    ],
    tags: ["教育", "智慧", "AI", "革新"],
    image: "https://t.alcy.cc/fj",
  },
    {
    tagline: "# 深度分析",
    title: "多维精析，\n突破常规认知。",
    paragraphs: [
      "从立意校准到文采焕新，十重评价维度层层递进。如同手术刀般精准，又如春风化雨般细腻。",
    ],
    tags: ["立意", "文采", "结构", "逻辑", "评分"],
    image: "https://t.alcy.cc/fj",
  },
  {
    tagline: "# 专业批改",
    title: "特教级批改，\n次次皆精进。",
    paragraphs: [
      "MoE混合专家架构，让每次批改都精准如名师亲授。从篇章结构到标点细节，步步成就写作大师风范。",
    ],
    tags: ["MoE", "专家模型", "批改", "反馈", "提升"],
    image: "https://t.alcy.cc/fj",
  },
  {
    tagline: "# 智能交互",
    title: "你的下个老师，\n何必是老师。",
    paragraphs: [
      "写作从未如此通透。智能提纲如同北斗引航，实时建议宛若灵感催化剂。当AI读懂字里行间的深意，写作便成了与智慧的对话。",
    ],
    tags: ["提纲", "建议", "实时", "交互", "理解"],
    image: "https://t.alcy.cc/fj",
  },
  {
    tagline: "# 个性化成长",
    title: "专属你的写作进化论。",
    paragraphs: [
      "每一次修改痕迹都被智能学习，每一处进步都形成个性化提升路径。在墨灵，写作能力以可见的速度进化。",
    ],
    tags: ["学习", "进化", "个性化", "追踪", "成长"],
    image: "https://t.alcy.cc/fj",
  },
];


export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  // sectionRefs will hold refs for: Hero (0), textSections (1 to N), Footer (N+1)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP Animation - Unchanged, will apply to all elements in sectionRefs
  useGSAP(() => {
    // Filter out null refs just in case
    const sections = sectionRefs.current.filter(section => section !== null) as HTMLDivElement[];

    sections.forEach((section) => { // No need for index here
      gsap.fromTo(section,
        { opacity: 0.3, y: 50 }, // Initial state
        {
          opacity: 1, // Final state
          y: 0, // Final state
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%", // Adjusted start slightly higher for potentially shorter footer
            end: "bottom 20%",
            toggleActions: "play none none reverse",
            // markers: true, // Uncomment for debugging scroll trigger points
          },
        }
      );
    });

  }, { scope: container }); // scope ensures animations are cleaned up

  return (
    <div ref={container} className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black overflow-x-hidden"> {/* Added overflow-x-hidden */}

      {/* Hero Section - Assign ref 0 */}
      <main ref={el => { sectionRefs.current[0] = el as HTMLDivElement | null; }} className="min-h-screen flex flex-col items-center justify-center text-center space-y-6 p-8">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
          <span className="text-gray-900 dark:text-white">墨灵</span>
          <span className="text-gray-500 dark:text-gray-400 ml-4">InkCraft</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          优雅的写作，从这里开始
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="mt-8">
            立即体验 <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </main>

      {/* Introduction Sections - Assign refs 1 to N */}
      {textSectionsData.map((section, index) => (
        <div
          key={index}
           // Assign refs starting from 1
          ref={el => { sectionRefs.current[index + 1] = el as HTMLDivElement | null; }}
          className="min-h-screen flex items-center py-24 px-4 sm:px-8 lg:px-16 xl:px-24"
        >
          <div className={`container mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            {/* Text Content Area (30%) */}
            <div className={`md:w-[30%] flex flex-col justify-center space-y-6 ${index % 2 !== 0 ? 'md:text-right md:items-end' : 'md:text-left md:items-start'}`}>
              {section.tagline && (
                <p className="text-base font-medium text-indigo-600 dark:text-indigo-400">
                  {section.tagline}
                </p>
              )}
              <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white whitespace-pre-line tracking-tight">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-lg text-gray-600 dark:text-gray-400 max-w-xl md:max-w-none">
                  {paragraph}
                </p>
              ))}
              {section.tags && section.tags.length > 0 && (
                <div className={`flex flex-wrap gap-2 pt-4 w-full ${index % 2 !== 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                  {section.tags.map((tag, tIndex) => (
                    <span key={tIndex} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Image Area (70%) */}
            <div className={`md:w-[70%] flex justify-center items-center mt-12 md:mt-0`}>
              <Image
                src={section.image}
                alt={`Illustration for ${section.title.split('\n').join(' ')}`}
                width={1000}
                height={600}
                className="w-full h-auto object-contain rounded-lg shadow-xl"
                sizes="(max-width: 767px) 90vw, 70vw"
                priority={index < 2}
              />
            </div>
          </div>
        </div>
      ))}

      {/* --- NEW FINAL SECTION --- */}
      {/* Assign ref N+1 */}
      <div
        ref={el => { sectionRefs.current[textSectionsData.length + 1] = el as HTMLDivElement | null; }}
        className="flex flex-col items-center justify-center text-center space-y-6 py-24 px-8" // Added padding
      >
         {/* Replicated elements from Hero section, potentially smaller heading */}
        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">
          <span className="text-gray-900 dark:text-white">墨灵</span>
          <span className="text-gray-500 dark:text-gray-400 ml-3">InkCraft</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto"> {/* Adjusted text size/max-width slightly */}
          优雅的写作，从这里开始
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="mt-6"> {/* Adjusted margin slightly */}
            立即体验 <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
      {/* --- END OF NEW FINAL SECTION --- */}

    </div>
  );
}