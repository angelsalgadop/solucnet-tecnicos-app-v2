const mysql = require('mysql2/promise');

// Usar las mismas credenciales que en index.js
const dbSistema = {
    host: 'localhost',
    user: 'debian-sys-maint',
    password: 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

async function probarTecnicosConDatosReales() {
    console.log('🧪 Probando interfaz de técnicos con datos reales...\n');

    let conexion;
    try {
        // Conectar a la base de datos
        conexion = await mysql.createConnection(dbSistema);
        console.log('✅ Conectado a la base de datos');

        // Primero agregar el rol 'tecnico' si no existe
        await conexion.query(`
            ALTER TABLE usuarios_sistema
            MODIFY COLUMN rol enum('soporte','admin','tecnico') NOT NULL DEFAULT 'soporte'
        `);

        // 1. Buscar técnicos existentes
        const [tecnicos] = await conexion.query(`
            SELECT id, nombre, username
            FROM usuarios_sistema
            WHERE rol = 'tecnico'
            LIMIT 5
        `);

        console.log(`\n📋 Técnicos encontrados: ${tecnicos.length}`);
        tecnicos.forEach(t => {
            console.log(`  • ID: ${t.id}, Nombre: ${t.nombre}, Usuario: ${t.username}`);
        });

        if (tecnicos.length === 0) {
            console.log('\n⚠️ No hay técnicos registrados. Creando uno de prueba...');

            // Crear técnico de prueba
            const [result] = await conexion.query(`
                INSERT INTO usuarios_sistema (nombre, username, password, rol)
                VALUES ('Técnico Prueba', 'tecnico_test', 'test123', 'tecnico')
            `);

            console.log(`✅ Técnico creado con ID: ${result.insertId}`);
            tecnicos.push({
                id: result.insertId,
                nombre: 'Técnico Prueba',
                username: 'tecnico_test'
            });
        }

        // 2. Buscar visitas asignadas a técnicos
        const [visitas] = await conexion.query(`
            SELECT vt.*,
                   COALESCE(vt.serial_equipo_asignado, 'SIN_SERIAL') as serial_equipo_asignado,
                   COALESCE(vt.equipo_tipo, 'Sin tipo') as equipo_tipo,
                   COALESCE(vt.equipo_estado, 'Sin estado') as equipo_estado
            FROM visitas_tecnicas vt
            WHERE vt.tecnico_asignado_id IS NOT NULL
            ORDER BY vt.fecha_programada DESC
            LIMIT 10
        `);

        console.log(`\n📋 Visitas asignadas encontradas: ${visitas.length}`);

        if (visitas.length === 0) {
            console.log('\n⚠️ No hay visitas asignadas. Creando una de prueba...');

            // Buscar un cliente que tenga equipo asignado
            const basesDatos = [
                { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' }
            ];

            for (const bd of basesDatos) {
                try {
                    const conexionMikro = await mysql.createConnection(bd);

                    // Buscar cliente con equipo
                    const [clientesConEquipo] = await conexionMikro.query(`
                        SELECT DISTINCT
                            u.id as userid,
                            u.nombre,
                            u.cedula,
                            u.telefono,
                            a.serial_producto,
                            a.tipo_producto
                        FROM usuarios u
                        LEFT JOIN tblservicios s ON u.id = s.userid
                        LEFT JOIN server sv ON s.server = sv.id
                        LEFT JOIN almacen a ON s.userid = a.userid
                        WHERE a.serial_producto IS NOT NULL
                        AND a.serial_producto != ''
                        LIMIT 1
                    `);

                    if (clientesConEquipo.length > 0) {
                        const cliente = clientesConEquipo[0];

                        // Crear visita de prueba
                        const [resultVisita] = await conexion.query(`
                            INSERT INTO visitas_tecnicas (
                                cliente_id, cliente_nombre, cliente_cedula, cliente_telefono,
                                motivo_visita, estado, tecnico_asignado_id, tecnico_asignado_nombre,
                                fecha_programada, creado_por, bd_origen,
                                serial_equipo_asignado, equipo_tipo, equipo_estado
                            ) VALUES (?, ?, ?, ?, ?, 'asignada', ?, ?, CURDATE(), 1, ?, ?, ?, 'comodato')
                        `, [
                            cliente.userid,
                            cliente.nombre,
                            cliente.cedula,
                            cliente.telefono || '3001234567',
                            'Revisión de equipo - Prueba',
                            tecnicos[0].id,
                            tecnicos[0].nombre,
                            'mikrowisp_' + bd.host,
                            cliente.serial_producto,
                            cliente.tipo_producto || 'Equipo Red'
                        ]);

                        console.log(`✅ Visita de prueba creada con ID: ${resultVisita.insertId}`);
                        console.log(`   Cliente: ${cliente.nombre} (#${cliente.userid})`);
                        console.log(`   Serial: ${cliente.serial_producto}`);
                        console.log(`   Técnico: ${tecnicos[0].nombre}`);

                        visitas.push({
                            id: resultVisita.insertId,
                            cliente_nombre: cliente.nombre,
                            serial_equipo_asignado: cliente.serial_producto,
                            equipo_tipo: cliente.tipo_producto || 'Equipo Red',
                            equipo_estado: 'comodato'
                        });
                    }

                    await conexionMikro.end();
                    break;
                } catch (error) {
                    console.log(`⚠️ No se pudo conectar a ${bd.host}: ${error.message}`);
                }
            }
        }

        // 3. Mostrar análisis de las visitas
        if (visitas.length > 0) {
            console.log(`\n📊 ANÁLISIS DE VISITAS:`);

            visitas.forEach((visita, index) => {
                console.log(`\n${index + 1}. Visita ID: ${visita.id}`);
                console.log(`   Cliente: ${visita.cliente_nombre}`);
                console.log(`   Serial: ${visita.serial_equipo_asignado || 'SIN_SERIAL'}`);
                console.log(`   Tipo: ${visita.equipo_tipo || 'Sin tipo'}`);
                console.log(`   Estado: ${visita.equipo_estado || 'Sin estado'}`);

                if (visita.serial_equipo_asignado && visita.serial_equipo_asignado !== 'SIN_SERIAL') {
                    console.log(`   ✅ Esta visita SÍ mostrará "EQUIPO ASIGNADO" en la interfaz`);
                } else {
                    console.log(`   ❌ Esta visita NO mostrará "EQUIPO ASIGNADO"`);
                }
            });

            const visitasConSerial = visitas.filter(v => v.serial_equipo_asignado && v.serial_equipo_asignado !== 'SIN_SERIAL');
            console.log(`\n📊 RESUMEN:`);
            console.log(`   Total visitas: ${visitas.length}`);
            console.log(`   Con seriales: ${visitasConSerial.length}`);
            console.log(`   Sin seriales: ${visitas.length - visitasConSerial.length}`);

            if (visitasConSerial.length > 0) {
                console.log(`\n✅ ÉXITO: Hay ${visitasConSerial.length} visita(s) que mostrarán seriales`);
                console.log(`\n🎯 Para probar en la interfaz de técnicos:`);
                console.log(`   1. Accede a tecnicos_visitas.html`);
                console.log(`   2. Inicia sesión con usuario: ${tecnicos[0].username}`);
                console.log(`   3. Busca las visitas asignadas`);
                console.log(`   4. Haz clic en "Completar" en una visita`);
                console.log(`   5. Deberías ver "EQUIPO ASIGNADO: Serial: ${visitasConSerial[0].serial_equipo_asignado}"`);
            }
        } else {
            console.log(`\n❌ No se pudieron crear visitas de prueba`);
            console.log(`💡 Necesitas datos en las bases de datos MikroWisp para probar`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        if (conexion) await conexion.end();
    }
}

// Ejecutar prueba
probarTecnicosConDatosReales()
    .then(() => {
        console.log('\n✅ Prueba completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });