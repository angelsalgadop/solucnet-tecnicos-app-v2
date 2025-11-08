const mysql = require('mysql2/promise');

async function asignarMasVisitasTecnico1() {
    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    console.log('🔄 Asignando más visitas con seriales al Tecnico 1 (ID: 4)...\n');

    // 1. Verificar visitas actuales del Tecnico 1
    const [visitasActuales] = await conexion.query(`
        SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, estado
        FROM visitas_tecnicas
        WHERE tecnico_asignado_id = 4
        AND estado IN ('asignada', 'en_progreso')
    `);

    console.log(`📋 Visitas actuales del Tecnico 1: ${visitasActuales.length}`);
    visitasActuales.forEach(v => {
        console.log(`  ID: ${v.id}, Cliente: ${v.cliente_nombre}, Serial: ${v.serial_equipo_asignado || 'SIN SERIAL'}`);
    });

    // 2. Buscar visitas con seriales no asignadas al Tecnico 1
    const [visitasDisponibles] = await conexion.query(`
        SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, tecnico_asignado_id
        FROM visitas_tecnicas
        WHERE serial_equipo_asignado IS NOT NULL
        AND serial_equipo_asignado != ''
        AND (tecnico_asignado_id != 4 OR tecnico_asignado_id IS NULL)
        AND estado IN ('programada', 'asignada')
        ORDER BY id DESC
        LIMIT 3
    `);

    console.log(`\n📦 Visitas con seriales disponibles: ${visitasDisponibles.length}`);
    visitasDisponibles.forEach(v => {
        const asignado = v.tecnico_asignado_id ? `Técnico ${v.tecnico_asignado_id}` : 'No asignada';
        console.log(`  ID: ${v.id}, Cliente: ${v.cliente_nombre}, Serial: ${v.serial_equipo_asignado}, ${asignado}`);
    });

    // 3. Asignar estas visitas al Tecnico 1
    if (visitasDisponibles.length > 0) {
        console.log(`\n🔄 Asignando ${visitasDisponibles.length} visitas adicionales al Tecnico 1...`);

        for (const visita of visitasDisponibles) {
            await conexion.execute(`
                UPDATE visitas_tecnicas
                SET tecnico_asignado_id = 4,
                    tecnico_asignado_nombre = 'Tecnico 1',
                    estado = 'asignada'
                WHERE id = ?
            `, [visita.id]);

            console.log(`  ✅ Visita ${visita.id} asignada: ${visita.cliente_nombre} → ${visita.serial_equipo_asignado}`);
        }
    }

    // 4. Verificar resultado final
    const [visitasFinales] = await conexion.query(`
        SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, estado
        FROM visitas_tecnicas
        WHERE tecnico_asignado_id = 4
        AND estado IN ('asignada', 'en_progreso')
        ORDER BY id DESC
    `);

    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`  Tecnico 1 - Redes y conectividad (ID: 4)`);
    console.log(`  Total visitas asignadas: ${visitasFinales.length}`);

    const visitasConSerial = visitasFinales.filter(v => v.serial_equipo_asignado);
    console.log(`  Visitas con seriales: ${visitasConSerial.length}`);

    if (visitasConSerial.length > 0) {
        console.log(`\n📋 Visitas que mostrarán "EQUIPO ASIGNADO":`);
        visitasConSerial.forEach((visita, index) => {
            console.log(`  ${index + 1}. ${visita.cliente_nombre}`);
            console.log(`     Serial: ${visita.serial_equipo_asignado}`);
            console.log(`     Tipo: ${visita.equipo_tipo || 'Sin tipo'}`);
            console.log(`     Estado: ${visita.estado}`);
            console.log(`     ✅ Mostrará "EQUIPO ASIGNADO" en el modal\n`);
        });

        console.log(`🌐 PARA PROBAR:`);
        console.log(`1. Abre: https://192.168.99.122:3000/tecnicos_visitas.html`);
        console.log(`2. Inicia sesión como Tecnico 1`);
        console.log(`3. Deberías ver ${visitasFinales.length} visitas`);
        console.log(`4. Haz clic en "Completar" en cualquier visita`);
        console.log(`5. En el modal deberías ver "EQUIPO ASIGNADO" con el serial`);
        console.log(`\n💡 Si no aparece, presiona Ctrl+F5 para limpiar caché del navegador`);
    } else {
        console.log(`\n❌ El Tecnico 1 no tiene visitas con seriales`);
    }

    await conexion.end();
}

asignarMasVisitasTecnico1().catch(console.error);