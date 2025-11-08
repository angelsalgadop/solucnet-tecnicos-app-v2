const axios = require('axios');
const https = require('https');
const fs = require('fs');

// Configurar axios para aceptar certificados SSL auto-firmados
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

axios.defaults.httpsAgent = httpsAgent;

// Configuración
const SIMULATION_DURATION = 2 * 60 * 1000; // 2 minutos
const NUM_CLIENTS = 50;
const SERVER_URL = 'https://localhost:3000';

// Números colombianos simulados
const generatePhoneNumbers = (count) => {
    const numbers = [];
    const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '322', '323', '324'];
    
    for (let i = 0; i < count; i++) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 9000000) + 1000000;
        numbers.push(`57${prefix}${suffix}@c.us`);
    }
    return numbers;
};

// Mensajes realistas
const clientMessages = [
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
    "Hola",
    "Buenos días",
    "Buenas tardes", 
    "Buenas noches",
    "Saludos",
    "1",
    "2",
    "3", 
    "4",
    "Planes",
    "Soporte",
    "Información",
    "Contacto",
    "Cuánto cuesta el plan de 100 megas?",
    "Hacen instalación el mismo día?",
    "Qué documentos necesito para contratar?",
    "Tienen servicio en mi barrio?",
    "Cuál es el costo de instalación?",
    "Incluyen el modem?",
    "Tienen promociones activas?",
    "Mi factura llegó muy alta este mes",
    "El técnico no ha llegado a mi cita",
    "Quiero cancelar el servicio",
    "Necesito cambiar mi dirección",
    "Cómo puedo pagar mi factura?",
    "Dónde están ubicadas sus oficinas?",
    "Disculpa, me puedes ayudar?",
    "Gracias por la información",
    "Entendido, muchas gracias",
    "Ok, perfecto",
    "Me parece bien"
];

// Nombres realistas
const clientNames = [
    "Carlos Rodríguez", "María García", "José López", "Ana Martínez", "Pedro Pérez",
    "Laura Sánchez", "David González", "Carmen Fernández", "Miguel Torres", "Isabel Ruiz",
    "Francisco Moreno", "Pilar Jiménez", "Antonio Muñoz", "Rosa Álvarez", "Manuel Romero",
    "Dolores Navarro", "Juan Gutiérrez", "Teresa Herrera", "Ángel Vargas", "Concepción Castro",
    "Roberto Silva", "Antonia Ortega", "Rafael Ramos", "Francisca Delgado", "Fernando Morales",
    "Mercedes Ruiz", "Eduardo Jiménez", "Amparo Castillo", "Sergio Ibáñez", "Remedios Guerrero",
    "Alejandro Cano", "Josefa Prieto", "Gonzalo Méndez", "Esperanza Herrero", "Rubén Gallego",
    "Trinidad Calvo", "Adrián León", "Virtudes Vidal", "Iván Serrano", "Encarnación Blanco",
    "Cristian Aguilar", "Purificación Lozano", "Raúl Garrido", "Milagros Díez", "Óscar Santana",
    "Presentación Crespo", "Víctor Pastor", "Salvadora Vega", "Jesús Mora", "Natividad Soto"
];

// Función para inyectar mensaje simulado directamente al servidor
async function injectSimulatedMessage(phoneId, message, senderName) {
    try {
        const response = await axios.post(`${SERVER_URL}/api/simulate-incoming-message`, {
            from: phoneId,
            body: message,
            pushname: senderName,
            timestamp: Math.floor(Date.now() / 1000),
            fromMe: false,
            type: 'chat'
        }, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            phone: phoneId,
            message: message,
            name: senderName,
            response: response.data
        };
    } catch (error) {
        return {
            success: false,
            phone: phoneId,
            message: message,
            name: senderName,
            error: error.message
        };
    }
}

// Función para simular un cliente
async function simulateClient(clientId, phoneId, clientName) {
    const startTime = Date.now();
    let messageCount = 0;
    const clientLog = [];
    
    console.log(`📱 Cliente ${clientId} (${clientName}) iniciado`);
    
    // Cada cliente envía entre 1 y 4 mensajes
    const numMessages = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numMessages; i++) {
        // Tiempo aleatorio entre mensajes (10 segundos a 60 segundos)
        const waitTime = Math.floor(Math.random() * 50000) + 10000;
        
        // Si excede el tiempo, terminar
        if (Date.now() - startTime + waitTime > SIMULATION_DURATION) {
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Seleccionar mensaje aleatorio
        const randomMessage = clientMessages[Math.floor(Math.random() * clientMessages.length)];
        
        console.log(`💬 ${clientName}: "${randomMessage}"`);
        
        // Inyectar mensaje
        const result = await injectSimulatedMessage(phoneId, randomMessage, clientName);
        
        clientLog.push({
            timestamp: new Date().toISOString(),
            message: randomMessage,
            result: result
        });
        
        if (result.success) {
            console.log(`✅ ${clientName}: Mensaje inyectado exitosamente`);
            messageCount++;
        } else {
            console.log(`❌ ${clientName}: Error - ${result.error}`);
        }
    }
    
    console.log(`🏁 Cliente ${clientId} (${clientName}) terminado - ${messageCount} mensajes`);
    return { messageCount, log: clientLog };
}

// Función principal
async function runSimulation() {
    console.log(`🚀 Iniciando simulación de inyección de ${NUM_CLIENTS} clientes por ${SIMULATION_DURATION/1000} segundos`);
    console.log(`⏰ Hora de inicio: ${new Date().toISOString()}`);
    console.log(`📍 Servidor: ${SERVER_URL}`);
    console.log('═'.repeat(80));
    
    const phoneNumbers = generatePhoneNumbers(NUM_CLIENTS);
    const startTime = Date.now();
    const clientPromises = [];
    
    // Iniciar todos los clientes
    for (let i = 0; i < NUM_CLIENTS; i++) {
        const clientName = clientNames[i] || `Cliente ${i + 1}`;
        const clientPromise = simulateClient(i + 1, phoneNumbers[i], clientName);
        clientPromises.push(clientPromise);
        
        // Pausa pequeña entre inicios
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Timer de progreso
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, SIMULATION_DURATION - elapsed);
        const progress = ((elapsed / SIMULATION_DURATION) * 100).toFixed(1);
        
        console.log(`⏱️  Progreso: ${progress}% - Tiempo restante: ${Math.ceil(remaining/1000)}s`);
        
        if (remaining <= 0) {
            clearInterval(progressInterval);
        }
    }, 20000);
    
    // Esperar finalización
    setTimeout(() => {
        console.log('🛑 Tiempo de simulación completado');
    }, SIMULATION_DURATION);
    
    // Obtener resultados
    const results = await Promise.all(clientPromises);
    clearInterval(progressInterval);
    
    // Calcular estadísticas
    const endTime = Date.now();
    const duration = endTime - startTime;
    let totalMessages = 0;
    let successfulMessages = 0;
    let failedMessages = 0;
    
    results.forEach(result => {
        totalMessages += result.messageCount;
        result.log.forEach(entry => {
            if (entry.result.success) {
                successfulMessages++;
            } else {
                failedMessages++;
            }
        });
    });
    
    console.log('═'.repeat(80));
    console.log('📊 REPORTE FINAL DE SIMULACIÓN DE INYECCIÓN');
    console.log('═'.repeat(80));
    console.log(`🕒 Duración: ${(duration/1000).toFixed(1)} segundos`);
    console.log(`👥 Clientes simulados: ${NUM_CLIENTS}`);
    console.log(`💬 Total de mensajes: ${totalMessages}`);
    console.log(`✅ Mensajes exitosos: ${successfulMessages}`);
    console.log(`❌ Mensajes fallidos: ${failedMessages}`);
    console.log(`📈 Tasa de éxito: ${totalMessages > 0 ? ((successfulMessages/totalMessages)*100).toFixed(1) : 0}%`);
    console.log(`📊 Promedio por cliente: ${(totalMessages/NUM_CLIENTS).toFixed(1)} mensajes`);
    console.log(`⚡ Velocidad: ${(totalMessages/(duration/1000)).toFixed(1)} mensajes/segundo`);
    console.log(`🖥️  Revisa tu interfaz web para ver los mensajes simulados`);
    
    // Guardar reporte
    const report = {
        timestamp: new Date().toISOString(),
        duration: duration,
        numClients: NUM_CLIENTS,
        totalMessages: totalMessages,
        successfulMessages: successfulMessages,
        failedMessages: failedMessages,
        successRate: totalMessages > 0 ? (successfulMessages/totalMessages)*100 : 0,
        messagesPerSecond: totalMessages/(duration/1000),
        results: results
    };
    
    fs.writeFileSync('simulation_injection_report.json', JSON.stringify(report, null, 2));
    console.log('💾 Reporte detallado guardado en: simulation_injection_report.json');
    console.log('✅ Simulación de inyección completada');
}

// Manejo de interrupciones
process.on('SIGINT', () => {
    console.log('\n🛑 Simulación interrumpida por el usuario');
    process.exit(0);
});

// Iniciar
runSimulation().catch(error => {
    console.error('💥 Error en simulación:', error);
    process.exit(1);
});