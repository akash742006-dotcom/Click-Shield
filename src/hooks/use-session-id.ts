'use client'

import * as React from 'react'

const STORAGE_KEY = 'clickshield.sessionId'

/** Stable per-browser session ID used to scope scan history. */
export function useSessionId() {
  const [sessionId, setSessionId] = React.useState<string>('anon')

  React.useEffect(() => {
    try {
      let id = window.localStorage.getItem(STORAGE_KEY)
      if (!id) {
        id =
          'sess-' +
          Date.now().toString(36) +
          '-' +
          Math.random().toString(36).slice(2, 8)
        window.localStorage.setItem(STORAGE_KEY, id)
      }
      setSessionId(id)
    } catch {
      // localStorage unavailable; keep 'anon'
    }
  }, [])

  return sessionId
}
