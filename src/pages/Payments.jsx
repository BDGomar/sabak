import { useEffect, useState } from 'react'
import { api, fmtFCFA, fmtDateTime, openReceipt } from '../lib/api'
import { useDebounced, PageHeader, Pagination, Badge, Modal, ErrorBox, btn, btnGhost, btnDanger, input, card, label } from '../lib/ui'

export default function Payments({ me }) {
  const [rows, setRows] = useState(null)
  const [filters, setFilters] = useState({ method: '', status: '' })
  const [page, setPage] = useState(1)
  const [err, setErr] = useState(null)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [success, setSuccess] = useState(null)

  const canPay = ['direction', 'reception', 'comptabilite'].includes(me.role)
  const isDir = me.role === 'direction'

  useEffect(() => {
    const q = `page=${page}&method=${filters.method}&status=${filters.status}`
    api(`/payments?${q}`).then(setRows).catch(e => setErr(e.message))
  }, [page, filters])

  const loadUnpaidSubs = async clientId => {
    const subs = await api(`/subscriptions?client_id=${clientId}&status=actif&per_page=100`)
    return subs.data.filter(s => s.remaining_balance > 0)
  }

  return (
    <div>
      <PageHeader title="Caisse / Paiements">
        {canPay && <button className={btn} onClick={() => { setSuccess(null); setModalOpen(true) }}>+ Encaisser</button>}
      </PageHeader>
      {err && <ErrorBox error={err} />}
      {error && <ErrorBox error={error} />}
      <div className={card}>
        <div className="flex gap-3 mb-4">
          <select className={input + ' max-w-[10rem]'} value={filters.method} onChange={e => { setFilters({ ...filters, method: e.target.value }); setPage(1) }}>
            <option value="">Tous modes</option><option value="especes">Espèces</option><option value="mobile_money">Mobile Money</option>
          </select>
          <select className={input + ' max-w-[9rem]'} value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
            <option value="">Tous statuts</option><option value="valide">Validés</option><option value="annule">Annulés</option><option value="rembourse">Remboursés</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr><th>Date</th><th>Reçu</th><th>Client</th><th>Objet</th><th>Payé</th><th>Solde</th><th>Mode</th><th>Statut</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {(rows?.data || []).map(p => (
              <tr key={p.id}>
                <td data-label="Date" className="text-slate-600">{fmtDateTime(p.paid_at)}</td>
                <td data-label="Reçu" className="font-mono text-xs font-semibold text-slate-700">{p.receipt_number}</td>
                <td data-label="Client" className="font-medium">{p.client?.first_name} {p.client?.last_name}</td>
                <td data-label="Objet" className="text-slate-600">{p.service_label || p.subscription?.plan?.name || '—'}</td>
                <td data-label="Payé" className="font-semibold">{fmtFCFA(p.amount_paid)}</td>
                <td data-label="Solde">{p.balance ? <span className="text-rose-600 font-medium">{fmtFCFA(p.balance)}</span> : <span className="text-slate-400">—</span>}</td>
                <td data-label="Mode" className="text-slate-600">{p.method === 'especes' ? 'Espèces' : (p.operator ? `MM · ${p.operator}` : 'Mobile Money')}</td>
                <td data-label="Statut"><Badge value={p.status} /></td>
                <td data-label="Actions" className="text-right space-x-1 whitespace-nowrap">
                  <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => openReceipt(p.id)}>Reçu</button>
                  {isDir && p.status === 'valide' && <CancelBtn payment={p} onError={setError} onDone={() => setPage(x => x)} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && !rows.data.length && <p className="text-sm text-slate-400 mt-3">Aucune transaction.</p>}
        <Pagination meta={rows} onPage={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Encaisser un paiement" wide>
        {success ? (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-emerald-800">
              <div className="font-semibold">Paiement enregistré ✓</div>
              <div className="text-sm mt-1">Référence <span className="font-mono">{success.reference}</span> · Reçu <strong className="font-mono">{success.receipt_number}</strong></div>
              <div className="text-sm">Solde restant : {fmtFCFA(success.balance)}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => openReceipt(success.id)}>Voir le reçu</button>
              <button className={btn} onClick={() => { setModalOpen(false); setPage(1) }}>Fermer</button>
            </div>
          </div>
        ) : (
          <PaymentForm onDone={setSuccess} loadUnpaidSubs={loadUnpaidSubs} />
        )}
      </Modal>
    </div>
  )
}

function CancelBtn({ payment, onError, onDone }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [type, setType] = useState('annule')
  const [busy, setBusy] = useState(false)

  const go = async () => {
    setBusy(true)
    try { await api(`/payments/${payment.id}/cancel`, { method: 'POST', body: { reason, type } }); setOpen(false); onDone() }
    catch (ex) { onError(ex.message) } finally { setBusy(false) }
  }

  return (
    <>
      <button className={btnDanger + ' text-xs py-1.5 px-3'} onClick={() => setOpen(true)}>Annuler/Rembourser</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4 text-lg">{payment.receipt_number} — {fmtFCFA(payment.amount_paid)}</h3>
            <label className={label}>Type d'opération</label>
            <select className={input} value={type} onChange={e => setType(e.target.value)}>
              <option value="annule">Annulation (erreur de saisie)</option>
              <option value="rembourse">Remboursement</option>
            </select>
            <div className="mt-3"><label className={label}>Motif (obligatoire — tracé au journal)</label>
              <textarea rows={3} className={input} value={reason} onChange={e => setReason(e.target.value)} /></div>
            <div className="flex justify-end gap-2 mt-5">
              <button className={btnGhost} onClick={() => setOpen(false)}>Fermer</button>
              <button className={btnDanger} disabled={busy || !reason.trim()} onClick={go}>{busy ? '…' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PaymentForm({ onDone, loadUnpaidSubs }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(null)
  const [query, setQuery] = useState('')
  const term = useDebounced(query)
  const [results, setResults] = useState([])
  const [showList, setShowList] = useState(false)
  const [picked, setPicked] = useState(null)
  const [unpaid, setUnpaid] = useState([])

  const [etype, setEtype] = useState('abonnement')
  const [form, setForm] = useState({
    subscription_id: '', service_label: '', amount_paid: '', method: 'especes', operator: '', operator_ref: '', note: '',
  })

  useEffect(() => {
    if (!term || picked) return
    api(`/clients/duplicates?phone=${encodeURIComponent(term)}&name=${encodeURIComponent(term)}`)
      .then(d => { setResults(d); setShowList(true) }).catch(() => {})
  }, [term, picked])

  const pick = async c => {
    setPicked(c)
    setShowList(false)
    setUnpaid(await loadUnpaidSubs(c.id))
  }

  const reset = () => { setPicked(null); setUnpaid([]); setQuery(''); setEtype('abonnement') }

  const sub = unpaid.find(s => String(s.id) === form.subscription_id)
  const maxDue = sub ? sub.remaining_balance : null

  const submit = async e => {
    e.preventDefault(); setBusy(true); setFailed(null)
    try {
      const body = { amount_paid: Number(form.amount_paid), method: form.method, client_id: picked.id }
      if (etype === 'abonnement') body.subscription_id = Number(form.subscription_id)
      else body.service_label = form.service_label
      if (form.method === 'mobile_money') {
        body.operator = form.operator
        if (form.operator_ref) body.operator_ref = form.operator_ref
      }
      if (form.note) body.note = form.note
      onDone(await api('/payments', { method: 'POST', body }))
    } catch (ex) {
      const details = Object.values(ex.errors || {}).flat().join(' · ')
      setFailed(`${ex.message}${details ? ' — ' + details : ''}`)
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {failed && <ErrorBox error={failed} />}

      <div className="flex gap-2 text-sm">
        {['abonnement', 'service'].map(t => (
          <button key={t} type="button"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${etype === t ? 'bg-yellow-400 text-black border-yellow-400' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            onClick={() => setEtype(t)}>
            {t === 'abonnement' ? 'Abonnement (acompte)' : 'Service / produit'}
          </button>
        ))}
      </div>

      {/* Recherche client */}
      <div className="relative">
        <label className={label}>Client *</label>
        {picked ? (
          <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50 rounded-md px-3 py-2 text-sm">
            <span><strong>{picked.code}</strong> — {picked.full_name || `${picked.first_name} ${picked.last_name}`} ({picked.phone})</span>
            <button type="button" className={btnGhost} onClick={reset}>changer</button>
          </div>
        ) : (
          <>
            <input className={input} placeholder="Nom ou téléphone du client…" value={query} onChange={e => setQuery(e.target.value)} />
            {showList && !!results.length && (
              <ul className="absolute z-10 border border-slate-200 bg-white rounded-md mt-1 w-full max-h-52 overflow-y-auto shadow">
                {results.map(c => (
                  <li key={c.id}>
                    <button type="button" className="w-full text-left text-sm px-3 py-2 hover:bg-slate-50"
                      onClick={() => pick(c)}>
                      <strong>{c.code}</strong> — {c.full_name || `${c.first_name} ${c.last_name}`} <span className="text-slate-500 text-xs">({c.phone}, {c.status})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showList && picked === null && term.length > 1 && !results.length && <p className="text-xs text-slate-400 mt-1">Aucun client ne correspond.</p>}
          </>
        )}
      </div>

      {picked && etype === 'abonnement' && (
        <div>
          <label className={label}>Abonnement avec solde restant *</label>
          {!unpaid.length && <p className="text-sm text-amber-600">Aucun abonnement actif impayé pour ce client — voir « Service ».</p>}
          <select required className={input} value={form.subscription_id}
            onChange={e => setForm({ ...form, subscription_id: e.target.value })}>
            <option value="">— choisir —</option>
            {unpaid.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.plan?.name} · reste {fmtFCFA(s.remaining_balance)} · fin {String(s.end_date).slice(0, 10)}
              </option>
            ))}
          </select>
        </div>
      )}

      {picked && etype === 'service' && (
        <div><label className={label}>Libellé du service / produit *</label>
          <input required className={input} placeholder="Séance d'essai, complément alimentaire…"
            value={form.service_label} onChange={e => setForm({ ...form, service_label: e.target.value })} />
        </div>
      )}

      {picked && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Montant payé (FCFA) *</label>
              <input required type="number" min={1} max={maxDue || undefined} step={1}
                className={input} value={form.amount_paid}
                onChange={e => setForm({ ...form, amount_paid: e.target.value })} />
              {maxDue != null && form.amount_paid !== '' && Number(form.amount_paid) > maxDue
                && <p className="text-xs text-rose-600 mt-1">Maximum encaissable : {fmtFCFA(maxDue)}</p>}
            </div>
            <div><label className={label}>Mode *</label>
              <select className={input} value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                <option value="especes">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>

          {form.method === 'mobile_money' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Opérateur *</label>
                <select required className={input} value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}>
                  <option value="">—</option><option>Moov Money</option><option>Orange Money</option>
                </select>
              </div>
              <div><label className={label}>Référence transaction (unique par opérateur)</label>
                <input className={input} value={form.operator_ref} onChange={e => setForm({ ...form, operator_ref: e.target.value })} />
                <p className="text-[11px] text-slate-400 mt-0.5">Saisir la référence du reçu Mobile Money — elle est enregistrée une seule fois.</p>
              </div>
            </div>
          )}

          <div><label className={label}>Note (facultatif)</label>
            <input className={input} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button className={btn} disabled={busy || !picked}>{busy ? 'Enregistrement…' : 'Encaisser'}</button>
      </div>
    </form>
  )
}
