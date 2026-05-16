import { useState, useEffect } from 'react'
import { X, Clock, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react'
import { registrarSalida, registrarPago, buscarPorPlaca } from '../api/endpoints'
import toast from 'react-hot-toast'

const METODOS = [
  { key: 'efectivo', label: 'Efectivo',  Icon: Banknote  },
  { key: 'tarjeta',  label: 'Tarjeta',   Icon: CreditCard },
  { key: 'app',      label: 'App',        Icon: Smartphone },
]

const fmt = v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

export default function ModalSalida({ espacio, onClose, onSuccess }) {
  const [paso, setPaso]       = useState('buscando')   // buscando | cobro | listo
  const [resumen, setResumen] = useState(null)
  const [metodo, setMetodo]   = useState('efectivo')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        // Buscar el vehículo activo por placa del espacio
        console.log('espacio recibido en modal salida',espacio)
        const encontrado = await buscarPorPlaca(espacio.vehiculo_placa)
        const res = await registrarSalida(encontrado.datos.id)
        setResumen(res.resumen)
        setPaso('cobro')
      }catch (error) {
          await conn.rollback();
          // Si falló después de registrar hora_salida, revertirla manualmente
          try {
            await db.query("UPDATE vehiculos SET hora_salida = NULL WHERE id = ? AND hora_salida IS NOT NULL", [id]);
            await db.query(`UPDATE espacios SET estado = 'ocupado' 
              WHERE id = (SELECT espacio_id FROM vehiculos WHERE id = ?)`, [id]);
          } catch (_) {}
          console.error('Error en salida:', error);
          return res.status(500).json({ ok: false, mensaje: 'Error al registrar salida' });
        }
    }
    init()
  }, [])

  const handlePago = async () => {
    setLoading(true)
    try {
      await registrarPago({
        vehiculo_id: resumen.vehiculo_id,
        tarifa_id:   resumen.tarifa_id,
        total:       resumen.total_a_cobrar,
        metodo_pago: metodo,
      })
      setPaso('listo')
      setTimeout(() => { toast.success('Pago registrado ✓'); onSuccess() }, 1200)
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al registrar pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="font-bold text-neutral-900">Salida y Cobro</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Espacio <span className="font-mono font-semibold">{espacio.codigo}</span></p>
          </div>
          {paso !== 'listo' && (
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-5">
          {/* Buscando */}
          {paso === 'buscando' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-neutral-500">Calculando tiempo y tarifa...</p>
            </div>
          )}

          {/* Cobro */}
          {paso === 'cobro' && resumen && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
                <Row label="Placa"    value={<span className="font-mono font-bold">{resumen.placa}</span>} />
                <Row label="Tipo"     value={resumen.tipo} />
                <Row label="Ingreso"  value={new Date(resumen.hora_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} />
                <Row label="Salida"   value={new Date(resumen.hora_salida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} />
                <Row label="Tiempo"   value={
                  <span className="flex items-center gap-1"><Clock size={12} />{resumen.minutos} min</span>
                } />
                <Row label="Tarifa/h" value={fmt(resumen.precio_hora)} />
                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <Row label="TOTAL" value={
                    <span className="text-base font-extrabold text-neutral-900">{fmt(resumen.total_a_cobrar)}</span>
                  } bold />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <p className="text-sm font-semibold text-neutral-600 mb-2">Método de pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {METODOS.map(({ key, label, Icon }) => (
                    <button key={key} type="button"
                      onClick={() => setMetodo(key)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition
                        ${metodo === key
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                        }`}>
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition">
                  Cancelar
                </button>
                <button onClick={handlePago} disabled={loading}
                  className="flex-1 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Procesando...' : 'Cobrar'}
                </button>
              </div>
            </div>
          )}

          {/* Listo */}
          {paso === 'listo' && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <CheckCircle size={48} className="text-success" />
              <p className="font-bold text-neutral-900">¡Pago registrado!</p>
              <p className="text-sm text-neutral-500">El espacio quedó disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-neutral-500 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`text-neutral-800 ${bold ? 'font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  )
}
