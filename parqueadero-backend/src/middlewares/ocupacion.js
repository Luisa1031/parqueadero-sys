const db = require('../config/db');

/**
 * Revisa la ocupación total del parqueadero.
 * Si supera el 90% o 100%, inserta una notificación en la BD
 * y devuelve la alerta para enviarla al cliente vía respuesta JSON.
 */
const verificarOcupacion = async () => {
  const [rows] = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(estado = 'ocupado') AS ocupados
    FROM espacios
    WHERE estado != 'mantenimiento'
  `);

  const { total, ocupados } = rows[0];
  const porcentaje = (ocupados / total) * 100;

  const umbral1 = Number(process.env.ALERTA_PORCENTAJE_1) || 90;
  const umbral2 = Number(process.env.ALERTA_PORCENTAJE_2) || 100;

  let alerta = null;

  if (porcentaje >= umbral2) {
    alerta = { tipo: 'alerta_100', mensaje: '🚨 Parqueadero LLENO (100% ocupado)', porcentaje };
  } else if (porcentaje >= umbral1) {
    alerta = { tipo: 'alerta_90', mensaje: '⚠️ Parqueadero al 90% de ocupación', porcentaje };
  }

  if (alerta) {
    await db.query(
      `INSERT INTO notificaciones_ocupacion (tipo, total_espacios, espacios_ocupados, porcentaje)
       VALUES (?, ?, ?, ?)`,
      [alerta.tipo, total, ocupados, porcentaje.toFixed(2)]
    );
  }

  return { total, ocupados, porcentaje: porcentaje.toFixed(2), alerta };
};

module.exports = { verificarOcupacion };
