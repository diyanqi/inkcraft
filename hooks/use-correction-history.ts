import { useCallback, useEffect, useState } from "react"

type CorrectionHistory = {
  uuid: string
  title: string
  icon: string
  url: string
}

export function useCorrectionHistory() {
  const [history, setHistory] = useState<CorrectionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const limit = 7

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/correction/history?limit=${limit}&skip=${skip}`
      )
      if (!response.ok) throw new Error("获取历史记录失败")
      
      const { data } = await response.json()
      if (data.length < limit) {
        setHasMore(false)
      }
      
      setHistory(prev => skip === 0 ? data : [...prev, ...data])
    } catch (error) {
      console.error("获取历史记录失败:", error)
    } finally {
      setLoading(false)
    }
  }, [skip])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return
    setSkip(prev => prev + limit)
  }, [hasMore, loading])

  return {
    history,
    loading,
    hasMore,
    loadMore
  }
}