const bcrypt = require('bcrypt');
const db = require('../models');
const { User, Cliente } = db;

const userController = {
  // Listar todos los usuarios (admin)
  list: async (req, res) => {
    try {
      const users = await User.findAll({
        include: [
          { model: Cliente, as: 'cliente', required: false }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.render('users/list', { users: users || [], req: req });
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      res.status(500).render('error', {
        message: 'Error al cargar usuarios',
        error: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  },

  // Mostrar formulario de creación (admin)
  showCreate: (req, res) => {
    try {
      res.render('users/create');
    } catch (error) {
      console.error('Error al mostrar formulario de creación:', error);
      res.status(500).render('error', {
        message: 'Error al cargar formulario',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Crear usuario (admin)
  create: async (req, res) => {
    try {
      const { email, password, role, nombre, apellido, telefono, direccion, dni } = req.body;

      if (!email || !password || !role) {
        return res.render('users/create', { error: 'Email, contraseña y rol son requeridos' });
      }

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.render('users/create', { error: 'El email ya está registrado' });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = await User.create({
        email,
        password: hashedPassword,
        role,
        activo: true
      });

      // Si es cliente, crear registro en tabla clientes
      if (role === 'cliente' && nombre && apellido) {
        await Cliente.create({
          userId: user.id,
          nombre,
          apellido,
          telefono: telefono || null,
          direccion: direccion || null,
          dni: dni || null
        });
      }

      res.redirect('/users');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.render('users/create', { error: 'Error al crear usuario. Intenta nuevamente.' });
    }
  },

  // Activar/Desactivar usuario (admin)
  toggleActivo: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // No permitir desactivarse a sí mismo
      if (user.id === req.session.user.id) {
        return res.status(403).json({ error: 'No puedes desactivar tu propia cuenta' });
      }

      await user.update({ activo: !user.activo });

      res.redirect('/users');
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      res.status(500).json({ error: 'Error al cambiar estado del usuario' });
    }
  }
};

module.exports = userController;
