const db = require('../models');
const { Mantenimiento, Cabana, Implemento, User, TareaTrabajador, Reserva, Cliente } = db;
const { Op } = require('sequelize');
const { crearNotificacion } = require('./notificacionController');
const Sequelize = require('sequelize');

const mantenimientoController = {
  // Listar mantenimientos
  list: async (req, res) => {
    try {
      let mantenimientos = [];
      try {
        mantenimientos = await Mantenimiento.findAll({
          include: [
            { model: Cabana, as: 'cabana', required: false },
            { model: Implemento, as: 'implemento', required: false },
            { model: User, as: 'trabajador', required: false }
          ],
          order: [
            [Sequelize.literal("CASE WHEN prioridad = 'urgente' THEN 1 WHEN prioridad = 'alta' THEN 2 WHEN prioridad = 'media' THEN 3 WHEN prioridad = 'baja' THEN 4 ELSE 5 END"), 'ASC'],
            ['fechaInicio', 'DESC']
          ]
        });
      } catch (error) {
        console.error('Error en query con prioridad, usando ordenamiento simple:', error);
        try {
          mantenimientos = await Mantenimiento.findAll({
            include: [
              { model: Cabana, as: 'cabana', required: false },
              { model: Implemento, as: 'implemento', required: false },
              { model: User, as: 'trabajador', required: false }
            ],
            order: [['fechaInicio', 'DESC']]
          });
        } catch (innerError) {
          console.error('Error en query simple:', innerError);
          mantenimientos = [];
        }
      }

      // Cargar trabajadores disponibles para asignación
      let trabajadores = [];
      try {
        trabajadores = await User.findAll({
          where: {
            role: 'trabajador',
            activo: true
          },
          attributes: ['id', 'email'],
          order: [['email', 'ASC']]
        });
      } catch (trabError) {
        console.error('Error al cargar trabajadores:', trabError);
        trabajadores = [];
      }

      res.render('mantenimientos/list', {
        mantenimientos: mantenimientos || [],
        trabajadores: trabajadores || [],
        req: req,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al cargar mantenimientos:', error);
      res.status(500).render('error', {
        message: 'Error al cargar mantenimientos',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Mostrar formulario de creación
  showCreate: async (req, res) => {
    try {
      // Cargar cabañas
      let cabanas = [];
      try {
        cabanas = await Cabana.findAll({
          order: [['nombre', 'ASC']]
        });
      } catch (cabanaError) {
        console.error('Error al cargar cabañas:', cabanaError);
        cabanas = [];
      }

      // Cargar implementos
      let implementos = [];
      try {
        implementos = await Implemento.findAll({
          order: [['nombre', 'ASC']]
        });
      } catch (implementoError) {
        console.error('Error al cargar implementos:', implementoError);
        implementos = [];
      }

      // Cargar trabajadores activos
      let trabajadores = [];
      try {
        trabajadores = await User.findAll({
          where: {
            role: 'trabajador',
            activo: true
          },
          attributes: ['id', 'email'],
          order: [['email', 'ASC']]
        });
      } catch (trabError) {
        console.error('Error al cargar trabajadores:', trabError);
        trabajadores = [];
      }

      res.render('mantenimientos/create', {
        cabanas: cabanas || [],
        implementos: implementos || [],
        trabajadores: trabajadores || [],
        error: null
      });
    } catch (error) {
      console.error('Error al cargar formulario de mantenimiento:', error);
      res.status(500).render('error', {
        message: 'Error al cargar formulario',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Crear mantenimiento
  create: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const {
        tipoObjeto,
        cabanaId,
        implementoId,
        fechaInicio,
        fechaFin,
        categoria,
        tipo,
        tipoEspecifico,
        descripcion,
        prioridad,
        trabajadorId,
        requierePersonalExterno,
        personalExterno,
        inspeccionElectrica,
        revisionGas,
        mantencionEstufas,
        mantencionLeneras,
        controlMuebles,
        controlUtensilios,
        controlRopaCama,
        inspeccionAreasComunes
      } = req.body;

      const userId = req.session.user.id;

      // Validar trabajador si se proporciona
      if (trabajadorId) {
        try {
          const trabajador = await User.findByPk(trabajadorId);
          if (!trabajador || trabajador.role !== 'trabajador' || !trabajador.activo) {
            await transaction.rollback();
            throw new Error('Trabajador no válido o inactivo');
          }
        } catch (error) {
          console.error('Error al validar trabajador:', error);
          await transaction.rollback();
          throw new Error('Error al validar trabajador');
        }
      }

      // Crear mantenimiento
      const mantenimiento = await Mantenimiento.create({
        cabanaId: tipoObjeto === 'cabana' ? parseInt(cabanaId) : null,
        implementoId: tipoObjeto === 'implemento' ? parseInt(implementoId) : null,
        fechaInicio,
        fechaFin,
        categoria,
        tipo,
        tipoEspecifico: tipoEspecifico || null,
        descripcion: descripcion || null,
        prioridad: prioridad || 'media',
        estado: 'programado',
        trabajadorId: trabajadorId ? parseInt(trabajadorId) : null,
        inspeccionElectrica: inspeccionElectrica === 'on' || inspeccionElectrica === true,
        revisionGas: revisionGas === 'on' || revisionGas === true,
        mantencionEstufas: mantencionEstufas === 'on' || mantencionEstufas === true,
        mantencionLeneras: mantencionLeneras === 'on' || mantencionLeneras === true,
        controlMuebles: controlMuebles === 'on' || controlMuebles === true,
        controlUtensilios: controlUtensilios === 'on' || controlUtensilios === true,
        controlRopaCama: controlRopaCama === 'on' || controlRopaCama === true,
        inspeccionAreasComunes: inspeccionAreasComunes === 'on' || inspeccionAreasComunes === true,
        requierePersonalExterno: requierePersonalExterno === 'on' || requierePersonalExterno === true,
        personalExterno: personalExterno || null
      }, { transaction });

      // Crear TareaTrabajador automáticamente si se asignó un trabajador
      if (trabajadorId && userId) {
        try {
          const nombreObjeto = tipoObjeto === 'cabana'
            ? await Cabana.findByPk(cabanaId).then(c => c?.nombre || 'Cabaña')
            : await Implemento.findByPk(implementoId).then(i => i?.nombre || 'Implemento');

          await TareaTrabajador.create({
            trabajadorId: parseInt(trabajadorId),
            asignadoPor: userId,
            mantenimientoId: mantenimiento.id,
            cabanaId: tipoObjeto === 'cabana' ? parseInt(cabanaId) : null,
            tipo: 'mantenimiento',
            descripcion: `Mantenimiento ${categoria}: ${tipo} - ${descripcion || 'Sin descripción adicional'}`,
            estado: 'pendiente',
            fechaAsignacion: new Date()
          }, { transaction });

          // Notificar al trabajador
          try {
            await crearNotificacion(
              parseInt(trabajadorId),
              'Nueva Tarea Asignada',
              `Se te ha asignado una nueva tarea de mantenimiento: ${tipo} para ${nombreObjeto}`,
              'info'
            );
          } catch (notifError) {
            console.error('Error al notificar trabajador:', notifError);
          }
        } catch (tareaError) {
          console.error('Error al crear tarea de trabajador:', tareaError);
          // Continuar aunque falle la creación de la tarea
        }
      }

      // Notificar a clientes afectados
      if (tipoObjeto === 'cabana' && cabanaId) {
        try {
          await notificarClientesAfectados(parseInt(cabanaId), fechaInicio, fechaFin, mantenimiento.id);
        } catch (notifError) {
          console.error('Error al notificar clientes afectados:', notifError);
        }
      }

      await transaction.commit();
      res.redirect('/mantenimientos');
    } catch (error) {
      await transaction.rollback();
      console.error('Error al crear mantenimiento:', error);

      // Recargar datos para el formulario
      let cabanas = [];
      let implementos = [];
      let trabajadores = [];

      try {
        cabanas = await Cabana.findAll({ order: [['nombre', 'ASC']] });
        implementos = await Implemento.findAll({ order: [['nombre', 'ASC']] });
        trabajadores = await User.findAll({
          where: { role: 'trabajador', activo: true },
          attributes: ['id', 'email'],
          order: [['email', 'ASC']]
        });
      } catch (loadError) {
        console.error('Error al recargar datos del formulario:', loadError);
      }

      res.render('mantenimientos/create', {
        cabanas,
        implementos,
        trabajadores,
        error: error.message || 'Error al crear mantenimiento. Intenta nuevamente.'
      });
    }
  },

  // Asignar trabajador a mantenimiento existente
  asignarTrabajador: async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
      const { id } = req.params;
      const { trabajadorId } = req.body;
      const userId = req.session.user.id;

      const mantenimiento = await Mantenimiento.findByPk(id, { transaction });
      if (!mantenimiento) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }

      // Validar trabajador
      if (trabajadorId) {
        const trabajador = await User.findByPk(trabajadorId, { transaction });
        if (!trabajador || trabajador.role !== 'trabajador' || !trabajador.activo) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Trabajador no válido o inactivo' });
        }
      }

      await mantenimiento.update({ trabajadorId: trabajadorId ? parseInt(trabajadorId) : null }, { transaction });

      // Crear o actualizar TareaTrabajador
      let tarea = await TareaTrabajador.findOne({ where: { mantenimientoId: mantenimiento.id }, transaction });
      if (tarea) {
        await tarea.update({
          trabajadorId: parseInt(trabajadorId),
          asignadoPor: userId,
          estado: 'pendiente',
          fechaAsignacion: new Date()
        }, { transaction });
      } else {
        const nombreObjeto = mantenimiento.cabanaId
          ? await Cabana.findByPk(mantenimiento.cabanaId).then(c => c?.nombre || 'Cabaña')
          : await Implemento.findByPk(mantenimiento.implementoId).then(i => i?.nombre || 'Implemento');

        await TareaTrabajador.create({
          trabajadorId: parseInt(trabajadorId),
          asignadoPor: userId,
          mantenimientoId: mantenimiento.id,
          cabanaId: mantenimiento.cabanaId,
          tipo: 'mantenimiento',
          descripcion: `Mantenimiento ${mantenimiento.categoria}: ${mantenimiento.tipo} - ${mantenimiento.descripcion || 'Sin descripción adicional'}`,
          estado: 'pendiente',
          fechaAsignacion: new Date()
        }, { transaction });
      }

      // Notificar al trabajador
      try {
        await crearNotificacion(
          parseInt(trabajadorId),
          'Nueva Tarea Asignada',
          `Se te ha asignado una nueva tarea de mantenimiento: ${mantenimiento.tipo}`,
          'info'
        );
      } catch (notifError) {
        console.error('Error al notificar trabajador:', notifError);
      }

      await transaction.commit();
      res.redirect('/mantenimientos');
    } catch (error) {
      await transaction.rollback();
      console.error('Error al asignar trabajador:', error);
      res.status(500).json({ error: error.message || 'Error al asignar trabajador' });
    }
  },

  // Historial por cabaña
  historialCabana: async (req, res) => {
    try {
      const { cabanaId } = req.params;
      const cabana = await Cabana.findByPk(cabanaId).catch(() => null);

      if (!cabana) {
        return res.status(404).render('error', {
          message: 'Cabaña no encontrada',
          error: {},
          req: req
        });
      }

      let mantenimientos = [];
      try {
        mantenimientos = await Mantenimiento.findAll({
          where: { cabanaId: parseInt(cabanaId) },
          include: [
            { model: User, as: 'trabajador', required: false },
            {
              model: TareaTrabajador,
              as: 'tareas',
              required: false,
              separate: true,
              where: { estado: 'completada' },
              order: [['fechaCompletado', 'DESC']],
              limit: 1
            }
          ],
          order: [['fechaInicio', 'DESC']]
        });
      } catch (error) {
        console.error('Error al cargar mantenimientos de cabaña:', error);
        mantenimientos = [];
      }

      res.render('mantenimientos/historial-cabana', {
        cabana,
        mantenimientos: mantenimientos || []
      });
    } catch (error) {
      console.error('Error al cargar historial de cabaña:', error);
      res.status(500).render('error', {
        message: 'Error al cargar historial',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Historial por implemento
  historialImplemento: async (req, res) => {
    try {
      const { implementoId } = req.params;
      const implemento = await Implemento.findByPk(implementoId).catch(() => null);

      if (!implemento) {
        return res.status(404).render('error', {
          message: 'Implemento no encontrado',
          error: {},
          req: req
        });
      }

      let mantenimientos = [];
      try {
        mantenimientos = await Mantenimiento.findAll({
          where: { implementoId: parseInt(implementoId) },
          include: [
            { model: User, as: 'trabajador', required: false },
            {
              model: TareaTrabajador,
              as: 'tareas',
              required: false,
              separate: true,
              where: { estado: 'completada' },
              order: [['fechaCompletado', 'DESC']],
              limit: 1
            }
          ],
          order: [['fechaInicio', 'DESC']]
        });
      } catch (error) {
        console.error('Error al cargar mantenimientos de implemento:', error);
        mantenimientos = [];
      }

      res.render('mantenimientos/historial-implemento', {
        implemento,
        mantenimientos: mantenimientos || []
      });
    } catch (error) {
      console.error('Error al cargar historial de implemento:', error);
      res.status(500).render('error', {
        message: 'Error al cargar historial',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  }
};

// Función helper para notificar clientes afectados
async function notificarClientesAfectados(cabanaId, fechaInicio, fechaFin, mantenimientoId) {
  try {
    const reservasAfectadas = await Reserva.findAll({
      where: {
        cabanaId: cabanaId,
        estado: { [Op.in]: ['pendiente', 'confirmada'] },
        [Op.or]: [
          {
            [Op.and]: [
              { fechaInicio: { [Op.lte]: fechaFin } },
              { fechaFin: { [Op.gte]: fechaInicio } }
            ]
          }
        ]
      },
      include: [
        { model: Cliente, as: 'cliente', include: [{ model: User, as: 'user' }] },
        { model: Cabana, as: 'cabana' }
      ]
    });

    for (const reserva of reservasAfectadas) {
      if (reserva.cliente && reserva.cliente.user) {
        await crearNotificacion(
          reserva.cliente.user.id,
          'Mantenimiento Programado - Afecta tu Reserva',
          `Se ha programado un mantenimiento para la cabaña "${reserva.cabana.nombre}" del ${new Date(fechaInicio).toLocaleDateString()} al ${new Date(fechaFin).toLocaleDateString()}, que se solapa con tu reserva. Por favor contacta con nosotros para coordinar.`,
          'warning'
        );
      }
    }
  } catch (error) {
    console.error('Error al notificar clientes afectados:', error);
    // No lanzar error, solo registrar
  }
}

module.exports = mantenimientoController;
