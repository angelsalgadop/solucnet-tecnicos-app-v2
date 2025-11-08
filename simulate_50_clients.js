const axios = require('axios');
const fs = require('fs');

// Configuración de la simulación
const SIMULATION_DURATION = 2 * 60 * 1000; // 2 minutos en milisegundos
const NUM_CLIENTS = 50;
const SERVER_URL = 'http://localhost:3000';

// Números de teléfono simulados (formato colombiano)
const generatePhoneNumbers = (count) => {
    const numbers = [];
    const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324', '350', '351'];
    
    for (let i = 0; i < count; i++) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 9000000) + 1000000; // 7 dígitos
        numbers.push(`57${prefix}${suffix}`);
    }
    return numbers;
};

// Mensajes realistas que los clientes podrían enviar
const clientMessages = [
    // Consultas de servicios
    "Hola, necesito información sobre sus servicios de internet",
    "Buenos días, quiero conocer los planes disponibles",
    "Buenas tardes, me interesa contratar internet",
    "Hola, qué velocidades de internet manejan?",
    "Buenos días, cuáles son sus tarifas?",
    "Necesito cambiar mi plan actual",
    "Tengo problemas con mi conexión",
    "Mi internet está muy lento",
    "Se cayó el internet en mi casa",
    "No puedo conectarme a WiFi",
    
    // Saludos iniciales
    "Hola",
    "Buenos días",
    "Buenas tardes",
    "Buenas noches",
    "Saludos",
    
    // Consultas específicas
    "Cuánto cuesta el plan de 100 megas?",
    "Hacen instalación el mismo día?",
    "Qué documentos necesito para contratar?",
    "Tienen servicio en mi barrio?",
    "Cuál es el costo de instalación?",
    "Incluyen el modem?",
    "Tienen promociones activas?",
    "Cuánto demora la instalación?",
    "Trabajan los fines de semana?",
    "Tienen soporte técnico 24/7?",
    
    // Respuestas a opciones del menú
    "1",
    "2", 
    "3",
    "4",
    "Planes",
    "Soporte",
    "Información",
    "Contacto",
    
    // Consultas de soporte
    "Mi factura llegó muy alta este mes",
    "Necesito que me ayuden con la configuración",
    "El técnico no ha llegado a mi cita",
    "Quiero cancelar el servicio",
    "Necesito cambiar mi dirección",
    "Cómo puedo pagar mi factura?",
    "Dónde están ubicadas sus oficinas?",
    "A qué hora abren?",
    "Hasta qué hora atienden?",
    
    // Mensajes más naturales
    "Disculpa, me puedes ayudar?",
    "Gracias por la información",
    "Entendido, muchas gracias",
    "Ok, perfecto",
    "Me parece bien",
    "Necesito pensarlo",
    "Está muy caro",
    "Es un buen precio",
    "Me conviene ese plan",
    "Cuándo pueden venir a instalar?"
];

// Generar números de teléfono para los clientes
const phoneNumbers = generatePhoneNumbers(NUM_CLIENTS);

// Función para enviar mensaje via API
async function sendMessage(phoneNumber, message) {
    try {
        const response = await axios.post(`${SERVER_URL}/api/send-message`, {
            number: phoneNumber,
            message: message
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            phone: phoneNumber,
            message: message,
            response: response.data
        };
    } catch (error) {
        return {
            success: false,
            phone: phoneNumber,
            message: message,
            error: error.message
        };
    }
}

// Función para simular un cliente individual
async function simulateClient(clientId, phoneNumber) {
    const clientLog = [];
    const startTime = Date.now();
    
    console.log(`📱 Cliente ${clientId} (${phoneNumber}) iniciado`);
    
    // Cada cliente envía entre 1 y 5 mensajes durante la simulación
    const numMessages = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < numMessages; i++) {
        // Tiempo aleatorio entre mensajes (10 segundos a 2 minutos)
        const waitTime = Math.floor(Math.random() * 110000) + 10000;
        
        // Si el tiempo de espera excede el tiempo restante, terminar
        if (Date.now() - startTime + waitTime > SIMULATION_DURATION) {
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Seleccionar mensaje aleatorio
        const randomMessage = clientMessages[Math.floor(Math.random() * clientMessages.length)];
        
        console.log(`💬 Cliente ${clientId}: "${randomMessage}"`);
        
        // Enviar mensaje
        const result = await sendMessage(phoneNumber, randomMessage);
        clientLog.push({
            timestamp: new Date().toISOString(),
            message: randomMessage,
            result: result
        });
        
        if (result.success) {
            console.log(`✅ Cliente ${clientId}: Mensaje enviado exitosamente`);
        } else {
            console.log(`❌ Cliente ${clientId}: Error - ${result.error}`);
        }
    }
    
    console.log(`🏁 Cliente ${clientId} terminado (${clientLog.length} mensajes enviados)`);
    return clientLog;
}

// Función principal de simulación
async function runSimulation() {
    console.log(`🚀 Iniciando simulación de ${NUM_CLIENTS} clientes por ${SIMULATION_DURATION/1000} segundos`);
    console.log(`⏰ Hora de inicio: ${new Date().toISOString()}`);
    console.log(`📍 Servidor: ${SERVER_URL}`);
    console.log(`📱 Números generados: ${phoneNumbers.slice(0, 5).join(', ')}... (+${NUM_CLIENTS-5} más)`);
    console.log(`💬 ${clientMessages.length} tipos de mensajes diferentes`);
    console.log('═'.repeat(80));
    
    const startTime = Date.now();
    const clientPromises = [];
    
    // Iniciar todos los clientes en paralelo
    for (let i = 0; i < NUM_CLIENTS; i++) {
        const clientPromise = simulateClient(i + 1, phoneNumbers[i]);
        clientPromises.push(clientPromise);
        
        // Pequeña pausa entre inicio de clientes para no saturar
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Timer para mostrar progreso
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, SIMULATION_DURATION - elapsed);
        const progress = ((elapsed / SIMULATION_DURATION) * 100).toFixed(1);
        
        console.log(`⏱️  Progreso: ${progress}% - Tiempo restante: ${Math.ceil(remaining/1000)}s`);
        
        if (remaining <= 0) {
            clearInterval(progressInterval);
        }
    }, 15000);
    
    // Esperar que termine la simulación
    setTimeout(() => {
        console.log('🛑 Tiempo de simulación terminado');
    }, SIMULATION_DURATION);
    
    // Esperar a que todos los clientes terminen (con un poco de margen extra)
    const allResults = await Promise.all(clientPromises);
    clearInterval(progressInterval);
    
    // Generar reporte final
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    let totalMessages = 0;
    let successfulMessages = 0;
    let failedMessages = 0;
    
    allResults.forEach(clientLog => {
        clientLog.forEach(logEntry => {
            totalMessages++;
            if (logEntry.result.success) {
                successfulMessages++;
            } else {
                failedMessages++;
            }
        });
    });
    
    console.log('═'.repeat(80));
    console.log('📊 REPORTE FINAL DE SIMULACIÓN');
    console.log('═'.repeat(80));
    console.log(`🕒 Duración total: ${(totalDuration/1000).toFixed(1)} segundos`);
    console.log(`👥 Clientes simulados: ${NUM_CLIENTS}`);
    console.log(`💬 Total de mensajes: ${totalMessages}`);
    console.log(`✅ Mensajes exitosos: ${successfulMessages}`);
    console.log(`❌ Mensajes fallidos: ${failedMessages}`);
    console.log(`📈 Tasa de éxito: ${((successfulMessages/totalMessages)*100).toFixed(1)}%`);
    console.log(`📊 Promedio por cliente: ${(totalMessages/NUM_CLIENTS).toFixed(1)} mensajes`);
    console.log(`⚡ Velocidad: ${(totalMessages/(totalDuration/1000)).toFixed(1)} mensajes/segundo`);
    
    // Guardar reporte detallado
    const report = {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: totalDuration,
        numClients: NUM_CLIENTS,
        totalMessages: totalMessages,
        successfulMessages: successfulMessages,
        failedMessages: failedMessages,
        successRate: (successfulMessages/totalMessages)*100,
        messagesPerSecond: totalMessages/(totalDuration/1000),
        clientLogs: allResults
    };
    
    fs.writeFileSync('simulation_report.json', JSON.stringify(report, null, 2));
    console.log('💾 Reporte detallado guardado en: simulation_report.json');
    console.log('🎯 Simulación completada exitosamente');
}

// Manejo de errores y señales
process.on('SIGINT', () => {
    console.log('\n🛑 Simulación interrumpida por el usuario');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Error no capturado:', error);
    process.exit(1);
});

// Iniciar simulación
runSimulation().catch(error => {
    console.error('🚨 Error en la simulación:', error);
    process.exit(1);
});