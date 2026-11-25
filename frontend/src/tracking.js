import { Capacitor } from '@capacitor/core'
import { BackgroundGeolocation } from '@capgo/background-geolocation'

let currentEventId = null
let webTimer = null
let nativeRunning = false

function postWebLocation(eventId, onError) {
  const token = localStorage.getItem('token')

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await fetch(`/api/sos/${eventId}/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
        })
      } catch {
        // network problem, the next tick tries again
      }
    },
    () => {
      if (onError) onError({ code: 'NOT_AUTHORIZED' })
    }
  )
}

function startWebTracking(eventId, onError) {
  postWebLocation(eventId, onError)
  webTimer = setInterval(() => postWebLocation(eventId, onError), 5000)
}

async function startNativeTracking(eventId, onError) {
  const token = localStorage.getItem('token')

  await BackgroundGeolocation.start(
    {
      backgroundTitle: 'Nirapod SOS is active',
      backgroundMessage: 'Sharing your live location with your trusted contacts.',
      requestPermissions: true,
      stale: false,
      distanceFilter: 0,
      minIntervalMs: 5000,
      networkFallback: true,
      url: `${window.location.origin}/api/sos/${eventId}/location`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    },
    (location, error) => {
      if (error && onError) onError(error)
    }
  )

  nativeRunning = true
}

export async function startTracking(eventId, onError) {
  if (currentEventId === eventId) return
  if (currentEventId !== null) await stopTracking()

  currentEventId = eventId

  if (Capacitor.isNativePlatform()) {
    try {
      await startNativeTracking(eventId, onError)
      return
    } catch {
      // the native plugin is missing or failed, fall back to the web location below
    }
  }

  startWebTracking(eventId, onError)
}

export async function stopTracking() {
  currentEventId = null

  if (webTimer) {
    clearInterval(webTimer)
    webTimer = null
  }

  if (nativeRunning) {
    nativeRunning = false

    try {
      await BackgroundGeolocation.stop()
    } catch {
      // already stopped
    }
  }
}