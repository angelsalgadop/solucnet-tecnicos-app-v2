const mysql = require('mysql2/promise');

async function reasignarVisitas() {
    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    console.log('🔄 Reasignando visitas con seriales al técnico 22...\n');

    // Asignar visitas con seriales al técnico 22
    const [resultado] = await conexion.execute(`
        UPDATE visitas_tecnicas
        SET tecnico_asignado_id = 22,
            tecnico_asignado_nombre = 'Técnico Prueba',
            estado = 'asignada'
        WHERE serial_equipo_asignado IS NOT NULL
        AND serial_equipo_asignado != ''
        AND estado IN ('programada', 'asignada')
    `);

    console.log(`✅ ${resultado.affectedRows} visitas reasignadas`);

    // Verificar resultado
    const [visitasAsignadas] = await conexion.query(`
        SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, estado
        FROM visitas_tecnicas
        WHERE tecnico_asignado_id = 22
        AND estado IN ('asignada', 'en_progreso')
    `);

    console.log(`\n📋 Visitas asignadas al técnico 22: ${visitasAsignadas.length}`);
    visitasAsignadas.forEach((visita, index) => {
        console.log(`  ${index + 1}. ${visita.cliente_nombre}`);
        console.log(`     Serial: ${visita.serial_equipo_asignado}`);
        console.log(`     Tipo: ${visita.equipo_tipo}`);
        console.log(`     Estado: ${visita.estado}\n`);
    });

    await conexion.end();

    if (visitasAsignadas.length > 0) {
        console.log('🎯 Ahora puedes probar en https://localhost:3000/tecnicos_visitas.html');
        console.log('   Usuario: tecnico_test');
        console.log('   Password: test123');
    }
}

reasignarVisitas().catch(console.error);