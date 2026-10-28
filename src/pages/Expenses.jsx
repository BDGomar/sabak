import { useEffect, useState } from 'react'
import { api, fmtFCFA, fmtDate, today } from '../lib/api'
import { PageHeader, Pagination, Modal, ErrorBox, fieldErrors, btn, btnDanger, btnGhost, input, card, label } from '../lib/ui'

export default function Expenses({ me }) {
  const isDir = me.role === 'direction'
  const [rows, setRows] = useState(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ from: '', to: '', category: '' })
  const [cats, setCats] = useState([])
  const [err, setErr] = useState(null)
  const [failed, setFailed] = useState(null)
  const [open, setOpen] = useState(false)
  const [justification, setJustification] = useState(null)
  const [form, setForm] = useState({ date: today(), amount: '', expense_category_id: '', label: '', method: 'especes', operator_ref: '' })

  const load = () => {
    const q = `page=${page}&from=${filters.from}&to=${filters.to}&category_id=${filters.category}`
    api(`/expenses?${q}`).then(setRows).catch(e => setErr(e.message))
  }
  useEffect(() => {
    Promise.all([
      api('/expenses/categories'),
      api(`/expenses?page=${page}&from=${filters.from}&to=${filters.to}&category_id=${filters.category}`),
    ]).then(([c, r]) => { setCats(c); setRows(r) }).catch(e => setErr(e.message))
  }, [page, filters])

  const submit = async e => {
    e.preventDefault(); setFailed(null)
    try {
      let res
      if (justification) {
        const fd = new FormData()
        Object.entries(form).forEach(([k, v]) => fd.append(k, v))
        fd.append('justification', justification)
        res = await api('/expenses', { method: 'POST', form: fd })
      } else {
        const body = { ...form, amount: Number(form.amount) }
        if (!form.expense_category_id) delete body.expense_category_id
        res = await api('/expenses', { method: 'POST', body })
      }
      setOpen(false); setJustification(null)
      setForm({ date: today(), amount: '', expense_category_id: '', label: '', method: 'especes', operator_ref: '' })
      setPage(1)
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) }
  }

  const arch = async id => {
    if (!confirm('Archiver cette dépense ?')) return
    try { await api(`/expenses/${id}`, { method: 'DELETE' }); load() } catch (ex) { setErr(ex.message) }
  }

  return (
    <div>
      <PageHeader title="Dépenses">
        <button className={btn} onClick={() => { setOpen(true); setFailed(null) }}>+ Dépense</button>
      </PageHeader>
      {err && <ErrorBox error={err} />}
      <div className={card}>
        <div className="flex flex-wrap gap-3 mb-4">
          <input type="date" className={input + ' max-w-[10rem]'} value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" className={input + ' max-w-[10rem]'} value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
          <select className={input + ' max-w-[12rem]'} value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Toutes catégories</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr><th>Date</th><th>Catégorie</th><th>Libellé</th><th>Montant</th><th>Mode</th><th>Saisi par</th>{isDir && <th className="text-right">Actions</th>}</tr>
          </thead>
          <tbody>
            {(rows?.data || []).map(x => (
              <tr key={x.id}>
                <td data-label="Date" className="text-slate-600">{fmtDate(x.date)}</td>
                <td data-label="Catégorie"><span className="text-xs bg-slate-100 rounded-full px-2.5 py-1 font-medium">{x.category?.name}</span></td>
                <td data-label="Libellé">{x.label}{x.justification_path && <span className="text-xs text-emerald-600 ml-1">📎</span>}</td>
                <td data-label="Montant" className="font-semibold text-rose-700">{fmtFCFA(x.amount)}</td>
                <td data-label="Mode" className="text-slate-600">{x.method === 'especes' ? 'Espèces' : 'Mobile Money'}</td>
                <td data-label="Saisi par" className="text-slate-600">{x.user?.name}</td>
                {isDir && <td data-label="Actions" className="text-right"><button className={btnDanger + ' text-xs py-1.5 px-3'} onClick={() => arch(x.id)}>Archiver</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
        {rows && !rows.data.length && <p className="text-sm text-slate-400 mt-3">Aucune dépense.</p>}
        <Pagination meta={rows} onPage={setPage} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle dépense">
        <form onSubmit={submit} className="space-y-3">
          {failed && <ErrorBox error={failed} />}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Date *</label><input required type="date" className={input} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className={label}>Montant (FCFA) *</label><input required type="number" min={1} step={1} className={input} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="col-span-2"><label className={label}>Catégorie *</label>
              <select required className={input} value={form.expense_category_id} onChange={e => setForm({ ...form, expense_category_id: e.target.value })}>
                <option value="">— choisir —</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className={label}>Libellé *</label><input required className={input} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
            <div><label className={label}>Mode *</label>
              <select className={input} value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                <option value="especes">Espèces</option><option value="mobile_money">Mobile Money</option>
              </select>
            </div>
            <div><label className={label}>Réf. opérateur</label><input className={input} value={form.operator_ref} onChange={e => setForm({ ...form, operator_ref: e.target.value })} /></div>
            <div className="col-span-2"><label className={label}>Justificatif (photo/PDF, max 4 Mo)</label>
              <input type="file" accept="image/*,application/pdf" className={input} onChange={e => setJustification(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>Annuler</button>
            <button className={btn}>Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
