import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QrScanner from 'qr-scanner'
import { api, fmtDateTime } from '../lib/api'
import { PageHeader, card, btn, btnGhost, input, label, ErrorBox } from '../lib/ui'

/** Un badge « présent » en continu devant la caméra n'est compté qu'une fois. */
const PRESENCE_MS = 3000
/** Anti double-clic sur la saisie manuelle. */
const MANUAL_COOLDOWN_MS = 1500

/**
 * Le QR d'un badge contient un JSON {"bid":"BADGE-…","cid":1,"s":0}.
 * On accepte aussi un identifiant brut, une URL ?bid=… ou le texte collé.
 */
function extractBadgeId(raw) {
  const text = String(raw ?? '').trim()
  if (!text) return null

  try {
    const o = JSON.parse(text)
    const id = o?.bid || o?.badge_id || o?.badgeId
    if (typeof id === 'string' && id.trim()) return id.trim()
  } catch { /* pas du JSON */ }

  const match = text.match(/BADGE-[A-Z0-9]+/i)
  if (match) return match[0].toUpperCase()

  try {
    const url = new URL(text)
    const id = url.searchParams.get('bid') || url.searchParams.get('badge_id')
    if (id) return id
  } catch { /* pas une URL */ }

  return /^[A-Z0-9-]{4,40}$/i.test(text) ? text.toUpperCase() : null
}

export default function Scan() {
  const [manual, setManual] = useState('')
  const [result, setResult] = useState(null)
  const [err, setErr] = useState(null)
  const [camErr, setCamErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [attendances, setAttendances] = useState([])
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const startingRef = useRef(false)
  const presenceRef = useRef({ id: null, at: 0 })
  const manualRef = useRef({ id: null, at: 0 })

  const loadAttendances = useCallback(() => {
    api('/attendances?per_page=20').then(d => setAttendances(d.data || [])).catch(() => {})
  }, [])

  useEffect(() => { loadAttendances() }, [loadAttendances])

  const doScan = useCallback(async (rawId, { fromCamera = false } = {}) => {
    const badgeId = extractBadgeId(rawId)
    if (!badgeId) {
      setErr("QR code non reconnu : ce n'est pas un badge SABAK FITNESS.")
      return
    }

    const now = Date.now()

    if (fromCamera) {
      // Le badge reste devant la caméra : on ignore les détections répétées.
      if (presenceRef.current.id === badgeId && now - presenceRef.current.at < PRESENCE_MS) {
        presenceRef.current.at = now
        return
      }
      presenceRef.current = { id: badgeId, at: now }
    } else {
      if (manualRef.current.id === badgeId && now - manualRef.current.at < MANUAL_COOLDOWN_MS) return
      manualRef.current = { id: badgeId, at: now }
      presenceRef.current = { id: badgeId, at: now }
    }

    setBusy(true); setErr(null)
    try {
      const res = await api('/badges/scan', { method: 'POST', body: { badge_id: badgeId } })
      setResult(res)
      navigator.vibrate?.(60)
      loadAttendances()
    } catch (e) {
      setResult(null)
      setErr(e.message)
      navigator.vibrate?.([40, 60, 40])
    } finally {
      setBusy(false)
    }
  }, [loadAttendances])

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    if (scannerRef.current || startingRef.current) return
    startingRef.current = true
    setCamErr(null)

    if (!window.isSecureContext) {
      setCamErr("La caméra nécessite HTTPS. Utilisez la saisie manuelle ou ouvrez l'application en HTTPS.")
      startingRef.current = false
      return
    }

    const hasCamera = await QrScanner.hasCamera().catch(() => false)
    if (!hasCamera) {
      setCamErr('Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle.')
      startingRef.current = false
      return
    }

    let scanner = null
    try {
      scanner = new QrScanner(
        videoRef.current,
        res => doScan(res?.data ?? res, { fromCamera: true }),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        },
      )
      await scanner.start()
      scannerRef.current = scanner
      setScanning(true)
    } catch (e) {
      try { scanner?.destroy() } catch { /* ignore */ }
      setCamErr(
        /permission|denied|notallowed/i.test(e?.message || '')
          ? 'Accès caméra refusé. Autorisez la caméra dans le navigateur, ou utilisez la saisie manuelle.'
          : "Impossible d'ouvrir la caméra. Vérifiez qu'aucune autre application ne l'utilise.",
      )
    } finally {
      startingRef.current = false
    }
  }, [doScan])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const submitManual = e => {
    e.preventDefault()
    if (!manual.trim()) return
    doScan(manual)
    setManual('')
  }

  return (
    <div>
      <PageHeader title="Scanner les badges" />
      {err && <ErrorBox error={err} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Scan QR</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${scanning ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {scanning ? 'Caméra active' : 'Caméra inactive'}
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black mb-3 aspect-[4/3]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm gap-2 p-4 text-center">
                <span className="text-3xl">▣</span>
                <span>Présentez le QR code du badge devant la caméra</span>
              </div>
            )}
          </div>

          {camErr && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">{camErr}</p>}

          <div className="mb-3 flex gap-2">
            <button className={btn} onClick={startCamera} disabled={scanning}>Démarrer caméra</button>
            <button className={btnGhost} onClick={stopCamera} disabled={!scanning}>Arrêter</button>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <label className={label}>Saisie manuelle (Badge ID ou contenu du QR)</label>
            <form className="flex gap-2" onSubmit={submitManual}>
              <input className={input} value={manual} onChange={e => setManual(e.target.value)}
                placeholder="BADGE-XXXXXXXXXXXX" autoComplete="off" />
              <button className={btn} disabled={busy || !manual.trim()}>Valider</button>
            </form>
          </div>
        </div>

        <div className={card}>
          <h3 className="font-semibold mb-3">Résultat du scan</h3>

          {result ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1.5">
              <div className="text-lg font-bold text-emerald-800">✓ {result.message}</div>
              <div>
                <strong>Client :</strong>{' '}
                <Link to={`/clients/${result.client.id}`} className="text-emerald-800 font-medium underline hover:text-emerald-900">
                  {result.client.name}
                </Link>{' '}
                <span className="text-slate-500">({result.client.code})</span>
              </div>
              <div><strong>Abonnement :</strong> {result.subscription.plan} — {result.subscription.code}</div>
              <div><strong>Fin d'abonnement :</strong> {result.subscription.end_date}</div>
              <div className="text-2xl font-bold text-emerald-900 pt-2">Séances effectuées : {result.sessions_used}</div>
              <button className={btnGhost + ' mt-3'} onClick={() => setResult(null)}>Scanner un autre badge</button>
            </div>
          ) : err ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="text-lg font-bold text-rose-800">✕ Scan refusé</div>
              <p className="text-sm text-rose-700 mt-1">{err}</p>
              <button className={btnGhost + ' mt-3'} onClick={() => setErr(null)}>Réessayer</button>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-12">En attente de scan…</div>
          )}
        </div>
      </div>

      <div className={card + ' mt-4'}>
        <h3 className="font-semibold mb-3">Derniers passages</h3>
        {attendances.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun passage enregistré.</p>
        ) : (
          <div className="space-y-2">
            {attendances.map(a => (
              <div key={a.id} className="flex justify-between gap-3 p-3 border border-slate-200 rounded-xl">
                <div className="min-w-0">
                  <Link to={`/clients/${a.client?.id}`} className="font-medium hover:text-yellow-700 hover:underline">
                    {a.client?.first_name} {a.client?.last_name}
                  </Link>
                  <div className="text-xs text-slate-500">{a.client?.code} · {a.subscription?.plan?.name || '—'}</div>
                </div>
                <div className="text-right text-sm text-slate-600 shrink-0">
                  <div>{fmtDateTime(a.scanned_at)}</div>
                  <div className="text-xs">Par {a.scanner?.name || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
