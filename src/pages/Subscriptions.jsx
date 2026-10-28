import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fmtFCFA, fmtDate, today } from '../lib/api'
import { PageHeader, Pagination, Badge, ErrorBox, btn, btnGhost, btnDanger, input, label, card, Modal, fieldErrors } from '../lib/ui'
import { RenewForm, ReasonForm } from './ClientDetail'

export default function Subscriptions({ me }) {
  const [rows, setRows] = useState(null)
  const [filters, setFilters] = useState({ status: 'actif', expiring_days: '', search: '' })
  const [page, setPage] = useState(1)
  const [err, setErr] = useState(null)
  const [modal, setModal] = useState(null)
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState(null)

  const canWrite = ['direction', 'reception'].includes(me.role)
  const isDir = me.role === 'direction'

  const load = () => {
    const q = `page=${page}&status=${filters.status}`
    const extra = filters.expiring_days ? `&expiring_days=${filters.expiring_days}` : ''
    api(`/subscriptions?${q}${extra}`).then(setRows).catch(e => setErr(e.message))
  }
  useEffect(() => { load() }, [page, filters.status, filters.expiring_days])

  const done = () => { setModal(null); load() }
  const act = (path, body) => api(`/subscriptions/${current.id}/${path}`, { method: 'POST', body })
  const openCreate = () => { setCurrent(null); setModal('create') }

  return (
    <div>
      <PageHeader title="Abonnements">
        {canWrite && <button className={btn} onClick={openCreate}>+ Nouveau abonnement</button>}
      </PageHeader>
      {err && <ErrorBox error={err} />}
      <div className={card}>
        <div className="flex gap-3 mb-4">
          <select className={input + ' max-w-[9rem]'} value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
            <option value="">Tous</option><option value="actif">Actifs</option><option value="expire">Expirés</option>
            <option value="suspendu">Suspendus</option><option value="annule">Annulés</option>
          </select>
          <select className={input + ' max-w-[11rem]'} value={filters.expiring_days} onChange={e => { setFilters({ ...filters, expiring_days: e.target.value }); setPage(1) }}>
            <option value="">Échéance : tous</option>
            <option value="7">Expirent sous 7 jours</option>
            <option value="3">Expirent sous 3 jours</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr><th>Code</th><th>Client</th><th>Formule</th><th>Dû / Payé</th><th>Reste</th><th>Début</th><th>Fin</th><th>Jours</th><th>Statut</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {(rows?.data || []).map(s => (
              <tr key={s.id}>
                <td data-label="Code" className="font-mono text-xs font-semibold text-slate-700">{s.code}</td>
                <td data-label="Client">
                  <Link to={`/clients/${s.client?.id}`} className="font-medium hover:text-yellow-700 hover:underline">{s.client?.first_name} {s.client?.last_name}</Link>
                  <div className="text-xs text-slate-500">{s.client?.phone}</div>
                </td>
                <td data-label="Formule" className="text-slate-700">{s.plan?.name}</td>
                <td data-label="Dû / Payé" className="text-xs text-slate-600">{new Intl.NumberFormat('fr-FR').format(s.due_amount)} / {new Intl.NumberFormat('fr-FR').format(s.paid_amount)}</td>
                <td data-label="Reste" className={s.remaining_balance > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>{new Intl.NumberFormat('fr-FR').format(s.remaining_balance)}</td>
                <td data-label="Début" className="text-slate-600">{fmtDate(s.start_date)}</td>
                <td data-label="Fin" className="text-slate-600">{fmtDate(s.end_date)}</td>
                <td data-label="Jours" className={s.days_remaining <= 0 ? 'text-rose-600 font-semibold' : s.days_remaining <= 3 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>{s.days_remaining}</td>
                <td data-label="Statut"><Badge value={s.status} /></td>
                <td data-label="Actions" className="text-right space-x-1 whitespace-nowrap">
                  {s.status === 'actif' && canWrite && (
                    <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setCurrent(s); setModal('renew') }}>Renouveler</button>
                  )}
                  {s.status === 'suspendu' && canWrite && (
                    <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setCurrent(s); setModal(null); api(`/subscriptions/${s.id}/resume`).then(done).catch(e => setError(e.message)) }}>Reprendre</button>
                  )}
                  {s.status === 'actif' && isDir && (
                    <button className={btnDanger + ' text-xs py-1.5 px-3'} onClick={() => { setCurrent(s); setModal('suspend') }}>Suspendre</button>
                  )}
                  {(s.status === 'actif' || s.status === 'expire') && isDir && (
                    <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setCurrent(s); setModal('cancel') }}>Annuler</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && !rows.data.length && <p className="text-sm text-slate-400 mt-3">Aucun abonnement pour ce filtre.</p>}
        <Pagination meta={rows} onPage={setPage} />
      </div>
      {error && <ErrorBox error={error} />}

      <Modal open={modal === 'renew'} onClose={() => setModal(null)} title="Renouveler">
        {current && <RenewForm original={current} onDone={done} />}
      </Modal>
      <Modal open={modal === 'suspend'} onClose={() => setModal(null)} title="Suspendre (direction)">
        {current && <ReasonForm title="Suspendre" label_="Motif de suspension" action={r => act('suspend', { reason: r })} onDone={done} />}
      </Modal>
      <Modal open={modal === 'cancel'} onClose={() => setModal(null)} title="Annuler l'abonnement (direction)">
        {current && <ReasonForm title="Annuler" label_="Motif d'annulation" action={r => act('cancel', { reason: r })} onDone={done} />}
      </Modal>
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Nouveau abonnement">
        {modal === 'create' && <CreateSubscriptionForm onDone={done} />}
      </Modal>
    </div>
  )
}

function CreateSubscriptionForm({ onDone }) {
  const [plans, setPlans] = useState([])
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({ client_id: '', plan_id: '', start_date: today(), discount: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/plans?all=1').then(setPlans).catch(() => {})
    api('/clients?per_page=200').then(d => setClients(d?.data || [])).catch(() => {})
  }, [])

  const save = async e => {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      const body = { client_id: Number(form.client_id), plan_id: Number(form.plan_id), start_date: form.start_date }
      if (form.discount !== '' && Number(form.discount) > 0) body.discount = Number(form.discount)
      await api('/subscriptions', { method: 'POST', body })
      onDone()
    } catch (ex) { setError(`${ex.message} ${fieldErrors(ex.errors) || ''}`) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      {error && <ErrorBox error={error} />}
      <div>
        <label className={label}>Client *</label>
        <select required className={input} value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
          <option value="">— choisir un client —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.code} — {c.first_name} {c.last_name} ({c.phone})</option>
          ))}
        </select>
      </div>
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
        <button type="button" className={btnGhost} onClick={onDone}>Annuler</button>
        <button className={btn} disabled={busy}>{busy ? 'Création…' : 'Créer l\'abonnement'}</button>
      </div>
    </form>
  )
}
