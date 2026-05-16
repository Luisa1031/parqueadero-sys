const db = require('../config/db');

// POST /api/pagos
const registrarPago = async (req, res) => {
  const { vehiculo_id, tarifa_id, total, metodo_pago } = req.body;
  const operario_id = req.usuario.id;

  if (!vehiculo_id || !tarifa_id || !total || !metodo_pago) {
    return res.status(400).json({ ok: false, mensaje: 'vehiculo_id, tarifa_id, total y metodo_pago son requeridos' });
  }
  if (!['efectivo', 'tarjeta', 'app'].includes(metodo_pago)) {
    return res.status(400).json({ ok: false, mensaje: 'metodo_pago debe ser: efectivo, tarjeta o app' });
  }

  try {
    // Verificar que el vehículo tenga salida registrada y no tenga pago aún
    const [vehiculos] = await db.query(
      "SELECT id, hora_salida FROM vehiculos WHERE id = ?",
      [vehiculo_id]
    );
    if (!vehiculos.length) {
      return res.status(404).json({ ok: false, mensaje: 'Vehículo no encontrado' });
    }
    if (!vehiculos[0].hora_salida) {
      return res.status(409).json({ ok: false, mensaje: 'El vehículo aún no ha registrado salida' });
    }

    const [exists] = await db.query("SELECT id FROM pagos WHERE vehiculo_id = ?", [vehiculo_id]);
    if (exists.length) {
      return res.status(409).json({ ok: false, mensaje: 'Este vehículo ya tiene un pago registrado' });
    }

    const [result] = await db.query(
      "INSERT INTO pagos (vehiculo_id, tarifa_id, total, metodo_pago, operario_id) VALUES (?, ?, ?, ?, ?)",
      [vehiculo_id, tarifa_id, total, metodo_pago, operario_id]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Pago registrado correctamente',
      pago_id: result.insertId,
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar pago' });
  }
};

// GET /api/pagos/hoy  →  resumen del día
const resumenHoy = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.nombre AS operario,
        p.metodo_pago,
        COUNT(p.id)  AS cantidad,
        SUM(p.total) AS total
      FROM pagos p
      JOIN usuarios u ON u.id = p.operario_id
      WHERE DATE(p.fecha_pago) = CURDATE()
      GROUP BY u.id, u.nombre, p.metodo_pago
      ORDER BY total DESC
    `);

    const [totales] = await db.query(`
      SELECT COUNT(*) AS total_cobros, SUM(total) AS total_recaudado
      FROM pagos WHERE DATE(fecha_pago) = CURDATE()
    `);

    return res.json({ ok: true, detalle: rows, resumen: totales[0] });
  } catch (error) {
    console.error('Error en resumen del día:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener resumen' });
  }
};

module.exports = { registrarPago, resumenHoy };
