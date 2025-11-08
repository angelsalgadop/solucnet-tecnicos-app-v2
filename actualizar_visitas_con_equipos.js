const mysql = require('mysql2/promise');

// Configuración de base de datos del sistema
const dbSistema = {
    host: 'localhost',
    user: 'debian-sys-maint',
    password: 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

// Configuraciones de las bases de datos MikroWisp
const basesDatos = [
    { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '192.168.99.11', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '192.168.99.2', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '192.168.99.51', user: 'ADFZ2I', password: 'MOZ1BWZ86BRMXFW', database: 'Mikrowisp6' }
];

// Función para obtener serial de equipo de cliente
async function obtenerSerialEquipoCliente(clienteId, bdOrigen) {
    try {
        // Determinar qué base de datos usar basándose en bd_origen
        let baseDatos = null;
        for (const bd of basesDatos) {
            if (bdOrigen.includes(bd.host)) {
                baseDatos = bd;
                break;
            }
        }

        if (!baseDatos) {
            baseDatos = basesDatos[0]; // Usar la primera como fallback
        }

        const conexion = await mysql.createConnection(baseDatos);

        // Buscar serial en almacen y materiales
        const [equipos] = await conexion.query(`
            SELECT DISTINCT
                COALESCE(a.serial_producto, m.serial) as serial_equipo,
                COALESCE(p.producto, 'Equipo Red') as tipo_equipo,
                CASE
                    WHEN a.estado = 'comodato' THEN 'comodato'
                    WHEN a.estado = 'vendido' THEN 'vendido'
                    WHEN a.estado = 'prestado' THEN 'prestado'
                    ELSE 'comodato'
                END as estado_equipo
            FROM usuarios u
            LEFT JOIN tblservicios s ON u.id = s.userid
            LEFT JOIN server sv ON s.server = sv.id
            LEFT JOIN almacen a ON s.userid = a.userid
            LEFT JOIN productos p ON a.productoid = p.id
            LEFT JOIN materiales m ON s.userid = m.userid
            WHERE u.id = ?
            AND (
                (a.serial_producto IS NOT NULL AND a.serial_producto != '') OR
                (m.serial IS NOT NULL AND m.serial != '')
            )
            LIMIT 1
        `, [clienteId]);

        await conexion.end();

        if (equipos.length > 0) {
            const equipo = equipos[0];
            return {
                success: true,
                serial: equipo.serial_equipo,
                tipo: equipo.tipo_equipo,
                estado: equipo.estado_equipo
            };
        }

        return { success: false, message: 'No se encontró equipo asignado' };

    } catch (error) {
        console.error(`Error obteniendo equipo para cliente ${clienteId}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function actualizarVisitasConEquipos() {
    console.log('🔄 Actualizando visitas existentes con información de equipos...\n');

    let conexionSistema;
    try {
        conexionSistema = await mysql.createConnection(dbSistema);

        // Obtener visitas sin información de equipos
        const [visitasSinEquipos] = await conexionSistema.query(`
            SELECT id, cliente_id, cliente_nombre, bd_origen
            FROM visitas_tecnicas
            WHERE (serial_equipo_asignado IS NULL OR serial_equipo_asignado = '')
            AND estado != 'completada'
            ORDER BY fecha_programada DESC
            LIMIT 50
        `);

        console.log(`📋 Encontradas ${visitasSinEquipos.length} visitas sin información de equipos`);

        if (visitasSinEquipos.length === 0) {
            console.log('✅ Todas las visitas ya tienen información de equipos actualizada');
            return;
        }

        let visitasActualizadas = 0;
        let visitasConEquipos = 0;

        for (const visita of visitasSinEquipos) {
            console.log(`\n🔍 Procesando visita ${visita.id} - Cliente: ${visita.cliente_nombre}`);

            try {
                const equipoInfo = await obtenerSerialEquipoCliente(visita.cliente_id, visita.bd_origen);

                if (equipoInfo.success && equipoInfo.serial) {
                    // Actualizar visita con información de equipo
                    await conexionSistema.execute(`
                        UPDATE visitas_tecnicas
                        SET serial_equipo_asignado = ?,
                            equipo_tipo = ?,
                            equipo_estado = ?
                        WHERE id = ?
                    `, [equipoInfo.serial, equipoInfo.tipo, equipoInfo.estado, visita.id]);

                    console.log(`  ✅ Actualizada con equipo: ${equipoInfo.serial} (${equipoInfo.tipo})`);
                    visitasActualizadas++;
                    visitasConEquipos++;
                } else {
                    console.log(`  ⚠️ No se encontró equipo asignado`);
                    visitasActualizadas++;
                }

                // Pausa pequeña para no sobrecargar la BD
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`  ❌ Error procesando visita ${visita.id}:`, error.message);
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
            console.log(`\n✅ ÉXITO: ${resultado.con_seriales} visitas ahora muestran seriales en la interfaz de técnicos`);
        }

    } catch (error) {
        console.error('❌ Error actualizando visitas:', error.message);
        console.error(error.stack);
    } finally {
        if (conexionSistema) await conexionSistema.end();
    }
}

// Ejecutar actualización
actualizarVisitasConEquipos()
    .then(() => {
        console.log('\n✅ Actualización completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });