import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fmtFCFA, fmtDate } from '../lib/api'
import { card, PageHeader, btn } from '../lib/ui'

function Stat({ icon, big, label, sub, accent }) {
  return (
    <div className={`${card} group relative overflow-hidden ${accent || ''}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/5 to-transparent rounded-bl-full -mr-8 -mt-8"></div>
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="text-3xl font-bold tracking-tight text-slate-900 group-hover:scale-105 transition-transform duration-300">{big}</div>
          {icon && <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200/60 flex items-center justify-center text-yellow-600 shadow-sm">{icon}</div>}
        </div>
        <div className="text-sm text-slate-600 mt-2 font-medium">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-1.5">{sub}</div>}
      </div>
    </div>
  )
}

function DollarIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><line x1="12" y1="7" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
}
function UsersIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
function TrendingDownIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
}

const QUICK_ACTIONS = [
  { label: 'Nouveau client', to: '/clients', roles: ['direction', 'reception', 'comptabilite', 'coach'] },
  { label: 'Nouvel abonnement', to: '/subscriptions', roles: ['direction', 'reception', 'comptabilite', 'coach'] },
  { label: 'Nouvelle dépense', to: '/expenses', roles: ['direction', 'comptabilite'] },
]

export default function Dashboard({ me }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => { api('/dashboard').then(setD).catch(e => setErr(e.message)) }, [])

  if (err) return <div className="text-rose-600">{err}</div>
  if (!d) return <div className="text-slate-500">Chargement…</div>

  const c = d.clients || {}
  const a = d.abonnements || {}
  const al = d.alertes || {}
  const mode = d.recettes_mois_par_mode || {}

  return (
    <div>
      <PageHeader title="Tableau de bord" />
      <p className="text-sm text-slate-500 mb-4">Données du {fmtDate(d.date)}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_ACTIONS.filter(q => q.roles.includes(me?.role)).map(q => (
          <Link key={q.to} to={q.to} className={btn + ' text-decoration-none'}>{q.label}</Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat big={fmtFCFA(d.recettes_jour)} label="Recettes du jour" icon={<DollarIcon />} accent="bg-gradient-to-br from-emerald-50/80 to-white border-emerald-200/60" />
        <Stat big={fmtFCFA(d.recettes_mois)} label="Recettes du mois"
          sub={`Espèces ${fmtFCFA(mode.especes)} · MM ${fmtFCFA(mode.mobile_money)}`} icon={<DollarIcon />} />
        <Stat big={fmtFCFA(d.depenses_mois)} label="Dépenses du mois" icon={<TrendingDownIcon />} accent="bg-gradient-to-br from-rose-50/80 to-white border-rose-200/60" />
        <Stat big={fmtFCFA(d.soldes_dus)} label="Soldes dus (abonnements actifs)"
          sub={`${d.impayes} paiement(s) en attente`} icon={<UsersIcon />} accent="bg-gradient-to-br from-amber-50/80 to-white border-amber-200/60" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
        <Stat big={c.total ?? '—'} label="Clients au total" icon={<UsersIcon />} />
        <Stat big={c.actifs ?? '—'} label="Clients actifs" icon={<UsersIcon />} />
        <Stat big={c.prospects ?? '—'} label="Prospects" icon={<UsersIcon />} />
        <Stat big={c.expires ?? '—'} label="Expirés" icon={<UsersIcon />} />
        <Stat big={c.suspendus ?? '—'} label="Suspendus" icon={<UsersIcon />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        <Stat big={a.actifs ?? '—'} label="Abonnements actifs" icon={<DollarIcon />} />
        <Stat big={a.expiring_7j ?? '—'} label="Expirent sous 7 jours" icon={<DollarIcon />} />
        <Stat big={a.expires_aujourdui ?? '—'} label="Expirent aujourd'hui" icon={<DollarIcon />} />
        <Stat big={a.formules ?? '—'} label="Formules en vente" icon={<DollarIcon />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Alertes d'échéance</h3>
            <Link to="/alerts" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">Voir tout →</Link>
          </div>
          <div className="flex gap-2 text-sm mb-4">
            <span className="bg-amber-100/80 text-amber-700 rounded-full px-3 py-1 font-medium">{al.pending ?? 0} en attente</span>
            <span className="bg-emerald-100/80 text-emerald-700 rounded-full px-3 py-1 font-medium">{al.signalees ?? 0} traitées aujourd'hui</span>
          </div>
          <div className="space-y-1">
            {(al.clients_bientot || []).map((s, i) => (
              <Link key={i} to={`/clients/${s.client.id}`}
                className="flex items-center justify-between border-t border-slate-100/60 py-3 hover:bg-slate-50/50 rounded-xl px-3 -mx-3 transition-colors group">
                <div>
                  <div className="font-medium text-sm group-hover:text-yellow-700 transition-colors">{s.client.first_name} {s.client.last_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.client.code} · {s.formule}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{fmtDate(s.end_date)}</div>
                  <div className={`text-xs font-medium ${s.jours_restants <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {s.jours_restants > 0 ? `${s.jours_restants} j restants` : 'expiré'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {!(al.clients_bientot || []).length && <p className="text-sm text-slate-400 py-4 text-center">Aucune échéance proche.</p>}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Activité WhatsApp</h3>
            <span className="text-xs text-slate-400">Phase 2</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center p-3 bg-slate-50/50 rounded-xl">
              <div className="text-xl font-bold text-slate-900">{d.whatsapp?.envoyes ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">Envoyés</div>
            </div>
            <div className="text-center p-3 bg-amber-50/50 rounded-xl">
              <div className="text-xl font-bold text-amber-700">{d.whatsapp?.pending ?? 0}</div>
              <div className="text-xs text-amber-600/80 mt-1">En attente</div>
            </div>
            <div className="text-center p-3 bg-rose-50/50 rounded-xl">
              <div className="text-xl font-bold text-rose-700">{d.whatsapp?.echoues ?? 0}</div>
              <div className="text-xs text-rose-600/80 mt-1">Échecs</div>
            </div>
          </div>
          <div className="border-t border-slate-100/60 mt-6 pt-4">
            <h4 className="text-sm font-semibold mb-3">Pipeline prospects</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(d.prospects?.pipeline || {}).map(([stage, n]) => (
                <div key={stage} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50/50 transition-colors">
                  <span className="capitalize text-slate-600">{stage.replace('_', ' ')}</span>
                  <span className="font-semibold px-2.5 py-0.5 bg-slate-100 rounded-full">{n}</span>
                </div>
              ))}
              {!(d.prospects?.pipeline || {}).length && <p className="text-slate-400 text-xs text-center py-2">Aucun prospect.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
