// QuestLift Service Worker — rest timer notifications only

let notificationTimeout = null

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("message", (event) => {
  const { type, delay, title, body } = event.data || {}

  if (type === "SCHEDULE_NOTIFICATION") {
    // Clear any existing scheduled notification
    if (notificationTimeout) clearTimeout(notificationTimeout)

    notificationTimeout = setTimeout(() => {
      self.registration.showNotification(title || "Rest Over", {
        body: body || "Time to hit your next set!",
        icon: "/icon-192x192.png",
        tag: "rest-timer",
        renotify: true,
      })
      notificationTimeout = null
    }, delay)
  }

  if (type === "CANCEL_NOTIFICATION") {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
      notificationTimeout = null
    }
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if found
        for (const client of clients) {
          if (client.url.includes("/dashboard/workout") && "focus" in client) {
            return client.focus()
          }
        }
        // Otherwise open a new tab
        return self.clients.openWindow("/dashboard/workout")
      })
  )
})
