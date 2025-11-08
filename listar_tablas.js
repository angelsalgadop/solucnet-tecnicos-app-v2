#!/usr/bin/env node
const mysql = require('mysql2/promise');

const bd = { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' };

async function listarTablas() {
    try {
        const conexion = await mysql.createConnection(bd);

        console.log('📋 Tablas en la base de datos Mikrowisp6:\n');
        const [tablas] = await conexion.execute('SHOW TABLES');

        tablas.forEach((tabla, index) => {
            console.log(`${index + 1}. ${tabla[Object.keys(tabla)[0]]}`);
        });

        // Buscar tablas relacionadas con visitas
        console.log('\n🔍 Buscando tablas relacionadas con "visita", "retiro", "orden"...\n');
        const [tablasRelacionadas] = await conexion.execute(
            "SHOW TABLES LIKE '%visita%'"
        );

        if (tablasRelacionadas.length > 0) {
            console.log('Tablas con "visita":');
            tablasRelacionadas.forEach(t => console.log(`  • ${t[Object.keys(t)[0]]}`));
        }

        const [tablasRetiro] = await conexion.execute("SHOW TABLES LIKE '%retiro%'");
        if (tablasRetiro.length > 0) {
            console.log('\nTablas con "retiro":');
            tablasRetiro.forEach(t => console.log(`  • ${t[Object.keys(t)[0]]}`));
        }

        const [tablasOrden] = await conexion.execute("SHOW TABLES LIKE '%orden%'");
        if (tablasOrden.length > 0) {
            console.log('\nTablas con "orden":');
            tablasOrden.forEach(t => console.log(`  • ${t[Object.keys(t)[0]]}`));
        }

        await conexion.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listarTablas().catch(console.error);
