let activeTabId: number | null = null
let activeDomain: string | null = null
let startTime = Date.now()

function getDomain(url: string) {
    try {
        return new URL(url).hostname
    } catch {
        return null
    }
}

async function saveTime(
    domain: string,
    timeSpent: number
) {
    const result =
        await chrome.storage.local.get(domain)

    const previousTime =
        (result[domain] as number) || 0

    await chrome.storage.local.set({
        [domain]: previousTime + timeSpent
    })
}

async function trackTab(tabId: number) {
    const tab = await chrome.tabs.get(tabId)

    if (!tab.url) return

    const newDomain = getDomain(tab.url)

    if (!newDomain) return

    const now = Date.now()

    if (activeDomain) {
        const timeSpent = Math.floor(
            (now - startTime) / 1000
        )

        await saveTime(activeDomain, timeSpent)
    }

    activeTabId = tabId
    activeDomain = newDomain
    startTime = now

    console.log("Tracking:", activeDomain)
}

chrome.tabs.onActivated.addListener(
    async (activeInfo) => {
        await trackTab(activeInfo.tabId)
    }
)

chrome.tabs.onUpdated.addListener(
    async (tabId, changeInfo) => {
        if (
            tabId === activeTabId &&
            changeInfo.status === "complete"
        ) {
            await trackTab(tabId)
        }
    }
)