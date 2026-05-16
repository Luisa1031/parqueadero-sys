const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');

const authCtrl      = require('../controllers/authController');
const espaciosCtrl  = require('../controllers/espaciosController');
const vehiculosCtrl = require('../controllers/vehiculosController');
const pagosCtrl     = require('../controllers/pagosController');
const tarifasCtrl   = require('../controllers/tarifasController');
const usuariosCtrl  = require('../controllers/usuariosController');
const reportesCtrl  = require('../controllers/reportesController');

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/login', authCtrl.login);

// ── Espacios (autenticado) ────────────────────────────────────
router.get('/espacios',               verificarToken, espaciosCtrl.listarEspacios);
router.get('/espacios/disponibles',   verificarToken, espaciosCtrl.espaciosDisponibles);
router.put('/espacios/:id/estado',    verificarToken, soloAdmin, espaciosCtrl.cambiarEstado);

// ── Vehículos (autenticado) ───────────────────────────────────
router.post('/vehiculos/ingreso',     verificarToken, vehiculosCtrl.registrarIngreso);
router.put('/vehiculos/:id/salida',   verificarToken, vehiculosCtrl.registrarSalida);
router.get('/vehiculos/activos',      verificarToken, vehiculosCtrl.listarActivos);
router.get('/vehiculos/buscar',       verificarToken, vehiculosCtrl.buscarPorPlaca);

// ── Pagos ─────────────────────────────────────────────────────
router.post('/pagos',                 verificarToken, pagosCtrl.registrarPago);
router.get('/pagos/hoy',              verificarToken, soloAdmin, pagosCtrl.resumenHoy);

// ── Tarifas ───────────────────────────────────────────────────
router.get('/tarifas',                verificarToken, tarifasCtrl.listarTarifas);
router.post('/tarifas',               verificarToken, soloAdmin, tarifasCtrl.crearTarifa);
router.put('/tarifas/:id',            verificarToken, soloAdmin, tarifasCtrl.actualizarTarifa);

// ── Usuarios (solo admin) ─────────────────────────────────────
router.get('/usuarios',               verificarToken, soloAdmin, usuariosCtrl.listarUsuarios);
router.post('/usuarios',              verificarToken, soloAdmin, usuariosCtrl.crearUsuario);
router.put('/usuarios/:id',           verificarToken, soloAdmin, usuariosCtrl.actualizarUsuario);

// ── Reportes (solo admin) ─────────────────────────────────────
router.get('/reportes',               verificarToken, soloAdmin, reportesCtrl.generarReporte);
router.get('/reportes/historial',     verificarToken, soloAdmin, reportesCtrl.historialReportes);

module.exports = router;
