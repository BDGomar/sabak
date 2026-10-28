import { useEffect, useState } from 'react'
import { api, fmtDate } from '../lib/api'
import { PageHeader, Pagination, Badge, Modal, ErrorBox, fieldErrors, btn, btnGhost, input, card, label } from '../lib/ui'

export default function Whatsapp({ me }) {
  const [tab, setTab] = useState('templates')
  const [rows, setRows] = useState(null)
  const [msgs, setMsgs] = useState(null)
  const [page, setPage] = useState(1)
  const [page2, setPage2] = useState(1)
  const [err, setErr] = useState(null)
  const [edit, setEdit] = useState(null)
  const [failed, setFailed] = useState(null)
  const [testOpen, setTestOpen] = useState(false)
  const [testForm, setTestForm] = useState({ to: '', body: '' })
  const [testRes, setTestRes] = useState(null)

  const isDir = me.role === 'direction'

  const load = () => {
    api('/whatsapp/templates').then(setRows).catch(e => setErr(e.message))
    api(`/whatsapp/messages?page=${page2}`).then(setMsgs).catch(e => setErr(e.message))
  }
  useEffect(() => { load() }, [page2])

  const save = async e => {
    e.preventDefault(); setFailed(null)
    try {
      if (edit.id) await api(`/whatsapp/templates/${edit.id}`, { method: 'PUT', body: edit })
      else await api('/whatsapp/templates', { method: 'POST', body: edit })
      setEdit(null); load()
    } catch (ex) { setFailed(`${ex.message} ${fieldErrors(ex.errors) || ''}`) }
  }

  const sendTest = async e => {
    e.preventDefault(); setTestRes(null)
    try { setTestRes(await api('/whatsapp/test', { method: 'POST', body: testForm })) }
    catch {
      // le backend répond 501 tant que WA_TOKEN/WA_PHONE_ID ne sont pas configurés
      setTestRes({ code: 501, message: 'Envoi impossible : Meta Cloud API non configurée. Définir WA_TOKEN et WA_PHONE_ID côté serveur (Phase 2).' })
    } finally {
    }
  }

  return (
    <div>
      <PageHeader title="WhatsApp (phase 2)">
        <button className={btnGhost} onClick={() => setTestOpen(true)}>Message de test</button>
      </PageHeader>
      {err && <ErrorBox error={err} />}
      <p className="text-sm text-slate-500 mb-4">
        Envoi via l'API officielle Meta (pas de WhatsApp non officiel). Les modèles doivent être approuvés par Meta avant l'envoi au public.
        En attendant, les modèles et le journal sont prêts côté serveur.
      </p>
      <div className="flex gap-1 mb-4 text-sm">
        {['templates', 'messages'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-yellow-400 text-black font-semibold' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
            {t === 'templates' ? 'Modèles' : 'Journal des envois'}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className={card}>
          {isDir && <div className="mb-3 text-right"><button className={btn} onClick={() => { setEdit({ code: '', name: '', body: '', active: false }); setFailed(null) }}>+ Modèle</button></div>}
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 text-xs uppercase"><tr><th className="py-2">Code</th><th>Nom</th><th>Corps du message</th><th>Meta</th><th>Actif</th><th></th></tr></thead>
            <tbody>
              {(rows || []).map(t => (
                <tr key={t.id} className="border-t border-slate-100 align-top">
                  <td className="py-2 font-mono text-xs">{t.code}</td>
                  <td className="font-medium">{t.name}</td>
                  <td className="text-slate-600 text-xs max-w-md">{t.body}</td>
                  <td><Badge value={t.meta_status} /></td>
                  <td>{t.active ? <span className="text-emerald-700">✓</span> : <span className="text-slate-400">inactive</span>}</td>
                  {isDir && <td className="text-right"><button className={btnGhost} onClick={() => { setEdit({ ...t }); setFailed(null) }}>modifier</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'messages' && (
        <div className={card}>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 text-xs uppercase"><tr><th className="py-2">Destinataire</th><th>Modèle</th><th>Message</th><th>Statut</th><th>Erreur</th><th>Envoyé</th></tr></thead>
            <tbody>
              {(msgs?.data || []).map(m => (
                <tr key={m.id} className="border-t border-slate-100 align-top">
                  <td className="py-2">{m.to_number}</td>
                  <td className="text-xs">{m.template ? m.template.name : '—'}</td>
                  <td className="text-xs text-slate-600 max-w-sm">{m.body}</td>
                  <td><Badge value={m.status} /></td>
                  <td className="text-xs text-rose-600">{m.error || ''}</td>
                  <td className="text-xs text-slate-500">{m.sent_at ? fmtDate(m.sent_at) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {msgs && !msgs.data.length && <p className="text-sm text-slate-400 mt-3">Aucun message envoyé jusqu'ici.</p>}
          <Pagination meta={msgs} onPage={setPage2} />
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Modifier « ${edit.name} »` : 'Nouveau modèle'} wide>
        {edit && (
          <form onSubmit={save} className="space-y-3">
            {failed && <ErrorBox error={failed} />}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Code technique (sans espaces) *</label>
                <input required disabled={!!edit.id} pattern="[a-z0-9_]+" className={input} value={edit.code || ''}
                  onChange={e => setEdit({ ...edit, code: e.target.value })} /></div>
              <div><label className={label}>Nom affiché *</label><input required className={input} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
            </div>
            <div><label className={label}>Corps du message *</label>
              <textarea required rows={5} className={input} value={edit.body}
                onChange={e => setEdit({ ...edit, body: e.target.value })} />
              <p className="text-[11px] text-slate-400 mt-1">
                Variables : {'[Prénom]'}, {'[Nom]'}, {'[Montant]'}, {'[Formule]'}, {'[Date]'}, {'[Référence]'}, {'[Solde]'} — ex. « Bonjour [Prénom], votre abonnement expire le [Date]. »
              </p>
            </div>
            {!!edit.id && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Statut Meta</label>
                  <select className={input} value={edit.meta_status} onChange={e => setEdit({ ...edit, meta_status: e.target.value })}>
                    {['draft', 'soumis', 'approuve', 'refuse'].map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <label className="flex items-end gap-2 text-sm pb-2">
                  <input type="checkbox" checked={!!edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} /> Actif pour l'envoi
                </label>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setEdit(null)}>Annuler</button>
              <button className={btn}>Enregistrer</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={testOpen} onClose={() => setTestOpen(false)} title="Message de test">
        <form onSubmit={sendTest} className="space-y-3">
          <div><label className={label}>Numéro WhatsApp *</label><input required type="tel" className={input} placeholder="+22670XXXXXX" value={testForm.to} onChange={e => setTestForm({ ...testForm, to: e.target.value })} /></div>
          <div><label className={label}>Message *</label><textarea required rows={3} className={input} value={testForm.body} onChange={e => setTestForm({ ...testForm, body: e.target.value })} /></div>
          <div className="flex justify-end"><button className={btn}>Envoyer</button></div>
        </form>
        {testRes && <pre className="mt-3 p-3 bg-slate-50 rounded-md text-xs overflow-x-auto">{JSON.stringify(testRes, null, 2)}</pre>}
      </Modal>
    </div>
  )
}
