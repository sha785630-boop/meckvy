const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+|[a-z0-9][-a-z0-9]*\.(?:com|org|net|io|co|app|xyz|top|click|link|online|site|shop|icu|sbs|cfd)[^\s<>"{}|\\^`[\]]*/gi;

const seen = new Set();
/** @type {Map<string, { risk: string, domain: string }>} */
const urlRiskCache = new Map();
let blocklistDomains = new Set();

const PLATFORM = detectPlatform();

function detectPlatform() {
  const h = location.hostname;
  if (h.includes("whatsapp")) return "whatsapp_web";
  if (h.includes("telegram")) return "telegram_web";
  if (h.includes("google") && location.pathname.startsWith("/mail"))
    return "gmail";
  if (h.includes("messenger")) return "messenger";
  if (h.includes("instagram")) return "instagram";
  return "whatsapp_web";
}

function extractUrls(text) {
  const matches = text.match(URL_RE) || [];
  return [...new Set(matches.map((u) => u.replace(/[.,;:!?)]+$/, "")))];
}

function hashText(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `${PLATFORM}:${h}`;
}

function domainOf(url) {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isOnBlocklist(url) {
  const d = domainOf(url);
  if (!d) return false;
  if (blocklistDomains.has(d)) return true;
  for (const blocked of blocklistDomains) {
    if (d === blocked || d.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

chrome.runtime.sendMessage({ type: "GET_BLOCKLIST" }, (res) => {
  if (res?.domains) blocklistDomains = new Set(res.domains);
});

function scanMessage(text, senderHint) {
  const urls = extractUrls(text);
  if (!urls.length) return;

  const key = hashText(text);
  if (seen.has(key)) return;
  seen.add(key);
  if (seen.size > 800) {
    const first = seen.values().next().value;
    seen.delete(first);
  }

  // Instant local block from community list
  const blocked = urls.filter(isOnBlocklist);
  if (blocked.length) {
    for (const u of blocked) {
      urlRiskCache.set(u, { risk: "dangerous", domain: domainOf(u) });
    }
    showBanner(
      {
        overallRisk: "dangerous",
        message: "Blocked by community threat list",
        urls: blocked.map((u) => ({
          domain: domainOf(u),
          flags: [
            {
              title: "Community-confirmed scam",
              detail: "Other LinkShield users already reported this domain.",
            },
          ],
        })),
        block: true,
      },
      text,
    );
  }

  chrome.runtime.sendMessage(
    {
      type: "SCAN_MESSAGE",
      payload: { platform: PLATFORM, text, senderHint },
    },
    (result) => {
      if (!result?.ok) return;
      for (const u of result.urls || []) {
        urlRiskCache.set(u.normalizedUrl || u.url, {
          risk: u.risk,
          domain: u.domain,
        });
      }
      if (result.warn) showBanner(result, text);
      markDangerousLinksInDom();
    },
  );
}

function showBanner(result, text) {
  const id = `ls-${Date.now()}`;
  const risk = result.overallRisk;
  const colors = {
    dangerous: {
      bg: "#7f1d1d",
      border: "#ef4444",
      label: "SCAM LINK — DO NOT CLICK",
    },
    suspicious: {
      bg: "#78350f",
      border: "#f59e0b",
      label: "Suspicious link detected",
    },
    safe: {
      bg: "#14532d",
      border: "#22c55e",
      label: "Link checked — looks okay",
    },
  };
  const c = colors[risk] || colors.suspicious;
  const top = result.urls?.[0];
  const reportUrl = top?.normalizedUrl || top?.url || extractUrls(text)[0];

  const el = document.createElement("div");
  el.id = id;
  el.setAttribute("role", "alert");
  el.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
    max-width: 380px; padding: 16px 18px; border-radius: 14px;
    background: ${c.bg}; border: 2px solid ${c.border};
    color: #fff; font-family: system-ui, sans-serif; font-size: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.45); animation: ls-slide 0.3s ease;
  `;

  el.innerHTML = `
    <style>@keyframes ls-slide{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}</style>
    <div style="font-weight:700;font-size:15px;margin-bottom:6px">🛡️ LinkShield</div>
    <div style="font-weight:600;margin-bottom:4px">${c.label}</div>
    <div style="opacity:0.9;font-size:13px;margin-bottom:8px">${top?.flags?.[0]?.detail || result.message || ""}</div>
    <div style="font-size:12px;opacity:0.75;word-break:break-all">${top?.domain || ""}</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button data-action="dismiss" style="background:rgba(255,255,255,0.2);border:none;color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px">Dismiss</button>
      ${
        reportUrl
          ? `<button data-action="report" style="background:#d4654a;border:none;color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">Report scam</button>`
          : ""
      }
    </div>
  `;

  el.querySelector('[data-action="dismiss"]')?.addEventListener("click", () =>
    el.remove(),
  );
  el.querySelector('[data-action="report"]')?.addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { type: "REPORT_SCAM", payload: { url: reportUrl } },
      () => {
        const btn = el.querySelector('[data-action="report"]');
        if (btn) btn.textContent = "Reported ✓";
      },
    );
  });

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 18000);
}

function markDangerousLinksInDom() {
  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.href;
    if (!href || href.startsWith("javascript:")) return;
    const cached = [...urlRiskCache.entries()].find(
      ([u]) => href.includes(domainOf(u)) || u === href,
    );
    const dangerous =
      isOnBlocklist(href) ||
      cached?.[1]?.risk === "dangerous" ||
      [...urlRiskCache.values()].some(
        (v) => v.risk === "dangerous" && href.includes(v.domain),
      );

    if (!dangerous) return;

    a.style.outline = "2px solid #ef4444";
    a.style.background = "rgba(239,68,68,0.15)";
    a.title = "LinkShield: dangerous link — click blocked";
    a.dataset.linkshieldBlocked = "1";
  });
}

/** Hard block: stop navigation to known-dangerous destinations */
document.addEventListener(
  "click",
  (e) => {
    const a = e.target?.closest?.("a[href]");
    if (!a) return;
    const href = a.href;
    if (!href) return;

    const blocked =
      a.dataset.linkshieldBlocked === "1" ||
      isOnBlocklist(href) ||
      [...urlRiskCache.entries()].some(
        ([u, v]) =>
          v.risk === "dangerous" &&
          (href === u || href.includes(v.domain) || domainOf(href) === v.domain),
      );

    if (!blocked) return;

    e.preventDefault();
    e.stopPropagation();
    showBanner(
      {
        overallRisk: "dangerous",
        message: "LinkShield blocked this click to protect you.",
        urls: [
          {
            domain: domainOf(href),
            normalizedUrl: href,
            flags: [
              {
                title: "Click blocked",
                detail:
                  "This destination is flagged as a scam. Do not open it.",
              },
            ],
          },
        ],
        block: true,
      },
      href,
    );
  },
  true,
);

function getMessageNodes() {
  switch (PLATFORM) {
    case "whatsapp_web":
      return document.querySelectorAll(
        '[data-testid="msg-container"], .message-in, .message-out',
      );
    case "telegram_web":
      return document.querySelectorAll(".Message, .text-content");
    case "gmail":
      return document.querySelectorAll(".a3s.aiL, .gs .a3s");
    case "messenger":
      return document.querySelectorAll('[role="row"], .html-div');
    case "instagram":
      return document.querySelectorAll('[role="row"], span[dir="auto"]');
    default:
      return document.querySelectorAll("[data-message]");
  }
}

function processNode(node) {
  const text = node.textContent?.trim();
  if (!text || text.length < 8) return;
  if (!URL_RE.test(text)) return;
  URL_RE.lastIndex = 0;
  scanMessage(text);
}

function scanExisting() {
  getMessageNodes().forEach(processNode);
  markDangerousLinksInDom();
}

const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      processNode(node);
      node.querySelectorAll?.("*").forEach((child) => {
        if (child.textContent && URL_RE.test(child.textContent)) {
          URL_RE.lastIndex = 0;
          processNode(child);
        }
      });
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
setTimeout(scanExisting, 2500);

console.info("[LinkShield] Strong protection active on", PLATFORM);
