import { useState, useEffect } from 'react'
import { getReporte, getUsuarios } from '../api/endpoints'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { FileText, Search } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download } from 'lucide-react'


const fmt = v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0)

const hoy = () => new Date().toISOString().split('T')[0]
const inicioMes = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }

export default function Reportes() {
  const [operarios, setOperarios] = useState([])
  const [filtros, setFiltros]     = useState({ fecha_inicio: inicioMes(), fecha_fin: hoy(), operario_id: '' })
  const [reporte, setReporte]     = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    getUsuarios().then(r => setOperarios(r.datos.filter(u => u.rol === 'operario'))).catch(() => {})
  }, [])

  const generar = async () => {
    setLoading(true)
    try {
      const params = { fecha_inicio: filtros.fecha_inicio, fecha_fin: filtros.fecha_fin }
      if (filtros.operario_id) params.operario_id = filtros.operario_id
      const res = await getReporte(params)
      setReporte(res)
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al generar reporte')
    } finally { setLoading(false) }
  }

  const generarPDF = () => {
  if (!reporte) return

  const doc = new jsPDF()
  const fechaGen = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  // Encabezado
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ParkSys — Reporte de Ingresos', 14, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`, 14, 30)
  doc.text(`Generado: ${fechaGen}`, 14, 36)
  if (filtros.operario_id) {
    const op = operarios.find(o => String(o.id) === String(filtros.operario_id))
    if (op) doc.text(`Operario: ${op.nombre}`, 14, 42)
  }

  // Totales
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen general', 14, 52)

  autoTable(doc, {
    startY: 56,
    head: [['Total cobros', 'Total vehículos', 'Total recaudado', 'Operarios']],
    body: [[
      reporte.totales.total_cobros,
      reporte.totales.total_vehiculos,
      fmt(reporte.totales.total_recaudado),
      reporte.totales.total_operarios,
    ]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [29, 111, 232] },
  })

  // Detalle
  if (reporte.detalle?.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalle por operario', 14, doc.lastAutoTable.finalY + 12)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Operario', 'Tipo vehículo', 'Método pago', 'Cobros', 'Recaudado']],
      body: reporte.detalle.map(r => [
        r.operario,
        r.tipo_vehiculo,
        r.metodo_pago,
        r.cantidad_cobros,
        fmt(r.total_recaudado),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [29, 111, 232] },
      alternateRowStyles: { fillColor: [245, 248, 255] },
    })
  }

  doc.save(`reporte_parqueadero_${filtros.fecha_inicio}_${filtros.fecha_fin}.pdf`)
}

  return (
    <Layout>
      <h1 className="text-xl font-extrabold text-neutral-900 mb-5">Reportes</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-card p-5 mb-5">
        <h2 className="font-semibold text-neutral-700 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wide">Fecha inicio</label>
            <input type="date" value={filtros.fecha_inicio}
              onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wide">Fecha fin</label>
            <input type="date" value={filtros.fecha_fin}
              onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wide">Operario</label>
            <select value={filtros.operario_id}
              onChange={e => setFiltros(f => ({ ...f, operario_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition bg-white">
              <option value="">Todos los operarios</option>
              {operarios.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={generar} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Search size={15} />
            }
            {loading ? 'Generando...' : 'Generar reporte'}
          </button>

          {reporte && (
            <button onClick={generarPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
              <Download size={15} />
              Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* Resultado */}
      {reporte && (
        <div className="space-y-4 fade-in">
          {/* Totales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total cobros',    value: reporte.totales.total_cobros },
              { label: 'Total vehículos', value: reporte.totales.total_vehiculos },
              { label: 'Recaudado',       value: fmt(reporte.totales.total_recaudado) },
              { label: 'Operarios',       value: reporte.totales.total_operarios },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl shadow-card p-4">
                <p className="text-xs text-neutral-400 mb-1 font-medium">{label}</p>
                <p className="text-xl font-extrabold text-neutral-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Detalle */}
          {reporte.detalle?.length > 0 && (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-neutral-100">
                <FileText size={15} className="text-primary" />
                <h2 className="font-bold text-neutral-800">Detalle por operario</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    {['Operario','Tipo vehículo','Método pago','Cobros','Recaudado'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporte.detalle.map((row, i) => (
                    <tr key={i} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="px-5 py-3 font-medium text-neutral-800">{row.operario}</td>
                      <td className="px-5 py-3">
                        <span className={row.tipo_vehiculo === 'carro' ? 'badge-carro' : 'badge-moto'}>{row.tipo_vehiculo}</span>
                      </td>
                      <td className="px-5 py-3 text-neutral-500 capitalize">{row.metodo_pago}</td>
                      <td className="px-5 py-3 text-neutral-700">{row.cantidad_cobros}</td>
                      <td className="px-5 py-3 font-bold text-neutral-900">{fmt(row.total_recaudado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
