const db = require('../config/db');

// GET /api/reportes?operario_id=2&fecha_inicio=2025-01-01&fecha_fin=2025-01-31
const generarReporte = async (req, res) => {
  const { operario_id, fecha_inicio, fecha_fin } = req.query;
  const admin_id = req.usuario.id;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ ok: false, mensaje: 'fecha_inicio y fecha_fin son requeridas (YYYY-MM-DD)' });
  }

  try {
    // Construir filtro dinámico por operario
    const filtroOp = operario_id ? 'AND p.operario_id = ?' : '';
    const params = operario_id
      ? [fecha_inicio, fecha_fin, operario_id]
      : [fecha_inicio, fecha_fin];

    // Detalle por operario y método de pago
    const [detalle] = await db.query(`
      SELECT
        u.nombre            AS operario,
        p.metodo_pago,
        COUNT(p.id)         AS cantidad_cobros,
        SUM(p.total)        AS total_recaudado,
        v.tipo              AS tipo_vehiculo,
        COUNT(v.id)         AS cantidad_vehiculos
      FROM pagos p
      JOIN usuarios u  ON u.id = p.operario_id
      JOIN vehiculos v ON v.id = p.vehiculo_id
      WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
        ${filtroOp}
      GROUP BY u.id, u.nombre, p.metodo_pago, v.tipo
      ORDER BY u.nombre, p.metodo_pago
    `, params);

    // Totales generales
    const [totales] = await db.query(`
      SELECT
        COUNT(p.id)  AS total_cobros,
        SUM(p.total) AS total_recaudado,
        COUNT(DISTINCT v.id)         AS total_vehiculos,
        COUNT(DISTINCT p.operario_id) AS total_operarios
      FROM pagos p
      JOIN vehiculos v ON v.id = p.vehiculo_id
      WHERE DATE(p.fecha_pago) BETWEEN ? AND ?
        ${filtroOp}
    `, params);

    // Guardar reporte en BD
    const [result] = await db.query(
      `INSERT INTO reportes (admin_id, operario_id, fecha_inicio, fecha_fin, total_vehiculos, total_recaudado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        admin_id,
        operario_id || null,
        fecha_inicio,
        fecha_fin,
        totales[0].total_vehiculos,
        totales[0].total_recaudado || 0,
      ]
    );

    return res.json({
      ok: true,
      reporte_id: result.insertId,
      periodo: { fecha_inicio, fecha_fin },
      totales: totales[0],
      detalle,
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al generar reporte' });
  }
};

// GET /api/reportes/historial  →  reportes generados anteriormente
const historialReportes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, a.nombre AS admin, o.nombre AS operario_nombre
      FROM reportes r
      JOIN usuarios a ON a.id = r.admin_id
      LEFT JOIN usuarios o ON o.id = r.operario_id
      ORDER BY r.generado_en DESC
      LIMIT 50
    `);
    return res.json({ ok: true, datos: rows });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener historial' });
  }
};

module.exports = { generarReporte, historialReportes };
