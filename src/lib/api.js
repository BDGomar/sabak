const TOKEN_KEY = 'sabak_token'
const USER_KEY = 'sabak_user'

/**
 * Base de l'API.
 * - En dev / déploiement same-origin : "/api" (proxy Vite ou Nginx)
 * - Sur Vercel : VITE_API_URL=https://sabak.digitgroup.tech/api
 */
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function getMe() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}
export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Appel API unique. Injecte le Bearer token, parse JSON,
 * redirige vers /login en cas de 401 et précipite l'erreur avec son message.
 */
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),
  })

  let data = null
  try { data = await res.json() } catch { /* réponse non JSON */ }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/login')) {
      clearSession()
      window.location.href = '/login'
    }
    const err = new Error(data?.message || `Erreur ${res.status}`)
    err.status = res.status
    err.errors = data?.errors
    throw err
  }
  return data
}

/** Déconnexion serveur (supprime le token Sanctum courant). */
export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
    })
  } catch { /* hors-ligne : on nettoie quand même la session locale */ }
  clearSession()
}

/** Télécharge un export CSV authentifié. */
export async function download(path, filename) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Reçu HTML imprimable dans un nouvel onglet. */
export async function openReceipt(paymentId) {
  const token = getToken()
  const res = await fetch(`${API_BASE}/payments/${paymentId}/receipt/html`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const html = await res.text()
  const w = window.open('', '_blank', 'width=520,height=760')
  w.document.write(html)
  w.document.close()
}

export function fmtFCFA(n) {
  return typeof n === 'number' ? new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' : (n ?? '')
}
export function fmtDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '' }
export function fmtDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '' }
export function today() { return new Date().toISOString().slice(0, 10) }
