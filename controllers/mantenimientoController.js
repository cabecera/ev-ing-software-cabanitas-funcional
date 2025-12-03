const db = require('../models');
const { Mantenimiento, Cabana } = db;

const mantenimientoController = {
  // Listar mantenimientos
  list: async (req, res) => {
    try {
      const mantenimientos = await Mantenimiento.findAll({
        include: [{ model: Cabana, as: 'cabana' }],
        order: [['fechaInicio', 'DESC']]
      });

      res.render('mantenimientos/list', { mantenimientos });
    } catch (error) {
      console.error('Error al listar mantenimientos:', error);
      res.status(500).render('error', { message: 'Error al cargar mantenimientos', error });
    }
  },

  // Mostrar formulario de creación
  showCreate: async (req, res) => {
    try {
      const cabanas = await Cabana.findAll({
        order: [['nombre', 'ASC']]
      });
      res.render('mantenimientos/create', { cabanas });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', { message: 'Error al cargar formulario', error });
    }
  },

  // Crear mantenimiento
  create: async (req, res) => {
    try {
      const { cabanaId, fechaInicio, fechaFin, tipo, descripcion } = req.body;

      if (!cabanaId || !fechaInicio || !fechaFin || !tipo) {
        return res.render('mantenimientos/create', {
          error: 'Todos los campos son requeridos',
          cabanas: await Cabana.findAll()
        });
      }

      const mantenimiento = await Mantenimiento.create({
        cabanaId: parseInt(cabanaId),
        fechaInicio,
        fechaFin,
        tipo,
        descripcion: descripcion || null,
        estado: 'programado'
      });

      // Cambiar estado de cabaña a mantenimiento
      await Cabana.update(
        { estado: 'mantenimiento' },
        { where: { id: cabanaId } }
      );

      res.redirect('/mantenimientos');
    } catch (error) {
      console.error('Error al crear mantenimiento:', error);
      res.render('mantenimientos/create', {
        error: 'Error al crear mantenimiento',
        cabanas: await Cabana.findAll()
      });
    }
  },

  // Completar mantenimiento
  completar: async (req, res) => {
    try {
      const { id } = req.params;
      const mantenimiento = await Mantenimiento.findByPk(id);

      if (!mantenimiento) {
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }

      await mantenimiento.update({
        estado: 'completado'
      });

      // Liberar cabaña
      await Cabana.update(
        { estado: 'disponible' },
        { where: { id: mantenimiento.cabanaId } }
      );

      res.redirect('/mantenimientos');
    } catch (error) {
      console.error('Error al completar mantenimiento:', error);
      res.status(500).json({ error: 'Error al completar mantenimiento' });
    }
  }
};

module.exports = mantenimientoController;
