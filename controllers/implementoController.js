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
      res.status(500).render('error', {
        message: 'Error al cargar implementos',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Crear implemento (admin)
  create: async (req, res) => {
    try {
      const { nombre, descripcion, stockTotal, precioPrestamo } = req.body;

      if (!nombre || !stockTotal) {
        return       res.render('implementos/create', {
        error: 'Nombre y stock total son requeridos',
        req: req
      });
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
      res.render('implementos/create', {
        error: 'Error al crear implemento',
        req: req
      });
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

      // Validar que el stock total no sea negativo
      if (isNaN(nuevoStockTotal) || nuevoStockTotal < 0) {
        return res.status(400).json({ error: 'El stock total debe ser un número mayor o igual a 0' });
      }

      const diferencia = nuevoStockTotal - implemento.stockTotal;
      const nuevoStockDisponible = implemento.stockDisponible + diferencia;

      // Validar que el stock disponible no sea negativo
      if (nuevoStockDisponible < 0) {
        return res.status(400).json({
          error: `No se puede reducir el stock total. El stock disponible actual (${implemento.stockDisponible}) no permite reducir ${Math.abs(diferencia)} unidades. Stock disponible mínimo requerido: ${Math.abs(diferencia)}`
        });
      }

      // Validar que el stock disponible no exceda el stock total
      if (nuevoStockDisponible > nuevoStockTotal) {
        return res.status(400).json({
          error: `El stock disponible (${nuevoStockDisponible}) no puede ser mayor que el stock total (${nuevoStockTotal})`
        });
      }

      await implemento.update({
        nombre,
        descripcion: descripcion || null,
        stockTotal: nuevoStockTotal,
        stockDisponible: nuevoStockDisponible,
        precioPrestamo: precioPrestamo ? parseFloat(precioPrestamo) : 0
      });

      res.redirect('/implementos');
    } catch (error) {
      console.error('Error al actualizar implemento:', error);
      res.status(500).json({
        error: 'Error al actualizar implemento',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Error al actualizar implemento'
      });
    }
  }
};

module.exports = implementoController;

