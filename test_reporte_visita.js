// Script para probar el guardado de reportes de visita
const fetch = require('node-fetch');

async function testGuardarReporte() {
    try {
        const formData = {
            visita_id: 105, // Una visita que existe (vi en los logs que se inició)
            tecnico_id: 1,
            problemas_encontrados: 'Test de problemas encontrados',
            solucion_aplicada: 'Test de solución aplicada',
            materiales_utilizados: 'Test materiales',
            tiempo_trabajo: '01:30',
            cliente_satisfecho: 'si',
            requiere_seguimiento: false,
            notas: 'Notas de prueba',
            // Agregar coordenadas de prueba
            latitud: 4.123456,
            longitud: -73.654321,
            precision_gps: 5.5
        };

        console.log('📤 Enviando reporte de prueba:', formData);

        const response = await fetch('http://localhost:3000/api/reportes-visitas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const resultado = await response.json();
        console.log('📥 Respuesta del servidor:', resultado);

        if (resultado.success) {
            console.log('✅ Reporte guardado exitosamente');
            console.log('ID del reporte:', resultado.reporteId);
        } else {
            console.error('❌ Error guardando reporte:', resultado.message);
        }

    } catch (error) {
        console.error('💥 Error en la prueba:', error.message);
    }
}

testGuardarReporte();
