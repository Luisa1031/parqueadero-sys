import { useState, useEffect, useCallback } from 'react'
import { getEspacios } from '../api/endpoints'
import Layout from '../components/Layout'
import EspacioCard from '../components/EspacioCard'
import ModalIngreso from '../components/ModalIngreso'
import ModalSalida from '../components/ModalSalida'
import toast from 'react-hot-toast'
import { RefreshCw, Car, Bike, ParkingSquare } from 'lucide-react'

export default function OperarioDashboard() {
  const [espacios, setEspacios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [seleccionado, setSelec]  = useState(null)
  const [modalIngreso, setIngreso] = useState(null)
  const [modalSalida,  setSalida]  = useState(null)
  const [filtroTipo, setFiltro]   = useState('todos')

  const cargarEspacios = useCallback(async () => {
    try {
      const res = await getEspacios()
      setEspacios(res.datos)
    } catch {
      toast.error('Error al cargar espacios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarEspacios()
    const interval = setInterval(cargarEspacios, 30000) // auto-refresh 30s
    return () => clearInterval(interval)
  }, [cargarEspacios])

  const handleClick = (esp) => {
    if (esp.estado === 'disponible') {
      setSelec(esp)
      setIngreso(esp)
    } else if (esp.estado === 'ocupado') {
        if (!esp.vehiculo_id) {
          toast.error('No se encontro vehiculo en este espacio')
          return
        }
        setSelec(esp)
        setSalida(esp)
      }
  }

  const onDone = () => {
    setIngreso(null); setSalida(null); setSelec(null)
    cargarEspacios()
  }

  // Estadísticas
  const total     = espacios.length
  const ocupados  = espacios.filter(e => e.estado === 'ocupado').length
  const libres    = espacios.filter(e => e.estado === 'disponible').length
  const pct       = total ? Math.round((ocupados / total) * 100) : 0
  const carros    = espacios.filter(e => e.tipo === 'carro')
  const motos     = espacios.filter(e => e.tipo === 'moto')

  const filtrados = filtroTipo === 'todos' ? espacios
    : espacios.filter(e => e.tipo === filtroTipo)

  return (
    <Layout>
      {/* Título */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900">Mapa de Espacios</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Toca un espacio libre para registrar ingreso · Toca uno ocupado para registrar salida</p>
        </div>
        <button onClick={cargarEspacios}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary transition px-3 py-2 rounded-xl hover:bg-primary-light">
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total" value={total} color="neutral" icon={ParkingSquare} />
        <StatCard label="Libres" value={libres} color="success" icon={ParkingSquare} />
        <StatCard label="Ocupados" value={ocupados} color="danger" icon={Car} />
        <StatCard label="Ocupación"
          value={
            <span className={pct >= 100 ? 'text-danger' : pct >= 90 ? 'text-warning' : 'text-success'}>
              {pct}%
            </span>
          }
          color={pct >= 100 ? 'danger' : pct >= 90 ? 'warning' : 'success'}
          icon={RefreshCw}
        />
      </div>

      {/* Barra de ocupación */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-neutral-600">Ocupación general</span>
          <span className={`text-sm font-bold font-mono ${pct >= 100 ? 'text-danger' : pct >= 90 ? 'text-warning' : 'text-neutral-700'}`}>{pct}%</span>
        </div>
        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-danger' : pct >= 90 ? 'bg-warning' : 'bg-success'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct >= 90 && (
          <p className={`text-xs mt-2 font-semibold ${pct >= 100 ? 'text-danger' : 'text-warning'}`}>
            {pct >= 100 ? '🚨 Parqueadero LLENO' : '⚠️ Parqueadero al 90% de ocupación'}
          </p>
        )}
      </div>

      {/* Filtro tipo */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'carro', label: 'Carros', icon: Car },
          { key: 'moto',  label: 'Motos',  icon: Bike },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setFiltro(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition
              ${filtroTipo === key ? 'bg-primary text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary/40'}`}>
            {Icon && <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Carros */}
          {(filtroTipo === 'todos' || filtroTipo === 'carro') && (
            <Section title="Carros" badge={`${carros.filter(e=>e.estado==='disponible').length} libres`} color="warning">
              <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
                {carros.map(e => (
                  <EspacioCard key={e.id} espacio={e}
                    onClick={handleClick}
                    seleccionado={seleccionado?.id === e.id} />
                ))}
              </div>
            </Section>
          )}

          {/* Motos */}
          {(filtroTipo === 'todos' || filtroTipo === 'moto') && (
            <Section title="Motos" badge={`${motos.filter(e=>e.estado==='disponible').length} libres`} color="primary">
              <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
                {motos.map(e => (
                  <EspacioCard key={`${e.id}-${e.codigo}`} espacio={e}
                    onClick={handleClick}
                    seleccionado={seleccionado?.id === e.id} />
                ))}
              </div>
            </Section>
          )}

          {/* Leyenda */}
          <div className="flex items-center gap-4 text-xs text-neutral-500 pt-1">
            <LegItem color="bg-success" label="Disponible" />
            <LegItem color="bg-danger"  label="Ocupado"    />
            <LegItem color="bg-neutral-300" label="Mantenimiento" />
          </div>
        </div>
      )}

      {modalIngreso && (
        <ModalIngreso espacio={modalIngreso} onClose={() => { setIngreso(null); setSelec(null) }} onSuccess={onDone} />
      )}
      {modalSalida && (
        <ModalSalida espacio={modalSalida} onClose={() => { setSalida(null); setSelec(null) }} onSuccess={onDone} />
      )}
    </Layout>
  )
}

function StatCard({ label, value, color, icon: Icon }) {
  const colors = {
    neutral: 'bg-neutral-50 border-neutral-200 text-neutral-700',
    success: 'bg-success-light border-success/20 text-success',
    danger:  'bg-danger-light  border-danger/20  text-danger',
    warning: 'bg-warning-light border-warning/20 text-warning',
  }
  return (
    <div className={`rounded-xl border p-4 shadow-card ${colors[color]}`}>
      <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  )
}

function Section({ title, badge, color, children }) {
  const badgeColors = {
    warning: 'bg-warning-light text-warning',
    primary: 'bg-primary-light text-primary',
  }
  return (
    <div className="bg-white rounded-xl shadow-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-neutral-800">{title}</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColors[color]}`}>{badge}</span>
      </div>
      {children}
    </div>
  )
}

function LegItem({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-sm ${color}`} />
      {label}
    </span>
  )
}
