let activeTabId: number | null = null
let activeDomain: string | null = null
let startTime = Date.now()

const SAVE_INTERVAL = 5_000

function todayKey() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

function storageKey(domain: string) {
    return `${todayKey()}|${domain}`
}

function getDomain(url: string) {
    try {
        return new URL(url).hostname
    } catch {
        return null
    }
}

async function saveTime(domain: string, timeSpent: number) {
    const key = storageKey(domain)
    const result = await chrome.storage.local.get(key)
    const previousTime = (result[key] as number) || 0

    await chrome.storage.local.set({
        [key]: previousTime + timeSpent,
    })
}

function formatBadge(seconds: number): string {
    if (seconds < 60) return ""
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const rem = mins % 60
    if (hours < 10) return `${hours}:${String(rem).padStart(2, "0")}`
    if (hours < 100) return `${hours}h`
    return "99+"
}

async function updateBadge() {
    if (!activeDomain) {
        chrome.action.setBadgeText({ text: "" })
        return
    }

    const key = storageKey(activeDomain)
    const result = await chrome.storage.local.get(key)
    const total = (result[key] as number) || 0
    const text = formatBadge(total)

    chrome.action.setBadgeText({ text })
    chrome.action.setBadgeBackgroundColor({ color: [80, 80, 80, 255] })
}

async function flushCurrentSession() {
    if (!activeDomain) return

    const now = Date.now()
    const timeSpent = Math.floor((now - startTime) / 1000)

    if (timeSpent < 1) return

    await saveTime(activeDomain, timeSpent)
    startTime = now
    await updateBadge()
}

async function trackTab(tabId: number) {
    const tab = await chrome.tabs.get(tabId)

    if (!tab.url) return

    const newDomain = getDomain(tab.url)

    if (!newDomain) return

    await flushCurrentSession()

    activeTabId = tabId
    activeDomain = newDomain
    startTime = Date.now()
    await updateBadge()
}

setInterval(flushCurrentSession, SAVE_INTERVAL)

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await trackTab(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (tabId === activeTabId && changeInfo.status === "complete") {
        await trackTab(tabId)
    }
})

chrome.runtime.onStartup.addListener(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) trackTab(tabs[0].id)
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        activeDomain = null
        chrome.action.setBadgeText({ text: "" })
        return
    }

    const tabs = await chrome.tabs.query({ active: true, windowId })
    if (tabs[0]?.id) trackTab(tabs[0].id)
})