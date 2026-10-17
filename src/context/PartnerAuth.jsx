import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { tokensFor } from '../api/client'

// Sessions for the two partner apps: 'driver' and 'restaurant' (business owner).
const Ctx = createContext(null)
const ROLES = ['driver', 'restaurant']

export function PartnerAuthProvider({ children }) {
  const [users, setUsers] = useState({ driver: null, restaurant: null })
  const [ready, setReady] = useState({ driver: !tokensFor('driver').access, restaurant: !tokensFor('restaurant').access })

  const setUser = useCallback((role, u) => setUsers((s) => ({ ...s, [role]: u })), [])
  const done = (role) => setReady((s) => ({ ...s, [role]: true }))

  useEffect(() => {
    ROLES.forEach((role) => {
      if (tokensFor(role).access) api.me(role).then((u) => setUser(role, u)).catch(() => tokensFor(role).clear()).finally(() => done(role))
    })
    const out = (e) => e.detail?.role && setUser(e.detail.role, null)
    window.addEventListener('forksy:signed-out', out)
    return () => window.removeEventListener('forksy:signed-out', out)
  }, [setUser])

  const value = useMemo(() => {
    const finish = async (role, res) => { tokensFor(role).set(res); setUser(role, res.user || await api.me(role)) }
    return {
      users, ready,
      login: async (role, identifier, password) => {
        const res = await api.login(identifier, password, role)
        if (res.requires2fa) return { step: '2fa', tempToken: res.tempToken }
        if (res.requires2faSetup) return { step: '2fa-setup', tempToken: res.tempToken }
        await finish(role, res)
        return { step: 'done' }
      },
      verify2fa: async (role, tempToken, code) => finish(role, await api.verify2fa(tempToken, code)),
      // Call after a successful registration/application response that contains tokens.
      enable2fa: async (role, tempToken, code) => finish(role, await api.enable2fa(tempToken, code)),
      adopt: (role, res) => res?.accessToken ? finish(role, res) : Promise.resolve(),
      logout: async (role) => { await api.logout(role); tokensFor(role).clear(); setUser(role, null) },
    }
  }, [users, ready, setUser])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const usePartner = (role) => {
  const c = useContext(Ctx)
  return { user: c.users[role], ready: c.ready[role], login: (i, p) => c.login(role, i, p), verify2fa: (t, code) => c.verify2fa(role, t, code), enable2fa: (t, code) => c.enable2fa(role, t, code), adopt: (res) => c.adopt(role, res), logout: () => c.logout(role) }
}
