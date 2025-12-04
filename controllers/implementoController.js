const db = require('../models');
const { Implemento } = db;

const implementoController = {
  // Listar implementos
  list: async (req, res) => {
    try {
      const implementos = await Implemento.findAll({
        order: [['nombre', 'ASC']]
      });
      res.render('implementos/list', { implementos });
    } catch (error) {
      console.error('Error al listar implementos:', error);
      res.status(500).render('error', { message: 'Error al cargar implementos', error });
    }
  },

  // Crear implemento (admin)
  create: async (req, res) => {
    try {
      const { nombre, descripcion, stockTotal, precioPrestamo } = req.body;

      if (!nombre || !stockTotal) {
        return res.render('implementos/create', { error: 'Nombre y stock total son requeridos' });
      }

      await Implemento.create({
        nombre,
        descripcion: descripcion || null,
        stockTotal: parseInt(stockTotal),
        stockDisponible: parseInt(stockTotal),
        precioPrestamo: precioPrestamo ? parseFloat(precioPrestamo) : 0
      });

      res.redirect('/implementos');
    } catch (error) {
      console.error('Error al crear implemento:', error);
      res.render('implementos/create', { error: 'Error al crear implemento' });
    }
  },

  // Actualizar implemento (admin)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, stockTotal, precioPrestamo } = req.body;

      const implemento = await Implemento.findByPk(id);
      if (!implemento) {
        return res.status(404).json({ error: 'Implemento no encontrado' });
      }

      const nuevoStockTotal = parseInt(stockTotal);
      const diferencia = nuevoStockTotal - implemento.stockTotal;

      await implemento.update({
        nombre,
        descripcion: descripcion || null,
        stockTotal: nuevoStockTotal,
        stockDisponible: implemento.stockDisponible + diferencia,
        precioPrestamo: precioPrestamo ? parseFloat(precioPrestamo) : 0
      });

      res.redirect('/implementos');
    } catch (error) {
      console.error('Error al actualizar implemento:', error);
      res.status(500).json({ error: 'Error al actualizar implemento' });
    }
  }
};

module.exports = implementoController;

