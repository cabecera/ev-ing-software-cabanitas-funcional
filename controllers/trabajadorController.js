const db = require('../models');
const { TareaTrabajador, User, Cabana, PreparacionCabana } = db;

const trabajadorController = {
  // Listar tareas del trabajador
  misTareas: async (req, res) => {
    try {
      const trabajadorId = req.session.user.id;
      const tareas = await TareaTrabajador.findAll({
        where: { trabajadorId },
        include: [
          { model: Cabana, as: 'cabana', required: false },
          { model: PreparacionCabana, as: 'preparacion', required: false },
          { model: User, as: 'asignador' }
        ],
        order: [['fechaAsignacion', 'DESC'], ['estado', 'ASC']]
      });

      res.render('trabajador/mis_tareas', { tareas });
    } catch (error) {
      console.error('Error al listar tareas:', error);
      res.status(500).render('error', { message: 'Error al cargar tareas', error });
    }
  },

  // Ver detalle de tarea
  verTarea: async (req, res) => {
    try {
      const { id } = req.params;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id, {
        include: [
          { model: Cabana, as: 'cabana', required: false },
          { model: PreparacionCabana, as: 'preparacion', required: false },
          { model: User, as: 'trabajador' },
          { model: User, as: 'asignador' }
        ]
      });

      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        return res.status(404).render('error', { message: 'Tarea no encontrada', error: {} });
      }

      res.render('trabajador/ver_tarea', { tarea });
    } catch (error) {
      console.error('Error al cargar tarea:', error);
      res.status(500).render('error', { message: 'Error al cargar tarea', error });
    }
  },

  // Completar tarea
  completarTarea: async (req, res) => {
    try {
      const { id } = req.params;
      const { observaciones, reporteDanos } = req.body;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id);
      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      await tarea.update({
        estado: 'completada',
        fechaCompletado: new Date(),
        observaciones: observaciones || null,
        reporteDanios: reporteDanos || null
      });

      res.redirect('/trabajador/tareas');
    } catch (error) {
      console.error('Error al completar tarea:', error);
      res.status(500).json({ error: 'Error al completar tarea' });
    }
  },

  // Iniciar tarea
  iniciarTarea: async (req, res) => {
    try {
      const { id } = req.params;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id);
      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      await tarea.update({ estado: 'en_proceso' });

      res.redirect('/trabajador/tareas');
    } catch (error) {
      console.error('Error al iniciar tarea:', error);
      res.status(500).json({ error: 'Error al iniciar tarea' });
    }
  },

  // Reportar daño rápido
  reportarDano: async (req, res) => {
    try {
      const { id } = req.params;
      const { reporteDanos } = req.body;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id);
      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      await tarea.update({
        reporteDanios: (tarea.reporteDanios || '') + '\n' + reporteDanos
      });

      res.redirect('/trabajador/tareas');
    } catch (error) {
      console.error('Error al reportar daño:', error);
      res.status(500).json({ error: 'Error al reportar daño' });
    }
  }
};

module.exports = trabajadorController;
