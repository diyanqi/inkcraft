'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from "@/components/ui/skeleton"

interface Quote {
    content: string
    translation: string
    author: string
}

export function DailyQuote() {
    const [quote, setQuote] = useState<Quote | null>(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        fetch('/api/daily-quote')
            .then(res => res.json())
            .then(data => {
                setQuote({
                    content: data.content,
                    translation: data.translation,
                    author: data.author
                })
            })
            .catch(error => {
                console.error('Error fetching quote:', error)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-32 self-end" />
            </div>
        )
    }

    if (!quote) return null

    return (
        <div className="flex flex-col items-center gap-4 text-center w-full max-w-2xl">
            <p className="text-lg font-medium">{quote.content}</p>
            <p className="text-sm text-muted-foreground">{quote.translation}</p>
            <p className="self-end text-sm italic text-muted-foreground">—— {quote.author}</p>
        </div>
    )
}