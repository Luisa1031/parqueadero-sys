import { useState, useEffect } from 'react'
import { getVehiculosActivos, buscarPorPlaca } from '../api/endpoints'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { Search, Clock, Car, Bike } from 'lucide-react'

export default function VehiculosActivos() {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [busqueda, setBusqueda]   = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await getVehiculosActivos()
        setVehiculos(res.datos)
      } catch { toast.error('Error al cargar vehículos') }
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  const handleBuscar = async () => {
    if (!busqueda.trim()) return
    try {
      const res = await buscarPorPlaca(busqueda.trim())
      setVehiculos([res.datos])
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'No encontrado')
    }
  }

  const filtrados = busqueda.trim() ? vehiculos : vehiculos

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold text-neutral-900">Vehículos Activos</h1>
        <span className="text-sm font-semibold text-neutral-500">{vehiculos.length} dentro</span>
      </div>

      {/* Buscador */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text" placeholder="Buscar por placa (ABC123)"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleBuscar()}
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>
        <button onClick={handleBuscar}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition">
          Buscar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Car size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay vehículos activos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(v => (
            <div key={v.id} className="bg-white rounded-xl shadow-card p-4 flex items-center gap-4 fade-in">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${v.tipo === 'carro' ? 'bg-warning-light text-warning' : 'bg-primary-light text-primary'}`}>
                {v.tipo === 'carro' ? <Car size={20} /> : <Bike size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-900 text-lg">{v.placa}</span>
                  <span className={v.tipo === 'carro' ? 'badge-carro' : 'badge-moto'}>
                    {v.tipo}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Espacio <strong>{v.espacio}</strong> · Operario: {v.operario}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-neutral-600 justify-end">
                  <Clock size={13} />
                  <span className="text-sm font-semibold">{v.minutos_transcurridos} min</span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(v.hora_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
