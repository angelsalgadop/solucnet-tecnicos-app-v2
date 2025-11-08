const mysql = require('mysql2/promise');

async function verificarTiposEquipos() {
    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    console.log('🔍 Verificando tipos de equipos en las visitas...\n');

    // Ver todos los tipos de equipos únicos
    const [tiposEquipos] = await conexion.query(`
        SELECT DISTINCT equipo_tipo, COUNT(*) as cantidad
        FROM visitas_tecnicas
        WHERE equipo_tipo IS NOT NULL
        AND equipo_tipo != ''
        GROUP BY equipo_tipo
        ORDER BY cantidad DESC
    `);

    console.log('📋 Tipos de equipos encontrados:');
    tiposEquipos.forEach(tipo => {
        console.log(`  • ${tipo.equipo_tipo} (${tipo.cantidad} visitas)`);
    });

    // Ver seriales y tipos específicos
    const [equiposDetalle] = await conexion.query(`
        SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, equipo_estado
        FROM visitas_tecnicas
        WHERE serial_equipo_asignado IS NOT NULL
        AND serial_equipo_asignado != ''
        ORDER BY equipo_tipo, id
    `);

    console.log(`\n📦 Equipos por tipo:`);

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

    console.log('\n🎯 ANÁLISIS:');
    console.log('Los equipos que NO son "Onu CData" probablemente son TV BOX');
    console.log('Necesitamos actualizar la etiqueta en el frontend y las consultas');
}

verificarTiposEquipos().catch(console.error);