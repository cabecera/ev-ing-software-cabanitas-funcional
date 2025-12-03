const db = require('../models');
const { Cabana, Reserva, Mantenimiento } = db;
const { Op } = require('sequelize');

const cabanaController = {
  // Listar todas las cabañas
  list: async (req, res) => {
    try {
      const cabanas = await Cabana.findAll({
        order: [['nombre', 'ASC']]
      });
      res.render('cabanas/list', { cabanas, user: req.session.user });
    } catch (error) {
      console.error('Error al listar cabañas:', error);
      res.status(500).render('error', { message: 'Error al cargar cabañas', error });
    }
  },

  // Mostrar formulario de creación (admin)
  showCreate: (req, res) => {
    res.render('cabanas/create');
  },

  // Crear cabaña (admin)
  create: async (req, res) => {
    try {
      const { nombre, capacidad, precioNoche, descripcion, fotos } = req.body;

      if (!nombre || !capacidad || !precioNoche) {
        return res.render('cabanas/create', { error: 'Nombre, capacidad y precio son requeridos' });
      }

      await Cabana.create({
        nombre,
        capacidad: parseInt(capacidad),
        precioNoche: parseFloat(precioNoche),
        descripcion: descripcion || null,
        fotos: fotos ? JSON.stringify(fotos.split(',')) : null,
        estado: 'disponible'
      });

      res.redirect('/cabanas');
    } catch (error) {
      console.error('Error al crear cabaña:', error);
      res.render('cabanas/create', { error: 'Error al crear cabaña' });
    }
  },

  // Mostrar detalles de cabaña
  show: async (req, res) => {
    try {
      const { id } = req.params;
      const cabana = await Cabana.findByPk(id, {
        include: [
          {
            model: Reserva,
            as: 'reservas',
            where: {
              estado: {
                [Op.in]: ['pendiente', 'confirmada']
              }
            },
            required: false
          }
        ]
      });

      if (!cabana) {
        return res.status(404).render('error', { message: 'Cabaña no encontrada', error: {} });
      }

      res.render('cabanas/show', { cabana, user: req.session.user });
    } catch (error) {
      console.error('Error al mostrar cabaña:', error);
      res.status(500).render('error', { message: 'Error al cargar cabaña', error });
    }
  },

  // Mostrar formulario de edición (admin)
  showEdit: async (req, res) => {
    try {
      const { id } = req.params;
      const cabana = await Cabana.findByPk(id);

      if (!cabana) {
        return res.status(404).render('error', { message: 'Cabaña no encontrada', error: {} });
      }

      res.render('cabanas/edit', { cabana });
    } catch (error) {
      console.error('Error al cargar cabaña:', error);
      res.status(500).render('error', { message: 'Error al cargar cabaña', error });
    }
  },

  // Actualizar cabaña (admin)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, capacidad, precioNoche, descripcion, estado, fotos } = req.body;

      const cabana = await Cabana.findByPk(id);
      if (!cabana) {
        return res.status(404).render('error', { message: 'Cabaña no encontrada', error: {} });
      }

      await cabana.update({
        nombre,
        capacidad: parseInt(capacidad),
        precioNoche: parseFloat(precioNoche),
        descripcion: descripcion || null,
        estado: estado || cabana.estado,
        fotos: fotos ? JSON.stringify(fotos.split(',')) : cabana.fotos
      });

      res.redirect('/cabanas');
    } catch (error) {
      console.error('Error al actualizar cabaña:', error);
      res.status(500).render('error', { message: 'Error al actualizar cabaña', error });
    }
  },

  // Eliminar cabaña (admin)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const cabana = await Cabana.findByPk(id);

      if (!cabana) {
        return res.status(404).json({ error: 'Cabaña no encontrada' });
      }

      await cabana.destroy();
      res.redirect('/cabanas');
    } catch (error) {
      console.error('Error al eliminar cabaña:', error);
      res.status(500).json({ error: 'Error al eliminar cabaña' });
    }
  }
};

module.exports = cabanaController;
