import { useState, useCallback } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts"
import {
  useScreenTime,
  useAggregateStats,
  formatTime,
} from "./hooks/use-screen-time"

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(0, 65%, 50%)",
  "hsl(140, 50%, 45%)",
  "hsl(280, 55%, 55%)",
  "hsl(35, 80%, 50%)",
  "hsl(190, 70%, 45%)",
  "hsl(330, 65%, 50%)",
]

type Tab = "today" | "history"

function App() {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [tab, setTab] = useState<Tab>("today")
  const { sites: todaySites, totalTime: todayTotal } = useScreenTime(todayStr)
  const { siteTotals, mostActiveDay, leastActiveDay, mostVisitedSite } =
    useAggregateStats()

  const [deleting, setDeleting] = useState(false)
  const handleDelete = useCallback(async () => {
    setDeleting(true)
    await chrome.storage.local.clear()
    setDeleting(false)
  }, [])

  const exportCSV = useCallback(async () => {
    const result = await chrome.storage.local.get(null)
    const rows = Object.entries(result)
      .filter(([key]) => key.includes("|"))
      .map(([key, seconds]) => {
        const [date, ...rest] = key.split("|")
        const domain = rest.join("|")
        const total = seconds as number
        const h = Math.floor(total / 3600)
        const m = Math.floor((total % 3600) / 60)
        const s = total % 60
        return `${date},${domain},${total},${h}h ${m}m ${s}s`
      })

    const csv = "Date,Domain,Total Seconds,Time\n" + rows.join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "screen-time-export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const hasData = siteTotals.length > 0
  const isHistory = tab === "history"

  const barData = siteTotals.slice(0, 6).map((s) => ({
    name: s.domain.length > 10 ? s.domain.slice(0, 8) + "…" : s.domain,
    value: s.totalSeconds,
  }))

  const pieSites = isHistory ? siteTotals : todaySites
  const pieTotal = isHistory
    ? siteTotals.reduce((a, s) => a + s.totalSeconds, 0)
    : todayTotal

  const chartData = pieSites.map((s) => ({
    name: s.domain,
    value: s.totalSeconds,
  }))

  function tooltipFn(props: Record<string, unknown>) {
    const active = props.active as boolean | undefined
    const payload = props.payload as Array<{ name: string; value: number }> | undefined
    if (!active || !payload?.length) return null
    const d = payload[0]
    return (
      <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
        <p className="font-medium">{d.name}</p>
        <p className="text-muted-foreground">{formatTime(d.value)}</p>
      </div>
    )
  }

  return (
    <div className="w-80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg font-semibold">{formatTime(pieTotal)}</span>

        {hasData && (
          <div className="flex gap-1 pb-0.5">
            {(["today", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                data-active={tab === t}
                className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=false]:bg-muted data-[active=false]:text-muted-foreground hover:opacity-80"
              >
                {t === "today" ? "Today" : "History"}
              </button>
            ))}
          </div>
        )}
      </div>

      {isHistory && hasData && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-muted-foreground">Top Site</p>
            <p className="truncate font-medium">{mostVisitedSite}</p>
          </div>
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-muted-foreground">Most Day</p>
            <p className="truncate font-medium">{mostActiveDay}</p>
          </div>
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-muted-foreground">Least Day</p>
            <p className="truncate font-medium">{leastActiveDay}</p>
          </div>
        </div>
      )}

      {isHistory && hasData && (
        <div className="flex justify-center">
          <BarChart width={288} height={160} data={barData}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "currentColor" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis hide />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(220, 70%, 50%)" />
            <Tooltip content={tooltipFn} cursor={{ fill: "transparent" }} />
          </BarChart>
        </div>
      )}

      {pieSites.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {isHistory ? "No history data." : "No data for today."}
        </p>
      )}

      {pieSites.length > 0 && (
        <div className="flex justify-center">
          <PieChart width={240} height={180}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={tooltipFn} />
          </PieChart>
        </div>
      )}

      {pieSites.length > 0 && (
        <div className="space-y-1">
          {pieSites.map((site, i) => (
            <div
              key={site.domain}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate max-w-[180px]">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {site.domain}
              </span>
              <span className="text-muted-foreground shrink-0">
                {formatTime(site.totalSeconds)}
              </span>
            </div>
          ))}
        </div>
      )}

      {isHistory && hasData && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={exportCSV}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete all data"}
          </button>
        </div>
      )}

      {!hasData && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No data yet. Start browsing!
        </p>
      )}
    </div>
  )
}

export default App
