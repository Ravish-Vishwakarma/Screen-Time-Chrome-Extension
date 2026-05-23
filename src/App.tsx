import { PieChart, Pie, Cell, Tooltip } from "recharts"
import { useScreenTime, formatTime } from "./hooks/use-screen-time"

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
]

function App() {
  const { sites, totalTime } = useScreenTime()

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

      {sites.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No data yet. Start browsing!
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
