const DEFAULT_API = "https://meckvy.vercel.app";

chrome.runtime.onInstalled.addListener(async () => {
  const { clientId } = await chrome.storage.local.get("clientId");
  if (!clientId) {
    await chrome.storage.local.set({ clientId: crypto.randomUUID() });
  }
  syncBlocklist();
});

chrome.alarms?.create?.("sync-blocklist", { periodInMinutes: 30 });
chrome.alarms?.onAlarm?.addListener((alarm) => {
  if (alarm.name === "sync-blocklist") syncBlocklist();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SCAN_MESSAGE") {
    handleScan(msg.payload).then(sendResponse);
    return true;
  }
  if (msg.type === "REPORT_SCAM") {
    reportScam(msg.payload).then(sendResponse);
    return true;
  }
  if (msg.type === "GET_BLOCKLIST") {
    chrome.storage.local.get(["blocklistDomains"]).then((data) => {
      sendResponse({ domains: data.blocklistDomains || [] });
    });
    return true;
  }
});

async function getApiBase() {
  const stored = await chrome.storage.local.get(["apiBase"]);
  return stored.apiBase || DEFAULT_API;
}

async function ensureClientId() {
  const stored = await chrome.storage.local.get(["clientId"]);
  if (stored.clientId) return stored.clientId;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ clientId: id });
  return id;
}

async function syncBlocklist() {
  try {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/api/shield/community?mode=blocklist`);
    if (!res.ok) return;
    const data = await res.json();
    await chrome.storage.local.set({
      blocklistDomains: data.domains || [],
      blocklistUpdatedAt: data.updatedAt,
    });
  } catch {
    /* offline */
  }
}

async function handleScan(payload) {
  const clientId = await ensureClientId();
  const apiBase = await getApiBase();

  try {
    const res = await fetch(`${apiBase}/api/shield/monitor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        platform: payload.platform,
        text: payload.text,
        senderHint: payload.senderHint,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };

    if (data.warn) {
      const top = data.urls?.[0];
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.svg",
        title:
          data.overallRisk === "dangerous"
            ? "🚨 Scam link blocked"
            : "⚠️ Suspicious link",
        message: top?.flags?.[0]?.title || data.message,
        priority: 2,
      });
    }

    return { ok: true, ...data };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function reportScam(payload) {
  const clientId = await ensureClientId();
  const apiBase = await getApiBase();
  try {
    const res = await fetch(`${apiBase}/api/shield/community`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: payload.url,
        clientId,
        note: payload.note || "Reported via extension",
      }),
    });
    const data = await res.json();
    await syncBlocklist();
    return { ok: res.ok, ...data };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
