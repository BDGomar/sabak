import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { PageHeader, ErrorBox, btn, input, label, card } from '../lib/ui'

export default function Settings() {
  const [s, setS] = useState(null)
  const [err, setErr] = useState(null)
  const [ok, setOk] = useState(false)

  useEffect(() => { api('/settings').then(d => setS(d.settings)).catch(e => setErr(e.message)) }, [])

  const save = async e => {
    e.preventDefault(); setOk(false); setErr(null)
    try {
      const d = await api('/settings', { method: 'PUT', body: s })
      setS(d.settings); setOk(true)
    } catch (ex) { setErr(ex.message) }
  }

  if (!s) return <p className="text-slate-500">{err || 'Chargement…'}</p>
  const set = (k, v) => setS({ ...s, [k]: v })

  return (
    <div>
      <PageHeader title="Paramètres de la salle" />
      {err && <ErrorBox error={err} />}
      {ok && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md p-3 text-sm mb-4">Enregistré ✓ (recu et journal enregistrés)</div>}
      <form onSubmit={save} className="space-y-4 max-w-xl">
        <div className={card}>
          <h3 className="font-semibold mb-3">Salle</h3>
          <div className="space-y-3">
            <div><label className={label}>Nom de la salle</label><input className={input} value={s.gym_name || ''} onChange={e => set('gym_name', e.target.value)} /></div>
            <div><label className={label}>Adresse (reçus)</label><input className={input} value={s.gym_address || ''} onChange={e => set('gym_address', e.target.value)} /></div>
            <div><label className={label}>Téléphone</label><input className={input} value={s.gym_phone || ''} onChange={e => set('gym_phone', e.target.value)} /></div>
            <div><label className={label}>Fuseau horaire</label><input className={input} value={s.timezone || ''} onChange={e => set('timezone', e.target.value)} /></div>
          </div>
        </div>
        <div className={card}>
          <h3 className="font-semibold mb-1">Rappels d'échéance</h3>
          <p className="text-xs text-slate-500 mb-2">Jalons en JSON (tableau) — par défaut J-7, J-3, J-1, J0, J+1.</p>
          <textarea rows={2} className={input + ' font-mono text-xs'}
            value={s.reminder_delays || ''} onChange={e => set('reminder_delays', e.target.value)} />
          <p className="text-xs text-slate-500 mt-4 mb-3">Opérateurs Mobile Money (JSON) :</p>
          <textarea rows={2} className={input + ' font-mono text-xs'}
            value={s.mobile_money_operators || ''} onChange={e => set('mobile_money_operators', e.target.value)} />
        </div>
        <button className={btn}>Enregistrer</button>
      </form>
    </div>
  )
}
