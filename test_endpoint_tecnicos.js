const mysql = require('mysql2/promise');

// Configuración de base de datos del sistema
const dbSistema = {
    host: 'localhost',
    user: 'debian-sys-maint',
    password: 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

async function testEndpointTecnicos() {
    console.log('🧪 PRUEBA DIRECTA DEL ENDPOINT DE TÉCNICOS...\n');

    let conexion;
    try {
        conexion = await mysql.createConnection(dbSistema);

        // Simular exactamente lo que hace obtenerVisitasTecnico
        console.log('🔍 Consultando visitas del técnico ID 22...');

        const [visitas] = await conexion.execute(`
            SELECT *
            FROM visitas_tecnicas
            WHERE tecnico_asignado_id = ? AND estado IN ('asignada', 'en_progreso')
            ORDER BY fecha_programada ASC
        `, [22]);

        console.log(`📋 Encontradas ${visitas.length} visitas\n`);

        if (visitas.length > 0) {
            visitas.forEach((visita, index) => {
                console.log(`📋 VISITA ${index + 1}:`);
                console.log(`  ID: ${visita.id}`);
                console.log(`  Cliente: ${visita.cliente_nombre}`);
                console.log(`  Cédula: ${visita.cliente_cedula}`);
                console.log(`  Estado: ${visita.estado}`);
                console.log(`  📦 DATOS DE EQUIPOS EN BD:`);
                console.log(`    • serial_equipo_asignado: "${visita.serial_equipo_asignado}"`);
                console.log(`    • equipo_tipo: "${visita.equipo_tipo}"`);
                console.log(`    • equipo_estado: "${visita.equipo_estado}"`);
                console.log(`    • mikrotik_nombre: "${visita.mikrotik_nombre}"`);
                console.log(`    • usuario_ppp: "${visita.usuario_ppp}"`);

                // Verificar qué mostraría en el frontend
                if (visita.serial_equipo_asignado || visita.mikrotik_nombre || visita.usuario_ppp) {
                    console.log(`  ✅ Esta visita DEBERÍA mostrar "Información de Equipos"`);

                    if (visita.serial_equipo_asignado) {
                        console.log(`  ✅ Esta visita DEBERÍA mostrar "EQUIPO ASIGNADO: ${visita.serial_equipo_asignado}"`);
                    } else {
                        console.log(`  ⚠️ Esta visita NO mostrará "EQUIPO ASIGNADO" (no hay serial)`);
                    }
                } else {
                    console.log(`  ❌ Esta visita NO mostrará "Información de Equipos"`);
                }

                console.log(`  ${'='.repeat(60)}\n`);
            });

            // Verificar el endpoint real
            console.log(`🌐 PROBANDO ENDPOINT HTTP...`);
            console.log(`Url que usa el frontend: http://localhost:3000/api/tecnicos/visitas?tecnico_id=22`);
            console.log(`\n💡 Para probar en navegador:`);
            console.log(`1. Abre: http://localhost:3000/tecnicos_visitas.html`);
            console.log(`2. Inicia sesión con usuario: tecnico_test`);
            console.log(`3. Busca las visitas asignadas`);
            console.log(`4. Haz clic en "Completar" en una visita`);
            console.log(`5. Deberías ver "EQUIPO ASIGNADO" en el modal`);

        } else {
            console.log('❌ No se encontraron visitas para el técnico ID 22');
        }

    } catch (error) {
        console.error('❌ Error en prueba:', error.message);
        console.error(error.stack);
    } finally {
        if (conexion) await conexion.end();
    }
}

// Ejecutar prueba
testEndpointTecnicos()
    .then(() => {
        console.log('\n✅ Prueba de endpoint completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });