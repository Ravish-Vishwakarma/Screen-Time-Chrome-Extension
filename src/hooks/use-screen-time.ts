import { useState, useEffect, useCallback } from "react"

export interface SiteTime {
  domain: string
  totalSeconds: number
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export { formatTime }

export function useScreenTime() {
  const [sites, setSites] = useState<SiteTime[]>([])

  const fetchData = useCallback(async () => {
    const result = await chrome.storage.local.get(null)
    const data: SiteTime[] = Object.entries(result)
      .filter(([key]) => key !== "lastReset")
      .map(([domain, seconds]) => ({
        domain,
        totalSeconds: seconds as number,
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    setSites(data)
  }, [])

  useEffect(() => {
    fetchData()

    const listener = () => fetchData()
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
  }, [fetchData])

  const resetAll = useCallback(async () => {
    await chrome.storage.local.clear()
    setSites([])
  }, [])

  const totalTime = sites.reduce((acc, s) => acc + s.totalSeconds, 0)

  return { sites, totalTime, resetAll, formatTime }
}
