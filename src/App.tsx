import { useState } from "react"
import { PieChart, Pie, Cell, Tooltip } from "recharts"
import {
  useScreenTime,
  useAvailableDates,
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
  const today = dates.length > 0 ? dates[0] : new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)

  const { sites, totalTime } = useScreenTime(selectedDate)

  const chartData = sites.map((s) => ({
    name: s.domain,
    value: s.totalSeconds,
  }))

  return (
    <div className="w-80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Screen Time</h1>
        <span className="text-sm text-muted-foreground">
          Total: {formatTime(totalTime)}
        </span>
      </div>

      {dates.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
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

      {sites.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
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
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]
                return (
                  <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-muted-foreground">
                      {formatTime(d.value as number)}
                    </p>
                  </div>
                )
              }}
            />
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
    </div>
  )
}

export default App
