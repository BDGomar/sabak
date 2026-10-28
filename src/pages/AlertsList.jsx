import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fmtDate } from '../lib/api'
import { PageHeader, Pagination, Badge, input, card } from '../lib/ui'

export default function AlertsList() {
  const [status, setStatus] = useState('pending')
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [err, setErr] = useState(null)

  useEffect(() => {
    api(`/alerts?status=${status}&page=${page}`).then(d => setData(d)).catch(e => setErr(e.message))
  }, [status, page])

  return (
    <div>
      <PageHeader title="Alertes d'échéance" />
      <p className="text-sm text-slate-500 mb-4">
        Jalons J-7 / J-3 / J-1 / J0 / J+1 générés automatiquement chaque jour (tâche <code>sabak:alerts</code>).
        Un renouvellement annule automatiquement les relances obsolètes.
      </p>
      {err && <p className="text-rose-600">{err}</p>}
      <div className={card}>
        <select className={input + ' mb-3 w-44'} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="pending">En attente</option>
          <option value="sent">Traitées / envoyées</option>
          <option value="annule">Annulées</option>
          <option value="">Toutes</option>
        </select>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 text-xs uppercase">
            <tr><th className="py-2">Client</th><th>Formule</th><th>Fin</th><th>Jalon</th><th>Prévu le</th><th>Statut</th><th>Canal</th></tr>
          </thead>
          <tbody>
            {(data?.data || []).map(a => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="py-2">
                  <Link to={`/clients/${a.client?.id}`} className="hover:underline font-medium">
                    {a.client?.first_name} {a.client?.last_name}
                  </Link>
                  <div className="text-xs text-slate-400">{a.client?.phone}</div>
                </td>
                <td>{a.subscription?.plan?.name || '—'}</td>
                <td>{fmtDate(a.subscription?.end_date)}</td>
                <td><Badge value={a.delay} /></td>
                <td>{fmtDate(a.scheduled_date)}</td>
                <td><Badge value={a.status} /></td>
                <td className="text-slate-500">{a.channel}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && !data.data.length && <p className="text-sm text-slate-400 mt-3">Aucune alerte.</p>}
        <Pagination meta={data} onPage={setPage} />
      </div>
    </div>
  )
}
