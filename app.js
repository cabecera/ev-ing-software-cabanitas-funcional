require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const { Sequelize } = require('sequelize');
const dbConfig = require('./config/database');
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging
});

// Importar rutas
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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurar sesiones
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-cambiar-en-produccion',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Crear tabla de sesiones si no existe
sessionStore.sync();

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para pasar datos del usuario a las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// Rutas públicas
app.get('/', (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      const role = req.session.user.role;
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

// Montar rutas
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

// Importar middleware de manejo de errores
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');

// Manejar rutas no encontradas (404) - debe ir ANTES del error handler
app.use(notFoundHandler);

// Manejo de errores - debe ir al final
app.use(errorHandler);

// Manejar errores no capturados del proceso
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  // No terminar el proceso, solo logear
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  // No terminar el proceso, solo logear
});

// Inicializar base de datos y servidor
async function startServer() {
  try {
    // Intentar conectar a la base de datos, pero no bloquear el servidor si falla
    try {
      await sequelize.authenticate();
      console.log('Conexión a la base de datos establecida correctamente.');

      // Iniciar job de alertas de reservas (RF5)
      const { verificarReservasProximas } = require('./jobs/alertasReservas');

      // Ejecutar inmediatamente al iniciar
      verificarReservasProximas().catch(err => {
        console.error('Error en verificación inicial de alertas:', err);
      });

      // Ejecutar diariamente a las 9:00 AM (cada 24 horas)
      const INTERVALO_24_HORAS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
      setInterval(() => {
        verificarReservasProximas().catch(err => {
          console.error('Error en verificación periódica de alertas:', err);
        });
      }, INTERVALO_24_HORAS);

      console.log('Job de alertas de reservas iniciado. Se ejecutará diariamente.');
    } catch (dbError) {
      console.error('ADVERTENCIA: No se pudo conectar a la base de datos:', dbError.message);
      console.log('El servidor continuará ejecutándose, pero algunas funcionalidades pueden no estar disponibles.');
      // El servidor seguirá corriendo, pero las rutas que necesiten DB mostrarán errores apropiados
    }

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('NOTA: El servidor está configurado para manejar errores sin caerse.');
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    // Intentar iniciar el servidor de todas formas para mostrar una página de error
    try {
      app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT} (modo de recuperación)`);
      });
    } catch (startError) {
      console.error('No se pudo iniciar el servidor:', startError);
      process.exit(1);
    }
  }
}

startServer();
