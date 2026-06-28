import { useState, useEffect } from 'react'
import liff from '@line/liff'
import type { Profile } from '@liff/get-profile'

interface LiffState {
  isReady: boolean
  isLoggedIn: boolean
  profile: Profile | null
  error: string | null
}

const LIFF_ID = (import.meta as any).env?.VITE_LIFF_ID || ''
const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export function useLiff() {
  const [state, setState] = useState<LiffState>({
    isReady: false,
    isLoggedIn: false,
    profile: null,
    error: null,
  })

  useEffect(() => {
    const init = async () => {
      try {
        // Dev mode เมื่อไม่มี LIFF_ID หรือเปิดจาก localhost
        if (!LIFF_ID || IS_LOCALHOST) {
          const mockProfile = {
            userId: localStorage.getItem('line_user_id') || 'U_dev_test_001',
            displayName: 'ทดสอบ Dev',
            pictureUrl: '',
            statusMessage: '',
          }
          localStorage.setItem('line_user_id', mockProfile.userId)
          localStorage.setItem('line_display_name', mockProfile.displayName)
          setState({ isReady: true, isLoggedIn: true, profile: mockProfile, error: null })
          return
        }

        // Real LIFF mode
        await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true })

        if (!liff.isLoggedIn()) {
          liff.login()
          return
        }

        // ดึง profile — fallback ไป ID token ถ้า profile scope ยังไม่ได้เปิด
        let profile: Profile
        try {
          profile = await liff.getProfile()
        } catch {
          const token = liff.getDecodedIDToken()
          profile = {
            userId: token?.sub || '',
            displayName: token?.name || 'ผู้ใช้ LINE',
            pictureUrl: token?.picture || '',
            statusMessage: '',
          }
        }

        localStorage.setItem('line_user_id', profile.userId)
        localStorage.setItem('line_display_name', profile.displayName)
        localStorage.setItem('line_picture_url', profile.pictureUrl || '')

        setState({ isReady: true, isLoggedIn: true, profile, error: null })
      } catch (err: any) {
        console.error('LIFF init error:', err)
        setState((s) => ({ ...s, isReady: true, error: err.message || 'LIFF error' }))
      }
    }

    init()
  }, [])

  return state
}
