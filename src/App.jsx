import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { getMe, logout as logoutRequest } from './lib/api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Prospects from './pages/Prospects'
import Plans from './pages/Plans'
import Subscriptions from './pages/Subscriptions'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import CloseBox from './pages/Closings'
import Reports from './pages/Reports'
import AlertsList from './pages/AlertsList'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import Whatsapp from './pages/Whatsapp'
import Badges from './pages/Badges'
import Scan from './pages/Scan'

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: 'dashboard', roles: ['direction', 'reception', 'comptabilite'] },
  { to: '/clients', label: 'Clients', icon: 'clients', roles: ['direction', 'reception', 'comptabilite', 'coach'] },
  { to: '/prospects', label: 'Prospects', icon: 'prospects', roles: ['direction', 'reception'] },
  { to: '/badges', label: 'Badges', icon: 'badges', roles: ['direction', 'reception'] },
  { to: '/scan', label: 'Scanner', icon: 'scan', roles: ['direction', 'reception', 'coach'] },
  { to: '/subscriptions', label: 'Abonnements', icon: 'subscriptions', roles: ['direction', 'reception', 'comptabilite', 'coach'] },
  { to: '/payments', label: 'Caisse', icon: 'payments', roles: ['direction', 'reception', 'comptabilite'] },
  { to: '/expenses', label: 'Dépenses', icon: 'expenses', roles: ['direction', 'comptabilite'] },
  { to: '/closings', label: 'Clôture de caisse', icon: 'closings', roles: ['direction', 'reception', 'comptabilite'] },
  { to: '/alerts', label: 'Alertes', icon: 'alerts', roles: ['direction', 'reception', 'comptabilite', 'coach'] },
  { to: '/reports', label: 'Rapports', icon: 'reports', roles: ['direction', 'comptabilite'] },
  { to: '/plans', label: 'Formules', icon: 'plans', roles: ['direction', 'reception', 'comptabilite', 'coach'] },
  { to: '/whatsapp', label: 'WhatsApp', icon: 'whatsapp', roles: ['direction'] },
  { to: '/users', label: 'Utilisateurs', icon: 'users', roles: ['direction'] },
  { to: '/settings', label: 'Paramètres', icon: 'settings', roles: ['direction'] },
  { to: '/logs', label: 'Journal d\u2019audit', icon: 'logs', roles: ['direction', 'comptabilite'] },
]

const ROLE_LABELS = { direction: 'Direction', reception: 'Réception', comptabilite: 'Comptabilité', coach: 'Coach' }

function Icon({ name, className = 'w-5 h-5' }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
    clients: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    prospects: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </>
    ),
    badges: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6M12 17v6M1 12h6M17 12h6" />
      </>
    ),
    scan: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z" />
      </>
    ),
    subscriptions: (
      <>
        <polyline points="17 21 17 13" />
        <polyline points="7 13 7 21" />
        <path d="M7 3v18" />
        <path d="M15 3v18" />
      </>
    ),
    payments: (
      <>
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="7" x2="12" y2="13" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
    expenses: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    closings: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </>
    ),
    alerts: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    reports: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
    plans: (
      <>
        <rect x="12" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2" />
        <path d="M8 6H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 0 1.66 1.95 2 2 0 0 0 1.98-1.57l.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 0-1.68 1.95 2 2 0 0 0-1.98 1.57l-.06.06a1.65 1.65 0 0 0 .33 1.82z" />
        <line x1="1" y1="12" x2="23" y2="12" />
      </>
    ),
    logs: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function Layout({ me, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const items = NAV.filter(i => i.roles.includes(me?.role))

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  const logout = async () => {
    await logoutRequest()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#f9f9f7]">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 shrink-0 bg-gradient-to-b from-black via-black to-neutral-950 text-slate-300 flex flex-col transition-transform duration-300 ease-out ${drawer ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl`}>
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-black flex items-center justify-center font-black text-xl shadow-[0_0_40px_-8px_rgba(250,204,21,0.8)]">S</div>
          <div>
            <div className="font-bold text-white tracking-[0.25em] text-lg">SABAK</div>
            <div className="text-[10px] text-slate-400 tracking-[0.35em] uppercase">Fitness</div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-5 space-y-1 text-sm overflow-y-auto">
          {items.map(i => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'}
              onClick={() => setDrawer(false)}
              className={({ isActive }) => `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-[0_0_32px_-8px_rgba(250,204,21,0.7)]' : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-0.5'}`}>
              <Icon name={i.icon} className="w-5 h-5 shrink-0" />
              <span className="truncate">{i.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-white/10">
          <div className="text-white text-sm font-medium truncate">{me?.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{ROLE_LABELS[me?.role]}</div>
          <button onClick={logout} className="mt-4 w-full text-left text-sm text-slate-400 hover:text-yellow-400 transition-colors px-3.5 py-2 rounded-xl hover:bg-white/5">Se déconnecter</button>
        </div>
      </aside>
      {drawer && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setDrawer(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-black to-neutral-950 text-white px-4 py-3 flex items-center gap-3 shadow-xl">
          <button onClick={() => setDrawer(true)} aria-label="Menu" className="w-10 h-10 flex items-center justify-center rounded-xl text-yellow-400 hover:bg-white/10 transition">☰</button>
          <div className="font-bold text-yellow-400 tracking-[0.25em]">SABAK</div>
        </header>
        <main key={location.pathname} className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 animate-page-in max-w-[1600px] mx-auto w-full">{children}</main>
      </div>
      {!online && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-red-600 text-white text-xs font-medium px-4 py-2 shadow-lg">
          Hors ligne — les données affichées peuvent être incomplètes.
        </div>
      )}
    </div>
  )
}

function RequireAuth({ me, children }) {
  if (!me) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [me, setMe] = useState(getMe())
  useEffect(() => { setMe(getMe()) }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={setMe} />} />
      <Route path="/*" element={
        <RequireAuth me={me}>
          <Layout me={me}>
            <Routes>
              <Route path="/" element={me?.role === 'coach' ? <Navigate to="/clients" replace /> : <Dashboard me={me} />} />
              <Route path="/clients" element={<Clients me={me} />} />
              <Route path="/clients/:id" element={<ClientDetail me={me} />} />
              <Route path="/prospects" element={<Prospects me={me} />} />
              <Route path="/badges" element={<Badges me={me} />} />
              <Route path="/scan" element={<Scan me={me} />} />
              <Route path="/plans" element={<Plans me={me} />} />
              <Route path="/subscriptions" element={<Subscriptions me={me} />} />
              <Route path="/payments" element={<Payments me={me} />} />
              <Route path="/expenses" element={<Expenses me={me} />} />
              <Route path="/closings" element={<CloseBox me={me} />} />
              <Route path="/alerts" element={<AlertsList me={me} />} />
              <Route path="/reports" element={<Reports me={me} />} />
              <Route path="/users" element={<Users me={me} />} />
              <Route path="/settings" element={<Settings me={me} />} />
              <Route path="/logs" element={<Logs me={me} />} />
              <Route path="/whatsapp" element={<Whatsapp me={me} />} />
              <Route path="*" element={<div>Page inconnue.</div>} />
            </Routes>
          </Layout>
        </RequireAuth>
      } />
    </Routes>
  )
}
