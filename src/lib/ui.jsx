import { useEffect, useState } from 'react'

/** Bouton principal : fond jaune/noir (action forte). */
export const btn = 'bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 active:scale-[0.98] text-black font-semibold px-4 py-2 rounded-xl text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_-4px_rgba(250,204,21,0.6)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_6px_20px_-6px_rgba(250,204,21,0.7)] active:transition-transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100 inline-flex items-center justify-center gap-2'
export const btnGhost = 'border border-slate-200 bg-white/80 backdrop-blur text-slate-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white hover:border-slate-300 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center justify-center gap-2'
export const btnDanger = 'border border-rose-200 bg-rose-50/80 text-rose-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-100 hover:border-rose-300 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 inline-flex items-center justify-center gap-2'
export const input = 'border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 bg-white transition-all duration-200 shadow-sm hover:border-slate-300'
export const card = 'bg-white/95 backdrop-blur border border-slate-200/60 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-12px_rgba(15,23,42,0.4)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(15,23,42,0.5)] transition-shadow duration-300'
export const label = 'block text-xs font-semibold text-slate-700 mb-1.5'

export const STATUS_STYLES = {
  prospect: 'bg-slate-200 text-slate-700',
  actif: 'bg-emerald-100 text-emerald-700',
  expire: 'bg-amber-100 text-amber-700',
  suspendu: 'bg-rose-100 text-rose-700',
  inactif: 'bg-slate-200 text-slate-500',
  annule: 'bg-rose-100 text-rose-700',
  rembourse: 'bg-amber-100 text-amber-700',
  valide: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  sent: 'bg-emerald-100 text-emerald-700',
  deactivated: 'bg-slate-200 text-slate-500',
  // stages prospects
  nouveau: 'bg-sky-100 text-sky-700',
  contacte: 'bg-indigo-100 text-indigo-700',
  visite_prevue: 'bg-violet-100 text-violet-700',
  essai_effectue: 'bg-amber-100 text-amber-700',
  inscrit: 'bg-emerald-100 text-emerald-700',
  perdu: 'bg-rose-100 text-rose-700',
}

export function Badge({ value, className = '' }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[value] || 'bg-slate-200 text-slate-700'} ${className}`}>
      {String(value ?? '—')}
    </span>
  )
}

export function PageHeader({ title, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <div className="h-1 w-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mt-2"></div>
      </div>
      <div className="flex gap-2 flex-wrap">{children}</div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] w-full my-8 animate-scale-in ${wide ? 'max-w-3xl' : 'max-w-md'}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 text-lg leading-none">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-3 text-sm mb-4">{error}</div>
}

/** Liste des messages de validation Laravel. */
export function fieldErrors(errors) {
  if (!errors) return null
  return Object.values(errors).flat().join(' · ')
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1)
    .filter(p => Math.abs(p - meta.current_page) <= 2 || p === 1 || p === meta.last_page)
  return (
    <div className="flex items-center gap-1 mt-4 text-sm">
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
          <button
            onClick={() => onPage(p)}
            className={`px-3 py-1.5 rounded-lg ${p === meta.current_page ? 'bg-yellow-400 text-black font-semibold' : 'hover:bg-slate-100 text-slate-700'}`}
          >{p}</button>
        </span>
      ))}
      <span className="text-slate-500 ml-2">{meta.total} résultat(s)</span>
    </div>
  )
}

/** Hook utilitaire : débounce une valeur. */
export function useDebounced(value, delay = 350) {
  const [state, setState] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setState(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return state
}
