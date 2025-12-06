const bcrypt = require('bcrypt');
const db = require('../models');
const { User, Cliente } = db;

const authController = {
  // Mostrar formulario de login
  showLogin: (req, res) => {
    if (req.session.user) {
      const role = req.session.user.role;
      if (role === 'admin') {
        return res.redirect('/dashboard/admin');
      } else if (role === 'encargado') {
        return res.redirect('/dashboard/encargado');
      } else if (role === 'trabajador') {
        return res.redirect('/dashboard/trabajador');
      } else {
        return res.redirect('/dashboard/cliente');
      }
    }
    res.render('auth/login', { error: null });
  },

  // Procesar login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.render('auth/login', { error: 'Email y contraseña son requeridos' });
      }

      const user = await User.findOne({ where: { email } });

      if (!user || !user.activo) {
        return res.render('auth/login', { error: 'Credenciales inválidas' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.render('auth/login', { error: 'Credenciales inválidas' });
      }

      // Obtener datos del cliente si existe
      let cliente = null;
      if (user.role === 'cliente') {
        cliente = await Cliente.findOne({ where: { userId: user.id } });
      }

      req.session.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        clienteId: cliente ? cliente.id : null
      };

      // Redirigir según el rol
      if (user.role === 'admin') {
        return res.redirect('/dashboard/admin');
      } else if (user.role === 'encargado') {
        return res.redirect('/dashboard/encargado');
      } else if (user.role === 'trabajador') {
        return res.redirect('/dashboard/trabajador');
      } else {
        return res.redirect('/dashboard/cliente');
      }
    } catch (error) {
      console.error('Error en login:', error);
      res.render('auth/login', { error: 'Error al iniciar sesión. Intenta nuevamente.' });
    }
  },

  // Mostrar formulario de registro
  showRegister: (req, res) => {
    if (req.session.user) {
      const role = req.session.user.role;
      if (role === 'admin') {
        return res.redirect('/dashboard/admin');
      } else if (role === 'encargado') {
        return res.redirect('/dashboard/encargado');
      } else if (role === 'trabajador') {
        return res.redirect('/dashboard/trabajador');
      } else {
        return res.redirect('/dashboard/cliente');
      }
    }
    res.render('auth/registro', { error: null });
  },

  // Procesar registro
  register: async (req, res) => {
    // Usar transacción para asegurar atomicidad (si falla algo, se revierte todo)
    const transaction = await db.sequelize.transaction();

    try {
      const { email, password, nombre, apellido, telefono, direccion, dni } = req.body;

      // Validar campos requeridos
      if (!email || !password || !nombre || !apellido) {
        await transaction.rollback();
        return res.render('auth/registro', { error: 'Email, contraseña, nombre y apellido son requeridos' });
      }

      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        await transaction.rollback();
        return res.render('auth/registro', { error: 'El formato del email no es válido' });
      }

      // Validar longitud mínima de contraseña
      if (password.length < 6) {
        await transaction.rollback();
        return res.render('auth/registro', { error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email }, transaction });
      if (existingUser) {
        await transaction.rollback();
        return res.render('auth/registro', { error: 'El email ya está registrado. Por favor, usa otro email o inicia sesión.' });
      }

      // Si se proporciona DNI, verificar que no esté duplicado
      if (dni) {
        const existingCliente = await Cliente.findOne({ where: { dni }, transaction });
        if (existingCliente) {
          await transaction.rollback();
          return res.render('auth/registro', { error: 'El DNI ya está registrado en el sistema' });
        }
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario dentro de la transacción
      const user = await User.create({
        email,
        password: hashedPassword,
        role: 'cliente',
        activo: true
      }, { transaction });

      // Crear cliente dentro de la transacción
      await Cliente.create({
        userId: user.id,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono ? telefono.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        dni: dni ? dni.trim() : null
      }, { transaction });

      // Si todo salió bien, confirmar la transacción
      await transaction.commit();

      res.redirect('/auth/login?registered=true');
    } catch (error) {
      // Si hay un error, revertir la transacción
      await transaction.rollback();

      console.error('Error en registro:', error);

      // Mensajes de error más específicos según el tipo de error
      let errorMessage = 'Error al registrar. Intenta nuevamente.';

      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.fields && error.fields.includes('email')) {
          errorMessage = 'El email ya está registrado. Por favor, usa otro email o inicia sesión.';
        } else if (error.fields && error.fields.includes('dni')) {
          errorMessage = 'El DNI ya está registrado en el sistema.';
        } else {
          errorMessage = 'Ya existe un registro con estos datos. Verifica tu información.';
        }
      } else if (error.name === 'SequelizeValidationError') {
        errorMessage = 'Los datos proporcionados no son válidos. Verifica que todos los campos estén correctamente completados.';
      } else if (error.name === 'SequelizeDatabaseError') {
        errorMessage = 'Error de conexión con la base de datos. Por favor, intenta más tarde.';
      }

      res.render('auth/registro', { error: errorMessage });
    }
  },

  // Logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al cerrar sesión:', err);
      }
      res.redirect('/auth/login');
    });
  }
};

module.exports = authController;
