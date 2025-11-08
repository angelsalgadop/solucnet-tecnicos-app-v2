const mysql = require('mysql2/promise');

async function agregarMasTecnicos() {
    console.log('👥 Agregando más técnicos para prueba de asignación masiva...\n');

    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    // Verificar técnicos actuales
    const [tecnicosActuales] = await conexion.query(`
        SELECT id, nombre, especialidad
        FROM tecnicos
        WHERE activo = 1
    `);

    console.log(`📋 Técnicos actuales: ${tecnicosActuales.length}`);
    tecnicosActuales.forEach(t => {
        console.log(`  - ID: ${t.id}, Nombre: "${t.nombre}", Especialidad: "${t.especialidad}"`);
    });

    // Agregar nuevos técnicos si no existen
    const nuevosTecnicos = [
        {
            nombre: 'Tecnico 2',
            cedula: '22334455',
            telefono: '3001122334',
            especialidad: 'Fibra óptica'
        },
        {
            nombre: 'Tecnico 3',
            cedula: '33445566',
            telefono: '3002233445',
            especialidad: 'Equipos WiFi'
        },
        {
            nombre: 'Tecnico 4',
            cedula: '44556677',
            telefono: '3003344556',
            especialidad: 'Instalaciones'
        }
    ];

    console.log(`\n➕ Agregando ${nuevosTecnicos.length} nuevos técnicos...`);

    for (const tecnico of nuevosTecnicos) {
        // Verificar si ya existe
        const [existe] = await conexion.query(`
            SELECT id FROM tecnicos WHERE nombre = ? OR cedula = ?
        `, [tecnico.nombre, tecnico.cedula]);

        if (existe.length === 0) {
            await conexion.execute(`
                INSERT INTO tecnicos (nombre, cedula, telefono, especialidad, activo, creado_por)
                VALUES (?, ?, ?, ?, 1, 1)
            `, [tecnico.nombre, tecnico.cedula, tecnico.telefono, tecnico.especialidad]);

            console.log(`  ✅ ${tecnico.nombre} agregado - ${tecnico.especialidad}`);
        } else {
            console.log(`  ⚠️ ${tecnico.nombre} ya existe (ID: ${existe[0].id})`);
        }
    }

    // Verificar resultado final
    const [tecnicosFinales] = await conexion.query(`
        SELECT id, nombre, especialidad
        FROM tecnicos
        WHERE activo = 1
        ORDER BY id
    `);

    console.log(`\n🎯 TÉCNICOS FINALES: ${tecnicosFinales.length}`);
    tecnicosFinales.forEach(t => {
        console.log(`  - ID: ${t.id}, Nombre: "${t.nombre}", Especialidad: "${t.especialidad}"`);
    });

    console.log('\n🌐 AHORA PUEDES PROBAR:');
    console.log('1. Abre: https://192.168.99.122:3000/admin');
    console.log('2. Ve a "Asignar Técnico Masivamente"');
    console.log(`3. Deberías ver ${tecnicosFinales.length} técnicos en el dropdown`);
    console.log('4. Selecciona visitas y asigna a diferentes técnicos');

    await conexion.end();
}

agregarMasTecnicos().catch(console.error);