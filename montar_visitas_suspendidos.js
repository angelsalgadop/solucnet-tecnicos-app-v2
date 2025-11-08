#!/usr/bin/env node
/**
 * Script para montar automáticamente clientes suspendidos en visitas sin asignar
 * Este script:
 * - Consulta clientes suspendidos hace más de 1 mes en las 3 bases de datos
 * - Verifica que no existan visitas duplicadas
 * - Crea visitas técnicas con motivo "retiro"
 * - Agrega observaciones automáticas del bot
 */

const mysql = require('mysql2/promise');

// Configuración de bases de datos
const basesDatos = [
    {
        host: '192.168.99.50',
        user: 'root',
        password: 'Y9T1Q6P39YI6TJ2',
        database: 'Mikrowisp6',
        nombre: 'BD Principal (50)'
    },
    {
        host: '192.168.99.11',
        user: 'root',
        password: 'Y9T1Q6P39YI6TJ2',
        database: 'Mikrowisp6',
        nombre: 'BD Secundaria (11)'
    },
    {
        host: '192.168.99.2',
        user: 'root',
        password: 'Y9T1Q6P39YI6TJ2',
        database: 'Mikrowisp6',
        nombre: 'BD Terciaria (2)'
    }
];

// Base de datos del sistema de visitas
const dbSistema = {
    host: 'localhost',
    user: 'debian-sys-maint',
    password: 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

// ID del usuario creador (bot)
const USUARIO_BOT_ID = 1; // Ajusta según el ID del bot en usuarios_sistema

/**
 * Obtiene clientes suspendidos hace más de 30 días
 */
async function obtenerClientesSuspendidos() {
    const clientesSuspendidos = [];
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    console.log(`\n🔍 Buscando clientes suspendidos desde antes del ${fechaLimite.toISOString().split('T')[0]}...\n`);

    for (const bd of basesDatos) {
        try {
            const conexion = await mysql.createConnection({
                host: bd.host,
                user: bd.user,
                password: bd.password,
                database: bd.database
            });

            const query = `
                SELECT
                    u.id,
                    u.nombre,
                    u.cedula,
                    u.telefono,
                    u.movil,
                    u.direccion_principal as direccion,
                    u.estado,
                    COALESCE(ts.pppuser, u.codigo) as usuario_ppp,
                    ts.coordenadas,
                    srv.nodo as mikrotik_nombre,
                    MIN(f.vencimiento) as primera_factura_vencida,
                    DATEDIFF(NOW(), MIN(f.vencimiento)) as dias_moroso,
                    COUNT(f.id) as facturas_pendientes,
                    SUM(f.total) as deuda_total
                FROM usuarios u
                LEFT JOIN tblservicios ts ON u.id = ts.idcliente
                LEFT JOIN server srv ON ts.nodo = srv.id
                INNER JOIN facturas f ON u.id = f.idcliente
                WHERE u.estado = 'suspendido'
                    AND f.estado IN ('No pagado', 'vencida')
                    AND f.vencimiento < ?
                GROUP BY u.id, u.nombre, u.cedula, u.telefono, u.movil,
                         u.direccion_principal, u.estado, ts.pppuser, u.codigo,
                         ts.coordenadas, srv.nodo
                HAVING dias_moroso >= 30
                ORDER BY dias_moroso DESC
            `;

            const [clientes] = await conexion.execute(query, [fechaLimite.toISOString().split('T')[0]]);

            console.log(`✅ ${bd.nombre}: ${clientes.length} clientes suspendidos encontrados`);

            // Agregar información de BD origen
            clientes.forEach(cliente => {
                cliente.bd_origen = bd.host;
                cliente.bd_nombre = bd.nombre;
                clientesSuspendidos.push(cliente);
            });

            await conexion.end();
        } catch (error) {
            console.error(`❌ Error en ${bd.nombre}:`, error.message);
        }
    }

    console.log(`\n📊 Total de clientes suspendidos: ${clientesSuspendidos.length}\n`);
    return clientesSuspendidos;
}

/**
 * Verifica si un cliente ya tiene una visita de retiro pendiente o en progreso
 */
async function verificarVisitaExistente(conexion, cedula) {
    const [visitas] = await conexion.execute(`
        SELECT id, estado, cliente_nombre, fecha_creacion, motivo_visita
        FROM visitas_tecnicas
        WHERE cliente_cedula = ?
          AND motivo_visita LIKE '%retiro%'
          AND estado IN ('programada', 'asignada', 'en_progreso')
        ORDER BY fecha_creacion DESC
        LIMIT 1
    `, [cedula]);

    return visitas.length > 0 ? visitas[0] : null;
}

/**
 * Crea una visita técnica para retiro de equipo
 */
async function crearVisitaRetiro(conexion, cliente) {
    const mesesMoroso = Math.floor(cliente.dias_moroso / 30);
    const deudaFormateada = parseFloat(cliente.deuda_total || 0).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    });

    // Observaciones automáticas del bot
    const observaciones = `🤖 VISITA AUTOMÁTICA GENERADA POR BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Fecha generación: ${new Date().toLocaleString('es-CO')}
⚠️ Cliente suspendido hace ${cliente.dias_moroso} días (${mesesMoroso} meses)
💰 Deuda total: ${deudaFormateada}
📋 Facturas pendientes: ${cliente.facturas_pendientes}
📆 Primera factura vencida: ${new Date(cliente.primera_factura_vencida).toLocaleDateString('es-CO')}
🗄️ Base de datos: ${cliente.bd_nombre}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ ACCIÓN REQUERIDA: Retiro de equipo por morosidad prolongada`;

    const motivoVisita = `Retiro de equipo - Morosidad ${mesesMoroso} meses`;

    // Insertar visita
    const [resultado] = await conexion.execute(`
        INSERT INTO visitas_tecnicas (
            cliente_id,
            cliente_nombre,
            cliente_cedula,
            cliente_telefono,
            cliente_movil,
            cliente_direccion,
            cliente_coordenadas,
            mikrotik_nombre,
            usuario_ppp,
            motivo_visita,
            observacion,
            estado,
            fecha_programada,
            creado_por,
            bd_origen,
            fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'programada', NULL, ?, ?, NOW())
    `, [
        cliente.id,
        cliente.nombre,
        cliente.cedula,
        cliente.telefono || '',
        cliente.movil || '',
        cliente.direccion || '',
        cliente.coordenadas || '',
        cliente.mikrotik_nombre || 'Desconocido',
        cliente.usuario_ppp || '',
        motivoVisita,
        observaciones,
        USUARIO_BOT_ID,
        cliente.bd_origen
    ]);

    return resultado.insertId;
}

/**
 * Limpia visitas obsoletas (clientes que ya no están suspendidos o fueron retirados)
 * SOLO limpia visitas generadas automáticamente por el bot (creado_por = 1)
 */
async function limpiarVisitasObsoletas(conexionSistema) {
    console.log('🧹 LIMPIANDO VISITAS OBSOLETAS (SOLO GENERADAS POR BOT)...\n');

    let visitasCanceladas = 0;
    let visitasCompletadas = 0;
    let visitasManualesOmitidas = 0;

    try {
        // Obtener solo las visitas de retiro creadas automáticamente por el bot
        const [visitasPendientes] = await conexionSistema.execute(`
            SELECT id, cliente_cedula, cliente_nombre, estado, motivo_visita, bd_origen, fecha_creacion, creado_por,
                   observacion
            FROM visitas_tecnicas
            WHERE motivo_visita LIKE '%retiro%'
              AND estado IN ('programada', 'asignada', 'en_progreso')
              AND creado_por = ?
              AND observacion LIKE '%🤖 VISITA AUTOMÁTICA GENERADA POR BOT%'
            ORDER BY fecha_creacion DESC
        `, [USUARIO_BOT_ID]);

        console.log(`📋 Visitas de retiro automáticas pendientes encontradas: ${visitasPendientes.length}`);

        // Contar visitas manuales que NO se tocarán
        const [visitasManuales] = await conexionSistema.execute(`
            SELECT COUNT(*) as total
            FROM visitas_tecnicas
            WHERE motivo_visita LIKE '%retiro%'
              AND estado IN ('programada', 'asignada', 'en_progreso')
              AND (creado_por != ? OR observacion NOT LIKE '%🤖 VISITA AUTOMÁTICA GENERADA POR BOT%')
        `, [USUARIO_BOT_ID]);

        visitasManualesOmitidas = visitasManuales[0].total;
        console.log(`🔒 Visitas manuales protegidas (no se modificarán): ${visitasManualesOmitidas}\n`);

        if (visitasPendientes.length === 0) {
            console.log('✅ No hay visitas automáticas pendientes para validar.\n');
            return { canceladas: 0, completadas: 0, manuales_protegidas: visitasManualesOmitidas };
        }

        // Verificar cada visita
        for (const visita of visitasPendientes) {
            try {
                // Buscar cliente en las bases de datos
                let clienteEncontrado = null;
                let bdEncontrada = null;

                for (const bd of basesDatos) {
                    try {
                        const conexion = await mysql.createConnection({
                            host: bd.host,
                            user: bd.user,
                            password: bd.password,
                            database: bd.database
                        });

                        const [clientes] = await conexion.execute(`
                            SELECT id, nombre, cedula, estado
                            FROM usuarios
                            WHERE cedula = ?
                            LIMIT 1
                        `, [visita.cliente_cedula]);

                        await conexion.end();

                        if (clientes.length > 0) {
                            clienteEncontrado = clientes[0];
                            bdEncontrada = bd.nombre;
                            break;
                        }
                    } catch (error) {
                        console.error(`❌ Error consultando ${bd.nombre}:`, error.message);
                    }
                }

                // Decidir qué hacer con la visita
                if (!clienteEncontrado) {
                    // Cliente no existe (ya fue eliminado/retirado)
                    await conexionSistema.execute(`
                        UPDATE visitas_tecnicas
                        SET estado = 'completada',
                            observacion = CONCAT(COALESCE(observacion, ''), '\n\n🤖 AUTO-COMPLETADA: Cliente ya fue retirado (no existe en BD) - ${new Date().toLocaleString('es-CO')}')
                        WHERE id = ?
                    `, [visita.id]);

                    console.log(`✅ AUTO-COMPLETADA: ${visita.cliente_nombre}`);
                    console.log(`   └─ Visita ID: ${visita.id} - Cliente ya no existe en ninguna BD\n`);
                    visitasCompletadas++;

                } else if (clienteEncontrado.estado.toUpperCase() !== 'SUSPENDIDO') {
                    // Cliente existe pero ya no está suspendido (pagó o cambió de estado)
                    // Comparación case-insensitive para evitar errores por mayúsculas/minúsculas
                    await conexionSistema.execute(`
                        UPDATE visitas_tecnicas
                        SET estado = 'cancelada',
                            observacion = CONCAT(COALESCE(observacion, ''), '\n\n🤖 AUTO-CANCELADA: Cliente ya no está suspendido (estado actual: ${clienteEncontrado.estado}) - ${new Date().toLocaleString('es-CO')}')
                        WHERE id = ?
                    `, [visita.id]);

                    console.log(`❌ AUTO-CANCELADA: ${visita.cliente_nombre}`);
                    console.log(`   ├─ Visita ID: ${visita.id}`);
                    console.log(`   ├─ Estado actual: ${clienteEncontrado.estado}`);
                    console.log(`   └─ BD: ${bdEncontrada}\n`);
                    visitasCanceladas++;

                } else {
                    // Cliente sigue suspendido, mantener la visita
                    console.log(`⏸️  VIGENTE: ${visita.cliente_nombre} (sigue suspendido)`);
                }

            } catch (error) {
                console.error(`❌ Error validando visita ID ${visita.id}:`, error.message);
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN DE LIMPIEZA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   🔒 Visitas manuales protegidas:   ${visitasManualesOmitidas}`);
        console.log(`   🤖 Visitas automáticas analizadas: ${visitasPendientes.length}`);
        console.log(`   ❌ Canceladas (ya pagaron):       ${visitasCanceladas}`);
        console.log(`   ✅ Completadas (ya retirados):    ${visitasCompletadas}`);
        console.log(`   ⏸️  Vigentes (siguen suspendidos): ${visitasPendientes.length - visitasCanceladas - visitasCompletadas}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            canceladas: visitasCanceladas,
            completadas: visitasCompletadas,
            manuales_protegidas: visitasManualesOmitidas
        };

    } catch (error) {
        console.error('❌ Error en limpieza de visitas:', error.message);
        return { canceladas: 0, completadas: 0 };
    }
}

/**
 * Procesa todos los clientes suspendidos y crea visitas
 */
async function procesarClientesSuspendidos() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🤖 SISTEMA AUTOMÁTICO DE VISITAS PARA RETIRO');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        // Conectar a la base de datos del sistema
        const conexionSistema = await mysql.createConnection(dbSistema);
        await conexionSistema.query('USE solucnet_auth_system');

        // PASO 1: Limpiar visitas obsoletas PRIMERO
        const resultadoLimpieza = await limpiarVisitasObsoletas(conexionSistema);

        // PASO 2: Obtener clientes suspendidos para crear nuevas visitas
        const clientes = await obtenerClientesSuspendidos();

        if (clientes.length === 0) {
            await conexionSistema.end();
            console.log('✅ No hay clientes suspendidos que requieran visita de retiro.\n');
            return {
                total: 0,
                creadas: 0,
                duplicadas: 0,
                errores: 0,
                canceladas: resultadoLimpieza.canceladas,
                completadas: resultadoLimpieza.completadas
            };
        }

        // PASO 3: Crear nuevas visitas para clientes suspendidos
        let visitasCreadas = 0;
        let duplicadas = 0;
        let errores = 0;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 PROCESANDO CLIENTES...\n');

        for (const cliente of clientes) {
            try {
                // Verificar si ya existe una visita
                const visitaExistente = await verificarVisitaExistente(conexionSistema, cliente.cedula);

                if (visitaExistente) {
                    console.log(`⏭️  OMITIDO: ${cliente.nombre}`);
                    console.log(`   └─ Ya tiene visita de retiro (ID: ${visitaExistente.id}, Estado: ${visitaExistente.estado})`);
                    console.log(`   └─ Creada el: ${new Date(visitaExistente.fecha_creacion).toLocaleString('es-CO')}\n`);
                    duplicadas++;
                    continue;
                }

                // Crear nueva visita
                const visitaId = await crearVisitaRetiro(conexionSistema, cliente);

                console.log(`✅ VISITA CREADA: ${cliente.nombre}`);
                console.log(`   ├─ ID Visita: ${visitaId}`);
                console.log(`   ├─ Cédula: ${cliente.cedula}`);
                console.log(`   ├─ Días moroso: ${cliente.dias_moroso}`);
                console.log(`   ├─ Deuda: $${parseFloat(cliente.deuda_total || 0).toLocaleString('es-CO')}`);
                console.log(`   └─ BD Origen: ${cliente.bd_nombre}\n`);

                visitasCreadas++;
            } catch (error) {
                console.error(`❌ ERROR procesando ${cliente.nombre}:`, error.message, '\n');
                errores++;
            }
        }

        await conexionSistema.end();

        // Resumen final
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMEN FINAL DE EJECUCIÓN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   LIMPIEZA DE VISITAS OBSOLETAS:');
        console.log(`   ├─ 🔒 Visitas manuales protegidas: ${resultadoLimpieza.manuales_protegidas || 0}`);
        console.log(`   ├─ ❌ Canceladas (ya pagaron):     ${resultadoLimpieza.canceladas}`);
        console.log(`   └─ ✅ Completadas (ya retirados):  ${resultadoLimpieza.completadas}`);
        console.log('');
        console.log('   CREACIÓN DE NUEVAS VISITAS:');
        console.log(`   ├─ Clientes analizados:           ${clientes.length}`);
        console.log(`   ├─ Visitas creadas:               ${visitasCreadas}`);
        console.log(`   ├─ Ya existían (duplicadas):      ${duplicadas}`);
        console.log(`   └─ Errores:                       ${errores}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            total: clientes.length,
            creadas: visitasCreadas,
            duplicadas: duplicadas,
            errores: errores,
            canceladas: resultadoLimpieza.canceladas,
            completadas: resultadoLimpieza.completadas
        };

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar el script
if (require.main === module) {
    procesarClientesSuspendidos()
        .then(() => {
            console.log('✅ Script finalizado correctamente.\n');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Error ejecutando el script:', error);
            process.exit(1);
        });
}

module.exports = { procesarClientesSuspendidos, obtenerClientesSuspendidos };
