const mysql = require('mysql2/promise');

// Configuraciones de las bases de datos MikroWisp
const basesDatos = [
    { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '192.168.99.11', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '192.168.99.2', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' }
];

async function buscarTecnico1() {
    console.log('🔍 Buscando "Tecnico 1" en las bases de datos MikroWisp...\n');

    for (const bd of basesDatos) {
        try {
            console.log(`📡 Conectando a ${bd.host}...`);
            const conexion = await mysql.createConnection(bd);

            // Buscar en tabla de técnicos o empleados
            try {
                const [tecnicos] = await conexion.query(`
                    SELECT * FROM tecnicos
                    WHERE nombre LIKE '%Tecnico 1%' OR nombre LIKE '%Redes%'
                    LIMIT 5
                `);

                if (tecnicos.length > 0) {
                    console.log(`  ✅ Encontrados en tabla 'tecnicos':`);
                    tecnicos.forEach(t => {
                        console.log(`    ID: ${t.id}, Nombre: "${t.nombre}"`);
                    });
                }
            } catch (error) {
                console.log(`    ⚠️ Tabla 'tecnicos' no existe o error: ${error.message}`);
            }

            // Buscar en tabla de empleados
            try {
                const [empleados] = await conexion.query(`
                    SELECT * FROM empleados
                    WHERE nombre LIKE '%Tecnico 1%' OR nombre LIKE '%Redes%'
                    LIMIT 5
                `);

                if (empleados.length > 0) {
                    console.log(`  ✅ Encontrados en tabla 'empleados':`);
                    empleados.forEach(e => {
                        console.log(`    ID: ${e.id}, Nombre: "${e.nombre}"`);
                    });
                }
            } catch (error) {
                console.log(`    ⚠️ Tabla 'empleados' no existe o error: ${error.message}`);
            }

            // Buscar en tabla de usuarios administradores
            try {
                const [admins] = await conexion.query(`
                    SELECT * FROM administradores
                    WHERE nombre LIKE '%Tecnico 1%' OR nombre LIKE '%Redes%'
                    LIMIT 5
                `);

                if (admins.length > 0) {
                    console.log(`  ✅ Encontrados en tabla 'administradores':`);
                    admins.forEach(a => {
                        console.log(`    ID: ${a.id}, Nombre: "${a.nombre}"`);
                    });
                }
            } catch (error) {
                console.log(`    ⚠️ Tabla 'administradores' no existe o error: ${error.message}`);
            }

            // Mostrar todas las tablas disponibles
            const [tablas] = await conexion.query('SHOW TABLES');
            const tablasConTecnico = tablas.filter(t =>
                Object.values(t)[0].toLowerCase().includes('tecnico') ||
                Object.values(t)[0].toLowerCase().includes('empleado') ||
                Object.values(t)[0].toLowerCase().includes('admin') ||
                Object.values(t)[0].toLowerCase().includes('user')
            );

            if (tablasConTecnico.length > 0) {
                console.log(`  📋 Tablas relacionadas con técnicos/usuarios:`);
                tablasConTecnico.forEach(t => {
                    console.log(`    - ${Object.values(t)[0]}`);
                });
            }

            await conexion.end();
            console.log(`  ✅ Conexión cerrada\n`);

        } catch (error) {
            console.log(`  ❌ Error conectando a ${bd.host}: ${error.message}\n`);
        }
    }

    console.log('💡 POSIBLE SOLUCIÓN:');
    console.log('Si "Tecnico 1 - Redes y conectividad" aparece en la interfaz web,');
    console.log('probablemente sea un técnico hardcodeado en el frontend.');
    console.log('Podemos crear este técnico en la base de datos del sistema.');
}

buscarTecnico1().catch(console.error);