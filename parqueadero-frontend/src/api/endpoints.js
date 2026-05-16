import api from './client'

// ── Auth ──────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

// ── Espacios ──────────────────────────────────────────────────
export const getEspacios = () =>
  api.get('/espacios').then(r => r.data)

export const getEspaciosDisponibles = (tipo) =>
  api.get('/espacios/disponibles', { params: { tipo } }).then(r => r.data)

export const updateEstadoEspacio = (id, estado) =>
  api.put(`/espacios/${id}/estado`, { estado }).then(r => r.data)

// ── Vehículos ─────────────────────────────────────────────────
export const registrarIngreso = (data) =>
  api.post('/vehiculos/ingreso', data).then(r => r.data)

export const registrarSalida = (id) =>
  api.put(`/vehiculos/${id}/salida`).then(r => r.data)

export const getVehiculosActivos = () =>
  api.get('/vehiculos/activos').then(r => r.data)

export const buscarPorPlaca = (placa) =>
  api.get('/vehiculos/buscar', { params: { placa } }).then(r => r.data)

// ── Pagos ─────────────────────────────────────────────────────
export const registrarPago = (data) =>
  api.post('/pagos', data).then(r => r.data)

export const getResumenHoy = () =>
  api.get('/pagos/hoy').then(r => r.data)

// ── Tarifas ───────────────────────────────────────────────────
export const getTarifas = () =>
  api.get('/tarifas').then(r => r.data)

export const crearTarifa = (data) =>
  api.post('/tarifas', data).then(r => r.data)

export const updateTarifa = (id, data) =>
  api.put(`/tarifas/${id}`, data).then(r => r.data)

// ── Usuarios ──────────────────────────────────────────────────
export const getUsuarios = () =>
  api.get('/usuarios').then(r => r.data)

export const crearUsuario = (data) =>
  api.post('/usuarios', data).then(r => r.data)

export const updateUsuario = (id, data) =>
  api.put(`/usuarios/${id}`, data).then(r => r.data)

// ── Reportes ──────────────────────────────────────────────────
export const getReporte = (params) =>
  api.get('/reportes', { params }).then(r => r.data)

export const getHistorialReportes = () =>
  api.get('/reportes/historial').then(r => r.data)
