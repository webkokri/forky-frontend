import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { tokens } from '../api/client'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!tokens.access)

  useEffect(() => {
    if (tokens.access) api.me().then(setUser).catch(() => tokens.clear()).finally(() => setReady(true))
    const out = (e) => { if (!e.detail?.role || e.detail.role === 'customer') setUser(null) }
    window.addEventListener('forksy:signed-out', out)
    return () => window.removeEventListener('forksy:signed-out', out)
  }, [])

  const finish = useCallback(async (res) => {
    tokens.set(res)
    setUser(res.user || await api.me())
  }, [])

  const value = useMemo(() => ({
    user, ready,
    // Returns { step: '2fa', tempToken } when a code is needed, otherwise signs in.
    login: async (identifier, password) => {
      const res = await api.login(identifier, password)
      if (res.requires2fa) return { step: '2fa', tempToken: res.tempToken }
      if (res.requires2faSetup) return { step: '2fa-setup', tempToken: res.tempToken }
      await finish(res)
      return { step: 'done' }
    },
    verify2fa: async (tempToken, code) => { await finish(await api.verify2fa(tempToken, code)) },
    enable2fa: async (tempToken, code) => { await finish(await api.enable2fa(tempToken, code)) },
    register: async (body) => { const res = await api.register(body); if (res.accessToken) await finish(res); return res },
    logout: async () => { await api.logout(); tokens.clear(); setUser(null) },
  }), [user, ready, finish])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
