import { useEffect, useState } from 'react'
import { api, fmtDateTime } from '../lib/api'
import { PageHeader, Pagination, card } from '../lib/ui'

const COLORS = {
  login: 'bg-sky-100 text-sky-700', connexion: 'bg-sky-100 text-sky-700', echec_connexion: 'bg-rose-100 text-rose-700',
  create: 'bg-emerald-100 text-emerald-700', update: 'bg-amber-100 text-amber-700', delete: 'bg-rose-100 text-rose-700',
  annule: 'bg-rose-100 text-rose-700', rembourse: 'bg-amber-100 text-amber-700',
  paiement: 'bg-emerald-100 text-emerald-700', cloture: 'bg-indigo-100 text-indigo-700',
  suspend_abonnement: 'bg-rose-100 text-rose-700', resume_abonnement: 'bg-emerald-100 text-emerald-700', annule_abonnement: 'bg-rose-100 text-rose-700',
  archive: 'bg-rose-100 text-rose-700', config: 'bg-violet-100 text-violet-700',
}

const BASE_ACTIONS = [
  'login', 'failed_login', 'create_client', 'update_client', 'archive_client',
  'create_subscription', 'update_subscription', 'suspend_subscription', 'resume_subscription',
  'cancel_subscription', 'create_payment', 'cancel_payment', 'create_expense', 'archive_expense',
  'create_closing', 'update_settings', 'create_user', 'update_user',
]

export default function Logs() {
  const [rows, setRows] = useState(null)
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const [users, setUsers] = useState([])
  const [action, setAction] = useState('')
  // actions disponibles = liste de base + celles rencontrées dans les pages chargées
  const [seen, setSeen] = useState([])
  const ACTIONS = Array.from(new Set([...BASE_ACTIONS, ...seen]))

  useEffect(() => { api('/users').then(setUsers).catch(() => {}) }, [])

  useEffect(() => {
    const q = `page=${page}&action=${action}` + (userId ? `&user_id=${userId}` : '')
    api(`/activity-logs?${q}`).then(d => {
      setRows(d)
      setSeen(prev => Array.from(new Set([...prev, ...(d.data || []).map(r => r.action)])))
    }).catch(() => setRows({ data: [] }))
  }, [page, action, userId])

  return (
    <div>
      <PageHeader title="Journal d'audit" />
      <p className="text-sm text-slate-500 mb-4">Tout est tracé : connexions, champs modifiés, annulations de paiement, clôtures, suspensions, configuration.</p>
      <div className={card}>
        <div className="flex flex-wrap gap-2 mb-3">
          <select className="border border-slate-300 rounded-md text-sm px-2 py-1.5" value={action} onChange={e => { setAction(e.target.value); setPage(1) }}>
            <option value="">Toutes actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="border border-slate-300 rounded-md text-sm px-2 py-1.5" value={userId} onChange={e => { setUserId(e.target.value); setPage(1) }}>
            <option value="">Tout le monde</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[52rem]">
            <thead className="text-left text-slate-500 text-xs uppercase">
              <tr><th className="py-2">Date</th><th>Qui</th><th>Action</th><th>Objet</th><th>Détails</th><th>IP</th></tr>
            </thead>
            <tbody>
              {(rows?.data || []).map(l => (
                <tr key={l.id} className="border-t border-slate-100 align-top">
                  <td className="py-2 whitespace-nowrap text-slate-500">{fmtDateTime(l.created_at)}</td>
                  <td>{l.user?.name || '—'}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full font-mono ${COLORS[l.action] || 'bg-slate-100 text-slate-700'}`}>{l.action}</span></td>
                  <td className="text-xs text-slate-500">{l.entity_type}{l.entity_id ? ` #${l.entity_id}` : ''}</td>
                  <td className="text-xs text-slate-600 max-w-md"><code className="break-all">{l.details ? JSON.stringify(l.details) : ''}</code></td>
                  <td className="text-xs text-slate-400">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination meta={rows} onPage={setPage} />
      </div>
    </div>
  )
}
