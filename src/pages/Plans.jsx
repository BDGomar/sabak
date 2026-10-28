import { useEffect, useState } from 'react'
import { api, fmtFCFA } from '../lib/api'
import { PageHeader, Modal, ErrorBox, fieldErrors, btn, btnGhost, input, label, card, useDebounced } from '../lib/ui'

export default function Plans({ me }) {
  const isDir = me.role === 'direction'
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const term = useDebounced(search)
  const [edit, setEdit] = useState(null) // null | {} | plan
  const [failed, setFailed] = useState(null)
  const [err, setErr] = useState(null)

  const load = () => api('/plans?all=1').then(r => setRows(r.filter(p => !term || (p.name || '').toLowerCase().includes(term.toLowerCase())))).catch(e => setErr(e.message))
  useEffect(() => { load() }, [term])

  const save = async e => {
    e.preventDefault(); setFailed(null)
    const body = { ...edit }
    try {
      if (edit.id) await api(`/plans/${edit.id}`, { method: 'PUT', body })
      else await api('/plans', { method: 'POST', body })
      setEdit(null); load()
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) }
  }

  return (
    <div>
      <PageHeader title="Formules d'abonnement">
        {isDir && <button className={btn} onClick={() => { setEdit({ name: '', price: '', duration_days: 30, description: '', conditions: '', active: true }); setFailed(null) }}>+ Nouvelle formule</button>}
      </PageHeader>
      {err && <ErrorBox error={err} />}
      {!isDir && <p className="text-xs text-slate-500 mb-3">Lecture seule — seule la direction modifie les formules.</p>}

      <div className={card}>
        <input className={input + ' max-w-xs mb-4'} placeholder="Filtrer par nom…" value={search} onChange={e => setSearch(e.target.value)} />
        <table className="w-full text-sm">
          <thead>
            <tr><th>Formule</th><th>Prix</th><th>Durée</th><th>Active</th><th>Description</th>{isDir && <th className="text-right">Actions</th>}</tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td data-label="Formule" className="font-semibold">{p.name}</td>
                <td data-label="Prix" className="font-medium">{fmtFCFA(p.price)}</td>
                <td data-label="Durée" className="text-slate-600">{p.duration_days === 1 ? 'séance' : `${p.duration_days} jours`}</td>
                <td data-label="Active">{p.active ? <span className="text-emerald-700 font-semibold">✓ Active</span> : <span className="text-slate-400">Inactive</span>}</td>
                <td data-label="Description" className="text-slate-500 text-xs">{p.description || '—'}</td>
                {isDir && <td data-label="Actions" className="text-right"><button className={btnGhost + ' text-xs py-1.5 px-3'} onClick={() => { setEdit({ ...p }); setFailed(null) }}>Modifier</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Modifier ${edit.name}` : 'Nouvelle formule'}>
        {edit && (
          <form onSubmit={save} className="space-y-3">
            {failed && <ErrorBox error={failed} />}
            <div><label className={label}>Nom *</label><input required className={input} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Prix (FCFA) *</label><input required type="number" min={0} step={1} className={input} value={edit.price} onChange={e => setEdit({ ...edit, price: e.target.value })} /></div>
              <div><label className={label}>Durée (jours) *</label><input required type="number" min={1} max={3650} className={input} value={edit.duration_days} onChange={e => setEdit({ ...edit, duration_days: e.target.value })} /></div>
            </div>
            <div><label className={label}>Description</label><textarea rows={2} className={input} value={edit.description || ''} onChange={e => setEdit({ ...edit, description: e.target.value })} /></div>
            <div><label className={label}>Conditions</label><textarea rows={2} className={input} value={edit.conditions || ''} onChange={e => setEdit({ ...edit, conditions: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} />　En vente actuellement
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setEdit(null)}>Annuler</button>
              <button className={btn}>Enregistrer</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
