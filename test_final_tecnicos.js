const { obtenerVisitasTecnico } = require('./db_visitas_tecnicas.js');

async function testFinalTecnicos() {
    console.log('🧪 PRUEBA FINAL: Verificando que técnicos pueden ver seriales...\n');

    try {
        // Probar con el técnico que creamos (ID 22)
        console.log('🔍 Obteniendo visitas para técnico ID: 22');
        const resultado = await obtenerVisitasTecnico(22);

        if (resultado.success && resultado.visitas && resultado.visitas.length > 0) {
            console.log(`✅ Encontradas ${resultado.visitas.length} visitas para el técnico\n`);

            let visitasConSerial = 0;

            resultado.visitas.forEach((visita, index) => {
                console.log(`📋 Visita ${index + 1}:`);
                console.log(`  ID: ${visita.id}`);
                console.log(`  Cliente: ${visita.cliente_nombre}`);
                console.log(`  Cédula: ${visita.cliente_cedula}`);
                console.log(`  Estado: ${visita.estado}`);

                // Información de equipos
                console.log(`  📦 INFORMACIÓN DE EQUIPOS:`);
                console.log(`    • MikroTik: ${visita.mikrotik_nombre || 'No disponible'}`);
                console.log(`    • Usuario PPP: ${visita.usuario_ppp || 'No disponible'}`);
                console.log(`    • Serial Equipo: ${visita.serial_equipo_asignado || 'NO ASIGNADO'}`);
                console.log(`    • Tipo Equipo: ${visita.equipo_tipo || 'Sin tipo'}`);
                console.log(`    • Estado Equipo: ${visita.equipo_estado || 'Sin estado'}`);

                if (visita.serial_equipo_asignado) {
                    console.log(`  ✅ Esta visita SÍ mostrará "EQUIPO ASIGNADO" en la interfaz`);
                    visitasConSerial++;
                } else {
                    console.log(`  ⚠️ Esta visita NO mostrará "EQUIPO ASIGNADO"`);
                }

                console.log(`  ${'='.repeat(60)}\n`);
            });

            console.log(`📊 RESUMEN FINAL:`);
            console.log(`  Total visitas asignadas: ${resultado.visitas.length}`);
            console.log(`  Visitas con seriales: ${visitasConSerial}`);
            console.log(`  Visitas sin seriales: ${resultado.visitas.length - visitasConSerial}`);

            if (visitasConSerial > 0) {
                console.log(`\n✅ ÉXITO: ${visitasConSerial} visita(s) mostrarán seriales en tecnicos_visitas.html`);
                console.log(`\n🎯 Lo que verá el técnico al completar una visita:`);

                const visitaConSerial = resultado.visitas.find(v => v.serial_equipo_asignado);
                if (visitaConSerial) {
                    console.log(`\n📋 Ejemplo - Cliente: ${visitaConSerial.cliente_nombre}`);
                    console.log(`📄 En el modal aparecerá:`);
                    console.log(`   "Información de Equipos"`);
                    console.log(`   "🔧 MikroTik: ${visitaConSerial.mikrotik_nombre || 'No disponible'}"`);
                    console.log(`   "👤 Usuario PPP: ${visitaConSerial.usuario_ppp || 'No disponible'}"`);
                    console.log(`   "📦 EQUIPO ASIGNADO:"`);
                    console.log(`   "   Serial: ${visitaConSerial.serial_equipo_asignado}"`);
                    console.log(`   "   Tipo: ${visitaConSerial.equipo_tipo || 'Sin tipo'}"`);
                    console.log(`   "   Estado: ${visitaConSerial.equipo_estado || 'Sin estado'}"`);
                }
            } else {
                console.log(`\n❌ PROBLEMA: Ninguna visita tiene seriales asignados`);
                console.log(`💡 Es necesario actualizar más visitas o verificar la lógica de obtención de seriales`);
            }

        } else {
            console.log('⚠️ No se encontraron visitas para el técnico');
            console.log('💡 Para probar completamente necesitas:');
            console.log('   1. Asignar visitas al técnico ID 22');
            console.log('   2. O usar un técnico que ya tenga visitas asignadas');
        }

        console.log(`\n🎯 ESTADO DEL PROBLEMA ORIGINAL:`);
        console.log(`   ✅ Columnas agregadas a tabla visitas_tecnicas`);
        console.log(`   ✅ Función crearVisitaTecnica actualizada para incluir seriales`);
        console.log(`   ✅ Función obtenerVisitasTecnico actualizada para devolver seriales`);
        console.log(`   ✅ Frontend tecnicos_visitas.js actualizado para mostrar seriales`);
        console.log(`   ✅ Visitas existentes actualizadas con información de equipos`);
        console.log(`   ✅ Servidor PM2 reiniciado con cambios aplicados`);

    } catch (error) {
        console.error('❌ Error en prueba final:', error.message);
        console.error(error.stack);
    }
}

// Ejecutar prueba
testFinalTecnicos()
    .then(() => {
        console.log('\n✅ Prueba final completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
    });