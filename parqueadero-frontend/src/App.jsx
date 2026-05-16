import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login             from './pages/Login'
import OperarioDashboard from './pages/OperarioDashboard'
import VehiculosActivos  from './pages/VehiculosActivos'
import AdminDashboard    from './pages/AdminDashboard'
import Usuarios          from './pages/Usuarios'
import Tarifas           from './pages/Tarifas'
import Reportes          from './pages/Reportes'

// Ruta que requiere autenticación
function PrivateRoute({ children, rol }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
  if (!usuario) return <Navigate to="/login" replace />
  if (rol && usuario.rol !== rol) {
    return <Navigate to={usuario.rol === 'administrador' ? '/admin' : '/operario'} replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' } }} />
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Operario */}
          <Route path="/operario" element={
            <PrivateRoute rol="operario"><OperarioDashboard /></PrivateRoute>
          } />
          <Route path="/operario/activos" element={
            <PrivateRoute rol="operario"><VehiculosActivos /></PrivateRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <PrivateRoute rol="administrador"><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/usuarios" element={
            <PrivateRoute rol="administrador"><Usuarios /></PrivateRoute>
          } />
          <Route path="/admin/tarifas" element={
            <PrivateRoute rol="administrador"><Tarifas /></PrivateRoute>
          } />
          <Route path="/admin/reportes" element={
            <PrivateRoute rol="administrador"><Reportes /></PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
