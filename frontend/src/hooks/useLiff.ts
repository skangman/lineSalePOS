import { useState, useEffect } from 'react'
import liff from '@line/liff'
import type { Profile } from '@liff/get-profile'

interface LiffState {
  isReady: boolean
  isLoggedIn: boolean
  profile: Profile | null
  error: string | null
  login: () => void
}

const LIFF_ID = (import.meta as any).env?.VITE_LIFF_ID || ''
const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const IS_DEV_LIFF_MODE = !LIFF_ID || IS_LOCALHOST

// เรียกจากปุ่ม "เข้าสู่ระบบด้วย LINE" — โหมดจริงเด้งไป LINE login, โหมด dev จำลอง login ใหม่
function login() {
  if (IS_DEV_LIFF_MODE) {
    sessionStorage.removeItem('dev_logged_out')
    window.location.reload()
  } else {
    liff.login()
  }
}

export function useLiff() {
  const [state, setState] = useState<Omit<LiffState, 'login'>>({
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
          // กด logout ไว้ในแท็บนี้ → อยู่เฉยๆ ไม่ mock login ให้ใหม่ (เปิดแท็บใหม่/รีสตาร์ทเบราว์เซอร์ค่อย login ใหม่)
          if (sessionStorage.getItem('dev_logged_out') === 'true') {
            setState({ isReady: true, isLoggedIn: false, profile: null, error: null })
            return
          }

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

        await liff.init({ liffId: LIFF_ID })

        // ยังไม่ login → โชว์หน้า "เข้าสู่ระบบด้วย LINE" ค้างไว้ก่อน ให้กดปุ่มเอง
        // (ปุ่มเรียก login() ด้านบน ซึ่งจะ liff.login() ต่อ)
        if (!liff.isLoggedIn()) {
          setState({ isReady: true, isLoggedIn: false, profile: null, error: null })
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

  return { ...state, login }
}
