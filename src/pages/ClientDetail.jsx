import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, fmtFCFA, fmtDate, fmtDateTime, openReceipt, today } from '../lib/api'
import { PageHeader, Badge, Modal, ErrorBox, fieldErrors, btn, btnDanger, btnGhost, input, label, card } from '../lib/ui'

const CLIENT_STATUS = ['prospect', 'actif', 'expire', 'suspendu', 'inactif']

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

export default function ClientDetail({ me }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [d, setD] = useState(null)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [modal, setModal] = useState(null) // 'sub' | 'renew' | 'suspend' | 'resume' | 'cancel'
  const [current, setCurrent] = useState(null)
  const canWrite = ['direction', 'reception', 'comptabilite'].includes(me.role)
  const isDir = me.role === 'direction'

  const load = () => api(`/clients/${id}`).then(d => { setD(d); setForm({
    first_name: d.client.first_name, last_name: d.client.last_name, phone: d.client.phone,
    whatsapp: d.client.whatsapp || '', email: d.client.email || '', birthdate: d.client.birthdate || '',
    address: d.client.address || '', emergency_contact_name: d.client.emergency_contact_name || '',
    emergency_contact_phone: d.client.emergency_contact_phone || '', notes: d.client.notes || '',
  }) }).catch(e => setError(e.message))

  useEffect(() => { load() }, [id])

  if (!d && error) return <p className="text-rose-600">{error}</p>
  if (!d) return <p className="text-slate-500">Chargement…</p>

  const c = d.client

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
    <div>
      <div className="mb-5">
        <Link to="/clients" className="text-sm text-slate-500 hover:underline">← Tous les clients</Link>
      </div>
      <PageHeader title={`${c.first_name} ${c.last_name}`}>
        {isDir && <button className={btnDanger} onClick={() => setConfirmDelete(true)}>Archiver la fiche</button>}
      </PageHeader>
      {error && <ErrorBox error={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fiche */}
        <div className={card + ' lg:col-span-1'}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-mono text-xs text-slate-500">{c.code}</span>
              <div className="mt-1"><Badge value={c.status} /></div>
            </div>
            {canWrite && <button className={btnGhost} onClick={() => setEdit(true)}>Modifier</button>}
          </div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-500">Téléphone</dt><dd>{c.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">WhatsApp</dt><dd>{c.whatsapp_number || c.whatsapp || c.phone}</dd></div>
            {c.email && <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{c.email}</dd></div>}
            {c.birthdate && <div className="flex justify-between"><dt className="text-slate-500">Né(e) le</dt><dd>{fmtDate(c.birthdate)}</dd></div>}
            {c.address && <div className="flex justify-between"><dt className="text-slate-500">Adresse</dt><dd className="text-right">{c.address}</dd></div>}
            {c.emergency_contact_name && <div className="flex justify-between"><dt className="text-slate-500">Urgence</dt><dd className="text-right">{c.emergency_contact_name}<br />{c.emergency_contact_phone}</dd></div>}
            {c.notes && <div className="pt-2 border-t border-slate-100 text-slate-600">{c.notes}</div>}
          </dl>
          <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center">
            <span className="text-sm text-slate-500">Solde dû</span>
            <span className={`font-semibold ${d.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmtFCFA(d.balance_due)}</span>
          </div>
        </div>

        {/* Abonnements */}
        <div className={card + ' lg:col-span-2'}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Abonnements</h3>
            {canWrite && <button className={btn} onClick={() => { setModal('sub') }}>+ S'abonner</button>}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr><th>Code</th><th>Formule</th><th>Dû / Payé</th><th>Reste</th><th>Fin</th><th>Statut</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {(d.subscriptions || []).map(s => (
                <tr key={s.id}>
                  <td data-label="Code" className="font-mono text-xs font-semibold text-slate-700">{s.code}</td>
                  <td data-label="Formule" className="text-slate-700">{s.plan?.name}</td>
                  <td data-label="Dû / Payé" className="text-xs text-slate-600">{fmtFCFA(s.due_amount)} / {fmtFCFA(s.paid_amount)}</td>
                  <td data-label="Reste" className={s.remaining_balance > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>{fmtFCFA(s.remaining_balance)}</td>
                  <td data-label="Fin" className="text-slate-600">{fmtDate(s.end_date)}</td>
                  <td data-label="Statut"><Badge value={s.status} /></td>
                  <td data-label="Actions" className="text-right space-x-1">
                    {s.status === 'actif' && canWrite && (
                      <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setCurrent(s); setModal('renew') }}>Renouveler</button>
                    )}
                    {s.status === 'actif' && isDir && (
                      <button className={btnDanger + ' text-xs py-1.5 px-3'} onClick={() => { setCurrent(s); setModal('suspend') }}>Suspendre</button>
                    )}
                    {s.status === 'suspendu' && canWrite && (
                      <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={async () => { setCurrent(s); await subAction('resume'); load() }}>Reprendre</button>
                    )}
                    {(s.status === 'actif' || s.status === 'expire') && isDir && (
                      <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setCurrent(s); setModal('cancel') }}>Annuler</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(d.subscriptions || []).length && <p className="text-sm text-slate-400 mt-2">Aucun abonnement pour ce client.</p>}

          <h3 className="font-semibold mt-6 mb-2">Historique des paiements</h3>
          <table className="w-full text-sm">
            <thead>
              <tr><th>Date</th><th>Reçu</th><th>Objet</th><th>Payé</th><th>Solde</th><th>Mode</th><th>Statut</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {(d.payments || []).map(p => (
                <tr key={p.id}>
                  <td data-label="Date" className="text-slate-600">{fmtDateTime(p.paid_at)}</td>
                  <td data-label="Reçu" className="font-mono text-xs font-semibold text-slate-700">{p.receipt_number}</td>
                  <td data-label="Objet" className="text-slate-600">{p.service_label || p.subscription?.plan?.name || '—'}</td>
                  <td data-label="Payé" className="font-semibold">{fmtFCFA(p.amount_paid)}</td>
                  <td data-label="Solde" className="text-slate-600">{fmtFCFA(p.balance)}</td>
                  <td data-label="Mode" className="text-slate-600">{p.method === 'especes' ? 'Espèces' : `MM ${p.operator || ''}`}</td>
                  <td data-label="Statut"><Badge value={p.status} /></td>
                  <td data-label="Actions" className="text-right"><button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => openReceipt(p.id)}>Reçu</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(d.payments || []).length && <p className="text-sm text-slate-400 mt-2">Aucun paiement enregistré.</p>}
        </div>
      </div>

      {/* Modification fiche */}
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
        <p className="text-sm text-red-700 mb-4">Ceci archive la fiche (elle reste dans l'historique — aucune suppression durable).</p>
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setConfirmDelete(false)}>Annuler</button>
          <button className={btnDanger} onClick={archiveClient}>Archiver</button>
        </div>
      </Modal>

      {/* Nouvel abonnement */}
      <Modal open={modal === 'sub'} onClose={() => setModal(null)} title={`Abonner ${c.first_name}`}>
        <SubscriptionForm clientId={c.id} onDone={afterSubAction} />
      </Modal>

      {/* Renouveler */}
      <Modal open={modal === 'renew'} onClose={() => setModal(null)} title="Renouveler">
        {current && <RenewForm original={current} onDone={afterSubAction} />}
      </Modal>

      {/* Suspendre */}
      <Modal open={modal === 'suspend'} onClose={() => setModal(null)} title="Suspendre (direction)">
        {current && <ReasonForm title="Suspendre" label_="Motif de suspension"
          action={r => subAction('suspend', { reason: r })} onDone={afterSubAction} />}
      </Modal>

      {/* Annuler */}
      <Modal open={modal === 'cancel'} onClose={() => setModal(null)} title="Annuler l'abonnement (direction)">
        {current && <ReasonForm title="Annuler" label_="Motif d'annulation"
          action={r => subAction('cancel', { reason: r })} onDone={afterSubAction} />}
      </Modal>
    </div>
  )
}
