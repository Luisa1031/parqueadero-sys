const db = require('../config/db');

// GET /api/espacios  →  todos los espacios con su estado actual
const listarEspacios = async (req, res) => {
  try {
    const [espacios] = await db.query(`
      SELECT
        e.id, e.codigo, e.tipo, e.estado, e.nivel,
        v.placa        AS vehiculo_placa,
        v.hora_ingreso AS vehiculo_ingreso,
        v.id           AS vehiculo_id
      FROM espacios e
      LEFT JOIN vehiculos v
        ON v.espacio_id = e.id AND v.hora_salida IS NULL
      ORDER BY e.tipo, e.codigo
    `);
    return res.json({ ok: true, datos: espacios });
  } catch (error) {
    console.error('Error al listar espacios:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener espacios' });
  }
};

// GET /api/espacios/disponibles?tipo=carro
const espaciosDisponibles = async (req, res) => {
  const { tipo } = req.query;
  try {
    let query = "SELECT id, codigo, tipo, nivel FROM espacios WHERE estado = 'disponible'";
    const params = [];
    if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }
    query += ' ORDER BY codigo';

    const [espacios] = await db.query(query, params);
    return res.json({ ok: true, datos: espacios, total: espacios.length });
  } catch (error) {
    console.error('Error al listar disponibles:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener espacios disponibles' });
  }
};

// PUT /api/espacios/:id/estado  →  solo admin puede cambiar a 'mantenimiento'
const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const estadosValidos = ['disponible', 'ocupado', 'mantenimiento'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ ok: false, mensaje: 'Estado no válido' });
  }

  try {
    await db.query('UPDATE espacios SET estado = ? WHERE id = ?', [estado, id]);
    return res.json({ ok: true, mensaje: 'Estado actualizado' });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar estado' });
  }
};

module.exports = { listarEspacios, espaciosDisponibles, cambiarEstado };
