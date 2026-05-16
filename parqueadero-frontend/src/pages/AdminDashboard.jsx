import { useState, useEffect } from 'react'
import { getEspacios, getResumenHoy } from '../api/endpoints'
import Layout from '../components/Layout'
import { Car, Users, DollarSign, TrendingUp, ParkingSquare } from 'lucide-react'

const fmt = v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0)

export default function AdminDashboard() {
  const [espacios, setEspacios] = useState([])
  const [resumen,  setResumen]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getEspacios(), getResumenHoy()])
      .then(([e, r]) => { setEspacios(e.datos); setResumen(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total    = espacios.length
  const ocupados = espacios.filter(e => e.estado === 'ocupado').length
  const libres   = espacios.filter(e => e.estado === 'disponible').length
  const pct      = total ? Math.round((ocupados / total) * 100) : 0

  return (
    <Layout>
      <h1 className="text-xl font-extrabold text-neutral-900 mb-1">Dashboard</h1>
      <p className="text-sm text-neutral-400 mb-5">Resumen del día — {new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <KPI icon={ParkingSquare} label="Ocupación" value={`${pct}%`} sub={`${ocupados}/${total} espacios`}
              color={pct >= 100 ? 'danger' : pct >= 90 ? 'warning' : 'success'} />
            <KPI icon={Car}          label="Libres"     value={libres}    sub="espacios disponibles" color="success" />
            <KPI icon={DollarSign}   label="Recaudado hoy" value={fmt(resumen?.resumen?.total_recaudado)} sub={`${resumen?.resumen?.total_cobros || 0} cobros`} color="primary" />
            <KPI icon={TrendingUp}   label="Vehículos hoy" value={resumen?.resumen?.total_vehiculos || 0} sub="ingresaron hoy" color="neutral" />
          </div>

          {/* Barra ocupación */}
          <div className="bg-white rounded-xl shadow-card p-5 mb-5">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-neutral-700">Ocupación del parqueadero</span>
              <span className={`font-bold font-mono ${pct >= 100 ? 'text-danger' : pct >= 90 ? 'text-warning' : 'text-success'}`}>{pct}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-700 ${pct>=100?'bg-danger':pct>=90?'bg-warning':'bg-success'}`}
                style={{ width: `${pct}%` }} />
            </div>
            <div className="flex gap-4 mt-3 text-xs text-neutral-500">
              <span>🟢 Disponibles: <strong>{libres}</strong></span>
              <span>🔴 Ocupados: <strong>{ocupados}</strong></span>
              {espacios.filter(e=>e.estado==='mantenimiento').length > 0 &&
                <span>🔧 Mantenimiento: <strong>{espacios.filter(e=>e.estado==='mantenimiento').length}</strong></span>}
            </div>
          </div>

          {/* Ingresos por método */}
          {resumen?.detalle?.length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-5">
              <h2 className="font-bold text-neutral-800 mb-4">Cobros del día por operario</h2>
              <div className="space-y-2">
                {resumen.detalle.map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{row.operario}</p>
                      <p className="text-xs text-neutral-400">{row.metodo_pago} · {row.cantidad} cobros</p>
                    </div>
                    <span className="font-bold text-neutral-900">{fmt(row.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}

function KPI({ icon: Icon, label, value, sub, color }) {
  const colors = {
    success: 'text-success bg-success-light',
    danger:  'text-danger  bg-danger-light',
    warning: 'text-warning bg-warning-light',
    primary: 'text-primary bg-primary-light',
    neutral: 'text-neutral-600 bg-neutral-100',
  }
  return (
    <div className="bg-white rounded-xl shadow-card p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-extrabold text-neutral-900">{value}</p>
      <p className="text-xs font-semibold text-neutral-500 mt-0.5">{label}</p>
      <p className="text-[11px] text-neutral-400">{sub}</p>
    </div>
  )
}
