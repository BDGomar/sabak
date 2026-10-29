import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, fmtFCFA, fmtDate, fmtDateTime, openReceipt, today } from '../lib/api'
import { Badge, Modal, ErrorBox, fieldErrors, btn, btnDanger, btnGhost, input, label, card } from '../lib/ui'

const smGhost = 'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50'
const smDanger = 'inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100'

const CLIENT_STATUS = ['prospect', 'actif', 'expire', 'suspendu', 'inactif']

/* ------------------------------------------------------------------ icônes */

const ICONS = {
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  pin: <><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  cake: <><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16h16" /><path d="M12 7V3" /><path d="M8 7V5" /><path d="M16 7V5" /></>,
  alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  wallet: <><path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13v4" /><path d="M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /></>,
  receipt: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
  chevron: <><polyline points="9 18 15 12 9 6" /></>,
}

function Icon({ name, className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

/* ------------------------------------------------------------------ helpers */

function initials(first, last) {
  return `${(first || '').trim().charAt(0)}${(last || '').trim().charAt(0)}`.toUpperCase() || '?'
}

function StatCard({ icon, label, value, sub, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900',
    rose: 'text-rose-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.35)]">
      <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400/10 to-transparent" />
      <div className="relative flex items-start justify-between gap-2">
        <div className={`text-xl font-bold tracking-tight ${tones[tone] || tones.slate}`}>{value}</div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-yellow-200/70 bg-gradient-to-br from-yellow-50 to-yellow-100/40 text-yellow-600">
          <Icon name={icon} />
        </div>
      </div>
      <div className="relative mt-1.5 text-xs font-medium text-slate-500">{label}</div>
      {sub && <div className="relative mt-0.5 truncate text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}

function InfoRow({ icon, label: name, children }) {
  if (!children) return null
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400">
        <Icon name={icon} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{name}</div>
        <div className="truncate text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

function SubscriptionProgress({ s }) {
  const start = new Date(s.start_date).getTime()
  const end = new Date(s.end_date).getTime()
  const total = Math.max(1, (end - start) / 86400000)
  const elapsed = Math.min(total, Math.max(0, (Date.now() - start) / 86400000))
  const pct = Math.round((elapsed / total) * 100)
  const daysLeft = Math.ceil((end - Date.now()) / 86400000)

  const tone = daysLeft < 0 ? 'bg-rose-500' : daysLeft <= 3 ? 'bg-amber-400' : 'bg-emerald-500'

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
        <span>{fmtDate(s.start_date)}</span>
        <span className={daysLeft < 0 ? 'font-semibold text-rose-600' : daysLeft <= 3 ? 'font-semibold text-amber-600' : 'font-medium text-slate-600'}>
          {daysLeft < 0 ? `Expiré depuis ${Math.abs(daysLeft)} j` : `${daysLeft} j restants`}
        </span>
        <span>{fmtDate(s.end_date)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
      </div>
    </div>
  )
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-300 shadow-sm">
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {sub && <div className="mt-1 max-w-xs text-xs text-slate-400">{sub}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* -------------------------------------------------------------- formulaires */

export function SubscriptionForm({ clientId, onDone }) {
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({ client_id: clientId, plan_id: '', start_date: today(), discount: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { api('/plans?all=1').then(setPlans).catch(() => {}) }, [])

  const save = async e => {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      const body = { client_id: clientId, plan_id: form.plan_id, start_date: form.start_date }
      if (form.discount !== '' && Number(form.discount) > 0) body.discount = Number(form.discount)
      const sub = await api('/subscriptions', { method: 'POST', body })
      onDone(sub)
    } catch (ex) { setError(`${ex.message} ${fieldErrors(ex.errors) || ''}`) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      {error && <ErrorBox error={error} />}
      <label className={label}>Formule *</label>
      <select required className={input} value={form.plan_id} onChange={e => setForm({ ...form, plan_id: e.target.value })}>
        <option value="">— choisir —</option>
        {plans.filter(p => p.active).map(p => (
          <option key={p.id} value={p.id}>{p.name} — {fmtFCFA(p.price)} / {p.duration_days} j</option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Début *</label><input type="date" required className={input} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
        <div><label className={label}>Remise (FCFA)</label><input type="number" min={0} className={input} value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></div>
      </div>
      <div className="flex justify-end gap-2">
        <button className={btn} disabled={busy}>{busy ? 'Création…' : 'Créer l\u2019abonnement'}</button>
      </div>
    </form>
  )
}

export function RenewForm({ original, onDone }) {
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({ plan_id: original.plan?.id || original.plan_id, start_date: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { api('/plans?all=1').then(setPlans).catch(() => {}) }, [])

  const save = async e => {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      const body = {}
      if (form.plan_id) body.plan_id = form.plan_id
      if (form.start_date) body.start_date = form.start_date
      const sub = await api(`/subscriptions/${original.id}/renew`, { method: 'POST', body })
      onDone(sub)
    } catch (ex) { setError(`${ex.message} ${fieldErrors(ex.errors) || ''}`) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      {error && <ErrorBox error={error} />}
      <p className="text-sm text-slate-600">
        Renouvellement de <strong>{original.code}</strong> (fin {fmtDate(original.end_date)}).
        Sans date, le nouveau départ suit automatiquement la fin de l'ancien abonnement.
      </p>
      <label className={label}>Formule</label>
      <select className={input} value={form.plan_id || ''} onChange={e => setForm({ ...form, plan_id: e.target.value })}>
        <option value="">Même formule</option>
        {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {fmtFCFA(p.price)}</option>)}
      </select>
      <label className={label}>Départ (optionnel)</label>
      <input type="date" className={input} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
      <div className="flex justify-end"><button className={btn} disabled={busy}>{busy ? '…' : 'Renouveler'}</button></div>
    </form>
  )
}

export function ReasonForm({ title, label_, action, onDone }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const submit = async e => {
    e.preventDefault(); try { await action(reason); onDone() }
    catch (ex) { setError(ex.message) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <ErrorBox error={error} />}
      <label className={label}>{label_} *</label>
      <textarea required rows={3} className={input} value={reason} onChange={e => setReason(e.target.value)} />
      <div className="flex justify-end"><button className={btn}>{title}</button></div>
    </form>
  )
}

/* -------------------------------------------------------------------- page */

const TABS = [
  { key: 'subs', label: 'Abonnements' },
  { key: 'payments', label: 'Paiements' },
  { key: 'visits', label: 'Passages' },
]

export default function ClientDetail({ me }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [d, setD] = useState(null)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [tab, setTab] = useState('subs')
  const [visits, setVisits] = useState(null)
  const canWrite = ['direction', 'reception', 'comptabilite'].includes(me.role)
  const isDir = me.role === 'direction'

  const load = () => api(`/clients/${id}`).then(d => {
    setD(d)
    setForm({
      first_name: d.client.first_name, last_name: d.client.last_name, phone: d.client.phone,
      whatsapp: d.client.whatsapp || '', email: d.client.email || '', birthdate: d.client.birthdate || '',
      address: d.client.address || '', emergency_contact_name: d.client.emergency_contact_name || '',
      emergency_contact_phone: d.client.emergency_contact_phone || '', notes: d.client.notes || '',
    })
  }).catch(e => setError(e.message))

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (tab !== 'visits' || visits) return
    api(`/attendances?client_id=${id}&per_page=50`)
      .then(r => setVisits(r.data || []))
      .catch(() => setVisits([]))
  }, [tab, id, visits])

  const totals = useMemo(() => {
    const subs = d?.subscriptions || []
    const pays = d?.payments || []
    const active = subs.filter(s => s.status === 'actif').sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0] || null
    const paid = pays.filter(p => p.status === 'valide').reduce((n, p) => n + (p.amount_paid || 0), 0)
    return { subs, pays, active, paid }
  }, [d])

  if (!d && error) return <ErrorBox error={error} />
  if (!d) return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-yellow-400" />
      Chargement de la fiche…
    </div>
  )

  const c = d.client
  const { subs, pays, active, paid } = totals
  const activePlanName = active?.plan?.name || c.active_subscription_data?.plan || 'Aucun'
  const daysLeft = active?.days_remaining ?? c.active_subscription_data?.days_remaining ?? null
  const tabs = TABS.filter(t => t.key !== 'visits' || me.role !== 'comptabilite')

  const saveEdit = async e => {
    e.preventDefault(); setError(null)
    try { await api(`/clients/${id}`, { method: 'PUT', body: form }); setEdit(false); load() }
    catch (ex) { setError(`${ex.message} ${fieldErrors(ex.errors) || ''}`) }
  }

  const archiveClient = async () => {
    setError(null)
    try { await api(`/clients/${id}`, { method: 'DELETE' }); navigate('/clients') }
    catch (ex) { setError(ex.message) }
  }

  const afterSubAction = () => { setModal(null); load() }
  const subAction = async (path, body) => api(`/subscriptions/${current.id}/${path}`, { method: 'POST', body })

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900">
        <span className="rotate-180"><Icon name="chevron" /></span> Tous les clients
      </Link>

      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-neutral-950 to-neutral-900 p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-yellow-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-2xl font-black text-black shadow-[0_0_50px_-12px_rgba(250,204,21,0.9)] sm:h-20 sm:w-20 sm:text-3xl">
              {initials(c.first_name, c.last_name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{c.first_name} {c.last_name}</h1>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium capitalize text-white ring-1 ring-inset ring-white/15">{c.status}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                <span className="font-mono text-xs tracking-wide text-yellow-400/90">{c.code}</span>
                <a href={`tel:${c.phone}`} className="transition-colors hover:text-white">{c.phone}</a>
                {c.email && <span className="truncate">{c.email}</span>}
                <span className="text-xs text-slate-500">Client depuis {fmtDate(c.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:ml-auto">
            {canWrite && (
              <button onClick={() => setEdit(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20">
                Modifier
              </button>
            )}
            {canWrite && (
              <button onClick={() => setModal('sub')} className={btn}>+ S'abonner</button>
            )}
            {isDir && (
              <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20">
                Archiver
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
          {[
            { k: 'Solde dû', v: fmtFCFA(d.balance_due), tone: d.balance_due > 0 ? 'text-rose-300' : 'text-emerald-300' },
            { k: 'Abonnement', v: activePlanName, tone: 'text-white' },
            { k: 'Jours restants', v: daysLeft === null ? '—' : `${daysLeft} j`, tone: daysLeft !== null && daysLeft <= 3 ? 'text-amber-300' : 'text-white' },
            { k: 'Total payé', v: fmtFCFA(paid), tone: 'text-yellow-300' },
          ].map(s => (
            <div key={s.k}>
              <div className={`truncate text-lg font-bold tracking-tight ${s.tone}`}>{s.v}</div>
              <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {error && <ErrorBox error={error} />}

      {/* ------------------------------------------------------- contenu */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* coordonnées */}
        <div className="space-y-4 lg:col-span-1">
          <div className={card}>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Coordonnées</h2>
            <div className="divide-y divide-slate-100">
              <InfoRow icon="phone" label="Téléphone"><a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a></InfoRow>
              <InfoRow icon="phone" label="WhatsApp">{c.whatsapp_number || c.whatsapp || c.phone}</InfoRow>
              <InfoRow icon="mail" label="Email">{c.email}</InfoRow>
              <InfoRow icon="cake" label="Date de naissance">{c.birthdate ? fmtDate(c.birthdate) : null}</InfoRow>
              <InfoRow icon="pin" label="Adresse">{c.address}</InfoRow>
              <InfoRow icon="alert" label="Contact d'urgence">
                {c.emergency_contact_name ? `${c.emergency_contact_name}${c.emergency_contact_phone ? ` · ${c.emergency_contact_phone}` : ''}` : null}
              </InfoRow>
              <InfoRow icon="scan" label="Badge">{c.badge_id || null}</InfoRow>
            </div>

            {c.notes && (
              <div className="mt-4 rounded-xl bg-amber-50/70 p-3 text-sm text-amber-900 ring-1 ring-amber-100">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">Notes</div>
                {c.notes}
              </div>
            )}
          </div>
        </div>

        {/* onglets */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex w-fit gap-1 rounded-xl bg-slate-100/80 p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t.label}
                {t.key === 'subs' && subs.length > 0 && <span className="ml-1.5 text-xs text-slate-400">{subs.length}</span>}
                {t.key === 'payments' && pays.length > 0 && <span className="ml-1.5 text-xs text-slate-400">{pays.length}</span>}
              </button>
            ))}
          </div>

          {tab === 'subs' && (
            <div className="space-y-3">
              {subs.length === 0 && (
                <EmptyState icon="card" title="Aucun abonnement" sub="Ce client n'a pas encore de formule active."
                  action={canWrite && <button className={btn} onClick={() => setModal('sub')}>Créer un abonnement</button>} />
              )}
              {subs.map(s => (
                <div key={s.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:shadow-[0_8px_24px_-16px_rgba(15,23,42,0.4)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{s.plan?.name}</span>
                        <Badge value={s.status} />
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-slate-400">{s.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{fmtFCFA(s.due_amount)}</div>
                      <div className={`text-xs font-medium ${s.remaining_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {s.remaining_balance > 0 ? `Reste ${fmtFCFA(s.remaining_balance)}` : 'Soldé'}
                      </div>
                    </div>
                  </div>

                  {s.status === 'actif' && <SubscriptionProgress s={s} />}

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <span className="mr-auto text-xs text-slate-500">
                      {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
                      {typeof s.sessions_used === 'number' && <span className="ml-2 text-slate-400">· {s.sessions_used} séance{s.sessions_used > 1 ? 's' : ''}</span>}
                    </span>
                    {s.status === 'actif' && canWrite && (
                      <button className={smGhost} onClick={() => { setCurrent(s); setModal('renew') }}>Renouveler</button>
                    )}
                    {s.status === 'actif' && isDir && (
                      <button className={smDanger} onClick={() => { setCurrent(s); setModal('suspend') }}>Suspendre</button>
                    )}
                    {s.status === 'suspendu' && canWrite && (
                      <button className={smGhost} onClick={async () => { setCurrent(s); await subAction('resume'); load() }}>Reprendre</button>
                    )}
                    {(s.status === 'actif' || s.status === 'expire') && isDir && (
                      <button className={smGhost} onClick={() => { setCurrent(s); setModal('cancel') }}>Annuler</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'payments' && (
            <div className="space-y-3">
              {pays.length === 0 && <EmptyState icon="wallet" title="Aucun paiement" sub="Les encaissements de ce client apparaîtront ici." />}
              {pays.map(p => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${p.status === 'valide' ? 'bg-emerald-50 text-emerald-600' : p.status === 'rembourse' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Icon name="receipt" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {p.service_label || p.subscription?.plan?.name || 'Paiement'}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {fmtDateTime(p.paid_at)} · <span className="font-mono">{p.receipt_number}</span> · {p.method === 'especes' ? 'Espèces' : `Mobile Money${p.operator ? ` (${p.operator})` : ''}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{fmtFCFA(p.amount_paid)}</div>
                    <div className="mt-0.5"><Badge value={p.status} /></div>
                  </div>
                  <button className={smGhost} onClick={() => openReceipt(p.id)}>Reçu</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'visits' && (
            <div className="space-y-3">
              {visits === null && <p className="text-sm text-slate-400">Chargement des passages…</p>}
              {visits?.length === 0 && <EmptyState icon="scan" title="Aucun passage" sub="Les scans de badge de ce client s'afficheront ici." />}
              {visits?.map(v => (
                <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400">
                    <Icon name="scan" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900">{fmtDateTime(v.scanned_at)}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {v.subscription?.plan?.name || '—'}{v.scanner?.name ? ` · scanné par ${v.scanner.name}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- modales */}
      <Modal open={edit} onClose={() => setEdit(false)} title="Modifier la fiche" wide>
        <form onSubmit={saveEdit} className="grid grid-cols-2 gap-3">
          <div><label className={label}>Prénom</label><input className={input} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
          <div><label className={label}>Nom</label><input className={input} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
          <div><label className={label}>Téléphone</label><input className={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className={label}>WhatsApp</label><input className={input} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div><label className={label}>Email</label><input className={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className={label}>Naissance</label><input className={input} type="date" value={form.birthdate || ''} onChange={e => setForm({ ...form, birthdate: e.target.value })} /></div>
          <div className="col-span-2"><label className={label}>Adresse</label><input className={input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className={label}>Statut</label>
            <select className={input} value={c.status} disabled>
              {CLIENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label className={label}>Notes</label><input className={input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setEdit(false)}>Fermer</button>
            <button className={btn}>Enregistrer</button>
          </div>
        </form>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Archiver la fiche client">
        <p className="mb-4 text-sm text-rose-700">Ceci archive la fiche (elle reste dans l'historique — aucune suppression durable).</p>
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setConfirmDelete(false)}>Annuler</button>
          <button className={btnDanger} onClick={archiveClient}>Archiver</button>
        </div>
      </Modal>

      <Modal open={modal === 'sub'} onClose={() => setModal(null)} title={`Abonner ${c.first_name}`}>
        <SubscriptionForm clientId={c.id} onDone={afterSubAction} />
      </Modal>

      <Modal open={modal === 'renew'} onClose={() => setModal(null)} title="Renouveler">
        {current && <RenewForm original={current} onDone={afterSubAction} />}
      </Modal>

      <Modal open={modal === 'suspend'} onClose={() => setModal(null)} title="Suspendre (direction)">
        {current && <ReasonForm title="Suspendre" label_="Motif de suspension"
          action={r => subAction('suspend', { reason: r })} onDone={afterSubAction} />}
      </Modal>

      <Modal open={modal === 'cancel'} onClose={() => setModal(null)} title="Annuler l'abonnement (direction)">
        {current && <ReasonForm title="Annuler" label_="Motif d'annulation"
          action={r => subAction('cancel', { reason: r })} onDone={afterSubAction} />}
      </Modal>
    </div>
  )
}
