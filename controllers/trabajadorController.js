const db = require('../models');
const { TareaTrabajador, User, Cabana, PreparacionCabana, Mantenimiento, Implemento } = db;
const { crearNotificacion } = require('./notificacionController');

const trabajadorController = {
  // Listar tareas del trabajador
  misTareas: async (req, res) => {
    try {
      const trabajadorId = req.session.user.id;
      const tareas = await TareaTrabajador.findAll({
        where: { trabajadorId },
        include: [
          { model: Cabana, as: 'cabana', required: false },
          { model: PreparacionCabana, as: 'preparacion', required: false },
          { model: User, as: 'asignador', required: false },
          { model: Mantenimiento, as: 'mantenimiento', required: false }
        ],
        order: [['fechaAsignacion', 'DESC'], ['estado', 'ASC']]
      });

      res.render('trabajador/mis_tareas', { tareas });
    } catch (error) {
      console.error('Error al listar tareas:', error);
      res.status(500).render('error', {
        message: 'Error al cargar tareas',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Ver detalle de tarea
  verTarea: async (req, res) => {
    try {
      const { id } = req.params;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id, {
        include: [
          { model: Cabana, as: 'cabana', required: false },
          { model: PreparacionCabana, as: 'preparacion', required: false },
          { model: User, as: 'trabajador', required: false },
          { model: User, as: 'asignador', required: false },
          { model: Mantenimiento, as: 'mantenimiento', required: false }
        ]
      });

      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        return res.status(404).render('error', { message: 'Tarea no encontrada', error: {} });
      }

      res.render('trabajador/ver_tarea', { tarea });
    } catch (error) {
      console.error('Error al cargar tarea:', error);
      res.status(500).render('error', { message: 'Error al cargar tarea', error });
    }
  },

  // Completar tarea
  completarTarea: async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const { id } = req.params;
      const { observaciones, reporteDanos } = req.body;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id, {
        include: [
          { model: Mantenimiento, as: 'mantenimiento', required: false }
        ],
        transaction
      });

      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      // Actualizar tarea
      await tarea.update({
        estado: 'completada',
        fechaCompletado: new Date(),
        observaciones: observaciones || null,
        reporteDanios: reporteDanos || null
      }, { transaction });

      // Si la tarea está asociada a un mantenimiento, actualizar el mantenimiento
      if (tarea.mantenimientoId) {
        try {
          // Recargar el mantenimiento dentro de la transacción
          const mantenimiento = await Mantenimiento.findByPk(tarea.mantenimientoId, { transaction });

          if (mantenimiento) {
            // Preparar actualización de descripción
            let nuevaDescripcion = mantenimiento.descripcion || '';
            if (observaciones) {
              nuevaDescripcion = nuevaDescripcion
                ? `${nuevaDescripcion}\n\nObservaciones del trabajador (${new Date().toLocaleString()}): ${observaciones}`
                : `Observaciones del trabajador (${new Date().toLocaleString()}): ${observaciones}`;
            }
            if (reporteDanos) {
              nuevaDescripcion = nuevaDescripcion
                ? `${nuevaDescripcion}\n\nReporte de daños: ${reporteDanos}`
                : `Reporte de daños: ${reporteDanos}`;
            }

            // Actualizar estado del mantenimiento a completado y descripción
            await mantenimiento.update({
              estado: 'completado',
              descripcion: nuevaDescripcion || null
            }, { transaction });

            // Si tiene cabaña, liberarla
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

            // Recargar el mantenimiento para verificar que se guardó correctamente
            await mantenimiento.reload({ transaction });
            console.log(`Mantenimiento #${mantenimiento.id} actualizado a estado: ${mantenimiento.estado}`);

            // Notificar a los administradores
            try {
              const admins = await User.findAll({
                where: { role: 'admin', activo: true },
                transaction
              });

              // Obtener información del objeto (cabaña o implemento) para el mensaje
              let nombreObjeto = 'Objeto';
              if (mantenimiento.cabanaId) {
                const cabana = await Cabana.findByPk(mantenimiento.cabanaId, { transaction });
                nombreObjeto = cabana ? cabana.nombre : 'Cabaña';
              } else if (mantenimiento.implementoId) {
                const implemento = await Implemento.findByPk(mantenimiento.implementoId, { transaction });
                nombreObjeto = implemento ? implemento.nombre : 'Implemento';
              }

              // Obtener nombre del trabajador
              const trabajador = await User.findByPk(trabajadorId, { transaction });
              const nombreTrabajador = trabajador ? trabajador.email : 'Trabajador';

              for (const admin of admins) {
                let mensaje = `El trabajador ${nombreTrabajador} ha completado un mantenimiento ${mantenimiento.categoria} de tipo "${mantenimiento.tipo}" para ${nombreObjeto}.`;

                if (observaciones) {
                  mensaje += ` Observaciones: ${observaciones}`;
                }
                if (reporteDanos) {
                  mensaje += ` Reporte de daños: ${reporteDanos}`;
                }

                await crearNotificacion(
                  admin.id,
                  'Mantenimiento Completado',
                  mensaje,
                  'success'
                );
              }

              // También notificar a los encargados
              try {
                const encargados = await User.findAll({
                  where: { role: 'encargado', activo: true },
                  transaction
                });

                for (const encargado of encargados) {
                  let mensaje = `El trabajador ${nombreTrabajador} ha completado un mantenimiento ${mantenimiento.categoria} de tipo "${mantenimiento.tipo}" para ${nombreObjeto}.`;

                  if (observaciones) {
                    mensaje += ` Observaciones: ${observaciones}`;
                  }

                  await crearNotificacion(
                    encargado.id,
                    'Mantenimiento Completado',
                    mensaje,
                    'info'
                  );
                }
              } catch (encargadoNotifError) {
                console.error('Error al notificar a encargados:', encargadoNotifError);
                // Continuar aunque falle
              }
            } catch (notifError) {
              console.error('Error al notificar a administradores:', notifError);
              // No hacer rollback por errores de notificación
            }
          }
        } catch (mantenimientoError) {
          console.error('Error al actualizar mantenimiento:', mantenimientoError);
          // No hacer rollback, continuar con la tarea completada
        }
      }

      await transaction.commit();
      res.redirect('/trabajador/tareas');
    } catch (error) {
      await transaction.rollback().catch(() => {});
      console.error('Error al completar tarea:', error);
      res.status(500).json({ error: 'Error al completar tarea' });
    }
  },

  // Iniciar tarea
  iniciarTarea: async (req, res) => {
    try {
      const { id } = req.params;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id);
      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      await tarea.update({ estado: 'en_proceso' });

      res.redirect('/trabajador/tareas');
    } catch (error) {
      console.error('Error al iniciar tarea:', error);
      res.status(500).json({ error: 'Error al iniciar tarea' });
    }
  },

  // Reportar daño rápido
  reportarDano: async (req, res) => {
    try {
      const { id } = req.params;
      const { reporteDanos } = req.body;
      const trabajadorId = req.session.user.id;

      const tarea = await TareaTrabajador.findByPk(id);
      if (!tarea || tarea.trabajadorId !== trabajadorId) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      await tarea.update({
        reporteDanios: (tarea.reporteDanios || '') + '\n' + reporteDanos
      });

      res.redirect('/trabajador/tareas');
    } catch (error) {
      console.error('Error al reportar daño:', error);
      res.status(500).json({ error: 'Error al reportar daño' });
    }
  }
};

module.exports = trabajadorController;
