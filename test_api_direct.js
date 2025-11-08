const { obtenerVisitasTecnico } = require('./db_visitas_tecnicas.js');

async function testAPIDirecto() {
    console.log('🧪 PROBANDO FUNCIÓN obtenerVisitasTecnico DIRECTAMENTE...\n');

    try {
        console.log('🔍 Llamando a obtenerVisitasTecnico(22)...');
        const resultado = await obtenerVisitasTecnico(22);

        console.log('📊 RESULTADO:');
        console.log(`  success: ${resultado.success}`);
        console.log(`  visitas: ${resultado.visitas ? resultado.visitas.length : 'null'}`);

        if (resultado.success && resultado.visitas && resultado.visitas.length > 0) {
            console.log('\n📋 DETALLES DE VISITAS:');
            resultado.visitas.forEach((visita, index) => {
                console.log(`\n  VISITA ${index + 1}:`);
                console.log(`    ID: ${visita.id}`);
                console.log(`    Cliente: ${visita.cliente_nombre}`);
                console.log(`    Serial: ${visita.serial_equipo_asignado || 'NO ASIGNADO'}`);
                console.log(`    Tipo: ${visita.equipo_tipo || 'Sin tipo'}`);
                console.log(`    Estado: ${visita.equipo_estado || 'Sin estado'}`);
                console.log(`    MikroTik: ${visita.mikrotik_nombre || 'No disponible'}`);
                console.log(`    Usuario PPP: ${visita.usuario_ppp || 'No disponible'}`);
            });

            console.log('\n✅ La función está devolviendo datos correctos');

            // Simular lo que hace el endpoint
            console.log('\n🌐 SIMULANDO RESPUESTA DEL ENDPOINT:');
            const respuestaAPI = {
                success: true,
                visitas: resultado.visitas
            };
            console.log(JSON.stringify(respuestaAPI, null, 2));

        } else if (resultado.success) {
            console.log('\n⚠️ La función retorna success=true pero visitas vacías');
        } else {
            console.log('\n❌ La función retorna success=false');
            console.log(`  Mensaje de error: ${resultado.message}`);
        }

    } catch (error) {
        console.error('❌ ERROR CAPTURADO:', error.message);
        console.error(error.stack);
    }
}

// Ejecutar prueba
testAPIDirecto()
    .then(() => {
        console.log('\n✅ Prueba de API directa completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });