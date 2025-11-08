const axios = require('axios');
const https = require('https');
const fs = require('fs');

// Configurar axios para HTTPS con certificados auto-firmados
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});
axios.defaults.httpsAgent = httpsAgent;

// Configuración mejorada para estabilidad
const SIMULATION_DURATION = 3 * 60 * 1000; // 3 minutos (más tiempo para menos presión)
const NUM_CLIENTS = 30; // Reducido para evitar sobrecarga
const SERVER_URL = 'https://localhost:3000';
const MESSAGE_DELAY_MIN = 15000; // Mínimo 15 segundos entre mensajes
const MESSAGE_DELAY_MAX = 45000; // Máximo 45 segundos entre mensajes
const CLIENT_START_DELAY = 500; // 500ms entre inicios de clientes
const MAX_CONCURRENT_REQUESTS = 3; // Máximo 3 requests concurrentes

// Semáforo para controlar requests concurrentes
let activeRequests = 0;
const requestQueue = [];

// Función para manejar cola de requests
async function processRequestQueue() {
    if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
        return;
    }

    const requestFunction = requestQueue.shift();
    activeRequests++;
    
    try {
        await requestFunction();
    } catch (error) {
        console.error('Error en request:', error.message);
    } finally {
        activeRequests--;
        // Procesar siguiente request en la cola
        setTimeout(processRequestQueue, 100);
    }
}

// Generar números de teléfono colombianos
const generatePhoneNumbers = (count) => {
    const numbers = [];
    const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316'];
    
    for (let i = 0; i < count; i++) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 9000000) + 1000000;
        numbers.push(`57${prefix}${suffix}@c.us`);
    }
    return numbers;
};

// Mensajes realistas y variados
const clientMessages = [
    // Consultas iniciales
    "Hola, buenos días",
    "Buenas tardes",
    "Saludos",
    "Hola, necesito información",
    
    // Consultas específicas sobre servicios
    "Me interesa conocer los planes de internet",
    "Qué velocidades manejan?",
    "Cuáles son las tarifas actuales?",
    "Tienen promociones disponibles?",
    "Incluye instalación gratuita?",
    
    // Soporte técnico
    "Tengo problemas con mi conexión",
    "El internet está muy lento",
    "Se corta la señal frecuentemente",
    "No puedo conectar el WiFi",
    "Necesito ayuda técnica",
    
    // Servicios comerciales
    "Quiero cambiar de plan",
    "Cómo puedo contratar el servicio?",
    "Qué documentos necesito?",
    "Cuándo pueden hacer la instalación?",
    "Trabajan fines de semana?",
    
    // Facturación
    "Consulta sobre mi factura",
    "Cómo puedo pagar?",
    "Mi factura llegó alta este mes",
    "Necesito comprobante de pago",
    
    // Respuestas del menú
    "1", "2", "3", "4",
    "Planes", "Soporte", "Información", "Contacto",
    
    // Respuestas de seguimiento
    "Perfecto, gracias",
    "Entendido",
    "Me parece bien",
    "Necesito pensarlo",
    "Ok, muchas gracias"
];

// Nombres colombianos realistas
const clientNames = [
    "Carlos Rodríguez", "María García", "José López", "Ana Martínez",
    "Pedro Pérez", "Laura Sánchez", "David González", "Carmen Fernández", 
    "Miguel Torres", "Isabel Ruiz", "Francisco Moreno", "Pilar Jiménez",
    "Antonio Muñoz", "Rosa Álvarez", "Manuel Romero", "Dolores Navarro",
    "Juan Gutiérrez", "Teresa Herrera", "Ángel Vargas", "Concepción Castro",
    "Roberto Silva", "Antonia Ortega", "Rafael Ramos", "Francisca Delgado",
    "Fernando Morales", "Mercedes Ruiz", "Eduardo Jiménez", "Amparo Castillo",
    "Sergio Ibáñez", "Remedios Guerrero"
];

// Función mejorada para enviar mensajes con retry
async function injectSimulatedMessageSafe(phoneId, message, senderName, retries = 2) {
    return new Promise((resolve) => {
        const requestFunction = async () => {
            try {
                const response = await axios.post(`${SERVER_URL}/api/simulate-incoming-message`, {
                    from: phoneId,
                    body: message,
                    pushname: senderName,
                    timestamp: Math.floor(Date.now() / 1000),
                    fromMe: false,
                    type: 'chat'
                }, {
                    timeout: 8000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                resolve({
                    success: true,
                    phone: phoneId,
                    message: message,
                    name: senderName,
                    response: response.data
                });
            } catch (error) {
                if (retries > 0) {
                    console.log(`⚠️ ${senderName}: Reintentando envío (${retries} intentos restantes)`);
                    setTimeout(async () => {
                        const result = await injectSimulatedMessageSafe(phoneId, message, senderName, retries - 1);
                        resolve(result);
                    }, 2000);
                } else {
                    resolve({
                        success: false,
                        phone: phoneId,
                        message: message,
                        name: senderName,
                        error: error.message
                    });
                }
            }
        };

        // Agregar a la cola
        requestQueue.push(requestFunction);
        processRequestQueue();
    });
}

// Función para simular un cliente con comportamiento más realista
async function simulateRealisticClient(clientId, phoneId, clientName) {
    const startTime = Date.now();
    let messageCount = 0;
    const clientLog = [];
    
    console.log(`👤 Cliente ${clientId} (${clientName}) conectado`);
    
    // Pausa inicial aleatoria para simular llegada gradual
    const initialDelay = Math.random() * 30000; // Hasta 30 segundos
    await new Promise(resolve => setTimeout(resolve, initialDelay));
    
    // Cada cliente envía entre 1 y 3 mensajes (más conservador)
    const numMessages = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMessages; i++) {
        // Verificar si aún hay tiempo
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > SIMULATION_DURATION * 0.9) { // 90% del tiempo
            console.log(`⏰ Cliente ${clientId}: Tiempo agotado`);
            break;
        }
        
        // Tiempo aleatorio más largo entre mensajes
        const waitTime = Math.random() * (MESSAGE_DELAY_MAX - MESSAGE_DELAY_MIN) + MESSAGE_DELAY_MIN;
        
        if (i > 0) { // No esperar antes del primer mensaje
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Seleccionar mensaje contextual
        let selectedMessage;
        if (i === 0) {
            // Primer mensaje: más probable que sea un saludo
            const greetings = clientMessages.slice(0, 4);
            selectedMessage = greetings[Math.floor(Math.random() * greetings.length)];
        } else {
            // Mensajes siguientes: más variados
            selectedMessage = clientMessages[Math.floor(Math.random() * clientMessages.length)];
        }
        
        console.log(`💬 ${clientName}: "${selectedMessage}"`);
        
        // Enviar mensaje con protección
        const result = await injectSimulatedMessageSafe(phoneId, selectedMessage, clientName);
        
        clientLog.push({
            timestamp: new Date().toISOString(),
            message: selectedMessage,
            result: result
        });
        
        if (result.success) {
            console.log(`✅ ${clientName}: Mensaje enviado correctamente`);
            messageCount++;
        } else {
            console.log(`❌ ${clientName}: Error - ${result.error}`);
        }
        
        // Pausa adicional después de enviar para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`👋 Cliente ${clientId} (${clientName}) desconectado - ${messageCount} mensajes enviados`);
    return { messageCount, log: clientLog };
}

// Función principal mejorada
async function runImprovedSimulation() {
    console.log(`🚀 SIMULACIÓN MEJORADA - ${NUM_CLIENTS} clientes durante ${SIMULATION_DURATION/1000} segundos`);
    console.log(`⏰ Hora de inicio: ${new Date().toISOString()}`);
    console.log(`📍 Servidor: ${SERVER_URL}`);
    console.log(`⚙️  Configuración de estabilidad:`);
    console.log(`   • Máximo ${MAX_CONCURRENT_REQUESTS} requests concurrentes`);
    console.log(`   • ${MESSAGE_DELAY_MIN/1000}-${MESSAGE_DELAY_MAX/1000} segundos entre mensajes`);
    console.log(`   • ${CLIENT_START_DELAY}ms entre inicio de clientes`);
    console.log('═'.repeat(80));
    
    const phoneNumbers = generatePhoneNumbers(NUM_CLIENTS);
    const startTime = Date.now();
    const clientPromises = [];
    
    // Verificar conectividad antes de empezar
    try {
        console.log('🔍 Verificando conectividad con el servidor...');
        await axios.get(`${SERVER_URL}/api/status`, { timeout: 5000 });
        console.log('✅ Servidor accesible, iniciando simulación...');
    } catch (error) {
        console.error('❌ No se puede conectar al servidor:', error.message);
        return;
    }
    
    // Iniciar clientes de forma escalonada
    for (let i = 0; i < NUM_CLIENTS; i++) {
        const clientName = clientNames[i] || `Cliente ${i + 1}`;
        const clientPromise = simulateRealisticClient(i + 1, phoneNumbers[i], clientName);
        clientPromises.push(clientPromise);
        
        // Pausa entre inicios de clientes
        await new Promise(resolve => setTimeout(resolve, CLIENT_START_DELAY));
    }
    
    // Monitor de progreso menos agresivo
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, SIMULATION_DURATION - elapsed);
        const progress = ((elapsed / SIMULATION_DURATION) * 100).toFixed(1);
        
        console.log(`📊 Progreso: ${progress}% - Tiempo restante: ${Math.ceil(remaining/1000)}s - Requests activos: ${activeRequests}`);
        
        if (remaining <= 0) {
            clearInterval(progressInterval);
        }
    }, 30000); // Cada 30 segundos
    
    // Finalización controlada
    setTimeout(() => {
        console.log('🏁 Tiempo de simulación completado');
    }, SIMULATION_DURATION);
    
    // Esperar resultados
    const results = await Promise.all(clientPromises);
    clearInterval(progressInterval);
    
    // Generar reporte mejorado
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
    console.log('📊 REPORTE FINAL - SIMULACIÓN MEJORADA');
    console.log('═'.repeat(80));
    console.log(`🕒 Duración real: ${(duration/1000).toFixed(1)} segundos`);
    console.log(`👥 Clientes simulados: ${NUM_CLIENTS}`);
    console.log(`💬 Mensajes intentados: ${results.reduce((sum, r) => sum + r.log.length, 0)}`);
    console.log(`✅ Mensajes exitosos: ${successfulMessages}`);
    console.log(`❌ Mensajes fallidos: ${failedMessages}`);
    console.log(`📈 Tasa de éxito: ${results.reduce((sum, r) => sum + r.log.length, 0) > 0 ? ((successfulMessages/results.reduce((sum, r) => sum + r.log.length, 0))*100).toFixed(1) : 0}%`);
    console.log(`📊 Promedio por cliente: ${(totalMessages/NUM_CLIENTS).toFixed(1)} mensajes`);
    console.log(`⚡ Velocidad promedio: ${(successfulMessages/(duration/1000)).toFixed(2)} mensajes/segundo`);
    console.log(`🛡️  Requests máximos concurrentes: ${MAX_CONCURRENT_REQUESTS}`);
    console.log(`🖥️  Revisa la interfaz web para verificar los mensajes`);
    
    // Guardar reporte detallado
    const report = {
        timestamp: new Date().toISOString(),
        duration: duration,
        numClients: NUM_CLIENTS,
        totalAttempted: results.reduce((sum, r) => sum + r.log.length, 0),
        totalSuccessful: successfulMessages,
        totalFailed: failedMessages,
        successRate: results.reduce((sum, r) => sum + r.log.length, 0) > 0 ? (successfulMessages/results.reduce((sum, r) => sum + r.log.length, 0))*100 : 0,
        messagesPerSecond: successfulMessages/(duration/1000),
        maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
        messageDelayRange: [MESSAGE_DELAY_MIN, MESSAGE_DELAY_MAX],
        results: results
    };
    
    fs.writeFileSync('improved_simulation_report.json', JSON.stringify(report, null, 2));
    console.log('💾 Reporte detallado: improved_simulation_report.json');
    console.log('🎯 Simulación mejorada completada exitosamente');
}

// Manejo de interrupciones
process.on('SIGINT', () => {
    console.log('\n🛑 Simulación interrumpida por el usuario');
    console.log('📊 Guardando datos disponibles...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Error no capturado:', error.message);
    process.exit(1);
});

// Iniciar simulación mejorada
runImprovedSimulation().catch(error => {
    console.error('🚨 Error crítico en simulación:', error);
    process.exit(1);
});