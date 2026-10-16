/* Meckvy app service worker — also handles LinkShield push alerts */
const VERSION = "meckvy-v1";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/app-icon/192"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: always fresh from the network, offline screen if there is no connection
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Build assets and uploaded photos never change for a given URL
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/api/photos/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* use defaults */
  }

  if (data.app === "meckvy") {
    event.waitUntil(
      self.registration.showNotification(data.title || "DirectStay", {
        body: data.body || "New guest message",
        icon: "/app-icon/192",
        badge: "/app-icon/96",
        data: { url: data.url || "/dashboard/inbox" },
        tag: "meckvy-enquiry",
        renotify: true,
      }),
    );
    return;
  }

  const shield = {
    title: "LinkShield",
    body: "New alert",
    url: "/linkshield/protect",
    risk: "suspicious",
    ...data,
  };
  event.waitUntil(
    self.registration.showNotification(shield.title, {
      body: shield.body,
      icon: "/shield-icon.svg",
      badge: "/shield-icon.svg",
      data: { url: shield.url },
      tag: "linkshield-alert",
      requireInteraction: shield.risk === "dangerous",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ("focus" in win) {
          win.navigate(url);
          return win.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
