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

  // Mostrar formulario de edición (admin)
  showEdit: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(404).render('error', {
          message: 'ID de usuario inválido',
          error: {},
          req: req
        });
      }

      const user = await User.findByPk(id, {
        include: [{ model: Cliente, as: 'cliente', required: false }]
      });

      if (!user) {
        return res.status(404).render('error', {
          message: 'Usuario no encontrado',
          error: {},
          req: req
        });
      }

      res.render('users/edit', { user, req });
    } catch (error) {
      console.error('Error al cargar usuario para edición:', error);
      res.status(500).render('error', {
        message: 'Error al cargar usuario',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Actualizar usuario (admin)
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, role, activo, nombre, apellido, telefono, direccion, dni } = req.body;

      const user = await User.findByPk(id, {
        include: [{ model: Cliente, as: 'cliente', required: false }]
      });

      if (!user) {
        return res.status(404).render('error', {
          message: 'Usuario no encontrado',
          error: {},
          req: req
        });
      }

      // No permitir modificar su propia cuenta (excepto password)
      if (user.id === req.session.user.id && (email !== user.email || role !== user.role || activo !== user.activo)) {
        return res.render('users/edit', {
          user,
          error: 'No puedes modificar tu propio email, rol o estado. Solo puedes cambiar tu contraseña.',
          req
        });
      }

      // Validar email si cambió
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.render('users/edit', {
            user,
            error: 'El email ya está registrado por otro usuario',
            req
          });
        }
      }

      // Actualizar usuario
      let activoValue = user.activo; // Mantener valor actual por defecto
      if (activo !== undefined) {
        activoValue = activo === 'true' || activo === true || activo === 'on' || activo === 1 || activo === '1';
      }

      const updateData = {
        email: email || user.email,
        role: role || user.role,
        activo: activoValue
      };

      // Si se proporciona nueva contraseña, actualizarla
      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Guardar rol anterior antes de actualizar
      const rolAnterior = user.role;
      const nuevoRol = role || user.role;

      await user.update(updateData);

      // Recargar usuario con cliente para tener datos actualizados
      await user.reload({ include: [{ model: Cliente, as: 'cliente', required: false }] });

      // Manejar datos del cliente

      if (nuevoRol === 'cliente') {
        if (user.cliente) {
          // Actualizar cliente existente
          await user.cliente.update({
            nombre: nombre || user.cliente.nombre || '',
            apellido: apellido || user.cliente.apellido || '',
            telefono: telefono || null,
            direccion: direccion || null,
            dni: dni || null
          });
        } else if (nombre && apellido) {
          // Crear cliente si no existe
          await Cliente.create({
            userId: user.id,
            nombre,
            apellido,
            telefono: telefono || null,
            direccion: direccion || null,
            dni: dni || null
          });
        }
      } else if (rolAnterior === 'cliente' && nuevoRol !== 'cliente' && user.cliente) {
        // Si el rol cambió de cliente a otro, eliminar registro de cliente
        await user.cliente.destroy();
      }

      res.redirect('/users?updated=true');
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      try {
        const user = await User.findByPk(req.params.id, {
          include: [{ model: Cliente, as: 'cliente', required: false }]
        });
        res.render('users/edit', {
          user,
          error: 'Error al actualizar usuario. Intenta nuevamente.',
          req
        });
      } catch (loadError) {
        res.status(500).render('error', {
          message: 'Error al actualizar usuario',
          error: process.env.NODE_ENV === 'development' ? error : {},
          req: req
        });
      }
    }
  },

  // Eliminar usuario (admin)
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        include: [{ model: Cliente, as: 'cliente', required: false }]
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // No permitir eliminarse a sí mismo
      if (user.id === req.session.user.id) {
        return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' });
      }

      // Eliminar cliente asociado si existe
      if (user.cliente) {
        await user.cliente.destroy();
      }

      // Eliminar usuario
      await user.destroy();

      res.redirect('/users?deleted=true');
    } catch (error) {
      console.error('Error al eliminar usuario:', error);

      // Si hay error de foreign key, intentar desactivar en lugar de eliminar
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        try {
          await user.update({ activo: false });
          return res.redirect('/users?deactivated=true');
        } catch (updateError) {
          console.error('Error al desactivar usuario:', updateError);
        }
      }

      res.status(500).json({ error: 'Error al eliminar usuario. El usuario puede tener registros asociados.' });
    }
  }
};

module.exports = userController;
