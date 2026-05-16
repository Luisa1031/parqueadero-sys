-- ============================================================
--  SISTEMA DE GESTIÓN DE PARQUEADERO
--  Base de datos: parqueadero_db
--  Compatible con: MySQL 8.0+ / Railway (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS parqueadero_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE parqueadero_db;

-- ------------------------------------------------------------
-- TABLA: usuarios
-- Roles: administrador | operario
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  rol           ENUM('administrador', 'operario') NOT NULL DEFAULT 'operario',
  activo        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email),
  INDEX idx_rol   (rol)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: espacios
-- Representa cada lugar físico del parqueadero
-- tipo: moto | carro
-- estado: disponible | ocupado | mantenimiento
-- ------------------------------------------------------------
CREATE TABLE espacios (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo  VARCHAR(10)  NOT NULL UNIQUE,     -- Ej: A-01, B-03
  tipo    ENUM('moto', 'carro') NOT NULL,
  estado  ENUM('disponible', 'ocupado', 'mantenimiento') NOT NULL DEFAULT 'disponible',
  nivel   TINYINT      NOT NULL DEFAULT 1,  -- Piso del parqueadero
  PRIMARY KEY (id),
  INDEX idx_tipo_estado (tipo, estado)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: tarifas
-- Precio por hora según tipo de vehículo y franja horaria
-- El administrador puede crear/modificar tarifas
-- ------------------------------------------------------------
CREATE TABLE tarifas (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  tipo_vehiculo  ENUM('moto', 'carro') NOT NULL,
  franja_inicio  TIME           NOT NULL,   -- Ej: 06:00:00
  franja_fin     TIME           NOT NULL,   -- Ej: 12:00:00
  precio_hora    DECIMAL(10, 2) NOT NULL,
  activo         TINYINT(1)     NOT NULL DEFAULT 1,
  admin_id       INT UNSIGNED   NOT NULL,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tipo_activo (tipo_vehiculo, activo),
  FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: vehiculos
-- Registro de ingreso/salida de vehículos
-- placa formato Colombia: ABC123 o AB123C
-- ------------------------------------------------------------
CREATE TABLE vehiculos (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  placa         VARCHAR(7)   NOT NULL,
  tipo          ENUM('moto', 'carro') NOT NULL,
  hora_ingreso  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  hora_salida   DATETIME     NULL,
  espacio_id    INT UNSIGNED NOT NULL,
  operario_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_placa        (placa),
  INDEX idx_hora_ingreso (hora_ingreso),
  INDEX idx_espacio      (espacio_id),
  FOREIGN KEY (espacio_id)  REFERENCES espacios(id) ON UPDATE CASCADE,
  FOREIGN KEY (operario_id) REFERENCES usuarios(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: pagos
-- Registro del cobro al momento de la salida
-- metodo_pago: efectivo | tarjeta | app
-- ------------------------------------------------------------
CREATE TABLE pagos (
  id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  vehiculo_id  INT UNSIGNED   NOT NULL UNIQUE,  -- Un pago por registro
  tarifa_id    INT UNSIGNED   NOT NULL,
  total        DECIMAL(10, 2) NOT NULL,
  metodo_pago  ENUM('efectivo', 'tarjeta', 'app') NOT NULL,
  fecha_pago   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  operario_id  INT UNSIGNED   NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_fecha_pago (fecha_pago),
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON UPDATE CASCADE,
  FOREIGN KEY (tarifa_id)   REFERENCES tarifas(id)   ON UPDATE CASCADE,
  FOREIGN KEY (operario_id) REFERENCES usuarios(id)  ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLA: reportes
-- Resúmenes generados por el administrador
-- ------------------------------------------------------------
CREATE TABLE reportes (
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  admin_id          INT UNSIGNED   NOT NULL,
  operario_id       INT UNSIGNED   NULL,         -- NULL = reporte de todos
  fecha_inicio      DATE           NOT NULL,
  fecha_fin         DATE           NOT NULL,
  total_vehiculos   INT UNSIGNED   NOT NULL DEFAULT 0,
  total_recaudado   DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  generado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_admin    (admin_id),
  INDEX idx_operario (operario_id),
  FOREIGN KEY (admin_id)    REFERENCES usuarios(id) ON UPDATE CASCADE,
  FOREIGN KEY (operario_id) REFERENCES usuarios(id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLA: notificaciones_ocupacion
-- Registra los eventos al 90% y 100% de ocupación
-- ============================================================
CREATE TABLE notificaciones_ocupacion (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo         ENUM('alerta_90', 'alerta_100') NOT NULL,
  total_espacios    INT UNSIGNED NOT NULL,
  espacios_ocupados INT UNSIGNED NOT NULL,
  porcentaje   DECIMAL(5,2) NOT NULL,
  fecha        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- DATOS INICIALES
-- ============================================================


-- Admin por defecto (password: Admin123* → bcrypt)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@parqueadero.com',
 '$2b$10$7QJ8mJw0vH1dQJmL5vM4P.eB9fF2k0M4v0wB3uM0hT7l2WQ9kQx3G', 'administrador');

-- Espacios: 10 para carros (C-01 a C-10), 5 para motos (M-01 a M-05)
INSERT INTO espacios (codigo, tipo, nivel) VALUES
('C-01','carro',1), ('C-02','carro',1), ('C-03','carro',1), ('C-04','carro',1), ('C-05','carro',1),
('C-06','carro',1), ('C-07','carro',1), ('C-08','carro',1), ('C-09','carro',1), ('C-10','carro',1),
('M-01','moto',1),  ('M-02','moto',1),  ('M-03','moto',1),  ('M-04','moto',1),  ('M-05','moto',1);

-- Tarifas iniciales (las configura el admin desde la app)
INSERT INTO tarifas (tipo_vehiculo, franja_inicio, franja_fin, precio_hora, admin_id) VALUES
('carro', '06:00:00', '12:00:00', 3500.00, 1),
('carro', '12:00:00', '18:00:00', 4000.00, 1),
('carro', '18:00:00', '22:00:00', 3500.00, 1),
('moto',  '06:00:00', '12:00:00', 2000.00, 1),
('moto',  '12:00:00', '18:00:00', 2500.00, 1),
('moto',  '18:00:00', '22:00:00', 2000.00, 1);

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: ocupación actual del parqueadero
CREATE OR REPLACE VIEW v_ocupacion_actual AS
SELECT
  e.tipo,
  COUNT(*) AS total_espacios,
  SUM(CASE WHEN e.estado = 'ocupado'     THEN 1 ELSE 0 END) AS ocupados,
  SUM(CASE WHEN e.estado = 'disponible'  THEN 1 ELSE 0 END) AS disponibles,
  ROUND(SUM(CASE WHEN e.estado = 'ocupado' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS porcentaje_ocupacion
FROM espacios e
GROUP BY e.tipo;

-- Vista: vehículos activos (sin salida)
CREATE OR REPLACE VIEW v_vehiculos_activos AS
SELECT
  v.id,
  v.placa,
  v.tipo,
  v.hora_ingreso,
  e.codigo AS espacio,
  u.nombre AS operario
FROM vehiculos v
JOIN espacios e ON e.id = v.espacio_id
JOIN usuarios u ON u.id = v.operario_id
WHERE v.hora_salida IS NULL
ORDER BY v.hora_ingreso DESC;

-- Vista: ingresos del día por operario
CREATE OR REPLACE VIEW v_ingresos_hoy AS
SELECT
  u.nombre AS operario,
  COUNT(p.id)   AS cobros,
  SUM(p.total)  AS total_recaudado,
  p.metodo_pago
FROM pagos p
JOIN usuarios u ON u.id = p.operario_id
WHERE DATE(p.fecha_pago) = CURDATE()
GROUP BY u.id, u.nombre, p.metodo_pago
ORDER BY total_recaudado DESC;

-- ============================================================
-- PROCEDIMIENTO: calcular tarifa aplicable
-- Uso: CALL sp_calcular_tarifa('carro', '2025-06-15 09:30:00', @precio);
-- ============================================================
DELIMITER $$
CREATE PROCEDURE sp_calcular_tarifa(
  IN  p_tipo_vehiculo ENUM('moto','carro'),
  IN  p_hora_consulta DATETIME,
  OUT p_precio_hora   DECIMAL(10,2)
)
BEGIN
  SELECT precio_hora INTO p_precio_hora
  FROM tarifas
  WHERE tipo_vehiculo = p_tipo_vehiculo
    AND activo = 1
    AND TIME(p_hora_consulta) BETWEEN franja_inicio AND franja_fin
  LIMIT 1;

  IF p_precio_hora IS NULL THEN
    SELECT precio_hora INTO p_precio_hora
    FROM tarifas
    WHERE tipo_vehiculo = p_tipo_vehiculo AND activo = 1
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
END$$
DELIMITER ;