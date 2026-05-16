# 🅿️ Parqueadero Backend — API REST

Node.js + Express + MySQL

---

## 🚀 Instalación local

### 1. Clonar e instalar dependencias
```bash
git clone https://github.com/tu-usuario/parqueadero-backend.git
cd parqueadero-backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus datos de MySQL Workbench
```

### 3. Ejecutar la base de datos
- Abre MySQL Workbench
- Ejecuta el archivo `parqueadero_db.sql` (Ctrl+A → ⚡)

### 4. Iniciar el servidor
```bash
npm run dev      # desarrollo con nodemon
npm start        # producción
```

El servidor corre en: `http://localhost:3000`
Health check: `GET http://localhost:3000/health`

---

## 📡 Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/login` | Público | Login y obtención del JWT |
| GET | `/api/espacios` | Autenticado | Todos los espacios con estado |
| GET | `/api/espacios/disponibles?tipo=carro` | Autenticado | Espacios libres |
| PUT | `/api/espacios/:id/estado` | Admin | Cambiar estado del espacio |
| POST | `/api/vehiculos/ingreso` | Autenticado | Registrar ingreso |
| PUT | `/api/vehiculos/:id/salida` | Autenticado | Registrar salida + calcular total |
| GET | `/api/vehiculos/activos` | Autenticado | Vehículos dentro del parqueadero |
| GET | `/api/vehiculos/buscar?placa=ABC123` | Autenticado | Buscar por placa |
| POST | `/api/pagos` | Autenticado | Registrar pago |
| GET | `/api/pagos/hoy` | Admin | Resumen de ingresos del día |
| GET | `/api/tarifas` | Autenticado | Listar tarifas activas |
| POST | `/api/tarifas` | Admin | Crear tarifa |
| PUT | `/api/tarifas/:id` | Admin | Editar tarifa |
| GET | `/api/usuarios` | Admin | Listar operarios |
| POST | `/api/usuarios` | Admin | Crear usuario |
| PUT | `/api/usuarios/:id` | Admin | Editar/desactivar usuario |
| GET | `/api/reportes?fecha_inicio=&fecha_fin=&operario_id=` | Admin | Generar reporte |
| GET | `/api/reportes/historial` | Admin | Reportes anteriores |

---

## 🔐 Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

El token se obtiene del endpoint `POST /api/auth/login`.

---

## 🚢 Deploy en Railway

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "feat: backend inicial parqueadero"
git remote add origin https://github.com/tu-usuario/parqueadero-backend.git
git push -u origin main
```

### 2. Crear proyecto en Railway
- Ve a [railway.app](https://railway.app) → New Project
- Selecciona **Deploy from GitHub repo**
- Conecta tu repositorio

### 3. Agregar MySQL en Railway
- En tu proyecto Railway → **+ New** → **Database** → **MySQL**
- Railway auto-genera las variables de entorno:
  - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

### 4. Variables de entorno en Railway
En tu servicio Node.js → **Variables**, agregar:
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
JWT_SECRET=tu_clave_super_secreta_aqui
NODE_ENV=production
```

### 5. Railway detecta automáticamente
- El comando `npm start` desde `package.json`
- El puerto desde la variable `PORT` (Railway la inyecta automáticamente)

---

## 🧪 Credenciales iniciales

```
Email:    admin@parqueadero.com
Password: Admin123*
```
> ⚠️ Cambiar la contraseña después del primer login actualizando el hash en la BD.

Para generar un hash nuevo:
```js
const bcrypt = require('bcryptjs');
console.log(await bcrypt.hash('NuevaPassword123', 10));
```

---

## 📁 Estructura del proyecto

```
parqueadero-backend/
├── src/
│   ├── config/
│   │   └── db.js                  → Pool de conexión MySQL
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── espaciosController.js
│   │   ├── vehiculosController.js
│   │   ├── pagosController.js
│   │   ├── tarifasController.js
│   │   ├── usuariosController.js
│   │   └── reportesController.js
│   ├── middlewares/
│   │   ├── auth.js                → JWT + verificación de roles
│   │   └── ocupacion.js           → Alertas 90% y 100%
│   ├── routes/
│   │   └── index.js               → Todos los endpoints
│   └── app.js                     → Express + CORS + middlewares
├── server.js                      → Punto de entrada
├── .env.example
├── .gitignore
└── package.json
```
