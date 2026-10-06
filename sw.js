const CACHE = "happy-wife-v4";

// Install — take over immediately
self.addEventListener("install", e => {
  self.skipWaiting();
});

// Activate — clear every old cache
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Leave anything that is not our own origin alone — auth redirects to
  // Google and Supabase must never be intercepted or served from cache.
  if (url.origin !== self.location.origin) return;

  const isPage = req.mode === "navigate" ||
                 req.destination === "document" ||
                 url.pathname.endsWith(".html");

  if (isPage) {
    // NETWORK FIRST for the app itself, so updates land right away
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // CACHE FIRST for static assets (icons, fonts)
  e.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(res => {
        if (res && res.status === 200 && res.type !== "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});

// Push notifications
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : { title: "Happy Wife 💕", body: "Don't forget your 2 daily habits!" };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      vibrate: [200, 100, 200],
      tag: "happy-wife-reminder",
      renotify: true
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow("./index.html"));
});
