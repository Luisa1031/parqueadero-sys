const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /api/usuarios  →  solo admin
const listarUsuarios = async (req, res) => {
  try {
    const [usuarios] = await db.query(
      "SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY rol, nombre"
    );
    return res.json({ ok: true, datos: usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios' });
  }
};

// POST /api/usuarios  →  solo admin
const crearUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ ok: false, mensaje: 'Nombre, email, contraseña y rol son requeridos' });
  }
  if (!['administrador', 'operario'].includes(rol)) {
    return res.status(400).json({ ok: false, mensaje: 'Rol debe ser administrador u operario' });
  }
  if (password.length < 6) {
    return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener mínimo 6 caracteres' });
  }

  try {
    const [exists] = await db.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (exists.length) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)",
      [nombre, email, hash, rol]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario creado correctamente',
      usuario_id: result.insertId,
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear usuario' });
  }
};

// PUT /api/usuarios/:id  →  solo admin (activar/desactivar o cambiar datos)
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, activo, password } = req.body;

  try {
    let newHash = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener mínimo 6 caracteres' });
      }
      newHash = await bcrypt.hash(password, 10);
    }

    await db.query(
      `UPDATE usuarios SET
        nombre        = COALESCE(?, nombre),
        activo        = COALESCE(?, activo),
        password_hash = COALESCE(?, password_hash)
       WHERE id = ?`,
      [nombre, activo, newHash, id]
    );

    return res.json({ ok: true, mensaje: 'Usuario actualizado' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar usuario' });
  }
};

module.exports = { listarUsuarios, crearUsuario, actualizarUsuario };
