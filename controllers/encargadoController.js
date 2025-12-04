const db = require('../models');
const { PreparacionCabana, Reserva, Cabana, TareaPreparacion, ItemPreparacionCompletado, EntregaCabana, ChecklistInventario, ItemVerificacion, User, Cliente } = db;
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
