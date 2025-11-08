const mysql = require('mysql2/promise');
const { obtenerSerialEquipoCliente } = require('./db_visitas_tecnicas.js');

// Configuración de base de datos del sistema
const dbSistema = {
    host: 'localhost',
    user: 'debian-sys-maint',
    password: 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

async function actualizarVisitasExistentes() {
    console.log('🔄 Actualizando visitas existentes con información de equipos...\n');

    let conexionSistema;
    try {
        conexionSistema = await mysql.createConnection(dbSistema);

        // Obtener visitas sin información de equipos
        const [visitasSinEquipos] = await conexionSistema.query(`
            SELECT id, cliente_id, cliente_nombre, cliente_cedula
            FROM visitas_tecnicas
            WHERE (serial_equipo_asignado IS NULL OR serial_equipo_asignado = '')
            AND estado != 'completada'
            ORDER BY fecha_programada DESC
            LIMIT 20
        `);

        console.log(`📋 Encontradas ${visitasSinEquipos.length} visitas sin información de equipos`);

        if (visitasSinEquipos.length === 0) {
            console.log('✅ Todas las visitas ya tienen información de equipos actualizada');
            return;
        }

        let visitasActualizadas = 0;
        let visitasConEquipos = 0;

        for (const visita of visitasSinEquipos) {
            console.log(`\n🔍 Procesando visita ${visita.id} - Cliente: ${visita.cliente_nombre} (${visita.cliente_cedula})`);

            try {
                const equipoInfo = await obtenerSerialEquipoCliente(visita.cliente_cedula);

                if (equipoInfo && equipoInfo.serial_equipo_asignado) {
                    // Actualizar visita con información de equipo
                    await conexionSistema.execute(`
                        UPDATE visitas_tecnicas
                        SET serial_equipo_asignado = ?,
                            equipo_tipo = ?,
                            equipo_estado = ?,
                            mikrotik_nombre = ?,
                            usuario_ppp = ?
                        WHERE id = ?
                    `, [
                        equipoInfo.serial_equipo_asignado,
                        equipoInfo.equipo_tipo,
                        equipoInfo.equipo_estado,
                        equipoInfo.mikrotik_nombre,
                        equipoInfo.usuario_ppp,
                        visita.id
                    ]);

                    console.log(`  ✅ Actualizada con equipo: ${equipoInfo.serial_equipo_asignado} (${equipoInfo.equipo_tipo || 'Sin tipo'})`);
                    visitasActualizadas++;
                    visitasConEquipos++;
                } else {
                    console.log(`  ⚠️ No se encontró equipo asignado`);
                    visitasActualizadas++;
                }

                // Pausa pequeña para no sobrecargar la BD
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`  ❌ Error procesando visita ${visita.id}:`, error.message);
                visitasActualizadas++;
            }
        }

        console.log(`\n📊 RESUMEN DE ACTUALIZACIÓN:`);
        console.log(`  Visitas procesadas: ${visitasActualizadas}`);
        console.log(`  Visitas con equipos encontrados: ${visitasConEquipos}`);
        console.log(`  Visitas sin equipos: ${visitasActualizadas - visitasConEquipos}`);

        // Verificar resultado final
        const [visitasFinales] = await conexionSistema.query(`
            SELECT
                COUNT(*) as total,
                COUNT(serial_equipo_asignado) as con_seriales
            FROM visitas_tecnicas
            WHERE estado != 'completada'
        `);

        const resultado = visitasFinales[0];
        console.log(`\n📊 ESTADO FINAL:`);
        console.log(`  Total visitas activas: ${resultado.total}`);
        console.log(`  Con seriales: ${resultado.con_seriales}`);
        console.log(`  Sin seriales: ${resultado.total - resultado.con_seriales}`);

        if (resultado.con_seriales > 0) {
            console.log(`\n✅ ÉXITO: ${resultado.con_seriales} visitas ahora mostrarán seriales en la interfaz de técnicos`);

            // Mostrar ejemplos de visitas con seriales
            const [ejemplos] = await conexionSistema.query(`
                SELECT cliente_nombre, serial_equipo_asignado, equipo_tipo
                FROM visitas_tecnicas
                WHERE serial_equipo_asignado IS NOT NULL
                AND estado != 'completada'
                LIMIT 5
            `);

            if (ejemplos.length > 0) {
                console.log(`\n📋 Ejemplos de visitas con equipos:`);
                ejemplos.forEach(ej => {
                    console.log(`  • ${ej.cliente_nombre} → ${ej.serial_equipo_asignado} (${ej.equipo_tipo || 'Sin tipo'})`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Error actualizando visitas:', error.message);
        console.error(error.stack);
    } finally {
        if (conexionSistema) await conexionSistema.end();
    }
}

// Ejecutar actualización
actualizarVisitasExistentes()
    .then(() => {
        console.log('\n✅ Actualización completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });