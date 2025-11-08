const { obtenerVisitasTecnico } = require('./db_visitas_tecnicas.js');

async function probarEndpointTecnicos() {
    console.log('🧪 Probando endpoint de técnicos con seriales...\n');

    try {
        // Probar con ID de técnico ficticio
        console.log('🔍 Probando obtenerVisitasTecnico con ID ficticio...');
        const resultado = await obtenerVisitasTecnico(1);

        console.log(`📊 Success: ${resultado.success}`);
        console.log(`📊 Visitas: ${resultado.visitas ? resultado.visitas.length : 0}`);

        if (resultado.success && resultado.visitas && resultado.visitas.length > 0) {
            console.log(`\n✅ Encontradas ${resultado.visitas.length} visitas para técnico`);

            resultado.visitas.forEach((visita, index) => {
                console.log(`\n📋 Visita ${index + 1}:`);
                console.log(`  ID: ${visita.id}`);
                console.log(`  Cliente: ${visita.cliente_nombre}`);
                console.log(`  Cédula: ${visita.cliente_cedula}`);
                console.log(`  Estado: ${visita.estado}`);

                console.log(`\n  🔍 Información de equipos:`);
                console.log(`  - serial_equipo_asignado: ${visita.serial_equipo_asignado || 'NULL'}`);
                console.log(`  - equipo_tipo: ${visita.equipo_tipo || 'NULL'}`);
                console.log(`  - equipo_estado: ${visita.equipo_estado || 'NULL'}`);
                console.log(`  - mikrotik_nombre: ${visita.mikrotik_nombre || 'NULL'}`);
                console.log(`  - usuario_ppp: ${visita.usuario_ppp || 'NULL'}`);

                if (visita.serial_equipo_asignado) {
                    console.log(`  ✅ Esta visita SÍ debe mostrar seriales en la interfaz`);
                } else {
                    console.log(`  ⚠️ Esta visita NO tiene serial de equipo asignado`);
                }

                console.log(`  ${'='.repeat(50)}`);
            });

            // Contar visitas con seriales
            const visitasConSerial = resultado.visitas.filter(v => v.serial_equipo_asignado);
            console.log(`\n📊 RESUMEN:`);
            console.log(`  Total visitas: ${resultado.visitas.length}`);
            console.log(`  Con seriales: ${visitasConSerial.length}`);
            console.log(`  Sin seriales: ${resultado.visitas.length - visitasConSerial.length}`);

            if (visitasConSerial.length > 0) {
                console.log(`\n✅ Estas visitas mostrarán seriales en la interfaz de técnicos:`);
                visitasConSerial.forEach(v => {
                    console.log(`  • ${v.cliente_nombre} → ${v.serial_equipo_asignado} (${v.equipo_tipo || 'Sin tipo'})`);
                });
            }

        } else {
            console.log('⚠️ No se encontraron visitas para el técnico (esperado en entorno de prueba)');
            console.log('💡 Para probar con datos reales, necesitas:');
            console.log('   1. Un técnico registrado en la BD');
            console.log('   2. Visitas asignadas a ese técnico');
            console.log('   3. Clientes con equipos asignados');
        }

        console.log('\n🎯 Cómo funciona en la interfaz de técnicos:');
        console.log('   1. Técnico accede a su interfaz');
        console.log('   2. Ve sus visitas asignadas');
        console.log('   3. Al completar una visita, hace clic en "Completar"');
        console.log('   4. Se abre modal con datos del cliente');
        console.log('   5. Si el cliente tiene equipo asignado, aparece:');
        console.log('      "Información de Equipos"');
        console.log('      "EQUIPO ASIGNADO: Serial: XXXXXXXX"');

    } catch (error) {
        console.error('❌ Error probando endpoint de técnicos:', error.message);
        console.error(error.stack);
    }
}

// Ejecutar prueba
probarEndpointTecnicos()
    .then(() => {
        console.log('\n✅ Prueba de endpoint de técnicos completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });