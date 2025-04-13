'use client'

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { DailyQuote } from "@/components/daily-quote"

import data from "./data.json"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-[calc(100vh-4rem)]">
      {/* <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} /> */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 lg:px-6 gap-4">
        <DailyQuote />
        <Button
          onClick={() => router.push('/dashboard/create')}
        >
          开始批改
        </Button>
      </div>
    </div>
  )
}
