const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const permitidos = [
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ]
    if (!origin || permitidos.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api', routes);

// ── Health check (útil para Railway) ─────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, mensaje: 'API Parqueadero funcionando', timestamp: new Date() });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta ${req.method} ${req.path} no encontrada` });
});

// ── Manejo global de errores ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});

module.exports = app;
