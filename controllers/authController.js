const bcrypt = require('bcrypt');
const db = require('../models');
const { User, Cliente } = db;

const authController = {
  // Mostrar formulario de login
  showLogin: (req, res) => {
    if (req.session.user) {
      return res.redirect('/dashboard');
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
      return res.redirect('/dashboard');
    }
    res.render('auth/registro', { error: null });
  },

  // Procesar registro
  register: async (req, res) => {
    try {
      const { email, password, nombre, apellido, telefono, direccion, dni } = req.body;

      if (!email || !password || !nombre || !apellido) {
        return res.render('auth/registro', { error: 'Email, contraseña, nombre y apellido son requeridos' });
      }

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.render('auth/registro', { error: 'El email ya está registrado' });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = await User.create({
        email,
        password: hashedPassword,
        role: 'cliente',
        activo: true
      });

      // Crear cliente
      await Cliente.create({
        userId: user.id,
        nombre,
        apellido,
        telefono: telefono || null,
        direccion: direccion || null,
        dni: dni || null
      });

      res.redirect('/auth/login?registered=true');
    } catch (error) {
      console.error('Error en registro:', error);
      res.render('auth/registro', { error: 'Error al registrar. Intenta nuevamente.' });
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
