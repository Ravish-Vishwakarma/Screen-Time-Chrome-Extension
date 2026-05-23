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
  useAvailableDates,
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

function formatDateLabel(dateStr: string) {
  const today = new Date()
  const d = new Date(dateStr + "T00:00:00")

  const diff = new Date(today).setHours(0, 0, 0, 0) - d.getTime()
  const days = Math.round(diff / 86_400_000)

  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return dateStr
}

function App() {
  const dates = useAvailableDates()
  const todayStr = new Date().toISOString().slice(0, 10)
  const defaultDate = dates.length > 0 ? dates[0] : todayStr
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const { sites, totalTime: dayTotal } = useScreenTime(selectedDate)
  const { siteTotals, mostActiveDay, leastActiveDay, mostVisitedSite } =
    useAggregateStats()

  const [deleting, setDeleting] = useState(false)
  const handleDelete = useCallback(async () => {
    setDeleting(true)
    await chrome.storage.local.clear()
    setDeleting(false)
  }, [])

  const hasData = siteTotals.length > 0
  const isToday = selectedDate === todayStr

  const barData = siteTotals.slice(0, 6).map((s) => ({
    name: s.domain.length > 10 ? s.domain.slice(0, 8) + "…" : s.domain,
    value: s.totalSeconds,
  }))

  const chartData = sites.map((s) => ({
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
        <span className="text-lg font-semibold">{formatTime(dayTotal)}</span>

        {hasData && (
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                data-active={date === selectedDate}
                className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=false]:bg-muted data-[active=false]:text-muted-foreground hover:opacity-80"
              >
                {formatDateLabel(date)}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isToday && hasData && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-muted-foreground">Top Site</p>
            <p className="truncate font-medium">{mostVisitedSite}</p>
          </div>
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-muted-foreground">Most Day</p>
            <p className="truncate font-medium">{formatDateLabel(mostActiveDay)}</p>
          </div>
          <div className="rounded-md border px-2 py-1.5">
            <p className="text-muted-foreground">Least Day</p>
            <p className="truncate font-medium">{formatDateLabel(leastActiveDay)}</p>
          </div>
        </div>
      )}

      {!isToday && hasData && (
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

      <p className="text-sm text-muted-foreground">
        {formatDateLabel(selectedDate)} — {formatTime(dayTotal)}
      </p>

      {sites.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No data for this day.
        </p>
      )}

      {sites.length > 0 && (
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

      {sites.length > 0 && (
        <div className="space-y-1">
          {sites.map((site, i) => (
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

      {hasData && (
        <div className="flex justify-center pt-1">
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
