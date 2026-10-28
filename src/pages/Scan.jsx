import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { PageHeader, card, btn, input, label, ErrorBox } from '../lib/ui'

export default function Scan({ me }) {
  const [manual, setManual] = useState('')
  const [result, setResult] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [attendances, setAttendances] = useState([])
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const loadAttendances = () => {
    api('/attendances?per_page=20').then(d => setAttendances(d.data || [])).catch(() => {})
  }
  useEffect(() => { loadAttendances() }, [])

  const doScan = async (badgeId, payload = null) => {
    setBusy(true); setErr(null); setResult(null)
    try {
      const res = await api('/badges/scan', { method: 'POST', body: { badge_id: badgeId, payload } })
      setResult(res)
      loadAttendances()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (e) { setErr('Impossible d\'accéder à la caméra') }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  useEffect(() => { return () => stopCamera() }, [])

  return (
    <div>
      <PageHeader title="Scanner les badges" />
      {err && <ErrorBox error={err} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <h3 className="font-semibold mb-3">Scan QR</h3>
          <div className="mb-3 flex gap-2">
            <button className={btn} onClick={startCamera}>Démarrer caméra</button>
            <button className="border border-slate-300 px-4 py-2 rounded-xl" onClick={stopCamera}>Arrêter</button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black mb-3" />
          <div className="text-xs text-slate-500 mb-3">Scannez le QR code du badge client</div>
          <div className="border-t pt-3">
            <label className={label}>Scan manuel (Badge ID)</label>
            <div className="flex gap-2">
              <input className={input} value={manual} onChange={e => setManual(e.target.value)} placeholder="BADGE-..." />
              <button className={btn} disabled={busy || !manual} onClick={() => doScan(manual)}>Valider</button>
            </div>
          </div>
        </div>

        <div className={card}>
          <h3 className="font-semibold mb-3">Résultat du scan</h3>
          {result ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="text-lg font-bold text-emerald-800">✓ {result.message}</div>
              <div><strong>Client:</strong> {result.client.name} ({result.client.code})</div>
              <div><strong>Abonnement:</strong> {result.subscription.plan} - {result.subscription.code}</div>
              <div><strong>Fin d'abonnement:</strong> {result.subscription.end_date}</div>
              <div className="text-xl font-bold mt-2">Séances effectuées: {result.sessions_used}</div>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">En attente de scan...</div>
          )}
        </div>
      </div>

      <div className={card + ' mt-4'}>
        <h3 className="font-semibold mb-3">Derniers passages</h3>
        <div className="space-y-2">
          {attendances.map(a => (
            <div key={a.id} className="flex justify-between p-3 border border-slate-200 rounded-xl">
              <div>
                <div className="font-medium">{a.client?.first_name} {a.client?.last_name}</div>
                <div className="text-xs text-slate-500">{a.client?.code} · {a.subscription?.plan?.name}</div>
              </div>
              <div className="text-right text-sm text-slate-600">
                <div>{new Date(a.scanned_at).toLocaleString('fr-FR')}</div>
                <div className="text-xs">Par {a.scanner?.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
