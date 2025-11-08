// Simular el entorno del navegador para probar la función completarVisita
const fs = require('fs');

// Leer el archivo JavaScript de técnicos
const tecnicosJS = fs.readFileSync('/root/whatsapp-chatbot/public/tecnicos_visitas.js', 'utf8');

console.log('🧪 Probando función completarVisita del frontend de técnicos...\n');

// Verificar que el código contiene las funciones necesarias
console.log('🔍 Verificando código del frontend:');

if (tecnicosJS.includes('serial_equipo_asignado')) {
    console.log('✅ Código contiene manejo de serial_equipo_asignado');
} else {
    console.log('❌ Código NO contiene manejo de serial_equipo_asignado');
}

if (tecnicosJS.includes('EQUIPO ASIGNADO')) {
    console.log('✅ Código contiene sección "EQUIPO ASIGNADO"');
} else {
    console.log('❌ Código NO contiene sección "EQUIPO ASIGNADO"');
}

if (tecnicosJS.includes('Información de Equipos')) {
    console.log('✅ Código contiene título "Información de Equipos"');
} else {
    console.log('❌ Código NO contiene título "Información de Equipos"');
}

// Simular datos de visita con serial
const visitaConSerial = {
    id: 123,
    cliente_nombre: 'WENDY JOHANA HERNANDEZ',
    cliente_cedula: '1193510858',
    cliente_telefono: '3001234567',
    fecha_programada: '2025-09-28',
    motivo_visita: 'Reparación de equipo',
    serial_equipo_asignado: 'ZTEGCCBEF632',
    equipo_tipo: 'Onu CData',
    equipo_estado: 'comodato',
    mikrotik_nombre: 'Mikrotik_Reposo',
    usuario_ppp: 'user-wendyherna'
};

const visitaSinSerial = {
    id: 124,
    cliente_nombre: 'CLIENTE SIN EQUIPO',
    cliente_cedula: '9999999999',
    cliente_telefono: '3009999999',
    fecha_programada: '2025-09-28',
    motivo_visita: 'Consulta técnica',
    serial_equipo_asignado: null,
    equipo_tipo: null,
    equipo_estado: null,
    mikrotik_nombre: null,
    usuario_ppp: 'user-sinequipo'
};

console.log('\n📋 Simulando generación de HTML para visita CON serial:');
console.log(generarHTMLVisita(visitaConSerial));

console.log('\n📋 Simulando generación de HTML para visita SIN serial:');
console.log(generarHTMLVisita(visitaSinSerial));

function generarHTMLVisita(visita) {
    // Simular la lógica que está en completarVisita()
    let clienteInfo = `
        <p><strong>Nombre:</strong> ${visita.cliente_nombre}</p>
        <p><strong>Cédula:</strong> ${visita.cliente_cedula}</p>
        <p><strong>Teléfono:</strong> ${visita.cliente_telefono || 'No disponible'}</p>
        <p><strong>Fecha programada:</strong> ${new Date(visita.fecha_programada).toLocaleDateString()}</p>
        <p><strong>Motivo:</strong> ${visita.motivo_visita}</p>
    `;

    // Agregar información de equipos si está disponible
    if (visita.serial_equipo_asignado || visita.mikrotik_nombre || visita.usuario_ppp) {
        clienteInfo += `<hr><h6><i class="fas fa-microchip"></i> Información de Equipos</h6>`;

        if (visita.mikrotik_nombre) {
            clienteInfo += `<p><strong><i class="fas fa-router"></i> MikroTik:</strong> ${visita.mikrotik_nombre}</p>`;
        }

        if (visita.usuario_ppp) {
            clienteInfo += `<p><strong><i class="fas fa-user"></i> Usuario PPP:</strong> ${visita.usuario_ppp}</p>`;
        }

        if (visita.serial_equipo_asignado) {
            clienteInfo += `
                <div class="border-start border-warning border-3 ps-3 mb-2">
                    <p class="mb-1"><strong><i class="fas fa-microchip text-warning"></i> EQUIPO ASIGNADO:</strong></p>
                    <p class="mb-1"><strong>Serial:</strong> <span class="text-primary">${visita.serial_equipo_asignado}</span></p>
            `;

            if (visita.equipo_tipo) {
                clienteInfo += `<p class="mb-1"><strong>Tipo:</strong> ${visita.equipo_tipo}</p>`;
            }

            if (visita.equipo_estado) {
                clienteInfo += `<p class="mb-0"><strong>Estado:</strong> <span class="badge bg-info">${visita.equipo_estado}</span></p>`;
            }

            clienteInfo += `</div>`;
        }
    }

    return clienteInfo;
}

console.log('\n✅ Simulación completada');
console.log('\n🎯 El problema puede ser:');
console.log('   1. No hay visitas asignadas a técnicos reales');
console.log('   2. Los clientes de las visitas no tienen equipos asignados');
console.log('   3. La base de datos de técnicos no está configurada');
console.log('\n💡 Para probar en producción:');
console.log('   1. Asigna una visita a un técnico real');
console.log('   2. Asegúrate que el cliente tiene un equipo asignado');
console.log('   3. El técnico debería ver los seriales al completar la visita');