import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <main className="text-center space-y-6 p-8">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
          <span className="text-gray-900 dark:text-white">文酱</span>
          <span className="text-gray-500 dark:text-gray-400 ml-4">InkCraft</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          优雅的写作，从这里开始
        </p>
        <Link href="/dashboard">
          <Button>
            <ChevronRight /> 立即体验
          </Button>
        </Link>
      </main>
    </div>
  );
}
