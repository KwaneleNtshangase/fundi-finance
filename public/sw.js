// Fundi Finance — Service Worker
// Handles: Push notifications + Offline caching (loadshedding/taxi mode)

const CACHE_NAME = "fundi-finance-v2";

// Assets to pre-cache immediately on install
const PRECACHE = [
  "/",
  "/manifest.json",
  "/fundi-logo.png",
  "/favicon.ico",
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {
        // If any pre-cache fails (e.g. offline at install time), continue anyway
      })
    )
  );
  // Take over immediately — don't wait for old SW to expire
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== CACHE_NAME)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: serve cached content offline ───────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests from same origin
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Skip Supabase API calls — always needs network
  if (request.url.includes("supabase.co")) return;

  const url = new URL(request.url);

  // ── Static assets (_next/static): cache-first ────────────────────────────
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Navigation requests (page loads): network-first, fall back to cache ──
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          // Offline: serve cached page (app shell)
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // ── Images and other assets: stale-while-revalidate ─────────────────────
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Fundi Finance", body: "You have a new notification!", url: "/" };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    data.body = event.data ? event.data.text() : data.body;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/fundi-logo.png",
      badge: "/fundi-logo.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" },
      actions: data.actions || [],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
