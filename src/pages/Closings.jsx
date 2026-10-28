import { useEffect, useState } from 'react'
import { api, fmtFCFA, fmtDate, today } from '../lib/api'
import { PageHeader, ErrorBox, btn, input, card, label } from '../lib/ui'

export default function CloseBox() {
  const [date, setDate] = useState(today())
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ expected_cash: '', counted_cash: '', note: '' })
  const [err, setErr] = useState(null)
  const [failed, setFailed] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [s, h] = await Promise.all([
        api(`/closings/summary?date=${date}`),
        api(`/closings?from=${date}&to=${date}`),
      ])
      setSummary(s); setHistory(h)
      const mine = h.find(x => String(x.date).slice(0, 10) === date)
      setForm({ expected_cash: '', counted_cash: '', note: '', ...(mine ? { expected_cash: mine.expected_cash, counted_cash: mine.counted_cash, note: mine.note || '' } : {}) })
    } catch (ex) { setErr(ex.message) }
  }
  useEffect(() => { load() }, [date])

  const submit = async e => {
    e.preventDefault(); setBusy(true); setFailed(null)
    try {
      await api('/closings', { method: 'POST', body: { date, expected_cash: Number(form.expected_cash), counted_cash: Number(form.counted_cash), note: form.note || undefined } })
      await load()
    } catch (ex) { setFailed(ex.message) } finally { setBusy(false) }
  }

  const t = summary?.totals || {}
  const already = history.some(x => String(x.date).slice(0, 10) === date)

  return (
    <div>
      <PageHeader title="Clôture de caisse journalière" />
      {err && <ErrorBox error={err} />}
      {failed && <ErrorBox error={failed} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <div className="flex items-center gap-3 mb-4">
            <input type="date" className={input + ' max-w-[11rem]'} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Encaissé espèces</div>
              <div className="text-xl font-bold">{fmtFCFA(t.especes)}</div>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Encaissé Mobile Money</div>
              <div className="text-xl font-bold">{fmtFCFA(t.mobile_money)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Total encaissé</div>
              <div className="text-xl font-bold">{fmtFCFA(t.encaisse_total)}</div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Dépenses du jour</div>
              <div className="text-xl font-bold">{fmtFCFA(t.depenses)}</div>
            </div>
          </div>
          {summary?.by_user?.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
              <div className="text-xs text-slate-500 mb-2">Par utilisateur</div>
              {summary.by_user.map(u => (
                <div key={u.user.id} className="flex justify-between py-1">
                  <span>{u.user.name} <span className="text-xs text-slate-400">{u.user.role}</span></span>
                  <span className="font-medium">{fmtFCFA(u.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <h3 className="font-semibold mb-1">Comptage des espèces</h3>
          <p className="text-xs text-slate-500 mb-3">
            {already
              ? 'Clôture déjà faite ce jour — enregistrée au journal. Toute rectification doit passer par la direction.'
              : 'Comparez l\u2019espérance (encaissé théorique) et le comptage réel. L\u2019écart est enregistré au journal.'}
          </p>
          <form onSubmit={submit} className="space-y-3">
            <div><label className={label}>Espèces attendues (théorique) *</label>
              <input required type="number" min={0} step={1} className={input}
                value={form.expected_cash || t.especes || ''} onChange={e => setForm({ ...form, expected_cash: e.target.value })} />
            </div>
            <div><label className={label}>Espèces comptées (réel) *</label>
              <input required type="number" min={0} step={1} className={input} value={form.counted_cash} onChange={e => setForm({ ...form, counted_cash: e.target.value })} />
            </div>
            <div><label className={label}>Note</label><input className={input} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
            {form.counted_cash !== '' && <p className="text-sm">Écart : <strong>{Number(form.counted_cash) - Number(form.expected_cash || 0)} FCFA</strong></p>}
            <button className={btn} disabled={busy || already}>{busy ? '…' : already ? 'Clôture déjà faite' : 'Clôturer la journée'}</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className={card}>
          <h3 className="font-semibold mb-3">Historique des clôtures</h3>
          <table className="w-full text-sm">
            <thead><tr><th>Date</th><th>Par</th><th>Espèces</th><th>MM</th><th>Écart</th></tr></thead>
            <tbody>
              {history.map(c => (
                <tr key={c.id}>
                  <td data-label="Date" className="text-slate-600">{fmtDate(c.date)}</td>
                  <td data-label="Par" className="text-slate-600">{c.user?.name}</td>
                  <td data-label="Espèces">{fmtFCFA(c.total_cash)}</td>
                  <td data-label="MM">{fmtFCFA(c.total_mobile_money)}</td>
                  <td data-label="Écart" className={c.difference > 0 ? 'text-emerald-700 font-semibold' : c.difference < 0 ? 'text-rose-600 font-semibold' : 'text-slate-600'}>{c.difference > 0 ? '+' : ''}{c.difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!history.length && <p className="text-sm text-slate-400 mt-2">Aucune clôture pour cette date.</p>}
        </div>
        <GapList />
      </div>
    </div>
  )
}

function GapList() {
  const [gaps, setGaps] = useState([])
  useEffect(() => { api('/closings/gaps').then(setGaps).catch(() => {}) }, [])
  return (
    <div className={card}>
      <h3 className="font-semibold mb-3">Écarts de caisse (tous)</h3>
      <table className="w-full text-sm">
        <thead><tr><th>Date</th><th>Comptable</th><th>Écart</th><th>Note</th></tr></thead>
        <tbody>
          {gaps.map(g => (
            <tr key={g.id}>
              <td data-label="Date" className="text-slate-600">{fmtDate(g.date)}</td>
              <td data-label="Comptable" className="text-slate-600">{g.user?.name}</td>
              <td data-label="Écart" className={g.difference < 0 ? 'text-rose-600 font-semibold' : g.difference > 0 ? 'text-emerald-700 font-semibold' : ''}>{g.difference > 0 ? '+' : ''}{g.difference}</td>
              <td data-label="Note" className="text-slate-500 text-xs">{g.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!gaps.length && <p className="text-sm text-slate-400 mt-2">Aucun écart enregistré. 💪</p>}
    </div>
  )
}
