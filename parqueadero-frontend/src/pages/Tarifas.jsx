import { useState, useEffect } from 'react'
import { getTarifas, crearTarifa, updateTarifa } from '../api/endpoints'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { Plus, X, Car, Bike, Pencil } from 'lucide-react'

const fmt = v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

export default function Tarifas() {
  const [tarifas, setTarifas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // null | 'nueva' | tarifa (edit)
  const [form, setForm]       = useState({ tipo_vehiculo: 'carro', franja_inicio: '06:00', franja_fin: '12:00', precio_hora: '' })
  const [saving, setSaving]   = useState(false)

  const cargar = async () => {
    try { const r = await getTarifas(); setTarifas(r.datos) }
    catch { toast.error('Error al cargar tarifas') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const abrirEditar = (t) => {
    setForm({ tipo_vehiculo: t.tipo_vehiculo, franja_inicio: t.franja_inicio.slice(0,5), franja_fin: t.franja_fin.slice(0,5), precio_hora: t.precio_hora })
    setModal(t)
  }

  const handleGuardar = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'nueva') {
        await crearTarifa(form)
        toast.success('Tarifa creada')
      } else {
        await updateTarifa(modal.id, form)
        toast.success('Tarifa actualizada')
      }
      setModal(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const toggleActivo = async (t) => {
    try {
      await updateTarifa(t.id, { activo: t.activo ? 0 : 1 })
      toast.success(t.activo ? 'Tarifa desactivada' : 'Tarifa activada')
      cargar()
    } catch { toast.error('Error') }
  }

  const carros = tarifas.filter(t => t.tipo_vehiculo === 'carro')
  const motos  = tarifas.filter(t => t.tipo_vehiculo === 'moto')

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold text-neutral-900">Tarifas</h1>
        <button onClick={() => { setForm({ tipo_vehiculo:'carro', franja_inicio:'06:00', franja_fin:'12:00', precio_hora:'' }); setModal('nueva') }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition shadow-sm">
          <Plus size={15} /> Nueva tarifa
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {[{ label: 'Carros', icon: Car, data: carros, color: 'warning' }, { label: 'Motos', icon: Bike, data: motos, color: 'primary' }].map(({ label, icon: Icon, data, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className={`flex items-center gap-2 px-5 py-3.5 border-b border-neutral-100`}>
                <Icon size={16} className={color === 'warning' ? 'text-warning' : 'text-primary'} />
                <h2 className="font-bold text-neutral-800">{label}</h2>
              </div>
              {data.length === 0 ? (
                <p className="text-sm text-neutral-400 px-5 py-6 text-center">Sin tarifas configuradas</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Franja</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Precio/hora</th>
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Creado por</th>
                      <th className="text-center px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Estado</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(t => (
                      <tr key={t.id} className={`border-b border-neutral-50 hover:bg-neutral-50 transition ${!t.activo ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3 font-mono text-neutral-700 font-medium">
                          {t.franja_inicio.slice(0,5)} – {t.franja_fin.slice(0,5)}
                        </td>
                        <td className="px-5 py-3 font-bold text-neutral-900">{fmt(t.precio_hora)}</td>
                        <td className="px-5 py-3 text-neutral-500 text-xs">{t.creado_por}</td>
                        <td className="px-5 py-3 text-center">
                          <span onClick={() => toggleActivo(t)} className={`cursor-pointer text-xs font-semibold px-2 py-0.5 rounded-full
                            ${t.activo ? 'bg-success-light text-success' : 'bg-neutral-100 text-neutral-400'}`}>
                            {t.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => abrirEditar(t)} className="text-neutral-400 hover:text-primary transition">
                            <Pencil size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-900">{modal === 'nueva' ? 'Nueva Tarifa' : 'Editar Tarifa'}</h2>
              <button onClick={() => setModal(null)} className="text-neutral-400 hover:text-neutral-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleGuardar} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-neutral-600 mb-2 block">Tipo de vehículo</label>
                <div className="grid grid-cols-2 gap-2">
                  {['carro', 'moto'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo_vehiculo: t }))}
                      className={`py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition
                        ${form.tipo_vehiculo === t ? 'border-primary bg-primary-light text-primary' : 'border-neutral-200 text-neutral-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['franja_inicio','Inicio'],['franja_fin','Fin']].map(([key,label]) => (
                  <div key={key}>
                    <label className="text-sm font-semibold text-neutral-600 mb-1.5 block">{label}</label>
                    <input type="time" required value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-600 mb-1.5 block">Precio por hora (COP)</label>
                <input type="number" required min={0} step={100} placeholder="Ej: 3500"
                  value={form.precio_hora}
                  onChange={e => setForm(f => ({ ...f, precio_hora: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
