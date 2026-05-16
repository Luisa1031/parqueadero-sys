import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Car, LayoutGrid, Users, DollarSign,
  FileText, LogOut, ShieldCheck, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navOperario = [
  { to: '/operario',         icon: LayoutGrid,  label: 'Espacios'  },
  { to: '/operario/activos', icon: Car,          label: 'Activos'   },
]
const navAdmin = [
  { to: '/admin',            icon: LayoutGrid,  label: 'Dashboard' },
  { to: '/admin/usuarios',   icon: Users,        label: 'Usuarios'  },
  { to: '/admin/tarifas',    icon: DollarSign,   label: 'Tarifas'   },
  { to: '/admin/reportes',   icon: FileText,     label: 'Reportes'  },
]

export default function Layout({ children }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const nav = usuario?.rol === 'administrador' ? navAdmin : navOperario

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = ({ mobile }) => (
    <aside className={`
      ${mobile ? 'flex' : 'hidden md:flex'}
      flex-col w-60 bg-white border-r border-neutral-200 min-h-screen
    `}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Car size={16} color="white" />
        </div>
        <span className="font-extrabold text-neutral-900 tracking-tight">ParkSys</span>
      </div>

      {/* Rol badge */}
      <div className="px-5 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
          ${usuario?.rol === 'administrador' ? 'bg-primary-light text-primary' : 'bg-success-light text-success'}`}>
          <ShieldCheck size={11} />
          {usuario?.rol === 'administrador' ? 'Administrador' : 'Operario'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}>
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-neutral-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-semibold text-neutral-800 truncate">{usuario?.nombre}</p>
          <p className="text-xs text-neutral-400 truncate">{usuario?.email}</p>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-light rounded-xl transition font-medium">
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
          <button onClick={() => setOpen(v => !v)} className="text-neutral-600">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-extrabold text-neutral-900">ParkSys</span>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
