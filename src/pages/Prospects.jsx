import { useEffect, useState } from 'react'
import { api, fmtDate, today } from '../lib/api'
import { PageHeader, Pagination, Badge, Modal, ErrorBox, fieldErrors, btn, input, label, card } from '../lib/ui'

const STAGES = ['nouveau', 'contacte', 'visite_prevue', 'essai_effectue', 'inscrit', 'perdu']

export default function Prospects({ me }) {
  const [rows, setRows] = useState(null)
  const [stage, setStage] = useState('')
  const [page, setPage] = useState(1)
  const [plans, setPlans] = useState([])
  const [err, setErr] = useState(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', whatsapp: '', source: '', stage: 'nouveau', interested_plan_id: '', next_contact_at: '', notes: '' })
  const [edit, setEdit] = useState(null)
  const [convert, setConvert] = useState(null)
  const [convForm, setConvForm] = useState({ plan_id: '', start_date: today() })
  const [failed, setFailed] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([api('/plans?all=1'), api(`/prospects?stage=${stage}&page=${page}`)])
      .then(([p, r]) => { setPlans(p); setRows(r) }).catch(e => setErr(e.message))
  }, [stage, page])

  const save = async e => {
    e.preventDefault(); setBusy(true); setFailed(null)
    try {
      const body = { ...form }
      for (const k of ['interested_plan_id']) if (body[k] === '') body[k] = null
      await api('/prospects', { method: 'POST', body })
      setCreateOpen(false); setForm({ first_name: '', last_name: '', phone: '', whatsapp: '', source: '', stage: 'nouveau', interested_plan_id: '', next_contact_at: '', notes: '' })
      setPage(1)
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) } finally { setBusy(false) }
  }

  const saveEdit = async e => {
    e.preventDefault(); setBusy(true); setFailed(null)
    try {
      await api(`/prospects/${edit.id}`, { method: 'PUT', body: { ...edit, interested_plan_id: edit.interested_plan_id || null } })
      setEdit(null)
      await api(`/prospects?stage=${stage}&page=${page}`).then(setRows)
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) } finally { setBusy(false) }
  }

  const doConvert = async e => {
    e.preventDefault(); setBusy(true); setFailed(null)
    try {
      await api(`/prospects/${convert.id}/convert`, { method: 'POST', body: { ...convForm, plan_id: convForm.plan_id || null } })
      setConvert(null)
      await api(`/prospects?stage=${stage}&page=${page}`).then(setRows)
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) } finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title="Pipeline prospects">
        <button className={btn} onClick={() => setCreateOpen(true)}>+ Nouveau prospect</button>
      </PageHeader>
      {err && <ErrorBox error={err} />}
      <div className={card}>
        <div className="flex flex-wrap gap-2 mb-4">
          <select className={input + ' max-w-[12rem]'} value={stage} onChange={e => { setStage(e.target.value); setPage(1) }}>
            <option value="">Toutes les étapes</option>
            {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr><th>Prospect</th><th>Téléphone</th><th>Source</th><th>Étape</th><th>Formule visée</th><th>Prochain contact</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {(rows?.data || []).map(p => (
              <tr key={p.id}>
                <td data-label="Prospect" className="font-medium">{p.first_name} {p.last_name}</td>
                <td data-label="Téléphone" className="text-slate-600">{p.phone}</td>
                <td data-label="Source" className="text-slate-600">{p.source || '—'}</td>
                <td data-label="Étape"><Badge value={p.stage} /></td>
                <td data-label="Formule visée" className="text-slate-600">{p.interested_plan?.name || '—'}</td>
                <td data-label="Prochain contact" className="text-slate-600">{p.next_contact_at ? fmtDate(p.next_contact_at) : '—'}</td>
                <td data-label="Actions" className="text-right space-x-1">
                  {!p.client_id && (
                    <>
                      <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setEdit(p); setFailed(null) }}>Modifier</button>
                      {p.stage !== 'inscrit' && p.stage !== 'perdu' && (
                        <button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setConvert(p); setConvForm({ plan_id: p.interested_plan_id || '', start_date: today() }); setFailed(null) }}>Convertir</button>
                      )}
                    </>
                  )}
                  {p.client_id && <span className="text-xs text-emerald-700 font-semibold">Converti ✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && !rows.data.length && <p className="text-sm text-slate-400 mt-3">Aucun prospect pour ce filtre.</p>}
        <Pagination meta={rows} onPage={setPage} />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau prospect" wide>
        <form onSubmit={save} className="space-y-3">
          {failed && <ErrorBox error={failed} />}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Prénom *</label><input required className={input} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><label className={label}>Nom *</label><input required className={input} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
            <div><label className={label}>Téléphone *</label><input required type="tel" className={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className={label}>WhatsApp</label><input className={input} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
            <div><label className={label}>Source</label><input className={input} placeholder="réseaux, passant, bouche-à-oreille…" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></div>
            <div><label className={label}>Étape</label>
              <select className={input} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><label className={label}>Formule qui l'intéresse</label>
              <select className={input} value={form.interested_plan_id} onChange={e => setForm({ ...form, interested_plan_id: e.target.value })}>
                <option value="">—</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><label className={label}>Prochain contact</label><input type="date" className={input} value={form.next_contact_at} onChange={e => setForm({ ...form, next_contact_at: e.target.value })} /></div>
          </div>
          <div><label className={label}>Notes</label><textarea rows={2} className={input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><button className={btn} disabled={busy}>{busy ? '…' : 'Enregistrer'}</button></div>
        </form>
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Modifier le prospect" wide>
        {edit && (
          <form onSubmit={saveEdit} className="space-y-3">
            {failed && <ErrorBox error={failed} />}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Prénom</label><input className={input} value={edit.first_name} onChange={e => setEdit({ ...edit, first_name: e.target.value })} /></div>
              <div><label className={label}>Nom</label><input className={input} value={edit.last_name} onChange={e => setEdit({ ...edit, last_name: e.target.value })} /></div>
              <div><label className={label}>Téléphone</label><input className={input} value={edit.phone} onChange={e => setEdit({ ...edit, phone: e.target.value })} /></div>
              <div><label className={label}>Étape</label>
                <select className={input} value={edit.stage} onChange={e => setEdit({ ...edit, stage: e.target.value })}>
                  {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div><label className={label}>Source</label><input className={input} value={edit.source || ''} onChange={e => setEdit({ ...edit, source: e.target.value })} /></div>
              <div><label className={label}>Prochain contact</label><input type="date" className={input} value={edit.next_contact_at || ''} onChange={e => setEdit({ ...edit, next_contact_at: e.target.value })} /></div>
            </div>
            <div><label className={label}>Notes</label><textarea rows={2} className={input} value={edit.notes || ''} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><button className={btn} disabled={busy}>{busy ? '…' : 'Enregistrer'}</button></div>
          </form>
        )}
      </Modal>

      <Modal open={!!convert} onClose={() => setConvert(null)} title="Convertir le prospect en client">
        {convert && (
          <form onSubmit={doConvert} className="space-y-3">
            {failed && <ErrorBox error={failed} />}
            <p className="text-sm text-slate-600">
              Créer la fiche client de <strong>{convert.first_name} {convert.last_name}</strong>.
              Sans formule, le client est créé avec le statut « prospect ».
            </p>
            <label className={label}>Formule (optionnel)</label>
            <select className={input} value={convForm.plan_id} onChange={e => setConvForm({ ...convForm, plan_id: e.target.value })}>
              <option value="">Conversion sans abonnement</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {new Intl.NumberFormat('fr-FR').format(p.price)} FCFA</option>)}
            </select>
            {convForm.plan_id && (<div><label className={label}>Début</label><input type="date" className={input} value={convForm.start_date} onChange={e => setConvForm({ ...convForm, start_date: e.target.value })} /></div>)}
            <div className="flex justify-end"><button className={btn} disabled={busy}>{busy ? 'Conversion…' : 'Convertir'}</button></div>
          </form>
        )}
      </Modal>
    </div>
  )
}
