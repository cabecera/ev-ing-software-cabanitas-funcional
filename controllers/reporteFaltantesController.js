const db = require('../models');
const { ReporteFaltantes, Cabana, User } = db;

const reporteFaltantesController = {
  // Listar reportes
  list: async (req, res) => {
    try {
      const reportes = await ReporteFaltantes.findAll({
        include: [
          { model: Cabana, as: 'cabana' },
          { model: User, as: 'resolutor', required: false }
        ],
        order: [['fecha', 'DESC']]
      });

      res.render('reportes/list', { reportes });
    } catch (error) {
      console.error('Error al listar reportes:', error);
      res.status(500).render('error', {
        message: 'Error al cargar reportes',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Mostrar formulario de creación
  showCreate: async (req, res) => {
    try {
      const cabanas = await Cabana.findAll({
        order: [['nombre', 'ASC']]
      });
      res.render('reportes/create', { cabanas });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', {
        message: 'Error al cargar formulario',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Crear reporte
  create: async (req, res) => {
    try {
      const { cabanaId, descripcion, itemsFaltantes } = req.body;

      if (!cabanaId || !descripcion) {
        let cabanas = [];
        try {
          cabanas = await Cabana.findAll();
        } catch (cabanaError) {
          console.error('Error al cargar cabañas:', cabanaError);
        }
        return res.render('reportes/create', {
          error: 'Cabaña y descripción son requeridos',
          cabanas: cabanas
        });
      }

      await ReporteFaltantes.create({
        cabanaId: parseInt(cabanaId),
        descripcion,
        itemsFaltantes: itemsFaltantes ? JSON.stringify(itemsFaltantes.split(',')) : null,
        estado: 'pendiente'
      });

      res.redirect('/reportes/faltantes');
    } catch (error) {
      console.error('Error al crear reporte:', error);
      let cabanas = [];
      try {
        cabanas = await Cabana.findAll();
      } catch (cabanaError) {
        console.error('Error al cargar cabañas:', cabanaError);
      }
      res.render('reportes/create', {
        error: 'Error al crear reporte',
        cabanas: cabanas,
        req: req
      });
    }
  },

  // Resolver reporte
  resolver: async (req, res) => {
    try {
      const { id } = req.params;
      const reporte = await ReporteFaltantes.findByPk(id);

      if (!reporte) {
        return res.status(404).json({ error: 'Reporte no encontrado' });
      }

      await reporte.update({
        estado: 'resuelto',
        resueltoPor: req.session.user.id,
        fechaResolucion: new Date()
      });

      res.redirect('/reportes/faltantes');
    } catch (error) {
      console.error('Error al resolver reporte:', error);
      res.status(500).json({
        error: 'Error al resolver reporte',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Error al resolver reporte'
      });
    }
  }
};

module.exports = reporteFaltantesController;

