import { useScreenTime, formatTime } from "./hooks/use-screen-time"

function App() {
  const { sites, totalTime, resetAll } = useScreenTime()

  return (
    <div className="w-80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Screen Time</h1>
        <span className="text-sm text-muted-foreground">
          Total: {formatTime(totalTime)}
        </span>
      </div>

      <div className="space-y-1">
        {sites.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No data yet. Start browsing!
          </p>
        )}

        {sites.map((site) => (
          <div
            key={site.domain}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span className="truncate max-w-[180px]">{site.domain}</span>
            <span className="text-muted-foreground shrink-0">
              {formatTime(site.totalSeconds)}
            </span>
          </div>
        ))}
      </div>

      {sites.length > 0 && (
        <button
          onClick={resetAll}
          className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Reset all data
        </button>
      )}
    </div>
  )
}

export default App
