import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, saveSession } from '../lib/api'
import { btn, btnGhost, input, ErrorBox, fieldErrors } from '../lib/ui'

const DEMO_ACCOUNTS = [
  { label: 'Direction', email: 'direction@sabakfitness.bf' },
  { label: 'Réception', email: 'reception@sabakfitness.bf' },
  { label: 'Comptabilité', email: 'comptabilite@sabakfitness.bf' },
  { label: 'Coach', email: 'coach@sabakfitness.bf' },
]

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const d = await api('/auth/login', { method: 'POST', body: form })
      saveSession(d.token, d.user)
      onLogin(d.user)
      navigate('/')
    } catch (err) {
      setError(`${err.message} ${fieldErrors(err.errors) || ''}`)
    } finally { setBusy(false) }
  }

  const loginAs = async account => {
    setForm({ email: account.email, password: 'Passw0rd!' })
    setError(null); setBusy(true)
    try {
      const d = await api('/auth/login', { method: 'POST', body: { email: account.email, password: 'Passw0rd!' } })
      saveSession(d.token, d.user)
      onLogin(d.user)
      navigate('/')
    } catch (err) {
      setError(`${err.message} ${fieldErrors(err.errors) || ''}`)
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-950 to-black p-4 relative overflow-hidden">
      {/* Halo lumineux jaune */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(circle at 50% -5%, rgba(250,204,21,0.25) 0%, rgba(250,204,21,0.08) 35%, transparent 70%)',
      }} />
      <div className="pointer-events-none absolute -bottom-60 -right-60 w-[500px] h-[500px] rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-40 -left-40 w-[400px] h-[400px] rounded-full bg-yellow-400/5 blur-3xl" />

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-black flex items-center justify-center text-4xl font-black shadow-[0_0_60px_-12px_rgba(250,204,21,0.9)]">S</div>
          <h1 className="text-4xl font-black text-white tracking-[0.2em]">SABAK <span className="text-yellow-400">FITNESS</span></h1>
          <p className="text-slate-400 text-sm mt-3 tracking-wide">Gestion de la salle de sport</p>
        </div>

        <form onSubmit={submit} className="bg-white/95 backdrop-blur rounded-3xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] p-6 sm:p-8 space-y-5 animate-scale-in border border-white/20">
          <ErrorBox error={error} />
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
            <input id="email" className={input} type="email" required autoFocus value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="prenom@sabakfitness.bf" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe</label>
            <input id="password" className={input} type="password" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button className={`${btn} w-full py-3 text-base`} disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>

          <div className="border-t border-slate-100 pt-6">
            <p className="text-[11px] text-slate-400 mb-3 font-semibold uppercase tracking-widest">Comptes de démo — un clic</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.email} type="button" disabled={busy}
                  onClick={() => loginAs(a)}
                  className={btnGhost + ' text-left px-3 py-2.5 transition-all hover:border-yellow-400 hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2.5'}>
                  <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-black font-bold flex items-center justify-center text-xs">{a.label[0]}</span>
                  <span className="min-w-0">
                    <span className="font-semibold text-slate-900 block text-sm">{a.label}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{a.email}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-8">© {new Date().getFullYear()} Sabak Fitness · Gestion sportive</p>
      </div>
    </div>
  )
}
