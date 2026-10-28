import { useEffect, useState } from 'react'
import { api, fmtDateTime } from '../lib/api'
import { PageHeader, Modal, ErrorBox, fieldErrors, Badge, btn, btnGhost, input, label, card } from '../lib/ui'

const ROLES = [['direction', 'Direction'], ['reception', 'Réception'], ['comptabilite', 'Comptabilité'], ['coach', 'Coach']]

export default function Users({ me }) {
  const [rows, setRows] = useState([])
  const [edit, setEdit] = useState(null) // {} = création
  const [failed, setFailed] = useState(null)
  const [err, setErr] = useState(null)

  const load = () => api('/users').then(setRows).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault(); setFailed(null)
    try {
      if (edit.id) await api(`/users/${edit.id}`, { method: 'PUT', body: edit })
      else await api('/users', { method: 'POST', body: edit })
      setEdit(null); load()
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) }
  }

  return (
    <div>
      <PageHeader title="Utilisateurs">
        <button className={btn} onClick={() => { setEdit({ name: '', email: '', role: 'reception', phone: '', password: '', is_active: true }); setFailed(null) }}>+ Utilisateur</button>
      </PageHeader>
      {err && <ErrorBox error={err} />}
      <div className={card}>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 text-xs uppercase"><tr><th className="py-2">Nom</th><th>Email</th><th>Rôle</th><th>Téléphone</th><th>Actif</th><th></th></tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2 font-medium">{u.name}{u.id === me.id && <span className="text-xs text-slate-400 ml-1">(vous)</span>}</td>
                <td>{u.email}</td>
                <td><RoleBadge role={u.role} /></td>
                <td className="text-slate-600">{u.phone || '—'}</td>
                <td>{u.is_active ? <span className="text-emerald-700">✓</span> : <span className="text-rose-600">compte désactivé</span>}</td>
                <td className="text-right"><button className={btnGhost} onClick={() => { setEdit({ ...u, password: '' }); setFailed(null) }}>modifier</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Modifier ${edit.name}` : 'Nouvel utilisateur'}>
        {edit && (
          <form onSubmit={save} className="space-y-3">
            {failed && <ErrorBox error={failed} />}
            <div><label className={label}>Nom *</label><input required className={input} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
            <div><label className={label}>Email *</label><input required type="email" className={input} value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} /></div>
            <div><label className={label}>Rôle *</label>
              <select className={input} value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}>
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <p className="text-[11px] text-slate-400 mt-0.5">Direction : tout · Réception : clients, abonnements, caisse · Comptabilité : caisse, dépenses, rapports · Coach : lecture.</p>
            </div>
            <div><label className={label}>Téléphone</label><input className={input} value={edit.phone || ''} onChange={e => setEdit({ ...edit, phone: e.target.value })} /></div>
            <div><label className={label}>{edit.id ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}</label>
              <input type="password" required={!edit.id} minLength={8} className={input} value={edit.password} onChange={e => setEdit({ ...edit, password: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={edit.is_active !== false} onChange={e => setEdit({ ...edit, is_active: e.target.checked })} /> Compte actif
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

function RoleBadge({ role }) {
  const s = { direction: 'bg-indigo-100 text-indigo-700', reception: 'bg-emerald-100 text-emerald-700', comptabilite: 'bg-amber-100 text-amber-700', coach: 'bg-sky-100 text-sky-700' }
  const l = { direction: 'Direction', reception: 'Réception', comptabilite: 'Comptabilité', coach: 'Coach' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s[role]}`}>{l[role]}</span>
}
