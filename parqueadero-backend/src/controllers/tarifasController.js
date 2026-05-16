const db = require('../config/db');

// GET /api/tarifas
const listarTarifas = async (req, res) => {
  try {
    const [tarifas] = await db.query(`
      SELECT t.*, u.nombre AS creado_por
      FROM tarifas t
      JOIN usuarios u ON u.id = t.admin_id
      ORDER BY t.tipo_vehiculo, t.franja_inicio
    `);
    return res.json({ ok: true, datos: tarifas });
  } catch (error) {
    console.error('Error al listar tarifas:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener tarifas' });
  }
};

// POST /api/tarifas  →  solo admin
const crearTarifa = async (req, res) => {
  const { tipo_vehiculo, franja_inicio, franja_fin, precio_hora } = req.body;
  const admin_id = req.usuario.id;

  if (!tipo_vehiculo || !franja_inicio || !franja_fin || !precio_hora) {
    return res.status(400).json({ ok: false, mensaje: 'Todos los campos son requeridos' });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO tarifas (tipo_vehiculo, franja_inicio, franja_fin, precio_hora, admin_id) VALUES (?, ?, ?, ?, ?)",
      [tipo_vehiculo, franja_inicio, franja_fin, precio_hora, admin_id]
    );
    return res.status(201).json({ ok: true, mensaje: 'Tarifa creada', tarifa_id: result.insertId });
  } catch (error) {
    console.error('Error al crear tarifa:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear tarifa' });
  }
};

// PUT /api/tarifas/:id  →  solo admin
const actualizarTarifa = async (req, res) => {
  const { id } = req.params;
  const { tipo_vehiculo, franja_inicio, franja_fin, precio_hora, activo } = req.body;

  try {
    await db.query(
      `UPDATE tarifas SET
        tipo_vehiculo = COALESCE(?, tipo_vehiculo),
        franja_inicio = COALESCE(?, franja_inicio),
        franja_fin    = COALESCE(?, franja_fin),
        precio_hora   = COALESCE(?, precio_hora),
        activo        = COALESCE(?, activo)
       WHERE id = ?`,
      [tipo_vehiculo, franja_inicio, franja_fin, precio_hora, activo, id]
    );
    return res.json({ ok: true, mensaje: 'Tarifa actualizada' });
  } catch (error) {
    console.error('Error al actualizar tarifa:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar tarifa' });
  }
};

module.exports = { listarTarifas, crearTarifa, actualizarTarifa };
