/**
 * Aplicación Principal - Sistema de Gestión de Cabañas
 *
 * Este archivo configura e inicia el servidor Express, establece las conexiones
 * a la base de datos, configura las sesiones, monta las rutas y maneja los errores.
 *
 * @module app
 * @requires express
 * @requires express-session
 * @requires sequelize
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const { Sequelize } = require('sequelize');
const dbConfig = require('./config/database');
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Configurar conexión a la base de datos con Sequelize
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging
});

// ==================== IMPORTAR RUTAS ====================
// Todas las rutas del sistema están organizadas por módulo funcional
const authRoutes = require('./routes/auth');
const cabanaRoutes = require('./routes/cabanas');
const reservaRoutes = require('./routes/reservas');
const clienteRoutes = require('./routes/clientes');
const implementoRoutes = require('./routes/implementos');
const prestamoRoutes = require('./routes/prestamos');
const checklistRoutes = require('./routes/checklists');
const mantenimientoRoutes = require('./routes/mantenimientos');
const reporteRoutes = require('./routes/reportes');
const notificacionRoutes = require('./routes/notificaciones');
const encargadoRoutes = require('./routes/encargado');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const calendarioRoutes = require('./routes/calendario');
const pagoRoutes = require('./routes/pagos');
const encuestaRoutes = require('./routes/encuestas');
const incidenteRoutes = require('./routes/incidentes');
const trabajadorRoutes = require('./routes/trabajador');
const checkinRoutes = require('./routes/checkin');

// ==================== CONFIGURACIÓN DE EXPRESS ====================
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear datos del cuerpo de las peticiones
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================== CONFIGURACIÓN DE SESIONES ====================
// Las sesiones se almacenan en la base de datos usando Sequelize
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000, // Verificar sesiones expiradas cada 15 minutos
  expiration: 24 * 60 * 60 * 1000 // Las sesiones expiran después de 24 horas
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-cambiar-en-produccion',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevenir acceso desde JavaScript (protección XSS)
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Sincronizar tabla de sesiones con la base de datos
sessionStore.sync();

// ==================== CONFIGURACIÓN DE VISTAS ====================
// Motor de plantillas EJS para renderizar HTML dinámico
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos (CSS, imágenes, JavaScript del cliente)
app.use(express.static(path.join(__dirname, 'public')));

// ==================== MIDDLEWARE GLOBAL ====================
// Pasar datos del usuario autenticado a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// ==================== RUTAS PÚBLICAS ====================
// Redirigir según el rol del usuario o al login si no está autenticado
app.get('/', (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      const role = req.session.user.role;
      // Redirigir al dashboard correspondiente según el rol
      if (role === 'admin') {
        return res.redirect('/dashboard/admin');
      } else if (role === 'encargado') {
        return res.redirect('/dashboard/encargado');
      } else if (role === 'trabajador') {
        return res.redirect('/dashboard/trabajador');
      } else {
        return res.redirect('/dashboard/cliente');
      }
    }
    res.redirect('/auth/login');
  } catch (error) {
    next(error);
  }
});

// ==================== MONTAR RUTAS ====================
// Todas las rutas están protegidas por middleware de autenticación en sus respectivos archivos
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/cabanas', cabanaRoutes);
app.use('/reservas', reservaRoutes);
app.use('/clientes', clienteRoutes);
app.use('/implementos', implementoRoutes);
app.use('/prestamos', prestamoRoutes);
app.use('/checklists', checklistRoutes);
app.use('/mantenimientos', mantenimientoRoutes);
app.use('/reportes', reporteRoutes);
app.use('/notificaciones', notificacionRoutes);
app.use('/encargado', encargadoRoutes);
app.use('/users', userRoutes);
app.use('/calendario', calendarioRoutes);
app.use('/pagos', pagoRoutes);
app.use('/encuestas', encuestaRoutes);
app.use('/incidentes', incidenteRoutes);
app.use('/trabajador', trabajadorRoutes);
app.use('/checkin', checkinRoutes);
app.use('/observaciones', require('./routes/observaciones'));

// ==================== MANEJO DE ERRORES ====================
// Importar middleware de manejo de errores
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');

// Manejar rutas no encontradas (404) - debe ir ANTES del error handler
app.use(notFoundHandler);

// Manejo de errores - debe ir al final de todas las rutas
app.use(errorHandler);

// ==================== MANEJO DE ERRORES NO CAPTURADOS ====================
// Prevenir que el servidor se caiga por errores no manejados
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  // No terminar el proceso, solo logear para mantener el servidor activo
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  // No terminar el proceso, solo logear
});

// ==================== INICIALIZACIÓN DEL SERVIDOR ====================
/**
 * Inicia el servidor y configura los servicios en segundo plano
 * - Conecta a la base de datos
 * - Inicia el servicio de alertas automáticas de reservas (RF5)
 * - Inicia el servidor HTTP
 */
async function startServer() {
  try {
    // Intentar conectar a la base de datos, pero no bloquear el servidor si falla
    try {
      await sequelize.authenticate();
      console.log('Conexión a la base de datos establecida correctamente.');

      // ==================== SERVICIOS EN SEGUNDO PLANO ====================
      // Iniciar servicio de alertas automáticas de reservas (RF5)
      const { verificarReservasProximas } = require('./services/alertasReservas');

      // Ejecutar inmediatamente al iniciar para verificar reservas pendientes
      verificarReservasProximas().catch(err => {
        console.error('Error en verificación inicial de alertas:', err);
      });

      // Ejecutar diariamente (cada 24 horas) para verificar reservas próximas
      const INTERVALO_24_HORAS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
      setInterval(() => {
        verificarReservasProximas().catch(err => {
          console.error('Error en verificación periódica de alertas:', err);
        });
      }, INTERVALO_24_HORAS);

      console.log('Servicio de alertas de reservas iniciado. Se ejecutará diariamente.');
    } catch (dbError) {
      console.error('ADVERTENCIA: No se pudo conectar a la base de datos:', dbError.message);
      console.log('El servidor continuará ejecutándose, pero algunas funcionalidades pueden no estar disponibles.');
      // El servidor seguirá corriendo, pero las rutas que necesiten DB mostrarán errores apropiados
    }

    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('NOTA: El servidor está configurado para manejar errores sin caerse.');
    });

    // Manejar errores del servidor (como puerto en uso)
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error('\nERROR: El puerto', PORT, 'ya está en uso.');
        console.error('\nSoluciones:');
        console.error('  1. Detén el proceso que está usando el puerto', PORT);
        console.error('  2. O cambia el puerto: PORT=3001 npm start');
        console.error('\nPara detener el proceso en Windows:');
        console.error('  - Abre el Administrador de Tareas (Ctrl+Shift+Esc)');
        console.error('  - Busca "node.exe" y termínalo');
        console.error('  - O ejecuta en PowerShell:');
        console.error('    netstat -ano | findstr :' + PORT);
        console.error('    taskkill /PID <PID_NUMBER> /F');
        process.exit(1);
      } else {
        console.error('Error del servidor:', error);
        throw error;
      }
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);

    // Detectar si el error es por puerto en uso
    if (error.code === 'EADDRINUSE') {
      console.error('\nERROR: El puerto', PORT, 'ya está en uso.');
      console.error('Solución:');
      console.error('  1. Detén el proceso que está usando el puerto', PORT);
      console.error('  2. O cambia el puerto en la variable de entorno PORT');
      console.error('\nPara detener el proceso en Windows:');
      console.error('  - Abre el Administrador de Tareas (Ctrl+Shift+Esc)');
      console.error('  - Busca "node.exe" y termínalo');
      console.error('  - O ejecuta: netstat -ano | findstr :' + PORT);
      console.error('  - Luego: taskkill /PID <PID_NUMBER> /F');
      process.exit(1);
    }

    // Intentar iniciar el servidor de todas formas para mostrar una página de error
    try {
      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT} (modo de recuperación)`);
      });
    } catch (startError) {
      // Si el error de inicio también es por puerto en uso, mostrar mensaje claro
      if (startError.code === 'EADDRINUSE') {
        console.error('\nERROR: El puerto', PORT, 'ya está en uso.');
        console.error('Por favor, detén el proceso que está usando el puerto', PORT);
        process.exit(1);
      }
      console.error('No se pudo iniciar el servidor:', startError);
      process.exit(1);
    }
  }
}

// Iniciar el servidor
startServer();
