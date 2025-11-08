const mysql = require('mysql2/promise');

async function checkDB() {
    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    console.log('🔍 Verificación directa de la base de datos...\n');

    // Verificar todas las visitas
    const [todasVisitas] = await conexion.query(`
        SELECT id, cliente_nombre, tecnico_asignado_id, estado, serial_equipo_asignado
        FROM visitas_tecnicas
        ORDER BY id DESC
        LIMIT 10
    `);

    console.log('📋 Últimas 10 visitas en la BD:');
    todasVisitas.forEach(v => {
        console.log(`  ID: ${v.id}, Cliente: ${v.cliente_nombre}, Técnico: ${v.tecnico_asignado_id}, Estado: ${v.estado}, Serial: ${v.serial_equipo_asignado || 'NULL'}`);
    });

    // Verificar visitas del técnico 22
    const [visitasTecnico22] = await conexion.query(`
        SELECT id, cliente_nombre, estado, serial_equipo_asignado
        FROM visitas_tecnicas
        WHERE tecnico_asignado_id = 22
    `);

    console.log(`\n📋 Visitas del técnico 22: ${visitasTecnico22.length}`);
    visitasTecnico22.forEach(v => {
        console.log(`  ID: ${v.id}, Cliente: ${v.cliente_nombre}, Estado: ${v.estado}, Serial: ${v.serial_equipo_asignado || 'NULL'}`);
    });

    // Verificar visitas con estado asignada/en_progreso
    const [visitasActivas] = await conexion.query(`
        SELECT id, cliente_nombre, tecnico_asignado_id, estado, serial_equipo_asignado
        FROM visitas_tecnicas
        WHERE tecnico_asignado_id = 22
        AND estado IN ('asignada', 'en_progreso')
    `);

    console.log(`\n📋 Visitas activas del técnico 22: ${visitasActivas.length}`);
    visitasActivas.forEach(v => {
        console.log(`  ID: ${v.id}, Cliente: ${v.cliente_nombre}, Estado: ${v.estado}, Serial: ${v.serial_equipo_asignado || 'NULL'}`);
    });

    await conexion.end();
}

checkDB().catch(console.error);