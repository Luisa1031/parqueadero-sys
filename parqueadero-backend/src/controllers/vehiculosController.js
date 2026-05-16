const db = require('../config/db');
const { verificarOcupacion } = require('../middlewares/ocupacion');

// Validar placa colombiana: ABC123 o AB123C
const validarPlaca = (placa) => /^[A-Z]{2,3}[0-9]{2,3}[A-Z0-9]?$/i.test(placa.trim());

// POST /api/vehiculos/ingreso
const registrarIngreso = async (req, res) => {
  const { placa, tipo, espacio_id } = req.body;
  const operario_id = req.usuario.id;

  if (!placa || !tipo || !espacio_id) {
    return res.status(400).json({ ok: false, mensaje: 'Placa, tipo y espacio son requeridos' });
  }
  if (!validarPlaca(placa)) {
    return res.status(400).json({ ok: false, mensaje: 'Formato de placa colombiana inválido (Ej: ABC123)' });
  }
  if (!['moto', 'carro'].includes(tipo)) {
    return res.status(400).json({ ok: false, mensaje: 'Tipo debe ser moto o carro' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [espacios] = await conn.query(
      "SELECT id, codigo, tipo, estado FROM espacios WHERE id = ? FOR UPDATE",
      [espacio_id]
    );
    if (!espacios.length) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Espacio no encontrado' });
    }
    const espacio = espacios[0];
    if (espacio.estado !== 'disponible') {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: `El espacio ${espacio.codigo} no está disponible` });
    }
    if (espacio.tipo !== tipo) {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: `El espacio ${espacio.codigo} es para ${espacio.tipo}, no para ${tipo}` });
    }

    const [activos] = await conn.query(
      "SELECT id FROM vehiculos WHERE placa = ? AND hora_salida IS NULL",
      [placa.toUpperCase()]
    );
    if (activos.length) {
      await conn.rollback();
      return res.status(409).json({ ok: false, mensaje: `La placa ${placa.toUpperCase()} ya tiene un ingreso activo` });
    }

    const [result] = await conn.query(
      "INSERT INTO vehiculos (placa, tipo, espacio_id, operario_id) VALUES (?, ?, ?, ?)",
      [placa.toUpperCase(), tipo, espacio_id, operario_id]
    );

    await conn.query("UPDATE espacios SET estado = 'ocupado' WHERE id = ?", [espacio_id]);
    await conn.commit();

    const ocupacion = await verificarOcupacion();

    return res.status(201).json({
      ok: true,
      mensaje: 'Ingreso registrado correctamente',
      vehiculo_id: result.insertId,
      espacio: espacio.codigo,
      hora_ingreso: new Date(),
      ocupacion,
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error en ingreso:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar ingreso' });
  } finally {
    conn.release();
  }
};

// PUT /api/vehiculos/:id/salida
const registrarSalida = async (req, res) => {
  const { id } = req.params;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Obtener vehículo activo
    const [vehiculos] = await conn.query(
      `SELECT v.*, e.codigo AS espacio_codigo
       FROM vehiculos v
       JOIN espacios e ON e.id = v.espacio_id
       WHERE v.id = ? AND v.hora_salida IS NULL FOR UPDATE`,
      [id]
    );
    if (!vehiculos.length) {
      await conn.rollback();
      return res.status(404).json({ ok: false, mensaje: 'Vehículo activo no encontrado' });
    }

    const vehiculo = vehiculos[0];
    const hora_salida = new Date();
    const hora_ingreso = new Date(vehiculo.hora_ingreso);
    const minutos = Math.ceil((hora_salida - hora_ingreso) / 60000);
    const horas = Math.max(minutos / 60, 1); // Mínimo 1 hora

    // Obtener tarifa aplicable según hora de salida
    const [tarifas] = await conn.query(
      `SELECT id, precio_hora FROM tarifas
       WHERE tipo_vehiculo = ? AND activo = 1
         AND TIME(?) BETWEEN franja_inicio AND franja_fin
       LIMIT 1`,
      [vehiculo.tipo, hora_salida]
    );

    // Si no hay tarifa exacta, usar la más reciente del tipo
    let tarifa = tarifas[0];
    if (!tarifa) {
      const [fallback] = await conn.query(
        "SELECT id, precio_hora FROM tarifas WHERE tipo_vehiculo = ? AND activo = 1 ORDER BY created_at DESC LIMIT 1",
        [vehiculo.tipo]
      );
      tarifa = fallback[0];
    }

    const total = (tarifa.precio_hora * horas).toFixed(2);

    // Registrar hora de salida
    await conn.query("UPDATE vehiculos SET hora_salida = ? WHERE id = ?", [hora_salida, id]);

    // Liberar espacio
    await conn.query("UPDATE espacios SET estado = 'disponible' WHERE id = ?", [vehiculo.espacio_id]);

    await conn.commit();

    return res.json({
      ok: true,
      mensaje: 'Salida registrada. Proceda al cobro.',
      resumen: {
        vehiculo_id:    vehiculo.id,
        placa:          vehiculo.placa,
        tipo:           vehiculo.tipo,
        espacio:        vehiculo.espacio_codigo,
        hora_ingreso:   vehiculo.hora_ingreso,
        hora_salida,
        minutos,
        tarifa_id:      tarifa.id,
        precio_hora:    tarifa.precio_hora,
        total_a_cobrar: Number(total),
      },
    });
  }catch (error) {
    try { await conn.rollback() } catch (_) {}
    console.error('Error en salida:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar salida' });
  } finally {
    conn.release();
    }
};

// GET /api/vehiculos/activos
const listarActivos = async (req, res) => {
  try {
    const [vehiculos] = await db.query(`
      SELECT
        v.id, v.placa, v.tipo, v.hora_ingreso,
        e.codigo AS espacio,
        u.nombre AS operario,
        TIMESTAMPDIFF(MINUTE, v.hora_ingreso, NOW()) AS minutos_transcurridos
      FROM vehiculos v
      JOIN espacios e ON e.id = v.espacio_id
      JOIN usuarios u ON u.id = v.operario_id
      WHERE v.hora_salida IS NULL
      ORDER BY v.hora_ingreso DESC
    `);
    return res.json({ ok: true, datos: vehiculos, total: vehiculos.length });
  } catch (error) {
    console.error('Error al listar activos:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener vehículos activos' });
  }
};

// GET /api/vehiculos/buscar?placa=ABC123
const buscarPorPlaca = async (req, res) => {
  const { placa } = req.query;
  if (!placa) return res.status(400).json({ ok: false, mensaje: 'Placa requerida' });

  try {
    const [rows] = await db.query(`
      SELECT v.*, e.codigo AS espacio,
             TIMESTAMPDIFF(MINUTE, v.hora_ingreso, NOW()) AS minutos_transcurridos
      FROM vehiculos v
      JOIN espacios e ON e.id = v.espacio_id
      WHERE v.placa = ? AND v.hora_salida IS NULL
    `, [placa.toUpperCase()]);

    if (!rows.length) return res.status(404).json({ ok: false, mensaje: 'No hay ingreso activo para esa placa' });
    return res.json({ ok: true, datos: rows[0] });
  } catch (error) {
    console.error('Error al buscar placa:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al buscar vehículo' });
  }
};

module.exports = { registrarIngreso, registrarSalida, listarActivos, buscarPorPlaca };
