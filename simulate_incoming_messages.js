const fs = require('fs');

// Configuración de la simulación
const SIMULATION_DURATION = 2 * 60 * 1000; // 2 minutos
const NUM_CLIENTS = 50;

// Números reales de ejemplo (puedes usar números de prueba)
const generateRealishPhoneNumbers = (count) => {
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

// Nombres realistas para los clientes
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

// Función para simular mensaje entrante directamente en el sistema
function simulateIncomingMessage(phoneId, message, senderName) {
    const timestamp = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Bogota'
    });
    
    // Crear objeto de mensaje simulado similar al formato de WhatsApp Web.js
    const simulatedMessage = {
        id: {
            _serialized: `${phoneId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fromMe: false,
            remote: phoneId,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        body: message,
        type: 'chat',
        timestamp: Math.floor(Date.now() / 1000),
        from: phoneId,
        to: '573135648878@c.us', // Número del bot (ajustar según tu configuración)
        author: phoneId,
        pushname: senderName,
        isForwarded: false,
        hasMedia: false,
        fromMe: false,
        hasQuotedMsg: false,
        deviceType: 'android',
        isStatus: false,
        isStarred: false,
        broadcast: false,
        mentionedIds: [],
        groupMentions: [],
        isGif: false,
        links: []
    };
    
    // Agregar al log de mensajes para que aparezca en la interfaz
    const logEntry = `${timestamp}: 📨 [SIMULADO] Mensaje recibido de ${senderName} (${phoneId}): "${message}"`;
    
    // Escribir al archivo de logs
    fs.appendFileSync('./mensajes.log', logEntry + '\n');
    
    console.log(`📨 ${senderName}: "${message}"`);
    
    return simulatedMessage;
}

// Función para simular un cliente individual
async function simulateClient(clientId, phoneId, clientName) {
    const startTime = Date.now();
    let messageCount = 0;
    
    console.log(`📱 Cliente ${clientId} (${clientName}) iniciado`);
    
    // Cada cliente envía entre 1 y 4 mensajes
    const numMessages = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numMessages; i++) {
        // Tiempo aleatorio entre mensajes (15 segundos a 90 segundos)
        const waitTime = Math.floor(Math.random() * 75000) + 15000;
        
        // Si el tiempo excede la duración, terminar
        if (Date.now() - startTime + waitTime > SIMULATION_DURATION) {
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Seleccionar mensaje aleatorio
        const randomMessage = clientMessages[Math.floor(Math.random() * clientMessages.length)];
        
        // Simular mensaje entrante
        simulateIncomingMessage(phoneId, randomMessage, clientName);
        messageCount++;
    }
    
    console.log(`🏁 Cliente ${clientId} (${clientName}) terminado - ${messageCount} mensajes`);
    return messageCount;
}

// Función principal
async function runSimulation() {
    console.log(`🚀 Simulación de ${NUM_CLIENTS} clientes iniciada por ${SIMULATION_DURATION/1000} segundos`);
    console.log(`⏰ Inicio: ${new Date().toISOString()}`);
    console.log('═'.repeat(80));
    
    const phoneNumbers = generateRealishPhoneNumbers(NUM_CLIENTS);
    const startTime = Date.now();
    
    // Inicializar contadores
    let totalMessages = 0;
    const clientPromises = [];
    
    // Iniciar todos los clientes
    for (let i = 0; i < NUM_CLIENTS; i++) {
        const clientName = clientNames[i] || `Cliente ${i + 1}`;
        const clientPromise = simulateClient(i + 1, phoneNumbers[i], clientName).then(count => {
            totalMessages += count;
            return count;
        });
        clientPromises.push(clientPromise);
        
        // Pausa pequeña entre inicios
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Mostrar progreso cada 20 segundos
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, SIMULATION_DURATION - elapsed);
        const progress = ((elapsed / SIMULATION_DURATION) * 100).toFixed(1);
        
        console.log(`⏱️  Progreso: ${progress}% - Tiempo restante: ${Math.ceil(remaining/1000)}s`);
        
        if (remaining <= 0) {
            clearInterval(progressInterval);
        }
    }, 20000);
    
    // Esperar que termine la simulación
    setTimeout(() => {
        console.log('🛑 Tiempo de simulación completado');
    }, SIMULATION_DURATION);
    
    // Esperar resultados
    const results = await Promise.all(clientPromises);
    clearInterval(progressInterval);
    
    // Calcular estadísticas
    const endTime = Date.now();
    const duration = endTime - startTime;
    totalMessages = results.reduce((sum, count) => sum + count, 0);
    
    console.log('═'.repeat(80));
    console.log('📊 REPORTE FINAL DE SIMULACIÓN');
    console.log('═'.repeat(80));
    console.log(`🕒 Duración: ${(duration/1000).toFixed(1)} segundos`);
    console.log(`👥 Clientes simulados: ${NUM_CLIENTS}`);
    console.log(`💬 Mensajes generados: ${totalMessages}`);
    console.log(`📊 Promedio por cliente: ${(totalMessages/NUM_CLIENTS).toFixed(1)} mensajes`);
    console.log(`⚡ Velocidad: ${(totalMessages/(duration/1000)).toFixed(1)} mensajes/segundo`);
    console.log(`📝 Los mensajes se han agregado al archivo mensajes.log`);
    console.log(`🖥️  Revisa tu interfaz web para ver los mensajes simulados`);
    
    // Guardar reporte
    const report = {
        timestamp: new Date().toISOString(),
        duration: duration,
        numClients: NUM_CLIENTS,
        totalMessages: totalMessages,
        messagesPerClient: totalMessages/NUM_CLIENTS,
        messagesPerSecond: totalMessages/(duration/1000),
        clientResults: results
    };
    
    fs.writeFileSync('simulation_report_incoming.json', JSON.stringify(report, null, 2));
    console.log('💾 Reporte guardado en: simulation_report_incoming.json');
    console.log('✅ Simulación completada exitosamente');
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