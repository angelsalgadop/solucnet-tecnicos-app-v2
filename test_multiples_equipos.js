const { obtenerSerialEquipoCliente } = require('./db_visitas_tecnicas.js');

async function testMultiplesEquipos() {
    console.log('🧪 Probando función de múltiples equipos...\n');

    // Probar con una cédula conocida
    const cedulas = ['1067950020', '1078578508', '1027940008'];

    for (const cedula of cedulas) {
        console.log(`🔍 Probando cédula: ${cedula}`);

        try {
            const resultado = await obtenerSerialEquipoCliente(cedula);

            if (resultado) {
                console.log(`✅ Resultado encontrado:`);
                console.log(`  Serial principal: ${resultado.serial_equipo_asignado}`);
                console.log(`  Tipo: ${resultado.equipo_tipo}`);
                console.log(`  Estado: ${resultado.equipo_estado}`);
                console.log(`  MikroTik: ${resultado.mikrotik_nombre || 'No disponible'}`);
                console.log(`  Usuario PPP: ${resultado.usuario_ppp || 'No disponible'}`);

                if (resultado.todos_los_equipos) {
                    console.log(`  📦 Todos los equipos (${resultado.todos_los_equipos.length}):`);
                    resultado.todos_los_equipos.forEach((equipo, index) => {
                        console.log(`    ${index + 1}. Tipo: ${equipo.tipo}, Serial: ${equipo.serial}, Estado: ${equipo.estado}`);
                    });
                } else {
                    console.log(`  ⚠️ No se encontró array todos_los_equipos`);
                }
            } else {
                console.log(`❌ No se encontraron equipos`);
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }

        console.log('');
    }
}

testMultiplesEquipos().catch(console.error);