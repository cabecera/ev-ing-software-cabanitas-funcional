const db = require('../models');
const { PreparacionCabana, Reserva, Cabana, TareaPreparacion, ItemPreparacionCompletado, EntregaCabana, ChecklistInventario, ItemVerificacion, TareaTrabajador, User, Cliente } = db;
const { Op } = require('sequelize');

const encargadoController = {
  // Listar preparaciones pendientes
  listPreparaciones: async (req, res) => {
    try {
      const preparaciones = await PreparacionCabana.findAll({
        where: {
          estado: {
            [Op.in]: ['pendiente', 'en_proceso']
          }
        },
        include: [
          { model: Reserva, as: 'reserva', include: ['cliente'] },
          { model: Cabana, as: 'cabana' }
        ],
        order: [['fechaInicio', 'ASC']]
      });

      res.render('encargado/preparaciones', { preparaciones });
    } catch (error) {
      console.error('Error al listar preparaciones:', error);
      res.status(500).render('error', { message: 'Error al cargar preparaciones', error });
    }
  },

  // Iniciar preparación
  iniciarPreparacion: async (req, res) => {
    try {
      const { reservaId } = req.params;
      const reserva = await Reserva.findByPk(reservaId, {
        include: [{ model: Cabana, as: 'cabana' }]
      });

      if (!reserva) {
        return res.status(404).render('error', { message: 'Reserva no encontrada', error: {} });
      }

      // Verificar si ya existe una preparación
      let preparacion = await PreparacionCabana.findOne({ where: { reservaId } });

      if (!preparacion) {
        preparacion = await PreparacionCabana.create({
          reservaId,
          cabanaId: reserva.cabanaId,
          estado: 'pendiente'
        });

        // Crear items de preparación basados en tareas estándar
        const tareas = await TareaPreparacion.findAll({ where: { activo: true } });

        for (const tarea of tareas) {
          await ItemPreparacionCompletado.create({
            preparacionId: preparacion.id,
            tareaId: tarea.id,
            completado: false
          });
        }
      }

      res.redirect(`/encargado/preparacion/${preparacion.id}`);
    } catch (error) {
      console.error('Error al iniciar preparación:', error);
      res.status(500).render('error', { message: 'Error al iniciar preparación', error });
    }
  },

  // Ver detalles de preparación
  verPreparacion: async (req, res) => {
    try {
      const { id } = req.params;
      const preparacion = await PreparacionCabana.findByPk(id, {
        include: [
          { model: Reserva, as: 'reserva', include: ['cliente', 'cabana'] },
          { model: Cabana, as: 'cabana' },
          {
            model: ItemPreparacionCompletado,
            as: 'tareasCompletadas',
            include: [{ model: TareaPreparacion, as: 'tarea' }]
          }
        ]
      });

      if (!preparacion) {
        return res.status(404).render('error', { message: 'Preparación no encontrada', error: {} });
      }

      res.render('encargado/ver_preparacion', { preparacion });
    } catch (error) {
      console.error('Error al ver preparación:', error);
      res.status(500).render('error', { message: 'Error al cargar preparación', error });
    }
  },

  // Completar tarea de preparación
  completarTarea: async (req, res) => {
    try {
      const { id, tareaId } = req.params;
      const item = await ItemPreparacionCompletado.findOne({
        where: { preparacionId: id, tareaId }
      });

      if (!item) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      await item.update({
        completado: true,
        fechaCompletado: new Date()
      });

      // Verificar si todas las tareas están completadas
      const preparacion = await PreparacionCabana.findByPk(id, {
        include: [{ model: ItemPreparacionCompletado, as: 'tareasCompletadas' }]
      });

      const todasCompletadas = preparacion.tareasCompletadas.every(t => t.completado);

      if (todasCompletadas) {
        await preparacion.update({
          estado: 'completada',
          fechaCompletado: new Date()
        });

        // Crear entrega de cabaña
        const checklist = await ChecklistInventario.findOne({ where: { activo: true } });

        await EntregaCabana.create({
          reservaId: preparacion.reservaId,
          cabanaId: preparacion.cabanaId,
          checklistId: checklist ? checklist.id : null,
          estado: 'pendiente'
        });
      } else {
        if (preparacion.estado === 'pendiente') {
          await preparacion.update({ estado: 'en_proceso' });
        }
      }

      res.redirect(`/encargado/preparacion/${id}`);
    } catch (error) {
      console.error('Error al completar tarea:', error);
      res.status(500).json({ error: 'Error al completar tarea' });
    }
  },

  // Listar trabajadores y asignar tareas
  listTrabajadores: async (req, res) => {
    try {
      let trabajadores = [];
      let cabanas = [];
      let preparaciones = [];
      let tareasPendientes = [];

      try {
        trabajadores = await User.findAll({
          where: { role: 'trabajador', activo: true },
          order: [['email', 'ASC']]
        });
      } catch (err) {
        console.error('Error al cargar trabajadores:', err);
        throw new Error('Error al cargar trabajadores: ' + err.message);
      }

      try {
        cabanas = await Cabana.findAll({ order: [['nombre', 'ASC']] });
      } catch (err) {
        console.warn('Error al cargar cabañas:', err.message);
      }

      try {
        preparaciones = await PreparacionCabana.findAll({
          where: { estado: { [Op.in]: ['pendiente', 'en_proceso'] } },
          include: [{ model: Reserva, as: 'reserva' }]
        });
      } catch (err) {
        console.warn('Error al cargar preparaciones:', err.message);
      }

      try {
        tareasPendientes = await TareaTrabajador.findAll({
          include: [
            { model: User, as: 'trabajador' },
            { model: Cabana, as: 'cabana', required: false },
            { model: PreparacionCabana, as: 'preparacion', required: false }
          ],
          order: [['fechaAsignacion', 'DESC']]
        });
      } catch (err) {
        console.warn('Error al cargar tareas:', err.message);
        // Si la tabla no existe o hay otro error, simplemente usar array vacío
        if (err.message.includes("doesn't exist") || err.message.includes("Unknown table")) {
          console.log('La tabla tarea_trabajadores no existe. Ejecuta: npm run migrate');
        }
      }

      // Asegurarse de que siempre sean arrays
      trabajadores = trabajadores || [];
      cabanas = cabanas || [];
      preparaciones = preparaciones || [];
      tareasPendientes = tareasPendientes || [];

      res.render('encargado/trabajadores', {
        trabajadores: trabajadores || [],
        tareasPendientes: tareasPendientes || [],
        cabanas: cabanas || [],
        preparaciones: preparaciones || []
      });
    } catch (error) {
      console.error('Error al listar trabajadores:', error);
      console.error('Stack:', error.stack);

      // Intentar renderizar con valores por defecto para debugging
      try {
        res.status(500).render('error', {
          message: 'Error al cargar trabajadores',
          error: {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          },
          req: req
        });
      } catch (renderError) {
        console.error('Error al renderizar página de error:', renderError);
        res.status(500).send(`
          <h1>Error</h1>
          <p>Error al cargar trabajadores: ${error.message}</p>
          <a href="/">Volver al inicio</a>
        `);
      }
    }
  },

  // Asignar tarea a trabajador
  asignarTarea: async (req, res) => {
    try {
      const { trabajadorId, cabanaId, preparacionId, tipo, descripcion, fechaAsignada } = req.body;

      if (!trabajadorId || !tipo || !descripcion) {
        return res.render('encargado/trabajadores', {
          error: 'Faltan datos requeridos',
          trabajadores: await User.findAll({ where: { role: 'trabajador', activo: true } }),
          tareasPendientes: [],
          cabanas: await Cabana.findAll(),
          preparaciones: []
        });
      }

      await TareaTrabajador.create({
        trabajadorId: parseInt(trabajadorId),
        asignadoPor: req.session.user.id,
        cabanaId: cabanaId ? parseInt(cabanaId) : null,
        preparacionId: preparacionId ? parseInt(preparacionId) : null,
        tipo,
        descripcion,
        fechaAsignacion: fechaAsignada || new Date().toISOString().split('T')[0],
        estado: 'pendiente'
      });

      res.redirect('/encargado/trabajadores');
    } catch (error) {
      console.error('Error al asignar tarea:', error);

      // Si la tabla no existe, mostrar mensaje más claro
      if (error.message.includes("doesn't exist") || error.message.includes("Unknown table")) {
        return res.status(500).render('error', {
          message: 'La tabla de tareas de trabajadores no existe. Por favor ejecuta las migraciones: npm run migrate',
          error: { message: error.message }
        });
      }

      const trabajadores = await User.findAll({ where: { role: 'trabajador', activo: true } }).catch(() => []);
      const cabanas = await Cabana.findAll().catch(() => []);

      res.render('encargado/trabajadores', {
        error: 'Error al asignar tarea: ' + error.message,
        trabajadores,
        tareasPendientes: [],
        cabanas,
        preparaciones: []
      });
    }
  },

  // Ver reservas confirmadas para iniciar preparación
  reservasConfirmadas: async (req, res) => {
    try {
      const reservas = await Reserva.findAll({
        where: {
          estado: 'confirmada',
          fechaInicio: { [Op.gte]: new Date() }
        },
        include: [
          { model: Cabana, as: 'cabana' },
          { model: Cliente, as: 'cliente' },
          { model: PreparacionCabana, as: 'preparacion', required: false }
        ],
        order: [['fechaInicio', 'ASC']]
      });

      const reservasConPreparacion = reservas.map(r => ({
        ...r.toJSON(),
        preparacion: r.preparacion || null
      }));
      res.render('encargado/reservas_confirmadas', { reservas: reservasConPreparacion });
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      res.status(500).render('error', { message: 'Error al cargar reservas', error });
    }
  }
};

module.exports = encargadoController;
