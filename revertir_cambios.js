const mysql = require('mysql2/promise');

async function revertirCambios() {
    const conexion = await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });

    console.log('🔄 Revirtiendo cambios de TV BOX a ROUTER...\n');

    // Revertir TV BOX a ROUTER
    const [resultado] = await conexion.execute(`
        UPDATE visitas_tecnicas
        SET equipo_tipo = 'ROUTER'
        WHERE equipo_tipo = 'TV BOX'
    `);

    console.log(`✅ ${resultado.affectedRows} equipos TV BOX → ROUTER`);

    // Verificar resultado
    const [tipos] = await conexion.query(`
        SELECT DISTINCT equipo_tipo, COUNT(*) as cantidad
        FROM visitas_tecnicas
        WHERE equipo_tipo IS NOT NULL
        GROUP BY equipo_tipo
    `);

    console.log('\n📋 Tipos después de revertir:');
    tipos.forEach(tipo => {
        console.log(`  • ${tipo.equipo_tipo} (${tipo.cantidad})`);
    });

    await conexion.end();
}

revertirCambios().catch(console.error);