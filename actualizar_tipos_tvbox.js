const mysql = require('mysql2/promise');

async function actualizarTiposTVBox() {
    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    console.log('🔄 Actualizando tipos de equipos ROUTER → TV BOX...\n');

    // 1. Actualizar ROUTER a TV BOX
    const [resultadoRouter] = await conexion.execute(`
        UPDATE visitas_tecnicas
        SET equipo_tipo = 'TV BOX'
        WHERE equipo_tipo = 'ROUTER'
    `);

    console.log(`✅ ${resultadoRouter.affectedRows} equipos ROUTER → TV BOX`);

    // 2. Actualizar ROUTER TENDA a TV BOX
    const [resultadoTenda] = await conexion.execute(`
        UPDATE visitas_tecnicas
        SET equipo_tipo = 'TV BOX'
        WHERE equipo_tipo = 'ROUTER TENDA'
    `);

    console.log(`✅ ${resultadoTenda.affectedRows} equipos ROUTER TENDA → TV BOX`);

    // 3. Verificar resultado
    const [equiposActualizados] = await conexion.query(`
        SELECT DISTINCT equipo_tipo, COUNT(*) as cantidad
        FROM visitas_tecnicas
        WHERE equipo_tipo IS NOT NULL
        AND equipo_tipo != ''
        GROUP BY equipo_tipo
        ORDER BY cantidad DESC
    `);

    console.log('\n📋 Tipos de equipos después de la actualización:');
    equiposActualizados.forEach(tipo => {
        console.log(`  • ${tipo.equipo_tipo} (${tipo.cantidad} visitas)`);
    });

    // 4. Mostrar equipos específicos
    const [equiposDetalle] = await conexion.query(`
        SELECT cliente_nombre, serial_equipo_asignado, equipo_tipo
        FROM visitas_tecnicas
        WHERE serial_equipo_asignado IS NOT NULL
        AND serial_equipo_asignado != ''
        ORDER BY equipo_tipo, cliente_nombre
    `);

    console.log('\n📦 Equipos por tipo actualizado:');
    const equiposPorTipo = {};
    equiposDetalle.forEach(equipo => {
        const tipo = equipo.equipo_tipo || 'Sin tipo';
        if (!equiposPorTipo[tipo]) {
            equiposPorTipo[tipo] = [];
        }
        equiposPorTipo[tipo].push(equipo);
    });

    Object.keys(equiposPorTipo).forEach(tipo => {
        console.log(`\n📺 ${tipo}:`);
        equiposPorTipo[tipo].forEach(equipo => {
            console.log(`  • ${equipo.cliente_nombre} → ${equipo.serial_equipo_asignado}`);
        });
    });

    await conexion.end();

    console.log('\n🎯 PRÓXIMO PASO:');
    console.log('Actualizar el frontend para mostrar "TV BOX" correctamente');
}

actualizarTiposTVBox().catch(console.error);