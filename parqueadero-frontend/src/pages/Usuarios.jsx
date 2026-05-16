import { useState, useEffect } from 'react'
import { getUsuarios, crearUsuario, updateUsuario } from '../api/endpoints'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { UserPlus, X, Shield, User, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ nombre: '', email: '', password: '', rol: 'operario' })
  const [showPwd, setShowPwd]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const cargar = async () => {
    try { const r = await getUsuarios(); setUsuarios(r.datos) }
    catch { toast.error('Error al cargar usuarios') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const handleCrear = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await crearUsuario(form)
      toast.success('Usuario creado correctamente')
      setModal(false)
      setForm({ nombre: '', email: '', password: '', rol: 'operario' })
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al crear usuario')
    } finally { setSaving(false) }
  }

  const toggleActivo = async (u) => {
    try {
      await updateUsuario(u.id, { activo: u.activo ? 0 : 1 })
      toast.success(`Usuario ${u.activo ? 'desactivado' : 'activado'}`)
      cargar()
    } catch { toast.error('Error al actualizar usuario') }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold text-neutral-900">Usuarios</h1>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition shadow-sm">
          <UserPlus size={15} /> Nuevo usuario
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Rol</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                        ${u.rol === 'administrador' ? 'bg-primary-light text-primary' : 'bg-neutral-100 text-neutral-600'}`}>
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-neutral-800">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
                      ${u.rol === 'administrador' ? 'bg-primary-light text-primary' : 'bg-neutral-100 text-neutral-600'}`}>
                      {u.rol === 'administrador' ? <Shield size={10} /> : <User size={10} />}
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => toggleActivo(u)} title={u.activo ? 'Desactivar' : 'Activar'}>
                      {u.activo
                        ? <ToggleRight size={22} className="text-success mx-auto" />
                        : <ToggleLeft  size={22} className="text-neutral-300 mx-auto" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear usuario */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-modal fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-900">Nuevo Usuario</h2>
              <button onClick={() => setModal(false)} className="text-neutral-400 hover:text-neutral-600 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCrear} className="p-5 space-y-4">
              {[
                { key: 'nombre',   label: 'Nombre completo', type: 'text',  ph: 'Juan Pérez' },
                { key: 'email',    label: 'Correo',          type: 'email', ph: 'juan@parqueadero.com' },
              ].map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className="text-sm font-semibold text-neutral-600 mb-1.5 block">{label}</label>
                  <input type={type} required placeholder={ph}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
                </div>
              ))}

              <div>
                <label className="text-sm font-semibold text-neutral-600 mb-1.5 block">Contraseña</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} required minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full pr-10 px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-neutral-600 mb-1.5 block">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  {['operario', 'administrador'].map(r => (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, rol: r }))}
                      className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition capitalize
                        ${form.rol === r ? 'border-primary bg-primary-light text-primary' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
