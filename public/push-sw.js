const REMINDER_CACHE = 'peptidetracker-reminder-schedule'
const REMINDER_URL = '/__peptide-reminder-schedule'
const WEIGHIN_CACHE = 'peptidetracker-weighin-schedule'
const WEIGHIN_URL = '/__peptide-weighin-schedule'
const HOME_URL = '/app#today'

async function loadReminderState() {
  try {
    const cache = await caches.open(REMINDER_CACHE)
    const res = await cache.match(REMINDER_URL)
    if (!res) return { reminders: [], fired: {} }
    return res.json()
  } catch {
    return { reminders: [], fired: {} }
  }
}

async function saveReminderState(state) {
  const cache = await caches.open(REMINDER_CACHE)
  await cache.put(
    REMINDER_URL,
    new Response(JSON.stringify(state), {
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

async function loadWeighInState() {
  try {
    const cache = await caches.open(WEIGHIN_CACHE)
    const res = await cache.match(WEIGHIN_URL)
    if (!res) return { reminders: [], fired: {} }
    return res.json()
  } catch {
    return { reminders: [], fired: {} }
  }
}

async function saveWeighInState(state) {
  const cache = await caches.open(WEIGHIN_CACHE)
  await cache.put(
    WEIGHIN_URL,
    new Response(JSON.stringify(state), {
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

async function showSlotNotification(item) {
  const tag = item.tag || 'peptide-reminder'
  const url = item.url || (item.data && item.data.url) || HOME_URL
  await self.registration.showNotification(item.title || 'PeptideTracker', {
    body: item.body || 'Research-use reminder',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag,
    data: { url, slot: item.slot },
    renotify: false,
  })
}

async function fireDueReminders() {
  const state = await loadReminderState()
  const now = Date.now()
  const upcomingMs = 3 * 60 * 1000
  let changed = false
  for (const item of state.reminders || []) {
    if (!item || !item.at || !item.tag) continue
    if (state.fired && state.fired[item.tag]) continue
    if (item.at > now + upcomingMs) continue
    if (item.at < now - 3 * 60 * 60 * 1000) continue
    await showSlotNotification(item)
    state.fired = state.fired || {}
    state.fired[item.tag] = now
    changed = true
  }
  if (changed) await saveReminderState(state)
}

async function fireDueWeighIns() {
  const state = await loadWeighInState()
  const now = Date.now()
  const upcomingMs = 3 * 60 * 1000
  let changed = false
  for (const item of state.reminders || []) {
    if (!item || !item.at || !item.tag) continue
    if (state.fired && state.fired[item.tag]) continue
    if (item.at > now + upcomingMs) continue
    if (item.at < now - 3 * 60 * 60 * 1000) continue
    await showSlotNotification(item)
    state.fired = state.fired || {}
    state.fired[item.tag] = now
    changed = true
  }
  if (changed) await saveWeighInState(state)
}

self.addEventListener('push', function (event) {
  const options = {
    body: event.data ? event.data.text() : 'Research-use protocol reminder',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: HOME_URL },
  }
  event.waitUntil(self.registration.showNotification('PeptideTracker', options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url =
    (event.notification.data && event.notification.data.url) || HOME_URL
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'PEPTIDETRACKER_REMINDER_CLICK', url })
            if ('navigate' in client) {
              return client.focus().then(function () {
                return client.navigate(url)
              })
            }
            return client.focus()
          }
        }
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})

self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'peptide-reminders') {
    event.waitUntil(Promise.all([fireDueReminders(), fireDueWeighIns()]))
  }
})

self.addEventListener('sync', function (event) {
  if (event.tag === 'peptide-reminders') {
    event.waitUntil(Promise.all([fireDueReminders(), fireDueWeighIns()]))
  }
})

self.addEventListener('message', function (event) {
  const data = event.data || {}
  if (data.type === 'PEPTIDETRACKER_SET_SCHEDULE') {
    event.waitUntil(
      saveReminderState({
        reminders: data.reminders || [],
        fired: data.fired || {},
      }).then(fireDueReminders)
    )
  }
  if (data.type === 'PEPTIDETRACKER_CANCEL') {
    event.waitUntil(saveReminderState({ reminders: [], fired: {} }))
  }
  if (data.type === 'PEPTIDETRACKER_SET_WEIGHIN_SCHEDULE') {
    event.waitUntil(
      saveWeighInState({
        reminders: data.reminders || [],
        fired: data.fired || {},
      }).then(fireDueWeighIns)
    )
  }
  if (data.type === 'PEPTIDETRACKER_CANCEL_WEIGHIN') {
    event.waitUntil(saveWeighInState({ reminders: [], fired: {} }))
  }
  if (data.type === 'PEPTIDETRACKER_SHOW' && data.title) {
    event.waitUntil(showSlotNotification(data))
  }
})
