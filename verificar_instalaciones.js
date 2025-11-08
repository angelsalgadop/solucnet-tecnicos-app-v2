#!/usr/bin/env node
const mysql = require('mysql2/promise');

const bd = { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' };

async function verificar() {
    try {
        const conexion = await mysql.createConnection(bd);

        console.log('📋 Estructura de tabla "instalaciones":\n');
        const [columnas] = await conexion.execute('SHOW COLUMNS FROM instalaciones');
        columnas.forEach(col => {
            console.log(`  • ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'.padEnd(8)} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
        });

        console.log('\n📋 Ejemplo de registro:');
        console.log('-'.repeat(100));
        const [ejemplo] = await conexion.execute('SELECT * FROM instalaciones ORDER BY id DESC LIMIT 1');
        if (ejemplo.length > 0) {
            Object.entries(ejemplo[0]).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        } else {
            console.log('  No hay registros');
        }

        // También verificar tabla tareas
        console.log('\n\n📋 Estructura de tabla "tareas":\n');
        const [columnasTareas] = await conexion.execute('SHOW COLUMNS FROM tareas');
        columnasTareas.forEach(col => {
            console.log(`  • ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'.padEnd(8)}`);
        });

        console.log('\n📋 Ejemplo de tarea:');
        console.log('-'.repeat(100));
        const [ejemploTarea] = await conexion.execute('SELECT * FROM tareas ORDER BY id DESC LIMIT 1');
        if (ejemploTarea.length > 0) {
            Object.entries(ejemploTarea[0]).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        }

        await conexion.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificar().catch(console.error);
