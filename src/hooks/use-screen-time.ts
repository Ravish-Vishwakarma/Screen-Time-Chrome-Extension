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

function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function useAvailableDates(): string[] {
  const [dates, setDates] = useState<string[]>([])

  const scan = useCallback(async () => {
    const result = await chrome.storage.local.get(null)
    const prefixes = new Set<string>()

    for (const key of Object.keys(result)) {
      const idx = key.indexOf("|")
      if (idx !== -1) {
        prefixes.add(key.slice(0, idx))
      }
    }

    setDates(
      Array.from(prefixes).sort((a, b) => b.localeCompare(a))
    )
  }, [])

  useEffect(() => {
    scan()
    const listener = () => scan()
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
  }, [scan])

  return dates
}

export function useScreenTime(dateKey?: string) {
  const key = dateKey ?? todayString()
  const [sites, setSites] = useState<SiteTime[]>([])

  const fetchData = useCallback(async () => {
    const result = await chrome.storage.local.get(null)
    const prefix = `${key}|`
    const data: SiteTime[] = Object.entries(result)
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, seconds]) => ({
        domain: k.slice(prefix.length),
        totalSeconds: seconds as number,
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    setSites(data)
  }, [key])

  useEffect(() => {
    fetchData()

    const listener = () => fetchData()
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
  }, [fetchData])

  const totalTime = sites.reduce((acc, s) => acc + s.totalSeconds, 0)

  return { sites, totalTime, formatTime }
}
