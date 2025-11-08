#!/usr/bin/env node
const mysql = require('mysql2/promise');

const basesDatos = [
    { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', nombre: 'BD Principal (50)' },
];

async function verificarEstructura() {
    console.log('🔍 Verificando estructura de tablas...\n');

    const bd = basesDatos[0];
    try {
        const conexion = await mysql.createConnection({
            host: bd.host,
            user: bd.user,
            password: bd.password,
            database: bd.database
        });

        // Verificar tabla de visitas
        console.log('📋 Tabla: visitas');
        console.log('-'.repeat(70));
        const [columnasVisitas] = await conexion.execute('SHOW COLUMNS FROM visitas');
        columnasVisitas.forEach(col => {
            console.log(`  • ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
        });

        console.log('\n📋 Verificando si existe tabla visitas_sin_asignar...');
        try {
            const [columnasSinAsignar] = await conexion.execute('SHOW COLUMNS FROM visitas_sin_asignar');
            console.log('✅ Tabla visitas_sin_asignar existe:');
            columnasSinAsignar.forEach(col => {
                console.log(`  • ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
            });
        } catch (error) {
            console.log('❌ No existe tabla visitas_sin_asignar');
        }

        // Verificar tabla usuarios
        console.log('\n📋 Tabla: usuarios (primeras 10 columnas)');
        console.log('-'.repeat(70));
        const [columnasUsuarios] = await conexion.execute('SHOW COLUMNS FROM usuarios LIMIT 10');
        columnasUsuarios.forEach(col => {
            console.log(`  • ${col.Field} (${col.Type})`);
        });

        // Ver ejemplo de registro de visitas
        console.log('\n📋 Ejemplo de registro en visitas:');
        console.log('-'.repeat(70));
        const [ejemploVisita] = await conexion.execute('SELECT * FROM visitas LIMIT 1');
        if (ejemploVisita.length > 0) {
            console.log(JSON.stringify(ejemploVisita[0], null, 2));
        } else {
            console.log('No hay registros en visitas');
        }

        await conexion.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarEstructura().catch(console.error);
