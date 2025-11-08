const mysql = require('mysql2/promise');

const dbSistema = {
    host: 'localhost',
    user: 'debian-sys-maint',
    password: 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

async function verificarYAsignarVisitas() {
    console.log('🔍 Verificando visitas para tecnicos_visitas.html...\n');

    let conexion;
    try {
        conexion = await mysql.createConnection(dbSistema);

        // 1. Verificar técnico de prueba
        const [tecnicos] = await conexion.query(`
            SELECT id, nombre, username
            FROM usuarios_sistema
            WHERE username = 'tecnico_test'
        `);

        if (tecnicos.length === 0) {
            console.log('❌ No existe el técnico tecnico_test');
            return;
        }

        const tecnico = tecnicos[0];
        console.log(`✅ Técnico encontrado: ${tecnico.nombre} (ID: ${tecnico.id})`);

        // 2. Buscar visitas con seriales
        const [visitasConSeriales] = await conexion.query(`
            SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, estado, tecnico_asignado_id
            FROM visitas_tecnicas
            WHERE serial_equipo_asignado IS NOT NULL
            AND serial_equipo_asignado != ''
            ORDER BY id DESC
            LIMIT 5
        `);

        console.log(`\n📋 Visitas con seriales encontradas: ${visitasConSeriales.length}`);

        if (visitasConSeriales.length === 0) {
            console.log('❌ No hay visitas con seriales en la base de datos');
            return;
        }

        // 3. Asignar las primeras 2 visitas al técnico de prueba
        const visitasParaAsignar = visitasConSeriales.slice(0, 2);

        for (const visita of visitasParaAsignar) {
            await conexion.execute(`
                UPDATE visitas_tecnicas
                SET tecnico_asignado_id = ?,
                    tecnico_asignado_nombre = ?,
                    estado = 'asignada'
                WHERE id = ?
            `, [tecnico.id, tecnico.nombre, visita.id]);

            console.log(`✅ Visita ${visita.id} asignada: ${visita.cliente_nombre} → ${visita.serial_equipo_asignado}`);
        }

        // 4. Verificar resultado final
        const [visitasAsignadas] = await conexion.query(`
            SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, estado
            FROM visitas_tecnicas
            WHERE tecnico_asignado_id = ?
            AND estado IN ('asignada', 'en_progreso')
        `, [tecnico.id]);

        console.log(`\n🎯 RESULTADO FINAL:`);
        console.log(`  Técnico: ${tecnico.username} (${tecnico.nombre})`);
        console.log(`  Visitas asignadas: ${visitasAsignadas.length}`);

        if (visitasAsignadas.length > 0) {
            console.log(`\n📋 Visitas que aparecerán en tecnicos_visitas.html:`);
            visitasAsignadas.forEach((visita, index) => {
                console.log(`  ${index + 1}. ${visita.cliente_nombre}`);
                console.log(`     Serial: ${visita.serial_equipo_asignado}`);
                console.log(`     Tipo: ${visita.equipo_tipo}`);
                console.log(`     Estado: ${visita.estado}`);
                console.log(`     ✅ Mostrará "EQUIPO ASIGNADO" en el modal\n`);
            });

            console.log(`🌐 INSTRUCCIONES PARA PROBAR:`);
            console.log(`1. Abre: https://localhost:3000/tecnicos_visitas.html`);
            console.log(`2. Usuario: tecnico_test`);
            console.log(`3. Password: test123`);
            console.log(`4. Haz clic en "Completar" en cualquier visita`);
            console.log(`5. En el modal deberías ver:`);
            console.log(`   - "Información de Equipos"`);
            console.log(`   - "⚠️ EQUIPO ASIGNADO:"`);
            console.log(`   - "Serial: ${visitasAsignadas[0].serial_equipo_asignado}"`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (conexion) await conexion.end();
    }
}

verificarYAsignarVisitas()
    .then(() => {
        console.log('\n✅ Verificación completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });