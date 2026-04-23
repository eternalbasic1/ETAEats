'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const SOUND_KEY = 'eta-restaurant-sound-enabled'

export function useSoundAlert() {
  const [enabled, setEnabledState] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(SOUND_KEY)
    if (stored !== null) setEnabledState(stored === 'true')
    audioRef.current = new Audio('/notification.mp3')
    audioRef.current.preload = 'auto'
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_KEY, String(v))
    }
  }, [])

  // Call on any user click to unlock browser autoplay policy.
  const unlock = useCallback(() => {
    if (unlockedRef.current || !audioRef.current) return
    audioRef.current.play()
      .then(() => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        unlockedRef.current = true
      })
      .catch(() => { /* still locked, try next time */ })
  }, [])

  const play = useCallback(() => {
    if (!enabled || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => { /* autoplay blocked */ })
  }, [enabled])

  return { enabled, setEnabled, play, unlock }
}
