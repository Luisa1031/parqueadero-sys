const jwt = require('jsonwebtoken');

// Verifica que el token JWT sea válido
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, nombre, email, rol }
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
};

// Solo permite el rol 'administrador'
const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'administrador') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso restringido a administradores' });
  }
  next();
};

// Permite cualquier rol autenticado (admin u operario)
const cualquierRol = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
  }
  next();
};

module.exports = { verificarToken, soloAdmin, cualquierRol };
