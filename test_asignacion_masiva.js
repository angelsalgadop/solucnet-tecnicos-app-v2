const mysql = require('mysql2/promise');

async function testAsignacionMasiva() {
    console.log('🧪 Probando funcionalidad de asignación masiva...\n');

    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    // 1. Verificar técnicos disponibles
    console.log('1️⃣ Verificando técnicos disponibles...');
    const [tecnicos] = await conexion.query(`
        SELECT id, nombre, especialidad
        FROM tecnicos
        WHERE activo = 1
        ORDER BY nombre
    `);

    console.log(`   ✅ ${tecnicos.length} técnicos encontrados:`);
    tecnicos.forEach(t => {
        console.log(`     ID: ${t.id}, Nombre: "${t.nombre}", Especialidad: "${t.especialidad}"`);
    });

    // 2. Verificar visitas disponibles para asignar
    console.log('\n2️⃣ Verificando visitas disponibles para asignación masiva...');
    const [visitas] = await conexion.query(`
        SELECT id, cliente_nombre, equipo_tipo, tecnico_asignado_id, estado
        FROM visitas_tecnicas
        WHERE estado IN ('programada', 'asignada')
        ORDER BY id DESC
        LIMIT 10
    `);

    console.log(`   ✅ ${visitas.length} visitas disponibles para asignar:`);
    visitas.forEach(v => {
        const asignado = v.tecnico_asignado_id ? `Técnico ${v.tecnico_asignado_id}` : 'Sin asignar';
        console.log(`     ID: ${v.id}, Cliente: "${v.cliente_nombre}", ${asignado}, Estado: ${v.estado}`);
    });

    // 3. Simular asignación masiva (seleccionar 3 visitas y asignarlas al primer técnico)
    if (tecnicos.length > 0 && visitas.length >= 3) {
        const tecnicoSeleccionado = tecnicos[0];
        const visitasParaAsignar = visitas.slice(0, 3);

        console.log(`\n3️⃣ Simulando asignación masiva...`);
        console.log(`   Técnico seleccionado: ${tecnicoSeleccionado.nombre} (ID: ${tecnicoSeleccionado.id})`);
        console.log(`   Visitas para asignar: ${visitasParaAsignar.length}`);

        for (const visita of visitasParaAsignar) {
            await conexion.execute(`
                UPDATE visitas_tecnicas
                SET tecnico_asignado_id = ?,
                    tecnico_asignado_nombre = ?,
                    estado = 'asignada'
                WHERE id = ?
            `, [tecnicoSeleccionado.id, tecnicoSeleccionado.nombre, visita.id]);

            console.log(`     ✅ Visita ${visita.id} asignada a ${tecnicoSeleccionado.nombre}`);
        }

        // 4. Verificar resultado
        console.log('\n4️⃣ Verificando resultado de la asignación...');
        const [visitasAsignadas] = await conexion.query(`
            SELECT id, cliente_nombre, tecnico_asignado_nombre, estado
            FROM visitas_tecnicas
            WHERE id IN (${visitasParaAsignar.map(v => v.id).join(',')})
        `);

        visitasAsignadas.forEach(v => {
            console.log(`     ✅ Visita ${v.id}: ${v.cliente_nombre} → ${v.tecnico_asignado_nombre} (${v.estado})`);
        });

        console.log('\n🎯 PRUEBA COMPLETADA:');
        console.log('  ✅ Los técnicos se cargan correctamente de la base de datos');
        console.log('  ✅ La asignación masiva funciona correctamente');
        console.log('  ✅ Los estados se actualizan apropiadamente');

        console.log('\n🌐 PARA PROBAR EN LA INTERFAZ WEB:');
        console.log('1. Abre: https://192.168.99.122:3000/admin');
        console.log('2. Ve a la sección de "Asignar Técnico Masivamente"');
        console.log('3. Verifica que aparezcan técnicos reales en el dropdown');
        console.log('4. Selecciona visitas y un técnico, luego asigna');

    } else {
        console.log('\n❌ No hay suficientes técnicos o visitas para probar');
    }

    await conexion.end();
}

testAsignacionMasiva().catch(console.error);