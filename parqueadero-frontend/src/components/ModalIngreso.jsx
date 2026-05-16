import { useState } from 'react'
import { X, Car, Bike, Hash } from 'lucide-react'
import { registrarIngreso } from '../api/endpoints'
import toast from 'react-hot-toast'

const PLACA_RE = /^[A-Za-z]{2,3}[0-9]{2,3}[A-Za-z0-9]?$/

export default function ModalIngreso({ espacio, onClose, onSuccess }) {
  const [form, setForm]   = useState({ placa: '', tipo: espacio.tipo })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const placa = form.placa.toUpperCase().replace(/\s/g, '')
    if (!PLACA_RE.test(placa)) {
      toast.error('Placa inválida. Formato colombiano: ABC123 o AB123C')
      return
    }
    if (form.tipo !== espacio.tipo) {
      toast.error(`Este espacio es para ${espacio.tipo}`)
      return
    }
    setLoading(true)
    try {
      const res = await registrarIngreso({ placa, tipo: form.tipo, espacio_id: espacio.id })
      toast.success(`Ingreso registrado — Espacio ${espacio.codigo}`)
      if (res.ocupacion?.alerta) {
        toast(res.ocupacion.alerta.mensaje, {
          icon: res.ocupacion.alerta.tipo === 'alerta_100' ? '🚨' : '⚠️',
          duration: 6000,
          style: { background: res.ocupacion.alerta.tipo === 'alerta_100' ? '#FEE2E2' : '#FEF3C7' }
        })
      }
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al registrar ingreso')
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
            <h2 className="font-bold text-neutral-900">Registrar Ingreso</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Espacio <span className="font-mono font-semibold">{espacio.codigo}</span></p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo vehículo */}
          <div>
            <label className="text-sm font-semibold text-neutral-600 mb-2 block">Tipo de vehículo</label>
            <div className="grid grid-cols-2 gap-2">
              {['carro', 'moto'].map(t => {
                const Icon = t === 'carro' ? Car : Bike
                const active = form.tipo === t
                const disabled = espacio.tipo !== t
                return (
                  <button key={t} type="button"
                    disabled={disabled}
                    onClick={() => setForm(f => ({ ...f, tipo: t }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition
                      ${disabled
                        ? 'opacity-30 cursor-not-allowed border-neutral-200 text-neutral-400'
                        : active
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                      }`}>
                    <Icon size={16} />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Placa */}
          <div>
            <label className="text-sm font-semibold text-neutral-600 mb-1.5 block">Placa</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                required
                maxLength={7}
                autoFocus
                value={form.placa}
                onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
                placeholder="ABC123"
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition tracking-widest"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Formato: ABC123 o AB123C</p>
          </div>

          {/* Hora de ingreso */}
          <div className="bg-neutral-50 rounded-xl px-4 py-3 text-sm">
            <span className="text-neutral-500">Hora de ingreso:</span>
            <span className="font-semibold text-neutral-800 ml-2 font-mono">
              {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
