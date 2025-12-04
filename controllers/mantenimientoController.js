const db = require('../models');
const { Mantenimiento, Cabana, Implemento, Reserva, Cliente, User, TareaTrabajador } = db;
const { crearNotificacion } = require('./notificacionController');
const { Op, Sequelize } = require('sequelize');

const mantenimientoController = {
  // Listar mantenimientos
  list: async (req, res) => {
    try {
      let mantenimientos = [];
      try {
        // Intentar ordenar por prioridad si el campo existe
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
        // Si falla el ordenamiento, intentar sin prioridad
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
          order: [['email', 'ASC']],
          attributes: ['id', 'email']
        });
      } catch (error) {
        console.error('Error al cargar trabajadores:', error);
      }

      res.render('mantenimientos/list', {
        mantenimientos: mantenimientos || [],
        trabajadores: trabajadores || [],
        req: req
      });
    } catch (error) {
      console.error('Error al listar mantenimientos:', error);
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
      let cabanas = [];
      let implementos = [];
      let trabajadores = [];

      try {
        cabanas = await Cabana.findAll({
          order: [['nombre', 'ASC']]
        });
      } catch (error) {
        console.error('Error al cargar cabañas:', error);
      }

      try {
        implementos = await Implemento.findAll({
          order: [['nombre', 'ASC']]
        });
      } catch (error) {
        console.error('Error al cargar implementos:', error);
      }

      try {
        trabajadores = await User.findAll({
          where: {
            role: 'trabajador',
            activo: true
          },
          order: [['nombre', 'ASC']]
        });
      } catch (error) {
        console.error('Error al cargar trabajadores:', error);
      }

      res.render('mantenimientos/create', {
        cabanas: cabanas || [],
        implementos: implementos || [],
        trabajadores: trabajadores || []
      });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
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
        inspeccionElectrica,
        revisionGas,
        mantencionEstufas,
        mantencionLeneras,
        controlMuebles,
        controlUtensilios,
        controlRopaCama,
        inspeccionAreasComunes,
        requierePersonalExterno,
        personalExterno
      } = req.body;

      const userId = req.session.user?.id;

      // Validaciones
      if (!tipoObjeto || !fechaInicio || !fechaFin || !categoria || !tipo) {
        await transaction.rollback();
        const [cabanas, implementos, trabajadores] = await Promise.allSettled([
          Cabana.findAll({ order: [['nombre', 'ASC']] }),
          Implemento.findAll({ order: [['nombre', 'ASC']] }),
          User.findAll({ where: { role: 'trabajador', activo: true }, order: [['email', 'ASC']], attributes: ['id', 'email'] })
        ]);
        return res.render('mantenimientos/create', {
          error: 'Los campos tipo, fecha inicio, fecha fin y categoría son requeridos',
          cabanas: cabanas.status === 'fulfilled' ? cabanas.value : [],
          implementos: implementos.status === 'fulfilled' ? implementos.value : [],
          trabajadores: trabajadores.status === 'fulfilled' ? trabajadores.value : []
        });
      }

      if (tipoObjeto === 'cabana' && !cabanaId) {
        await transaction.rollback();
        const [cabanas, implementos, trabajadores] = await Promise.allSettled([
          Cabana.findAll({ order: [['nombre', 'ASC']] }),
          Implemento.findAll({ order: [['nombre', 'ASC']] }),
          User.findAll({ where: { role: 'trabajador', activo: true }, order: [['email', 'ASC']], attributes: ['id', 'email'] })
        ]);
        return res.render('mantenimientos/create', {
          error: 'Debe seleccionar una cabaña',
          cabanas: cabanas.status === 'fulfilled' ? cabanas.value : [],
          implementos: implementos.status === 'fulfilled' ? implementos.value : [],
          trabajadores: trabajadores.status === 'fulfilled' ? trabajadores.value : []
        });
      }

      if (tipoObjeto === 'implemento' && !implementoId) {
        await transaction.rollback();
        const [cabanas, implementos, trabajadores] = await Promise.allSettled([
          Cabana.findAll({ order: [['nombre', 'ASC']] }),
          Implemento.findAll({ order: [['nombre', 'ASC']] }),
          User.findAll({ where: { role: 'trabajador', activo: true }, order: [['email', 'ASC']], attributes: ['id', 'email'] })
        ]);
        return res.render('mantenimientos/create', {
          error: 'Debe seleccionar un implemento',
          cabanas: cabanas.status === 'fulfilled' ? cabanas.value : [],
          implementos: implementos.status === 'fulfilled' ? implementos.value : [],
          trabajadores: trabajadores.status === 'fulfilled' ? trabajadores.value : []
        });
      }

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
              'Nueva Tarea de Mantenimiento Asignada',
              `Se te ha asignado un mantenimiento ${categoria} para ${nombreObjeto}. Tipo: ${tipo}. Fechas: ${new Date(fechaInicio).toLocaleDateString()} al ${new Date(fechaFin).toLocaleDateString()}`,
              'info'
            );
          } catch (notifError) {
            console.error('Error al notificar trabajador:', notifError);
            // No fallar si la notificación falla
          }
        } catch (tareaError) {
          console.error('Error al crear tarea de trabajador:', tareaError);
          // No fallar si la creación de tarea falla, pero registrar el error
        }
      }

      // Cambiar estado de cabaña a mantenimiento si aplica
      if (tipoObjeto === 'cabana' && cabanaId) {
        try {
          await Cabana.update(
            { estado: 'mantenimiento' },
            { where: { id: cabanaId }, transaction }
          );

          // Notificar a clientes con reservas afectadas (sin bloquear si falla)
          notificarClientesAfectados(cabanaId, fechaInicio, fechaFin, mantenimiento.id)
            .catch(error => console.error('Error al notificar clientes:', error));
        } catch (cabanaError) {
          console.error('Error al actualizar estado de cabaña:', cabanaError);
          // Continuar aunque falle la actualización de estado
        }
      }

      await transaction.commit();
      res.redirect('/mantenimientos');
    } catch (error) {
      await transaction.rollback().catch(() => {});
      console.error('Error al crear mantenimiento:', error);

      let cabanas = [];
      let implementos = [];
      let trabajadores = [];

      try {
        [cabanas, implementos, trabajadores] = await Promise.allSettled([
          Cabana.findAll({ order: [['nombre', 'ASC']] }),
          Implemento.findAll({ order: [['nombre', 'ASC']] }),
          User.findAll({ where: { role: 'trabajador', activo: true }, order: [['email', 'ASC']], attributes: ['id', 'email'] })
        ]);
      } catch (loadError) {
        console.error('Error al cargar datos para mostrar error:', loadError);
      }

      res.render('mantenimientos/create', {
        error: error.message || 'Error al crear mantenimiento',
        cabanas: Array.isArray(cabanas) ? cabanas : (cabanas.status === 'fulfilled' ? cabanas.value : []),
        implementos: Array.isArray(implementos) ? implementos : (implementos.status === 'fulfilled' ? implementos.value : []),
        trabajadores: Array.isArray(trabajadores) ? trabajadores : (trabajadores.status === 'fulfilled' ? trabajadores.value : [])
      });
    }
  },

  // Asignar trabajador a mantenimiento existente (para encargados y admin)
  asignarTrabajador: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const { id } = req.params;
      const { trabajadorId } = req.body;
      const userId = req.session.user?.id;

      if (!userId) {
        await transaction.rollback();
        return res.status(401).json({ error: 'No autorizado' });
      }

      if (!trabajadorId) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Debe seleccionar un trabajador' });
      }

      const mantenimiento = await Mantenimiento.findByPk(id, {
        include: [
          { model: Cabana, as: 'cabana', required: false },
          { model: Implemento, as: 'implemento', required: false }
        ],
        transaction
      });

      if (!mantenimiento) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }

      // Validar trabajador
      const trabajador = await User.findByPk(trabajadorId, { transaction });
      if (!trabajador || trabajador.role !== 'trabajador' || !trabajador.activo) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Trabajador no válido o inactivo' });
      }

      // Actualizar mantenimiento
      await mantenimiento.update({
        trabajadorId: parseInt(trabajadorId)
      }, { transaction });

      // Crear o actualizar TareaTrabajador
      try {
        const nombreObjeto = mantenimiento.cabana
          ? mantenimiento.cabana.nombre
          : (mantenimiento.implemento ? mantenimiento.implemento.nombre : 'Objeto');

        // Verificar si ya existe una tarea para este mantenimiento
        const tareaExistente = await TareaTrabajador.findOne({
          where: { mantenimientoId: id },
          transaction
        });

        if (tareaExistente) {
          await tareaExistente.update({
            trabajadorId: parseInt(trabajadorId),
            asignadoPor: userId,
            estado: 'pendiente'
          }, { transaction });
        } else {
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
            'Tarea de Mantenimiento Asignada',
            `Se te ha asignado un mantenimiento ${mantenimiento.categoria} para ${nombreObjeto}. Tipo: ${mantenimiento.tipo}. Fechas: ${new Date(mantenimiento.fechaInicio).toLocaleDateString()} al ${new Date(mantenimiento.fechaFin).toLocaleDateString()}`,
            'info'
          );
        } catch (notifError) {
          console.error('Error al notificar trabajador:', notifError);
        }
      } catch (tareaError) {
        console.error('Error al crear/actualizar tarea de trabajador:', tareaError);
        // Continuar aunque falle la creación de tarea
      }

      await transaction.commit();
      res.json({ success: true, message: 'Trabajador asignado correctamente' });
    } catch (error) {
      await transaction.rollback().catch(() => {});
      console.error('Error al asignar trabajador:', error);
      res.status(500).json({ error: error.message || 'Error al asignar trabajador' });
    }
  },

  // Completar mantenimiento
  completar: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const { id } = req.params;
      const mantenimiento = await Mantenimiento.findByPk(id, {
        include: [
          { model: Cabana, as: 'cabana', required: false },
          { model: Implemento, as: 'implemento', required: false }
        ],
        transaction
      });

      if (!mantenimiento) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Mantenimiento no encontrado' });
      }

      await mantenimiento.update({
        estado: 'completado'
      }, { transaction });

      // Actualizar tareas relacionadas
      try {
        await TareaTrabajador.update(
          { estado: 'completada', fechaCompletado: new Date() },
          { where: { mantenimientoId: id }, transaction }
        );
      } catch (tareaError) {
        console.error('Error al actualizar tareas:', tareaError);
        // Continuar aunque falle
      }

      // Liberar cabaña o implemento
      if (mantenimiento.cabanaId) {
        try {
          await Cabana.update(
            { estado: 'disponible' },
            { where: { id: mantenimiento.cabanaId }, transaction }
          );
        } catch (cabanaError) {
          console.error('Error al liberar cabaña:', cabanaError);
          // Continuar aunque falle
        }
      }

      await transaction.commit();
      res.redirect('/mantenimientos');
    } catch (error) {
      await transaction.rollback().catch(() => {});
      console.error('Error al completar mantenimiento:', error);
      res.status(500).json({ error: 'Error al completar mantenimiento' });
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

// Función auxiliar para notificar a clientes afectados
async function notificarClientesAfectados(cabanaId, fechaInicio, fechaFin, mantenimientoId) {
  try {
    const fechaInicioMant = new Date(fechaInicio);
    const fechaFinMant = new Date(fechaFin);

    // Buscar reservas que se solapen con el período de mantenimiento
    const reservasAfectadas = await Reserva.findAll({
      where: {
        cabanaId: parseInt(cabanaId),
        estado: { [Op.in]: ['pendiente', 'confirmada'] },
        [Op.or]: [
          {
            fechaInicio: { [Op.between]: [fechaInicioMant, fechaFinMant] }
          },
          {
            fechaFin: { [Op.between]: [fechaInicioMant, fechaFinMant] }
          },
          {
            [Op.and]: [
              { fechaInicio: { [Op.lte]: fechaInicioMant } },
              { fechaFin: { [Op.gte]: fechaFinMant } }
            ]
          }
        ]
      },
      include: [
        {
          model: Cliente,
          as: 'cliente',
          required: false,
          include: [{ model: User, as: 'user', required: false }]
        },
        { model: Cabana, as: 'cabana', required: false }
      ]
    });

    // Notificar a cada cliente afectado
    for (const reserva of reservasAfectadas) {
      try {
        if (reserva.cliente && reserva.cliente.user) {
          await crearNotificacion(
            reserva.cliente.user.id,
            'Mantenimiento Programado - Cabaña No Disponible',
            `Se ha programado un mantenimiento para la cabaña "${reserva.cabana?.nombre || 'N/A'}" del ${new Date(fechaInicio).toLocaleDateString()} al ${new Date(fechaFin).toLocaleDateString()}, que afecta tu reserva del ${new Date(reserva.fechaInicio).toLocaleDateString()} al ${new Date(reserva.fechaFin).toLocaleDateString()}. Por favor contacta a la administración para coordinar alternativas (reembolso o reprogramación).`,
            'warning'
          );
        }
      } catch (notifError) {
        console.error('Error al notificar cliente individual:', notifError);
        // Continuar con el siguiente cliente
      }
    }
  } catch (error) {
    console.error('Error al notificar clientes afectados:', error);
    // No lanzar error para no interrumpir la creación del mantenimiento
  }
}

module.exports = mantenimientoController;
