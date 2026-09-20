self.addEventListener("push", (event) => {
  let data = { title: "LinkShield", body: "New alert", url: "/linkshield/protect", risk: "suspicious" };
  try {
    data = { ...data, ...event.data?.json() };
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/shield-icon.svg",
      badge: "/shield-icon.svg",
      data: { url: data.url },
      tag: "linkshield-alert",
      requireInteraction: data.risk === "dangerous",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/linkshield/protect";
  event.waitUntil(clients.openWindow(url));
});
