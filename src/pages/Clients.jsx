import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, fmtDate } from '../lib/api'
import { PageHeader, Pagination, Badge, Modal, ErrorBox, fieldErrors, useDebounced, btn, btnGhost, input, label, card } from '../lib/ui'

const EMPTY = { first_name: '', last_name: '', phone: '', whatsapp: '', email: '', birthdate: '', address: '', emergency_contact_name: '', emergency_contact_phone: '', status: 'prospect', notes: '' }

export default function Clients({ me }) {
  const [rows, setRows] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const term = useDebounced(search)
  const [err, setErr] = useState(null)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [dupes, setDupes] = useState([])
  const [dupesLoaded, setDupesLoaded] = useState(false)
  const [failed, setFailed] = useState(null)
  const [saving, setSaving] = useState(false)

  const canWrite = ['direction', 'reception', 'comptabilite'].includes(me.role)

  useEffect(() => {
    api(`/clients?page=${page}&per_page=25&status=${status}&search=${encodeURIComponent(term)}`)
      .then(setRows).catch(e => setErr(e.message))
  }, [page, status, term])

  const checkDuplicates = async (values) => {
    setDupesLoaded(false)
    const d = await api(`/clients/duplicates?phone=${encodeURIComponent(values.phone)}&name=${encodeURIComponent(values.first_name + ' ' + values.last_name)}`)
    setDupes(d || [])
    setDupesLoaded(true)
  }

  const openCreate = () => { setForm(EMPTY); setDupes([]); setDupesLoaded(false); setFailed(null); setOpen(true) }

  const conflictingDupes = d => d.some(c => c.phone && c.phone.replace(/\D/g, '') === form.phone.replace(/\D/g, ''))

  const navigate = useNavigate()
  const save = async e => {
    e.preventDefault()
    setSaving(true); setFailed(null)
    try {
      const c = await api('/clients', { method: 'POST', body: form })
      setOpen(false)
      navigate(`/clients/${c.id}`)
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="Clients">
        {canWrite && <button className={btn} onClick={openCreate}>+ Nouveau client</button>}
      </PageHeader>
      {err && <ErrorBox error={err} />}
      <div className={card}>
        <div className="flex gap-3 mb-4">
          <input className={input + ' max-w-xs'} placeholder="Rechercher (nom, téléphone, code)…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <select className={input + ' max-w-[10rem]'} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Tous les statuts</option>
            <option value="prospect">Prospect</option><option value="actif">Actif</option>
            <option value="expire">Expiré</option><option value="suspendu">Suspendu</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr><th>Code</th><th>Nom</th><th>Téléphone</th><th>Statut</th><th>Abonnement</th><th>Fin</th></tr>
          </thead>
          <tbody>
            {(rows?.data || []).map(c => {
              const s = c.active_subscription_data
              return (
                <tr key={c.id}>
                  <td data-label="Code">
                    <Link to={`/clients/${c.id}`} className="font-semibold text-yellow-700 hover:text-yellow-800 hover:underline">{c.code}</Link>
                  </td>
                  <td data-label="Nom"><Link to={`/clients/${c.id}`} className="font-medium hover:text-yellow-700 hover:underline">{c.first_name} {c.last_name}</Link></td>
                  <td data-label="Téléphone" className="text-slate-700">{c.phone}</td>
                  <td data-label="Statut"><Badge value={c.status} /></td>
                  <td data-label="Abonnement" className="text-slate-700">{s ? s.plan : '—'}</td>
                  <td data-label="Fin" className={s && s.days_remaining <= 3 ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                    {s ? `${s.days_remaining} j` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows && !rows.data.length && <p className="text-sm text-slate-400 mt-3">Aucun client ne correspond.</p>}
        <Pagination meta={rows} onPage={setPage} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau client" wide>
        <form onSubmit={save} className="space-y-3">
          {failed && <ErrorBox error={failed} />}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Prénom *</label><input required className={input} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><label className={label}>Nom *</label><input required className={input} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
            <div><label className={label}>Téléphone *</label>
              <input required type="tel" className={input} value={form.phone}
                onChange={e => { setForm({ ...form, phone: e.target.value }); setDupesLoaded(false) }} />
            </div>
            <div><label className={label}>WhatsApp (si différent)</label>
              <input className={input} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
            <div><label className={label}>Email</label><input type="email" className={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className={label}>Date de naissance</label><input type="date" className={input} value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} /></div>
            <div className="col-span-2"><label className={label}>Adresse</label><input className={input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className={label}>Contact d'urgence</label><input className={input} value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
            <div><label className={label}>Tél. urgence</label><input className={input} value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
            <div><label className={label}>Statut</label>
              <select className={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="prospect">Prospect (informé, pas encore inscrit)</option>
                <option value="actif">Actif</option><option value="inactif">Inactif</option>
              </select>
            </div>
            <div><label className={label}>Notes administratives</label><input className={input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>

          {form.phone.length >= 4 && (
            <div className="border-t border-slate-200 pt-3">
              <button type="button" className={btnGhost} onClick={() => checkDuplicates(form)}>Vérifier les doublons</button>
              {dupesLoaded && (
                conflictingDupes(dupes) ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm mt-2">
                    <strong>{dupes.length} fiche(s) proche(s) déjà en base.</strong> Ne pas créer un doublon —
                    ouvrez la fiche existante pour la renouveler :
                    <ul className="mt-2 space-y-1">
                      {dupes.map(d => (
                        <li key={d.id}>
                          <Link to={`/clients/${d.id}`} className="underline font-medium">{d.code} — {d.full_name || d.first_name + ' ' + d.last_name}</Link> <span className="text-xs">({d.phone}, {d.status})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : <p className="text-sm text-emerald-700 mt-2">✓ Aucun doublon probable trouvé.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>Annuler</button>
            <button className={btn} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
