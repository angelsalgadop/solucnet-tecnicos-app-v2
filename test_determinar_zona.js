const mysql = require('mysql2/promise');

const dbSistema = {
    host: 'localhost',
    user: 'debian-sys-maint',
    password: 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

async function testDeterminarZona() {
    try {
        console.log('🧪 Probando determinación de zonas para clientes nuevos...\n');

        const conexion = await mysql.createConnection(dbSistema);

        // Obtener algunos clientes con bd_origen = 'nuevos_clientes'
        const [visitas] = await conexion.execute(
            `SELECT id, cliente_nombre, bd_origen, localidad, cliente_direccion
             FROM visitas_tecnicas
             WHERE bd_origen = 'nuevos_clientes'
             LIMIT 10`
        );

        console.log(`📋 Encontradas ${visitas.length} visitas con bd_origen = 'nuevos_clientes'\n`);

        for (const visita of visitas) {
            const textoCompleto = `${visita.localidad || ''} ${visita.cliente_direccion || ''}`.toUpperCase();

            let zonaDetectada = 'No detectada (usará Reposo por defecto)';
            if (textoCompleto.includes('REPOSO') || textoCompleto.includes('SALVADOR') || textoCompleto.includes('MI LUCHA')) {
                zonaDetectada = '192.168.99.50 (Reposo)';
            } else if (textoCompleto.includes('CHURIDO')) {
                zonaDetectada = '192.168.99.11 (Churido)';
            } else if (textoCompleto.includes('OSITO') || textoCompleto.includes('RIO GRANDE') || textoCompleto.includes('SALSIPUEDES')) {
                zonaDetectada = '192.168.99.2 (Rio Grande)';
            }

            console.log(`\n🔍 ID ${visita.id} - ${visita.cliente_nombre}`);
            console.log(`   Localidad: ${visita.localidad || 'NULL'}`);
            console.log(`   Dirección: ${visita.cliente_direccion || 'NULL'}`);
            console.log(`   ✅ Zona detectada: ${zonaDetectada}`);
        }

        await conexion.end();
        console.log('\n✅ Prueba completada');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testDeterminarZona();
