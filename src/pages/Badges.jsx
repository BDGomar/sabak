import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { PageHeader, card, btn, input, label, ErrorBox } from '../lib/ui'

export default function Badges({ me }) {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [err, setErr] = useState(null)
  const [selected, setSelected] = useState(null)
  const [badge, setBadge] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/clients?per_page=200').then(d => setClients(d.data || [])).catch(e => setErr(e.message))
  }, [])

  const filtered = clients.filter(c => {
    const t = search.toLowerCase()
    return !t || c.first_name.toLowerCase().includes(t) || c.last_name.toLowerCase().includes(t) || c.code.toLowerCase().includes(t) || c.phone.includes(t)
  })

  const generate = async (c) => {
    setBusy(true); setErr(null)
    try {
      const res = await api(`/clients/${c.id}/badge/generate`, { method: 'POST' })
      setSelected(c)
      setBadge(res)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const view = async (c) => {
    setBusy(true); setErr(null)
    try {
      const res = await api(`/clients/${c.id}/badge`)
      setSelected(c)
      setBadge({ client: c, qr: res.qr, payload: res.payload, badge_id: res.badge_id })
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <PageHeader title="Badges QR" />
      {err && <ErrorBox error={err} />}
      <div className={card}>
        <input className={input + ' max-w-sm mb-4'} placeholder="Rechercher un client..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50">
              <div>
                <div className="font-medium">{c.first_name} {c.last_name}</div>
                <div className="text-xs text-slate-500">{c.code} · {c.phone}</div>
              </div>
              <div className="flex gap-2">
                {c.badge_id ? <button className={btn} onClick={() => view(c)}>Voir badge</button> : null}
                <button className={c.badge_id ? 'border border-slate-300 px-4 py-2 rounded-xl text-sm' : btn} disabled={busy} onClick={() => generate(c)}>
                  {c.badge_id ? 'Régénérer' : 'Générer badge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {badge && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setBadge(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{selected.first_name} {selected.last_name}</h2>
              <p className="text-sm text-slate-500">{selected.code}</p>
            </div>
            {badge.qr && <img src={badge.qr} alt="QR Badge" className="w-full max-w-xs mx-auto" />}
            <div className="mt-4 text-xs text-slate-600 space-y-1">
              <div>Badge ID: <span className="font-mono">{badge.badge_id || badge.payload?.badge_id}</span></div>
              {badge.payload?.subscription && (
                <>
                  <div>Abonnement: {badge.payload.subscription.plan} ({badge.payload.subscription.code})</div>
                  <div>Prix: {badge.payload.subscription.price} FCFA</div>
                  <div>Période: {badge.payload.subscription.start_date} → {badge.payload.subscription.end_date}</div>
                </>
              )}
              <div>Séances effectuées: {badge.payload?.sessions?.used || 0}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <a href={badge.qr} download={`badge-${selected.code}.png`} className={btn + ' flex-1'}>Télécharger PNG</a>
              <button className="border border-slate-300 px-4 py-2 rounded-xl flex-1" onClick={() => window.print()}>Imprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
