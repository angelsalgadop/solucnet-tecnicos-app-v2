const mysql = require('mysql2/promise');

async function configurarTecnico1() {
    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    console.log('🔍 Buscando Tecnico 1 - Redes y conectividad...\n');

    // 1. Buscar el técnico por nombre
    const [tecnicos] = await conexion.query(`
        SELECT id, nombre, username
        FROM usuarios_sistema
        WHERE nombre LIKE '%Tecnico 1%' OR nombre LIKE '%Redes y conectividad%'
        OR username LIKE '%tecnico1%'
    `);

    console.log(`📋 Técnicos encontrados: ${tecnicos.length}`);
    tecnicos.forEach(t => {
        console.log(`  ID: ${t.id}, Nombre: "${t.nombre}", Usuario: "${t.username}"`);
    });

    if (tecnicos.length === 0) {
        console.log('\n⚠️ No se encontró "Tecnico 1 - Redes y conectividad"');
        console.log('Mostrando todos los técnicos disponibles:');

        const [todosTecnicos] = await conexion.query(`
            SELECT id, nombre, username, rol
            FROM usuarios_sistema
            ORDER BY id
        `);

        todosTecnicos.forEach(t => {
            console.log(`  ID: ${t.id}, Nombre: "${t.nombre}", Usuario: "${t.username}", Rol: ${t.rol}`);
        });

        await conexion.end();
        return;
    }

    // 2. Usar el primer técnico encontrado
    const tecnico = tecnicos[0];
    console.log(`\n✅ Configurando técnico: ${tecnico.nombre} (ID: ${tecnico.id})`);

    // 3. Verificar visitas actuales del técnico
    const [visitasActuales] = await conexion.query(`
        SELECT id, cliente_nombre, serial_equipo_asignado, estado
        FROM visitas_tecnicas
        WHERE tecnico_asignado_id = ?
        AND estado IN ('asignada', 'en_progreso')
    `, [tecnico.id]);

    console.log(`\n📋 Visitas actuales del técnico: ${visitasActuales.length}`);
    if (visitasActuales.length > 0) {
        visitasActuales.forEach(v => {
            console.log(`  ID: ${v.id}, Cliente: ${v.cliente_nombre}, Serial: ${v.serial_equipo_asignado || 'NO ASIGNADO'}`);
        });
    }

    // 4. Buscar visitas con seriales disponibles
    const [visitasConSeriales] = await conexion.query(`
        SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, tecnico_asignado_id
        FROM visitas_tecnicas
        WHERE serial_equipo_asignado IS NOT NULL
        AND serial_equipo_asignado != ''
        AND estado IN ('programada', 'asignada')
        ORDER BY id DESC
        LIMIT 5
    `);

    console.log(`\n📦 Visitas con seriales disponibles: ${visitasConSeriales.length}`);
    visitasConSeriales.forEach(v => {
        const estado = v.tecnico_asignado_id ? `Asignada a técnico ${v.tecnico_asignado_id}` : 'Disponible';
        console.log(`  ID: ${v.id}, Cliente: ${v.cliente_nombre}, Serial: ${v.serial_equipo_asignado}, ${estado}`);
    });

    // 5. Asignar las primeras 3 visitas con seriales al técnico
    const visitasParaAsignar = visitasConSeriales.slice(0, 3);

    if (visitasParaAsignar.length > 0) {
        console.log(`\n🔄 Asignando ${visitasParaAsignar.length} visitas al técnico...`);

        for (const visita of visitasParaAsignar) {
            await conexion.execute(`
                UPDATE visitas_tecnicas
                SET tecnico_asignado_id = ?,
                    tecnico_asignado_nombre = ?,
                    estado = 'asignada'
                WHERE id = ?
            `, [tecnico.id, tecnico.nombre, visita.id]);

            console.log(`  ✅ Visita ${visita.id} asignada: ${visita.cliente_nombre} → ${visita.serial_equipo_asignado}`);
        }

        // 6. Verificar resultado final
        const [visitasFinales] = await conexion.query(`
            SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, estado
            FROM visitas_tecnicas
            WHERE tecnico_asignado_id = ?
            AND estado IN ('asignada', 'en_progreso')
        `, [tecnico.id]);

        console.log(`\n🎯 RESULTADO FINAL:`);
        console.log(`  Técnico: ${tecnico.nombre} (ID: ${tecnico.id})`);
        console.log(`  Visitas asignadas: ${visitasFinales.length}`);

        if (visitasFinales.length > 0) {
            console.log(`\n📋 Visitas que aparecerán en tecnicos_visitas.html:`);
            visitasFinales.forEach((visita, index) => {
                console.log(`  ${index + 1}. ${visita.cliente_nombre}`);
                console.log(`     Serial: ${visita.serial_equipo_asignado}`);
                console.log(`     Tipo: ${visita.equipo_tipo}`);
                console.log(`     ✅ Mostrará "EQUIPO ASIGNADO" en el modal\n`);
            });

            console.log(`🌐 INSTRUCCIONES:`);
            console.log(`1. Abre: https://localhost:3000/tecnicos_visitas.html`);
            console.log(`2. Inicia sesión como: ${tecnico.nombre}`);
            console.log(`3. Haz clic en "Completar" en cualquier visita`);
            console.log(`4. Deberías ver "EQUIPO ASIGNADO" con el serial`);
        }
    } else {
        console.log('\n❌ No hay visitas con seriales disponibles para asignar');
    }

    await conexion.end();
}

configurarTecnico1().catch(console.error);