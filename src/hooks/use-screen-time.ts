import { useState, useEffect, useCallback } from "react"

export interface SiteTime {
  domain: string
  totalSeconds: number
}

export interface AggregateStats {
  siteTotals: SiteTime[]
  mostActiveDay: string
  leastActiveDay: string
  mostVisitedSite: string
  totalAllTime: number
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

export function useAggregateStats() {
  const [stats, setStats] = useState<AggregateStats>({
    siteTotals: [],
    mostActiveDay: "",
    leastActiveDay: "",
    mostVisitedSite: "",
    totalAllTime: 0,
  })

  const fetchStats = useCallback(async () => {
    const result = await chrome.storage.local.get(null)
    const domainTotals: Record<string, number> = {}
    const dayTotals: Record<string, number> = {}

    for (const [key, value] of Object.entries(result)) {
      const idx = key.indexOf("|")
      if (idx === -1) continue
      const date = key.slice(0, idx)
      const domain = key.slice(idx + 1)
      const seconds = value as number

      domainTotals[domain] = (domainTotals[domain] || 0) + seconds
      dayTotals[date] = (dayTotals[date] || 0) + seconds
    }

    const siteTotals = Object.entries(domainTotals)
      .map(([domain, totalSeconds]) => ({ domain, totalSeconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds)

    const totalAllTime = siteTotals.reduce((acc, s) => acc + s.totalSeconds, 0)

    const days = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])
    const mostActiveDay = days[0]?.[0] ?? ""
    const leastActiveDay = days[days.length - 1]?.[0] ?? ""
    const mostVisitedSite = siteTotals[0]?.domain ?? ""

    setStats({ siteTotals, mostActiveDay, leastActiveDay, mostVisitedSite, totalAllTime })
  }, [])

  useEffect(() => {
    fetchStats()
    const listener = () => fetchStats()
    chrome.storage.local.onChanged.addListener(listener)
    return () => chrome.storage.local.onChanged.removeListener(listener)
  }, [fetchStats])

  return stats
}
