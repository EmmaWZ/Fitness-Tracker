const CACHE_NAME = "fitness-v1";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// Handle scheduled notification alarms via postMessage
self.addEventListener("message", e => {
  if (e.data?.type === "SCHEDULE_NOTIFICATIONS") {
    // Handled by the page via Notification API directly
  }
});

// Show notification when triggered
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow("/");
    })
  );
});
