import { useEffect, useState } from 'react'
import { api, fmtFCFA, fmtDate, download, today } from '../lib/api'
import { PageHeader, Modal, ErrorBox, btnGhost, input, card, label, Badge } from '../lib/ui'

const MONTH_START = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

export default function Reports({ me }) {
  const [tab, setTab] = useState('revenue')
  const [range, setRange] = useState({ from: MONTH_START, to: today() })
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    setData(null)
    const q = `from=${range.from}&to=${range.to}`
    const endpoint = tab === 'revenue' ? `/reports/revenue?${q}`
      : tab === 'expenses' ? `/reports/expenses?${q}`
      : tab === 'unpaid' ? '/reports/unpaid'
      : `/reports/clients?status=${tab === 'clients' ? 'expirants' : tab}&days=30`
    api(endpoint).then(setData).catch(e => setErr(e.message))
  }, [tab, range])

  return (
    <div>
      <PageHeader title="Rapports">
        <button className={btnGhost} onClick={() => setShowExport(true)}>⇩ Exports CSV</button>
      </PageHeader>
      {err && <ErrorBox error={err} />}
      <div className="flex gap-1 mb-4 text-sm">
        {[['revenue', 'Recettes'], ['expenses', 'Dépenses'], ['unpaid', 'Impayés'], ['clients', 'Échéances 30 j'], ['expired_actifs', 'Actifs']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k === 'expired_actifs' ? 'actifs' : k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === (k === 'expired_actifs' ? 'actifs' : k) ? 'bg-yellow-400 text-black font-semibold' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>{l}</button>
        ))}
      </div>

      {['revenue', 'expenses'].includes(tab) && (
        <div className="flex gap-3 mb-4">
          <div><label className={label}>Du</label><input type="date" className={input} value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></div>
          <div><label className={label}>Au</label><input type="date" className={input} value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></div>
        </div>
      )}

      {!data && !err && <p className="text-slate-500">Chargement…</p>}

      {tab === 'revenue' && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={card}>
            <div className="text-xs text-slate-500">Encaissé sur la période</div>
            <div className="text-3xl font-bold text-emerald-700">{fmtFCFA(data.encaisse)}</div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="text-sm font-medium mb-2">Par mode</div>
              {Object.entries(data.par_mode || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1">
                  <span className="capitalize">{k === 'especes' ? 'Espèces' : 'Mobile Money'}</span><span className="font-medium">{fmtFCFA(v)}</span>
                </div>
              ))}
              {!Object.keys(data.par_mode || {}).length && <p className="text-sm text-slate-400">Aucun.</p>}
            </div>
          </div>
          <div className={card}>
            <div className="text-sm font-medium mb-2">Par opérateur Mobile Money</div>
            {Object.entries(data.par_operateur || {}).length ? Object.entries(data.par_operateur).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1"><span>{k}</span><span className="font-medium">{fmtFCFA(v)}</span></div>
            )) : <p className="text-sm text-slate-400">Aucun.</p>}
            <div className="text-sm font-medium mt-4 mb-2">Par formule vendue</div>
            {Object.entries(data.par_formule || {}).length ? Object.entries(data.par_formule).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1"><span>{k}</span><span className="font-medium">{fmtFCFA(v)}</span></div>
            )) : <p className="text-sm text-slate-400">Aucune vente sur la période.</p>}
          </div>
        </div>
      )}

      {tab === 'expenses' && data && (
        <div className={card}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-slate-500">Total dépenses</div>
              <div className="text-3xl font-bold text-rose-600">{fmtFCFA(data.total)}</div>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            {Object.entries(data.par_categorie || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1"><span className="capitalize">{k}</span><span className="font-medium">{fmtFCFA(v)}</span></div>
            ))}
            {!Object.keys(data.par_categorie || {}).length && <p className="text-sm text-slate-400">Aucune dépense.</p>}
          </div>
        </div>
      )}

      {tab === 'unpaid' && data && (
        <div className={card}>
          <table className="w-full text-sm">
            <thead><tr><th>Client</th><th>Formule</th><th>Abonnement</th><th>Dû</th><th>Payé</th><th>Solde dû</th></tr></thead>
            <tbody>
              {(Array.isArray(data) ? data : []).map(x => (
                <tr key={x.abonnement?.code}>
                  <td data-label="Client" className="font-medium">{x.client?.first_name} {x.client?.last_name} <span className="text-xs text-slate-400">{x.client?.code}</span></td>
                  <td data-label="Formule" className="text-slate-600">{x.formule}</td>
                  <td data-label="Abonnement" className="font-mono text-xs text-slate-600">{x.abonnement?.code}</td>
                  <td data-label="Dû">{fmtFCFA(x.dû)}</td>
                  <td data-label="Payé">{fmtFCFA(x.payé)}</td>
                  <td data-label="Solde dû" className="text-rose-600 font-semibold">{fmtFCFA(x.solde_du)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(Array.isArray(data) ? data : []).length && <p className="text-sm text-slate-400 mt-3">Tous les abonnements sont soldés. 💪</p>}
        </div>
      )}

      {['clients', 'actifs', 'expires'].includes(tab) && data && (
        <div className={card}>
          <table className="w-full text-sm">
            <thead><tr><th>Client</th><th>Formule</th><th>Fin</th><th>Jours restants</th><th>Statut</th></tr></thead>
            <tbody>
              {(Array.isArray(data) ? data : []).map((x, i) => (
                <tr key={x.end_date + (x.client?.code || i)}>
                  <td data-label="Client" className="font-medium">{x.client?.first_name} {x.client?.last_name} <span className="text-xs text-slate-400">{x.client?.phone}</span></td>
                  <td data-label="Formule" className="text-slate-600">{x.formule}</td>
                  <td data-label="Fin" className="text-slate-600">{fmtDate(x.end_date)}</td>
                  <td data-label="Jours restants" className={x.jours_restants <= 0 ? 'text-rose-600 font-semibold' : x.jours_restants <= 3 ? 'text-amber-600 font-semibold' : 'text-slate-600'}>{x.jours_restants}</td>
                  <td data-label="Statut"><Badge value={x.client?.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(Array.isArray(data) ? data : []).length && <p className="text-sm text-slate-400 mt-3">Aucun abonnement correspondant.</p>}
        </div>
      )}

      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
    </div>
  )
}

const ENTITIES = [
  ['clients', 'Clients'], ['payments', 'Paiements (caisse)'], ['expenses', 'Dépenses'],
  ['subscriptions', 'Abonnements'], ['closings', 'Clôtures de caisse'],
  ['alerts', 'Alertes'], ['whatsapp', 'Messages WhatsApp'],
]

function ExportModal({ open, onClose }) {
  const [busy, setBusy] = useState(null)
  const [err, setErr] = useState(null)
  const go = async entity => {
    setBusy(entity); setErr(null)
    try { await download(`/reports/export?entity=${entity}`, `${entity}-${today()}.csv`) }
    catch (ex) { setErr(ex.message) } finally { setBusy(null) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Exporter les données (CSV)">
      {err && <ErrorBox error={err} />}
      <p className="text-sm text-slate-500 mb-3">Fichiers séparés par ';', ouverts au tableur. Exports tracés côté serveur.</p>
      <div className="space-y-2">
        {ENTITIES.map(([k, label_]) => (
          <button key={k} disabled={busy} onClick={() => go(k)}
            className="w-full flex justify-between items-center border border-slate-200 rounded-md px-4 py-2.5 text-sm hover:bg-slate-50">
            <span>{label_}</span>
            <span className="text-xs text-slate-400">{busy === k ? '…' : '⇩ CSV'}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
