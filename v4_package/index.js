// Configurar variables de entorno ANTES de importar db.js
process.env.DB_SYSTEM_HOST = 'localhost';
process.env.DB_SYSTEM_USER = 'debian-sys-maint';
process.env.DB_SYSTEM_PASSWORD = 'IOHcXunF7795fMRI';
process.env.DB_SYSTEM_DATABASE = 'solucnet_auth_system';

// Ahora importar db.js después de configurar las variables de entorno
const fs = require('fs');
const https = require('https');
const express = require('express');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const cors = require('cors');
const {
    consultarCliente,
    crearSoporte,
    inicializarSistema,
    buscarUsuario,
    crearToken,
    verificarToken,
    verificarTokenEterno,
    cerrarSesion,
    validarConexionBD,
    agregarNumeroOmitido,
    obtenerNumerosOmitidos,
    estaNumeroOmitido,
    eliminarNumeroOmitido,
    obtenerUsuarios,
    crearUsuario,
    eliminarUsuario,
    actualizarUsuario,
    registrarLogAPI,
    obtenerLogsAPI,
    limpiarLogsAPI
} = require('./db.js');
const multer = require('multer');
const path = require('path');

let clienteIniciando = false;

// Mensajes de bienvenida aleatorios y amigables con Unicode
const mensajesBienvenida = [
    `\u{1F44B}Hola de nuevo! \u{2728}En *SOLUCNET* queremos que encuentres rapido lo que buscas. Explora el *menu* y elige la opcion que necesites. \u{1F4CB}`,
    `\u{1F60A}Que gusto verte otra vez! \u{1F4BB}En *SOLUCNET* estamos listos para ayudarte. Revisa el *menu* principal y selecciona tu opcion preferida. \u{1F4CB}`,
    `\u{1F44F}Nos alegra tu regreso! \u{1F4C5}En *SOLUCNET* tenemos todo preparado. Observa el *menu* y dinos que servicio necesitas. \u{1F4CB}`,
    `\u{1F604}Bienvenido nuevamente! \u{1F4AC}En *SOLUCNET* queremos hacer tu experiencia facil. Mira el *menu* y escoge lo que buscas. \u{1F4CB}`,
    `\u{1F917}Nos encanta tenerte de vuelta! \u{1F4E1}En *SOLUCNET* encontraras la solucion que necesitas. Consulta el *menu* y selecciona la opcion adecuada. \u{1F4CB}`,
    `\u{1F60E}Hola otra vez! \u{1F4CD}En *SOLUCNET* tu satisfaccion es prioridad. Revisa el *menu* principal y haz tu eleccion. \u{1F4CB}`,
    `\u{1F389}Que bueno que regresaste! \u{1F4DA}En *SOLUCNET* tenemos varias opciones para ti. Lee el *menu* con calma y selecciona la que mas te sirva. \u{1F4CB}`,
    `\u{1F44C}Un placer verte de nuevo! \u{1F50D}En *SOLUCNET* todo esta listo para atenderte. Explora el *menu* y dinos como podemos ayudarte. \u{1F4CB}`,
    `\u{1F49F}Bienvenido de regreso! \u{1F680}En *SOLUCNET* queremos llevarte directo a la solucion. Revisa el *menu* y selecciona tu opcion. \u{1F4CB}`,
    `\u{1F64C}Nos alegra verte nuevamente! \u{1F3AF}En *SOLUCNET* estamos aqui para ti. Mira el *menu* y elige lo que necesites. \u{1F4CB}`,
    `\u{1F601}Bienvenido otra vez! \u{1F4A1}En *SOLUCNET* estamos listos para asistirte. Revisa con calma el *menu* principal antes de elegir tu opcion. \u{1F4CB}`
];

// Localidades disponibles y sus imágenes
const localidadesDisponibles = {
    "reposo": "./images/reposo.jpg",
    "salvador": "./images/salvador.jpg",
    "bosque los almendros": "./images/bosque.jpg",
    "rio grande": "./images/riogrande.jpg",
    "osito": "./images/osito.jpg",
    "salsipuedes": "./images/salsipuedes.jpg",
    "milucha": "./images/milucha.jpg",
    "churido": "./images/churido.jpg"
};
// Configuración SSL para HTTPS
let sslOptions = null;
let useHTTPS = false;

// Verificar si existen los certificados SSL
if (fs.existsSync('ssl/private-key.pem') && fs.existsSync('ssl/certificate.pem')) {
    try {
        sslOptions = {
            key: fs.readFileSync('ssl/private-key.pem'),
            cert: fs.readFileSync('ssl/certificate.pem')
        };
        useHTTPS = true;
        console.log('🔒 Certificados SSL encontrados - Usando HTTPS');
    } catch (error) {
        console.log('⚠️  Error cargando certificados SSL:', error.message);
        console.log('🔄 Usando HTTP en su lugar');
        useHTTPS = false;
    }
} else {
    console.log('⚠️  No se encontraron certificados SSL');
    console.log('🔄 Usando HTTP');
    useHTTPS = false;
}

const app = express();
app.use(cors());
app.use(express.json());

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './uploads/';
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generar nombre único con timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB límite
        files: 10 // máximo 10 archivos por vez
    },
    fileFilter: function (req, file, cb) {
        // Tipos de archivo permitidos
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/mov',
            'audio/mp3', 'audio/wav', 'audio/ogg',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
        }
    }
});

// ===== Sistema de caché para mensajes de API =====
const mensajesAPICache = new Map(); // Para rastrear mensajes enviados por API

function agregarMensajeAPICache(chatId, mensaje, duracion = 30000) {
    const key = `${chatId}:${mensaje}`;
    mensajesAPICache.set(key, Date.now());
    
    // Limpiar después de la duración especificada (por defecto 30 segundos)
    setTimeout(() => {
        mensajesAPICache.delete(key);
    }, duracion);
}

function esMensajeDeAPI(chatId, mensaje) {
    const key = `${chatId}:${mensaje}`;
    return mensajesAPICache.has(key);
}

// ===== Función de logs =====
function registrarLog(texto) {
    const linea = `[${new Date().toISOString()}] ${texto}\n`;
    console.log(linea.trim());
    fs.appendFileSync('mensajes.log', linea);
}

// ===== FUNCIÓN CORREGIDA: Mensaje fuera de servicio =====
function enviarMensajeFueraHorario(chatId) {
    const ahora = new Date();
    const dia = ahora.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    const hora = ahora.getHours();

    // Verificar si está entre lunes (1) y sábado (6)
    const esDiaLaboral = dia >= 1 && dia <= 6;
    
    // Verificar si la hora está dentro del rango 8am - 7pm
    const enHorarioLaboral = hora >= 8 && hora < 19;

    // Si NO es día laboral o NO está en horario laboral => enviar mensaje
    if (!(esDiaLaboral && enHorarioLaboral)) {
        // Usar setTimeout para evitar bloqueo y asegurar que el mensaje se envíe
        setTimeout(async () => {
            await enviarMensajeSeguro(chatId, "⏰ Recuerda que nos encontramos fuera de servicio, nuestro horario de atencion es de lunes a sabado de 8 am - hasta las 7pm");
        }, 500);
    } else {
        console.log("✅ Dentro del horario laboral, no se envía mensaje.");
    }
}

// ===== Variables de control optimizadas =====
const estadosUsuario = new Map(); // Optimización: usar Map en lugar de objetos múltiples
const chatsActivos = new Map(); // Almacenar información de chats activos
const mensajesChat = new Map(); // Almacenar mensajes de cada chat
let whatsappListo = false;
let whatsappEstabilizado = false;
let ultimoReinicio = 0;

// Constantes de tiempo

// ===== Función de similitud optimizada =====
function similitudTexto(a, b) {
    if (!a || !b) return 0;
    a = a.toLowerCase();
    b = b.toLowerCase();
    
    // Optimización: verificar coincidencia exacta primero
    if (a === b) return 1;
    
    const distancia = levenshtein(a, b);
    const longitudMax = Math.max(a.length, b.length);
    return 1 - distancia / longitudMax;
}

function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matriz = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matriz[0][i] = i;
    for (let j = 0; j <= b.length; j++) matriz[j][0] = j;
    
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
            matriz[j][i] = Math.min(
                matriz[j - 1][i] + 1,
                matriz[j][i - 1] + 1,
                matriz[j - 1][i - 1] + cost
            );
        }
    }
    
    return matriz[b.length][a.length];
}

// ===== Función para limpiar sesión =====
function borrarSesion() {
    try {
        const sessionPath = '/root/chatbot-whatsapp/.wwebjs_auth';
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            registrarLog('🗑️ Carpeta de sesión eliminada correctamente.');
        } else {
            registrarLog('⚠️ No se encontró carpeta de sesión para borrar.');
        }
    } catch (err) {
        registrarLog(`❌ Error borrando sesión: ${err.message}`);
    }
}

// ===== PROTECCIÓN ANTI-BOT: Variables de control =====
const mensajesPorUsuario = new Map(); // Para rate limiting por usuario
const mensajesGlobales = []; // Para rate limiting global
const LIMITE_MENSAJES_POR_MINUTO = 20; // Límite por usuario
const LIMITE_MENSAJES_GLOBAL_POR_MINUTO = 60; // Límite global
const tiempoInicioBot = Date.now(); // Para delays entre sesiones
const primeraRespuestaPorUsuario = new Map(); // Para delay inicial por usuario

// ===== PROTECCIÓN ANTI-BOT: Configuración para API =====
const CONFIG_API_PROTECCIONES = {
    habilitarDelays: true,          // Activar delays en mensajes API
    habilitarTyping: true,          // Activar indicador "escribiendo"
    habilitarRateLimiting: true,    // Activar limitación de velocidad
    delayMinimo: 1000,              // Delay mínimo 1 segundo (más rápido que usuario normal)
    delayMaximo: 3000,              // Delay máximo 3 segundos
    typingReducido: true            // Typing más corto para API
};

// ===== PROTECCIÓN ANTI-BOT: Funciones auxiliares =====
function obtenerDelayAleatorio(longitudMensaje = 0) {
    // Delay base entre 2-5 segundos
    const delayBase = 2000 + Math.random() * 3000;

    // Agregar delay adicional basado en longitud del mensaje (simula lectura/escritura)
    const delayPorLongitud = Math.min(longitudMensaje * 30, 3000); // Máximo 3 segundos adicionales

    return Math.floor(delayBase + delayPorLongitud);
}

function obtenerDelayTyping(longitudMensaje = 0) {
    // Simular tiempo de escritura: 50-100ms por carácter, con mínimo de 1 segundo
    const tiempoEscritura = Math.max(1000, longitudMensaje * (50 + Math.random() * 50));
    return Math.floor(Math.min(tiempoEscritura, 5000)); // Máximo 5 segundos
}

function verificarRateLimiting(chatId) {
    const ahora = Date.now();
    const unMinutoAtras = ahora - 60000;

    // Limpiar mensajes antiguos del usuario
    if (mensajesPorUsuario.has(chatId)) {
        const mensajesUsuario = mensajesPorUsuario.get(chatId).filter(t => t > unMinutoAtras);
        mensajesPorUsuario.set(chatId, mensajesUsuario);

        if (mensajesUsuario.length >= LIMITE_MENSAJES_POR_MINUTO) {
            console.log(`⚠️ [RATE LIMIT] Usuario ${chatId} ha alcanzado el límite de mensajes por minuto`);
            return false;
        }
    }

    // Limpiar mensajes globales antiguos
    const mensajesRecientes = mensajesGlobales.filter(t => t > unMinutoAtras);
    mensajesGlobales.length = 0;
    mensajesGlobales.push(...mensajesRecientes);

    if (mensajesGlobales.length >= LIMITE_MENSAJES_GLOBAL_POR_MINUTO) {
        console.log(`⚠️ [RATE LIMIT] Límite global de mensajes alcanzado`);
        return false;
    }

    return true;
}

function registrarMensajeEnviado(chatId) {
    const ahora = Date.now();

    // Registrar para el usuario
    if (!mensajesPorUsuario.has(chatId)) {
        mensajesPorUsuario.set(chatId, []);
    }
    mensajesPorUsuario.get(chatId).push(ahora);

    // Registrar globalmente
    mensajesGlobales.push(ahora);
}

async function simularTyping(chatId, duracion) {
    try {
        // Enviar estado "escribiendo..."
        const chat = await client.getChatById(chatId);
        await chat.sendStateTyping();

        // Mantener el indicador por la duración especificada
        await new Promise(resolve => setTimeout(resolve, duracion));
    } catch (error) {
        console.log(`⚠️ [TYPING] Error simulando typing para ${chatId}: ${error.message}`);
        // No es crítico si falla, continuar sin typing indicator
    }
}

// ===== Funciones de gestión de chats =====
function obtenerNombreChat(chatId) {
    // Extraer número de teléfono del chatId
    const numero = chatId.replace('@c.us', '').replace('@lid', '');
    return `+${numero}`;
}

function obtenerModoChat(chatId) {
    const estado = obtenerEstadoUsuario(chatId);
    return estado.enEsperaHumano ? 'human' : 'bot';
}

function actualizarChatActivo(chatId, mensaje = null) {
    const numero = chatId.replace('@c.us', '').replace('@lid', '');
    const nombre = obtenerNombreChat(chatId);
    const modo = obtenerModoChat(chatId);
    
    const chatInfo = chatsActivos.get(chatId) || {
        id: chatId,
        phone: numero,
        name: nombre,
        mode: modo,
        lastActivity: Date.now(),
        lastMessage: '',
        unreadCount: 0,
        messages: []
    };

    if (mensaje) {
        chatInfo.lastMessage = mensaje.body.substring(0, 50) + (mensaje.body.length > 50 ? '...' : '');
        chatInfo.lastActivity = Date.now();
        
        // Incrementar contador de no leídos si es mensaje entrante
        if (!mensaje.fromMe) {
            chatInfo.unreadCount = (chatInfo.unreadCount || 0) + 1;
        }
        
        // Agregar mensaje a la lista
        if (!mensajesChat.has(chatId)) {
            mensajesChat.set(chatId, []);
        }

        const mensajes = mensajesChat.get(chatId);

        // Verificar si el mensaje ya existe para evitar duplicados
        const mensajeExistente = mensajes.find(m =>
            m.body === mensaje.body &&
            Math.abs(m.timestamp - Date.now()) < 5000 && // Dentro de 5 segundos
            m.fromMe === (mensaje.fromMe || false)
        );

        if (!mensajeExistente) {
            console.log(`📝 [CHAT UPDATE] Agregando mensaje único a ${chatId}: "${mensaje.body.substring(0, 30)}"`);
            mensajes.push({
                id: Date.now() + Math.random(),
                body: mensaje.body,
                fromMe: mensaje.fromMe || false,
                timestamp: Date.now(),
                status: mensaje.fromMe ? 'sent' : 'received'
            });
        } else {
            console.log(`🚫 [CHAT UPDATE] Mensaje duplicado detectado, omitiendo: "${mensaje.body.substring(0, 30)}"`);
        }

        // Mantener solo los últimos 100 mensajes por chat
        if (mensajes.length > 100) {
            mensajes.splice(0, mensajes.length - 100);
        }
    }
    
    chatInfo.mode = modo;
    chatsActivos.set(chatId, chatInfo);
}

function limpiarChatActivo(chatId) {
    chatsActivos.delete(chatId);
    mensajesChat.delete(chatId);
}

// ===== Función para limpiar mensajes duplicados =====
function limpiarMensajesDuplicados() {
    console.log('🧹 Iniciando limpieza de mensajes duplicados...');

    try {
        let totalDuplicados = 0;

        // Limpiar cada chat
        for (const [chatId, mensajes] of mensajesChat.entries()) {
            const mensajesOriginales = mensajes.length;
            const mensajesUnicos = [];
            const mensajesVistos = new Set();

            // Filtrar mensajes únicos (mantener el más reciente)
            for (let i = mensajes.length - 1; i >= 0; i--) {
                const mensaje = mensajes[i];
                const clave = `${mensaje.body}_${mensaje.fromMe}_${Math.floor(mensaje.timestamp / 1000)}`;

                if (!mensajesVistos.has(clave)) {
                    mensajesVistos.add(clave);
                    mensajesUnicos.unshift(mensaje); // Agregar al inicio para mantener orden
                }
            }

            const duplicadosEliminados = mensajesOriginales - mensajesUnicos.length;
            if (duplicadosEliminados > 0) {
                mensajesChat.set(chatId, mensajesUnicos);
                totalDuplicados += duplicadosEliminados;
                console.log(`   ✅ Chat ${chatId}: ${duplicadosEliminados} duplicados eliminados`);
            }
        }

        console.log(`🧹 Limpieza completada: ${totalDuplicados} mensajes duplicados eliminados`);
        return totalDuplicados;

    } catch (error) {
        console.error('❌ Error limpiando mensajes duplicados:', error.message);
        return 0;
    }
}

// ===== Funciones de estado optimizadas =====
function obtenerEstadoUsuario(chatId) {
    return estadosUsuario.get(chatId) || {
        ultimaInteraccion: 0,
        esperandoCedula: false,
        esperandoCedula2: false,
        seguimiento: null,
        enEsperaHumano: null,
        clienteEncontrado: null,
        erroresConsecutivos: 0, // NUEVO: contador de errores consecutivos
        formularioListener: null, // NUEVO: referencia al listener de formulario
        formularioListenerId: null, // NUEVO: ID único del listener de formulario
        ultimoMenuEnviado: null // NUEVO: timestamp del último menú enviado
    };
}

function actualizarEstadoUsuario(chatId, nuevoEstado) {
    const estadoActual = obtenerEstadoUsuario(chatId);
    estadosUsuario.set(chatId, { ...estadoActual, ...nuevoEstado });
}

function limpiarEstadoUsuario(chatId) {
    const estado = obtenerEstadoUsuario(chatId);
    if (estado.enEsperaHumano?.temporizador) {
        clearTimeout(estado.enEsperaHumano.temporizador);
    }
    // Remover listener de formulario si existe
    if (estado.formularioListener) {
        try {
            client.removeListener('message', estado.formularioListener);
            console.log('Listener de formulario removido al limpiar estado para', chatId);
        } catch (error) {
            console.error('Error removiendo listener de formulario:', error.message);
        }
    }
    estadosUsuario.delete(chatId);
}

// ===== NUEVA FUNCIÓN: Enviar audio explicativo =====
async function enviarAudioExplicativo(chatId) {
    try {
        const rutaAudio = '/root/chatbot-whatsapp/audio/menu_explicativo.mp3';
        
        // Verificar si el archivo existe
        if (!fs.existsSync(rutaAudio)) {
            registrarLog(`❌ Audio explicativo no encontrado en: ${rutaAudio}`);
            // Fallback: enviar mensaje de texto explicativo
            await enviarMensajeSeguro(chatId, `🔊 *Audio explicativo del menú*\n\nHola, veo que has tenido dificultades navegando nuestro menú. Te explico cómo usarlo:\n\n📋 *MENÚ PRINCIPAL*\n\n*1* - Si ya eres cliente de SOLUCNET y necesitas reportar un daño, hacer un pago o consultar intermitencias\n\n*2* - Si quieres adquirir un nuevo servicio de internet y eres nuevo cliente\n\n*3* - Si tuviste servicio con nosotros antes y quieres reactivarlo\n\n*4* - Si eres cliente activo pero el sistema no reconoce tu cédula\n\n*#* - Para volver al menú principal desde cualquier punto\n\n*##* - Para hablar directamente con un asesor humano\n\n¡Solo escribe el número de la opción que necesitas!`);
            return;
        }

        const media = MessageMedia.fromFilePath(rutaAudio);
        await enviarMensajeSeguro(chatId, media);
        registrarLog(`🔊 Audio explicativo enviado a ${chatId}`);
    } catch (error) {
        registrarLog(`❌ Error enviando audio explicativo: ${error.message}`);
        // Fallback en caso de error
        await enviarMensajeSeguro(chatId, `🔊 *Ayuda con el menú*\n\nVeo que necesitas ayuda. Recuerda que debes escribir solo el *número* de la opción que necesitas:\n\n1️⃣ Usuarios registrados\n2️⃣ Nuevo servicio\n3️⃣ Reactivación\n4️⃣ Cliente activo (problema con cédula)\n\nEjemplo: escribe solo "1" para la primera opción.`);
    }
}

// ===== FUNCIÓN MODIFICADA: Manejar mensaje de opción inválida =====
async function manejarOpcionInvalida(chatId, contexto = 'menu_principal') {
    const estado = obtenerEstadoUsuario(chatId);
    const nuevosErrores = (estado.erroresConsecutivos || 0) + 1;
    
    actualizarEstadoUsuario(chatId, { erroresConsecutivos: nuevosErrores });
    
    if (nuevosErrores >= 3) {
        // Enviar audio explicativo después de 3 errores consecutivos
        await enviarAudioExplicativo(chatId);
        // Resetear contador después de enviar el audio
        actualizarEstadoUsuario(chatId, { erroresConsecutivos: 0 });
        // Mostrar el menú principal nuevamente
        setTimeout(async () => {
            
        }, 3000); // Esperar 3 segundos después del audio
    } else {
        // Mensaje de error normal
        let mensajeError = '❗ Opción inválida, recuerda seguir el menú de atención';
        
        if (contexto === 'menu_principal') {
            mensajeError += '. Escribe el número de la opción que necesitas (1, 2, 3 o 4)';
        }
        
        mensajeError += ' y si deseas volver al menú principal envía #';

        await enviarMensajeSeguro(chatId, mensajeError);

        // Mostrar contador de intentos restantes
        const intentosRestantes = 3 - nuevosErrores;
        if (intentosRestantes > 0) {
            await enviarMensajeSeguro(chatId, `💡 Tip: Te quedan ${intentosRestantes} intentos antes de que te ayude con un audio explicativo.`);
        }
    }
}

// ===== User-Agents realistas para rotación =====
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function obtenerUserAgentAleatorio() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// ===== Inicialización del cliente optimizada =====
let client;

async function iniciarCliente() {
    if (clienteIniciando) {
        registrarLog('Cliente ya está iniciando, se evita duplicar.');
        return;
    }
    clienteIniciando = true;

    try {
        if (client) {
            try {
                registrarLog('Cerrando cliente anterior...');
                await client.destroy();
            } catch (cerrarErr) {
                registrarLog(`❌ Error cerrando cliente anterior: ${cerrarErr.message}`);
            }
        }

        // Seleccionar User-Agent aleatorio
        const userAgent = obtenerUserAgentAleatorio();
        console.log(`🔄 [USER-AGENT] Usando: ${userAgent.substring(0, 50)}...`);

        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: [
                    `--user-agent=${userAgent}`,
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-extensions',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            }
        });

        client.on('qr', qr => {
            qrcode.generate(qr, { small: true });
            registrarLog('Escanea el QR para iniciar sesion');
            // Guardar QR para API
            global.currentQR = qr;
        });

        client.on('ready', () => {
            whatsappListo = true;
            clienteIniciando = false;
            // Limpiar QR cuando se conecta exitosamente
            global.currentQR = null;
            registrarLog('✅ Cliente de WhatsApp listo');

            // Agregar delay de estabilización después de reinicios
            const ahora = Date.now();
            const tiempoDesdeUltimoReinicio = ahora - ultimoReinicio;

            if (ultimoReinicio > 0 && tiempoDesdeUltimoReinicio < 30000) {
                // Fue un reinicio, esperar 15 segundos adicionales para estabilización
                console.log('⏳ [ESTABILIZACIÓN] Esperando 15 segundos para que WhatsApp se estabilice completamente...');
                setTimeout(() => {
                    whatsappEstabilizado = true;
                    console.log('✅ [ESTABILIZACIÓN] WhatsApp completamente estabilizado y listo para enviar archivos');
                }, 15000);
            } else {
                // Inicio normal, marcar como estabilizado inmediatamente
                whatsappEstabilizado = true;
                console.log('✅ [ESTABILIZACIÓN] WhatsApp listo para enviar archivos');
            }
        });

        client.on('disconnected', (reason) => {
            whatsappListo = false;
            // Limpiar QR al desconectarse
            global.currentQR = null;
            registrarLog(`🔌 Cliente desconectado: ${reason}. Eliminando sesión y reiniciando...`);
            borrarSesion();
            clienteIniciando = false;
            setTimeout(iniciarCliente, 5000);
        });

        client.on('error', (err) => {
            // Limpiar QR al haber error
            global.currentQR = null;
            registrarLog(`❌ Error de cliente: ${err.message}. Eliminando sesión y reiniciando...`);
            borrarSesion();
            clienteIniciando = false;
            setTimeout(iniciarCliente, 5000);
        });

        // ===== Escucha de mensajes optimizada =====
        client.on('message', manejarMensaje);

        await client.initialize().catch(err => {
            registrarLog(`Fallo al inicializar cliente: ${err.message}. Eliminando sesión y reiniciando...`);
            borrarSesion();
            clienteIniciando = false;
            setTimeout(iniciarCliente, 5000);
        });

    } catch (err) {
        registrarLog(`Excepción al iniciar cliente: ${err.message}. Eliminando sesión y reiniciando...`);
        borrarSesion();
        clienteIniciando = false;
        setTimeout(iniciarCliente, 5000);
    }
}

// ===== Función principal de manejo de mensajes =====
async function manejarMensaje(msg) {
    try {
        // Filtrar estados de WhatsApp, mensajes de grupos, mensajes propios y número bloqueado
        if (msg.from.includes('status@broadcast') || msg.from.includes('@g.us') || msg.fromMe) return;
        
        // Bloquear número específico 573025961131
        if (msg.from.includes('573025961131')) return;

        // Normalizar chatId
        let chatId = msg.from;
        if (chatId.endsWith('@c.us')) {
            chatId = chatId.replace(/@c\.us$/, '') + '@c.us';
        } else if (chatId.endsWith('@lid')) {
            // Los números internacionales terminan con @lid
            chatId = chatId.replace(/@lid$/, '') + '@lid';
        }

        // Verificar si este mensaje fue enviado por API (filtrar mensajes de API externa)
        if (esMensajeDeAPI(chatId, msg.body)) {
            console.log(`🚫 [FILTRADO] Mensaje de API detectado y filtrado: ${msg.body.substring(0, 50)}`);
            return; // Salir sin procesar
        }

        // VERIFICAR NÚMEROS OMITIDOS PRIMERO - ANTES DE CUALQUIER PROCESAMIENTO
        const numeroSinFormato = chatId.replace('@c.us', '').replace('@lid', '');
        
        try {
            const numeroOmitido = await estaNumeroOmitido(numeroSinFormato);
            if (numeroOmitido) {
                registrarLog(`Número omitido detectado: ${numeroSinFormato} - Procesando en modo humano directo`);
                
                // Actualizar chat activo con el mensaje
                actualizarChatActivo(chatId, {
                    body: msg.body,
                    fromMe: false,
                    hasMedia: msg.hasMedia || false
                });
                
                // Verificar si ya está en modo humano
                const estado = obtenerEstadoUsuario(chatId);
                if (!estado.enEsperaHumano) {
                    // Activar modo humano solo si no está ya activado
                    await activarModoHumano(chatId);
                    await enviarMensaje(chatId, '📩 Tu mensaje ha sido transmitido al área encargada. Te pedimos un momento por favor, pronto nos comunicaremos contigo. ✨');
                } else {
                    // Solo manejar el mensaje en modo humano
                    await manejarModoHumano(chatId);
                }
                
                // DETENER TODO PROCESAMIENTO DEL BOT AQUÍ
                return;
            }
        } catch (error) {
            registrarLog(`Error verificando número omitido: ${error.message}`);
        }

        console.log(`📨 [LISTENER PRINCIPAL] Mensaje entrante de ${chatId}: "${msg.body}"`);
        registrarLog(`Mensaje entrante de ${chatId}: ${msg.body}`);
        
        // Procesar mensaje con posible imagen
        let bodyContent = msg.body;
        
        // Verificar si el mensaje tiene media (imagen, video, audio, etc.)
        if (msg.hasMedia) {
            try {
                const media = await msg.downloadMedia();

                // Procesar imágenes
                if (media.mimetype.startsWith('image/')) {
                    // Generar nombre único para la imagen
                    const timestamp = Date.now();
                    const extension = media.mimetype.split('/')[1];
                    const filename = `user_image_${timestamp}.${extension}`;
                    const filePath = `./images/users/${filename}`;

                    // Crear directorio si no existe
                    const userImagesDir = './images/users';
                    if (!fs.existsSync(userImagesDir)) {
                        fs.mkdirSync(userImagesDir, { recursive: true });
                    }

                    // Guardar imagen usando Promise para asegurar descarga completa
                    try {
                        await new Promise((resolve, reject) => {
                            const buffer = Buffer.from(media.data, 'base64');
                            fs.writeFile(filePath, buffer, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    } catch (error) {
                        registrarLog(`Error guardando imagen: ${error.message}`);
                        return; // Salir si hay error
                    }

                    // Crear HTML para mostrar la imagen en la interfaz web
                    const webPath = `/images/users/${filename}`;
                    bodyContent = `<img src="${webPath}" alt="Imagen enviada por usuario" style="max-width: 200px; border-radius: 8px;">`;
                    if (msg.body && msg.body.trim()) {
                        bodyContent += `<br><span>${msg.body}</span>`;
                    }

                    registrarLog(`Imagen guardada: ${filePath}`);
                }
                // Procesar audios
                else if (media.mimetype.startsWith('audio/')) {
                    // Generar nombre único para el audio
                    const timestamp = Date.now();
                    // Limpiar el tipo MIME para obtener la extensión correcta
                    const cleanMimeType = media.mimetype.split(';')[0];
                    const extension = cleanMimeType.split('/')[1];
                    const filename = `user_audio_${timestamp}.${extension}`;
                    const filePath = `./uploads/audios/${filename}`;

                    // Crear directorio si no existe
                    const userAudiosDir = './uploads/audios';
                    if (!fs.existsSync(userAudiosDir)) {
                        fs.mkdirSync(userAudiosDir, { recursive: true });
                    }

                    // Guardar audio usando Promise para asegurar descarga completa
                    try {
                        await new Promise((resolve, reject) => {
                            const buffer = Buffer.from(media.data, 'base64');
                            registrarLog(`Guardando audio de ${buffer.length} bytes en ${filePath}`);

                            fs.writeFile(filePath, buffer, (err) => {
                                if (err) {
                                    registrarLog(`Error escribiendo archivo de audio: ${err.message}`);
                                    reject(err);
                                } else {
                                    // Verificar que el archivo se guardó correctamente
                                    const stats = fs.statSync(filePath);
                                    registrarLog(`Audio guardado exitosamente: ${filePath} (${stats.size} bytes)`);
                                    resolve();
                                }
                            });
                        });
                    } catch (error) {
                        registrarLog(`Error guardando audio: ${error.message}`);
                        return; // Salir si hay error
                    }

                    // Crear HTML para mostrar el reproductor de audio en la interfaz web
                    const webPath = `/uploads/audios/${filename}`;
                    // Limpiar el tipo MIME para eliminar los codecs
                    const cleanAudioMimeType = media.mimetype.split(';')[0];
                    bodyContent = `<div class="audio-player">
                        <audio controls preload="metadata" style="width: 100%; max-width: 300px;">
                            <source src="${webPath}" type="${cleanAudioMimeType}">
                            <source src="${webPath}" type="audio/mpeg">
                            <source src="${webPath}" type="audio/wav">
                            <source src="${webPath}" type="audio/ogg">
                            Tu navegador no soporta el elemento de audio.
                        </audio>
                        <div class="audio-info">
                            <small>🎵 Audio enviado por usuario • ${cleanAudioMimeType}</small>
                        </div>
                    </div>`;
                    if (msg.body && msg.body.trim()) {
                        bodyContent += `<br><span>${msg.body}</span>`;
                    }

                    registrarLog(`Audio guardado: ${filePath}`);
                }
                // Procesar videos
                else if (media.mimetype.startsWith('video/')) {
                    // Generar nombre único para el video
                    const timestamp = Date.now();
                    // Limpiar el tipo MIME para obtener la extensión correcta
                    const cleanMimeType = media.mimetype.split(';')[0];
                    const extension = cleanMimeType.split('/')[1];
                    const filename = `user_video_${timestamp}.${extension}`;
                    const filePath = `./uploads/videos/${filename}`;

                    // Crear directorio si no existe
                    const userVideosDir = './uploads/videos';
                    if (!fs.existsSync(userVideosDir)) {
                        fs.mkdirSync(userVideosDir, { recursive: true });
                    }

                    // Guardar video usando Promise para asegurar descarga completa
                    try {
                        await new Promise((resolve, reject) => {
                            const buffer = Buffer.from(media.data, 'base64');
                            fs.writeFile(filePath, buffer, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    } catch (error) {
                        registrarLog(`Error guardando video: ${error.message}`);
                        return; // Salir si hay error
                    }

                    // Crear HTML para mostrar el video en la interfaz web
                    const webPath = `/uploads/videos/${filename}`;
                    // Limpiar el tipo MIME para eliminar los codecs
                    const cleanVideoMimeType = media.mimetype.split(';')[0];
                    bodyContent = `<div class="video-player">
                        <video controls style="width: 100%; max-width: 300px; border-radius: 8px;">
                            <source src="${webPath}" type="${cleanVideoMimeType}">
                            Tu navegador no soporta el elemento de video.
                        </video>
                        <div class="video-info">
                            <small>🎥 Video enviado por usuario</small>
                        </div>
                    </div>`;
                    if (msg.body && msg.body.trim()) {
                        bodyContent += `<br><span>${msg.body}</span>`;
                    }

                    registrarLog(`Video guardado: ${filePath}`);
                }
                // Procesar otros tipos de archivos
                else {
                    // Generar nombre único para el archivo
                    const timestamp = Date.now();
                    const extension = media.mimetype.split('/')[1] || 'file';
                    const filename = `user_file_${timestamp}.${extension}`;
                    const filePath = `./uploads/files/${filename}`;

                    // Crear directorio si no existe
                    const userFilesDir = './uploads/files';
                    if (!fs.existsSync(userFilesDir)) {
                        fs.mkdirSync(userFilesDir, { recursive: true });
                    }

                    // Guardar archivo usando Promise para asegurar descarga completa
                    try {
                        await new Promise((resolve, reject) => {
                            const buffer = Buffer.from(media.data, 'base64');
                            fs.writeFile(filePath, buffer, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    } catch (error) {
                        registrarLog(`Error guardando archivo: ${error.message}`);
                        return; // Salir si hay error
                    }

                    // Crear HTML para mostrar el enlace de descarga
                    const webPath = `/uploads/files/${filename}`;
                    bodyContent = `<div class="file-attachment">
                        <a href="${webPath}" download="${filename}" class="file-link">
                            📎 ${filename}
                        </a>
                        <div class="file-info">
                            <small>${media.mimetype} • ${(media.data.length * 0.75 / 1024).toFixed(1)} KB</small>
                        </div>
                    </div>`;
                    if (msg.body && msg.body.trim()) {
                        bodyContent += `<br><span>${msg.body}</span>`;
                    }

                    registrarLog(`Archivo guardado: ${filePath}`);
                }
            } catch (error) {
                registrarLog(`Error descargando media: ${error.message}`);
                bodyContent = '[Media - Error al descargar]';
                if (msg.body && msg.body.trim()) {
                    bodyContent += ` ${msg.body}`;
                }
            }
        }
        
        // Actualizar chat activo con el mensaje entrante
        actualizarChatActivo(chatId, {
            body: bodyContent,
            fromMe: false,
            hasMedia: msg.hasMedia || false
        });

        const estado = obtenerEstadoUsuario(chatId);

        // Reiniciar con #
        if (msg.body.trim() === '#') {
            limpiarEstadoUsuario(chatId);
            registrarLog(`Usuario ${chatId} reinició la conversación con #`);
            const mensaje = mensajesBienvenida[Math.floor(Math.random() * mensajesBienvenida.length)];
            await enviarMensajeSeguro(chatId, mensaje);
            await mostrarMenuPrincipal(chatId);
            return;
        }

        // Activar modo humano con ##
        if (msg.body.trim() === '##') {
            await activarModoHumano(chatId);
            return;
        }

        // Resetear contador de errores cuando el usuario envía una opción válida en cualquier contexto
        const opcionesValidas = ['1', '2', '3', '4', '9', '#', '##'];
        if (opcionesValidas.includes(msg.body.trim())) {
            actualizarEstadoUsuario(chatId, { erroresConsecutivos: 0 });
        }

        // Modo humano activo
        if (estado.enEsperaHumano) {
            await manejarModoHumano(chatId);
            return;
        }

        actualizarEstadoUsuario(chatId, { ultimaInteraccion: Date.now() });

        // Manejo de cédulas
        if (estado.esperandoCedula) {
            await procesarCedula(chatId, msg.body.trim(), 'usuario_registrado');
            return;
        }

        if (estado.esperandoCedula2) {
            await procesarCedula(chatId, msg.body.trim(), 'consulta_estado');
            return;
        }

        // Seguimiento de submenús
        if (estado.seguimiento) {
            await manejarSeguimiento(chatId, msg.body.trim(), estado.seguimiento);
            return;
        }

        // Menú principal
        await manejarMenuPrincipal(chatId, msg.body.trim());

    } catch (error) {
        registrarLog(`Error procesando mensaje: ${error.message}`);
    }
}

// ===== Funciones especializadas =====

async function activarModoHumano(chatId) {
    actualizarEstadoUsuario(chatId, {
        enEsperaHumano: { 
            contador: 0, 
            ultimaRespuesta: Date.now()
        },
        erroresConsecutivos: 0 // Reset errores al entrar en modo humano
    });
    
    registrarLog(`Usuario ${chatId} activó modo humano con ##`);
}

async function manejarModoHumano(chatId) {
    const estado = obtenerEstadoUsuario(chatId);
    
    actualizarEstadoUsuario(chatId, {
        enEsperaHumano: { 
            ...estado.enEsperaHumano,
            ultimaRespuesta: Date.now()
        }
    });
    
    registrarLog(`(HUMANO) Mensaje en modo humano de ${chatId}`);
}

async function procesarCedula(chatId, cedula, tipo) {
    registrarLog(`Usuario ${chatId} ingresó cédula: ${cedula}`);
    
    try {
        const resultado = await consultarCliente(cedula);
        
        actualizarEstadoUsuario(chatId, { 
            esperandoCedula: false, 
            esperandoCedula2: false,
            erroresConsecutivos: 0 // Reset errores después de procesar cédula exitosamente
        });

        if (resultado) {
            const { cliente, facturas, cuenta, bd } = resultado;
            actualizarEstadoUsuario(chatId, { 
                clienteEncontrado: { cliente, facturas, cuenta, bd } 
            });

            if (tipo === 'usuario_registrado') {
                await enviarMensajeSeguro(chatId, `👋 Hola, ${cliente.nombre}! Bienvenido de nuevo.\n\n*ESTADO* *${cliente.estado}*\n\nEn Que te podemos ayudar el dia de hoy?\n\n1.Registrar pago y plazo\n2.Soporte tecnico\n3.Mi estado de cuenta y cuenta a consignar\n9 Volver al menu principal`);
                actualizarEstadoUsuario(chatId, { 
                    seguimiento: { paso: 'menu_usuario', cliente } 
                });
            } else if (tipo === 'consulta_estado') {
                await mostrarEstadoCuenta(chatId, cliente, facturas, cuenta);
            }
        } else {
            await enviarMensajeSeguro(chatId, '😢 Lo sentimos, cliente no encontrado.');
            if (tipo === 'consulta_estado') {
                await transferirAsesor(chatId);
            } else {
                await mostrarMenuPrincipal(chatId);
            }
        }
    } catch (err) {
        registrarLog(`Error: ${err.message}`);
        await enviarMensajeSeguro(chatId, '🚫 Error de conexion con la base de datos. Intenta mas tarde.');
    }
}

async function mostrarEstadoCuenta(chatId, cliente, facturas, cuenta) {
    if (facturas && facturas.length > 0) {
        let mensajeDeuda = `💸 *${cliente.nombre}*\n\n`;
        if (cuenta) {
            mensajeDeuda += `\n Estado: *${cliente.estado}*\n`;
        }
        facturas.forEach((factura, i) => {
            mensajeDeuda += `${i + 1}.Vencimiento: ${factura.vencimiento}. \nTotal: $${factura.total}\n`;
        });
        if (cuenta) {
            mensajeDeuda += `\n Cuenta de pago: ${cuenta.cuenta}\n`;
        }
        if (facturas.length > 2) {
            mensajeDeuda += `\n⚠️ *Atencion:* Usted tiene mas de 2 facturas pendientes, evite reportes negativos en las centrales de riesgo.`;
        }
        await enviarMensajeSeguro(chatId, mensajeDeuda);
    } else {
        await enviarMensajeSeguro(chatId, '🎉 No tienes facturas pendientes de pago.');
    }

    await transferirAsesor(chatId);
}

async function transferirAsesor(chatId) {
    await enviarMensajeSeguro(chatId, '📨 Estamos procesando tu solicitud y enviándola al área especializada... ');
    enviarMensajeFueraHorario(chatId);
    
    actualizarEstadoUsuario(chatId, {
        seguimiento: null,
        enEsperaHumano: { 
            contador: 0, 
            ultimaRespuesta: Date.now()
        },
        erroresConsecutivos: 0 // Reset errores al transferir a asesor
    });
}

async function manejarSeguimiento(chatId, texto, seguimiento) {
    const estado = obtenerEstadoUsuario(chatId);
    
    switch (seguimiento.paso) {
        case 'nuevo_usuario_nombre':
            actualizarEstadoUsuario(chatId, {
                seguimiento: { paso: 'nuevo_usuario_localidad', nombre: texto },
                erroresConsecutivos: 0
            });
            await enviarMensajeSeguro(chatId, `🔍 Gracias ${texto}, ahora dime en que localidad necesitas el servicio.:`);
            break;

        case 'nuevo_usuario_localidad':
            await procesarLocalidad(chatId, texto, seguimiento.nombre);
            break;

        case 'menu_usuario':
            await manejarMenuUsuario(chatId, texto, estado.clienteEncontrado);
            break;

        case 'soporte_tecnico':
            await manejarSoporteTecnico(chatId, texto);
            break;

        case 'reporte_servicio':
            await manejarReporteServicio(chatId, texto);
            break;

        case 'luz_roja':
            await manejarLuzRoja(chatId, texto, estado.clienteEncontrado);
            break;

        case 'paso4':
            await enviarMensajeSeguro(chatId, `🔍 Gracias ${texto}, ahora dime tu numero de cedula, que ya te estoy transfiriendo con un asesor.:`);
            await transferirAsesor(chatId);
            break;

        case 'problema_lento':
            await manejarProblemaLento(chatId, texto);
            break;
            
            case 'manejarRespuestaFormulario':
            await manejarRespuestaFormulario(chatId, texto);
            break;
            

        default:
            actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
            await mostrarMenuPrincipal(chatId);
            break;
    }
}

async function procesarLocalidad(chatId, respuestaLocalidad, nombreUsuario) {
    const localidadEncontrada = Object.keys(localidadesDisponibles).find(loc => {
        return similitudTexto(respuestaLocalidad.toLowerCase(), loc) > 0.7;
    });

    if (localidadEncontrada) {
        const rutaImagen = localidadesDisponibles[localidadEncontrada];
        const media = MessageMedia.fromFilePath(rutaImagen);
        await enviarMensajeSeguro(chatId, `👋 Genial *${nombreUsuario}*, tenemos cobertura en *${localidadEncontrada}*.`);
        await enviarMensajeSeguro(chatId, media, rutaImagen);

        await configurarRegistroUsuario(chatId);
    } else {
        await enviarMensajeSeguro(chatId, `⚠️ ${nombreUsuario}, para esta zona lamentablemente no tenemos cobertura, pero ya te estamos tramitando con un asesor para darte una respuesta concreta.`);
        await activarModoHumano(chatId);
    }

    actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
}

async function configurarRegistroUsuario(chatId) {
    const temporizador = setTimeout(async () => {
        await enviarMensajeSeguro(chatId, 'deseas llenar nuestro formulario de registro?\n1.SI\n2.No');
        await manejarRespuestaFormulario(chatId);
    }, 3000); // 3 segundos en lugar de 5 minutos para testing

    actualizarEstadoUsuario(chatId, {
        enEsperaHumano: { 
            contador: 0, 
            ultimaRespuesta: Date.now(), 
            temporizador 
        },
        erroresConsecutivos: 0
    });
}

async function manejarRespuestaFormulario(chatId) {
    // PRIMERO: Remover cualquier listener de formulario existente para este chatId
    const estadoActual = obtenerEstadoUsuario(chatId);
    if (estadoActual.formularioListener) {
        try {
            client.removeListener('message', estadoActual.formularioListener);
            console.log('Listener de formulario anterior removido para', chatId);
        } catch (error) {
            console.error('Error removiendo listener anterior:', error.message);
        }
    }

    // Crear nuevo listener con ID único para evitar conflictos
    const listenerId = `formulario_${chatId}_${Date.now()}`;
    const listener = async respuesta => {
        // Verificar que sea para este chat específico
        if (respuesta.from !== chatId) return;

        // Ignorar mensajes enviados por el propio bot
        if (respuesta.fromMe) return;

        const texto = respuesta.body.toLowerCase().trim();
        console.log(`🎧 [LISTENER FORMULARIO ${listenerId}] Procesando respuesta de ${chatId}: "${texto}"`);

        if (texto === '1') {
            await enviarMensaje(chatId, `✅ Perfecto!  \nTe comparto el enlace para iniciar tu proceso de solicitud. Alli veras un boton que dice "COMENZAR" 🟢; solo debes hacer clic y completar los datos que te pedira.  \n📋 Son los requisitos para agendar tu instalacion.  \n\nCuando termines, cuentame a nombre de quien realizaste la inscripcion para poder agendar tu instalacion 📅.  \n🖼 En la imagen que te envie esta el valor del costo de instalacion.  \n\n⚠ Recuerda que manejamos una clausula de permanencia minima de 3 meses.  \n⚠ adicional a esto despues de que llenes el formulario recuerda que son 3 dias habiles para la instalacion, trataremos de hacerlo lo antes posible.\n https://solucnet.com/adquirir-servicios.html`);
            // Remover listener inmediatamente
            client.removeListener('message', listener);
            actualizarEstadoUsuario(chatId, { formularioListener: null });
        } else if (texto === '2') {
            await enviarMensajeSeguro(chatId, 'De acuerdo, en un momento un asesor se pondra en contacto contigo');
            enviarMensajeFueraHorario(chatId);
            // Remover listener inmediatamente
            client.removeListener('message', listener);
            actualizarEstadoUsuario(chatId, { formularioListener: null });

        // rama de opción inválida - permitir más intentos
        } else {
            await manejarOpcionInvalida(chatId, 'manejarRespuestaFormulario');
        }
    };

    // Agregar el listener con ID único
    client.on('message', listener);

    // Guardar referencia del listener en el estado
    actualizarEstadoUsuario(chatId, {
        formularioListener: listener,
        formularioListenerId: listenerId
    });

    console.log(`Nuevo listener de formulario agregado para ${chatId} con ID: ${listenerId}`);

    // Timeout de seguridad más agresivo: 5 minutos
    setTimeout(() => {
        try {
            const estadoTimeout = obtenerEstadoUsuario(chatId);
            if (estadoTimeout.formularioListenerId === listenerId) {
                client.removeListener('message', listener);
                actualizarEstadoUsuario(chatId, { formularioListener: null, formularioListenerId: null });
                console.log(`Listener de formulario timeout para ${chatId} (ID: ${listenerId})`);
            }
        } catch (error) {
            console.error('Error en timeout de listener:', error.message);
        }
    }, 5 * 60 * 1000); // 5 minutos
}

async function manejarMenuUsuario(chatId, texto, clienteEncontrado) {
    if (texto === '1') {
        await enviarMensajeSeguro(chatId, '👉 Por favor envianos tu comprobante de pago o indicanos la fecha hasta la cual requieres el plazo.');
        await transferirAsesor(chatId);
    } else if (texto === '3') {
        if (clienteEncontrado) {
            const { cliente, facturas, cuenta } = clienteEncontrado;
            await mostrarEstadoCuenta(chatId, cliente, facturas, cuenta);
        } else {
            await transferirAsesor(chatId);
        }
    } else if (texto === '2') {
        await enviarMensajeSeguro(chatId, `🔧 Soporte tecnico:\n\n1.Cambio de nombre o contrasena\n2.Reportar dano de servicio⚠\n#.Volver al menu principal`);
        actualizarEstadoUsuario(chatId, {
            seguimiento: { ...obtenerEstadoUsuario(chatId).seguimiento, paso: 'soporte_tecnico' },
            erroresConsecutivos: 0
        });
    } else if (texto === '9') {
        actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
        await mostrarMenuPrincipal(chatId);
    } else {
        await manejarOpcionInvalida(chatId, 'menu_usuario');
    }
}

async function manejarSoporteTecnico(chatId, texto) {
    if (texto === '1') {
        await enviarMensajeSeguro(chatId, '✉ Por favor, envia tu nuevo nombre o contrasena 🔑.');
        await transferirAsesor(chatId);
    } else if (texto === '2') {
        await enviarMensajeSeguro(chatId, `📶 Problemas de servicio:\n1.No tienes internet\n2.Internet lento o intermitente\n3.otro Problema o inquitud\n#.Volver al menu principal`);
        actualizarEstadoUsuario(chatId, {
            seguimiento: { ...obtenerEstadoUsuario(chatId).seguimiento, paso: 'reporte_servicio' },
            erroresConsecutivos: 0
        });
    } else if (texto === '9' || texto === '#') {
        actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
        await mostrarMenuPrincipal(chatId);
    } else {
        await manejarOpcionInvalida(chatId, 'soporte_tecnico');
    }
}

async function manejarReporteServicio(chatId, texto) {
    if (texto === '1') {
        await enviarMensajeSeguro(chatId, '🚨Presentas alguna luz roja en tu modem?\n1.SI\n2.No');
        actualizarEstadoUsuario(chatId, {
            seguimiento: { ...obtenerEstadoUsuario(chatId).seguimiento, paso: 'luz_roja' },
            erroresConsecutivos: 0
        });
    } else if (texto === '2') {
        const rutaImagen = './images/desconectarmodem.jpg';
        const media = MessageMedia.fromFilePath(rutaImagen);
        await enviarMensaje(chatId, media, rutaImagen);
        await enviarMensaje(chatId, '📶 Despues de este paso,Funciona con normalidad tu servicio ?\n1.SI\n2.No');
        actualizarEstadoUsuario(chatId, {
            seguimiento: { ...obtenerEstadoUsuario(chatId).seguimiento, paso: 'problema_lento' },
            erroresConsecutivos: 0
        });
    } else if (texto === '3') {
        await enviarMensaje(chatId, '🔧 Conectándote con nuestro equipo técnico especializado...\nMientras tanto, cuéntanos qué inconveniente presentas con el servicio: ');
        await transferirAsesor(chatId);
    } else if (texto === '9' || texto === '#') {
        actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
        await mostrarMenuPrincipal(chatId);
    } else {
        await manejarOpcionInvalida(chatId, 'reporte_servicio');
    }
}

async function manejarLuzRoja(chatId, texto, clienteEncontrado) {
    if (texto === '2') {
        const rutaImagen = './images/desconectarmodem.jpg';
        const media = MessageMedia.fromFilePath(rutaImagen);
        await enviarMensaje(chatId, media, rutaImagen);
        await enviarMensaje(chatId, '📶 Despues de este paso, Funciona con normalidad tu servicio ?\n1.SI\n2.No');
        actualizarEstadoUsuario(chatId, {
            seguimiento: { ...obtenerEstadoUsuario(chatId).seguimiento, paso: 'problema_lento' },
            erroresConsecutivos: 0
        });
    } else if (texto === '1') {
        actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
        
        await enviarMensajeSeguro(chatId, '🔍 GENERANDO VISITA TECNICA...');
        
        if (clienteEncontrado) {
            const { cliente, bd } = clienteEncontrado;
            try {
                await crearSoporte(cliente.id, bd);
            } catch (error) {
                registrarLog(`Error creando soporte: ${error.message}`);
            }
        }
        
        await enviarMensajeSeguro(chatId, '🙏 Ya hemos generado la visita tecnica. Normalmente son 3 dias habiles, Trataremos de visitarte lo mas pronto posible,  gracias por tu paciencia!');
        await enviarMensajeSeguro(chatId, '😊 Que tengas un excelente dia. Gracias por comunicarte con *SOLUCNET.SAS*');
        
        actualizarEstadoUsuario(chatId, {
            enEsperaHumano: { 
                contador: 0, 
                ultimaRespuesta: Date.now()
            }
        });
    } else if (texto === '9' || texto === '#') {
        actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
        await mostrarMenuPrincipal(chatId);
    } else {
        await manejarOpcionInvalida(chatId, 'luz_roja');
    }
}

async function manejarProblemaLento(chatId, texto) {
    if (texto === '1') {
        await enviarMensajeSeguro(chatId, '😊 Me alegra que ya tengas servicio, fue un placer ayudarte. Que tengas un excelente dia!');
        
        actualizarEstadoUsuario(chatId, {
            seguimiento: null,
            enEsperaHumano: { 
                contador: 0, 
                ultimaRespuesta: Date.now()
            },
            erroresConsecutivos: 0
        });
    } else if (texto === '2') {
        await enviarMensajeSeguro(chatId, '💬 Te estamos conectando con un especialista en soporte técnico...\nMientras tanto, descríbenos detalladamente el problema que presentas: ');
        await transferirAsesor(chatId);
    } else if (texto === '9' || texto === '#') {
        actualizarEstadoUsuario(chatId, { seguimiento: null, erroresConsecutivos: 0 });
        await mostrarMenuPrincipal(chatId);
    } else {
        await manejarOpcionInvalida(chatId, 'problema_lento');
    }
}

async function manejarMenuPrincipal(chatId, texto) {
    if (texto === '1') {
        await enviarMensajeSeguro(chatId, '👤 Por favor, introduce tu numero de cedula, Recuerda que no debe de llevar espacios:');
        actualizarEstadoUsuario(chatId, { esperandoCedula: true, erroresConsecutivos: 0 });
    } else if (texto === '2') {
        await enviarMensajeSeguro(chatId, '👤 Perfecto, para comenzar dime tu *nombre completo*:');
        actualizarEstadoUsuario(chatId, { 
            seguimiento: { paso: 'nuevo_usuario_nombre' },
            erroresConsecutivos: 0
        });
    } else if (texto === '3') {
        await enviarMensajeSeguro(chatId, '👤 Nos alegra que quieras regresar, introduce tu numero de cedula, Recuerda que no debe de llevar espacios:');
        actualizarEstadoUsuario(chatId, { esperandoCedula2: true, erroresConsecutivos: 0 });
    } else if (texto === '4') {
        await enviarMensajeSeguro(chatId, '👤 Perfecto, para comenzar dime tu *nombre completo*:');
        actualizarEstadoUsuario(chatId, { 
            seguimiento: { paso: 'paso4' },
            erroresConsecutivos: 0
        });
    } else if (texto === '9') {
        await mostrarMenuPrincipal(chatId);
    } else {
        await manejarOpcionInvalida(chatId, 'menu_principal');
    }
}

// ===== Funciones de utilidad =====

// ===== NUEVA FUNCIÓN: Enviar mensaje con protecciones anti-bot (versión API) =====
async function enviarMensajeAPIConProteccion(chatId, contenido, rutaImagen = null) {
    console.log(`🛡️ [MENSAJE API] Iniciando envío protegido a ${chatId}`);

    // 1. Verificar rate limiting si está habilitado
    if (CONFIG_API_PROTECCIONES.habilitarRateLimiting) {
        if (!verificarRateLimiting(chatId)) {
            console.log(`🚫 [RATE LIMIT API] Mensaje bloqueado por límite de velocidad`);
            // Esperar menos tiempo que usuarios normales
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

            if (!verificarRateLimiting(chatId)) {
                console.log(`🚫 [RATE LIMIT API] Mensaje descartado después de espera`);
                return false;
            }
        }
    }

    // 2. Calcular delays reducidos para API
    let delayLectura = 0;
    let delayTyping = 0;

    if (CONFIG_API_PROTECCIONES.habilitarDelays) {
        delayLectura = CONFIG_API_PROTECCIONES.delayMinimo +
                       Math.random() * (CONFIG_API_PROTECCIONES.delayMaximo - CONFIG_API_PROTECCIONES.delayMinimo);

        if (CONFIG_API_PROTECCIONES.habilitarTyping) {
            const longitudMensaje = typeof contenido === 'string' ? contenido.length : 50;
            delayTyping = CONFIG_API_PROTECCIONES.typingReducido
                ? Math.min(1000, longitudMensaje * 20) // Typing reducido: 20ms por carácter, max 1s
                : obtenerDelayTyping(longitudMensaje);
        }
    }

    // 3. Delay inicial (lectura simulada)
    if (delayLectura > 0) {
        console.log(`⏳ [API] Delay lectura: ${Math.floor(delayLectura)}ms`);
        await new Promise(resolve => setTimeout(resolve, delayLectura));
    }

    // 4. Simular typing si está habilitado
    if (delayTyping > 0 && CONFIG_API_PROTECCIONES.habilitarTyping) {
        console.log(`✍️ [API] Simulando typing: ${Math.floor(delayTyping)}ms`);
        await simularTyping(chatId, delayTyping);
    }

    // 5. Enviar mensaje
    const resultado = await enviarMensaje(chatId, contenido, rutaImagen, true);

    // 6. Registrar para rate limiting
    if (resultado && CONFIG_API_PROTECCIONES.habilitarRateLimiting) {
        registrarMensajeEnviado(chatId);
    }

    return resultado;
}

// ===== NUEVA FUNCIÓN: Enviar mensaje con protecciones anti-bot =====
async function enviarMensajeSeguro(chatId, contenido, rutaImagen = null, esAPIExterna = false, saltarProtecciones = false) {
    // Si es de API externa o se solicita saltar protecciones, usar función original
    if (esAPIExterna || saltarProtecciones) {
        return await enviarMensaje(chatId, contenido, rutaImagen, esAPIExterna);
    }

    console.log(`🛡️ [MENSAJE SEGURO] Iniciando envío protegido a ${chatId}`);

    // 0. Delay inicial para primera respuesta del usuario (simula que el bot recién se conectó)
    if (!primeraRespuestaPorUsuario.has(chatId)) {
        const tiempoDesdeInicio = Date.now() - tiempoInicioBot;

        // Si el bot acaba de iniciar (menos de 5 minutos), agregar delay adicional
        if (tiempoDesdeInicio < 5 * 60 * 1000) {
            const delayInicial = 30000 + Math.random() * 30000; // 30-60 segundos
            console.log(`⏳ [SESIÓN NUEVA] Primera respuesta a ${chatId}, esperando ${Math.floor(delayInicial/1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delayInicial));
        }

        primeraRespuestaPorUsuario.set(chatId, Date.now());
    }

    // 1. Verificar rate limiting
    if (!verificarRateLimiting(chatId)) {
        console.log(`🚫 [RATE LIMIT] Mensaje bloqueado por límite de velocidad`);
        // Esperar un tiempo aleatorio antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));

        // Verificar nuevamente
        if (!verificarRateLimiting(chatId)) {
            console.log(`🚫 [RATE LIMIT] Mensaje descartado después de espera`);
            return false;
        }
    }

    // 2. Calcular delays
    const longitudMensaje = typeof contenido === 'string' ? contenido.length : 50;
    const delayTyping = obtenerDelayTyping(longitudMensaje);
    const delayEntremensaje = obtenerDelayAleatorio(longitudMensaje);

    // 3. Delay inicial aleatorio (simula tiempo de lectura del mensaje del usuario)
    const delayLectura = 1000 + Math.random() * 2000;
    console.log(`⏳ [HUMANIZACIÓN] Esperando ${Math.floor(delayLectura)}ms (lectura)...`);
    await new Promise(resolve => setTimeout(resolve, delayLectura));

    // 4. Simular indicador "escribiendo..."
    console.log(`✍️ [HUMANIZACIÓN] Simulando typing por ${Math.floor(delayTyping)}ms...`);
    await simularTyping(chatId, delayTyping);

    // 5. Enviar el mensaje
    const resultado = await enviarMensaje(chatId, contenido, rutaImagen, esAPIExterna);

    if (resultado) {
        // 6. Registrar envío para rate limiting
        registrarMensajeEnviado(chatId);

        // 7. Delay después del envío (simula pausa entre mensajes)
        console.log(`⏳ [HUMANIZACIÓN] Esperando ${Math.floor(delayEntremensaje)}ms antes del próximo mensaje...`);
        await new Promise(resolve => setTimeout(resolve, delayEntremensaje));
    }

    return resultado;
}

async function enviarMensaje(chatId, contenido, rutaImagen = null, esAPIExterna = false) {
    console.log(`📤 [ENVIAR MENSAJE] Enviando a ${chatId}: "${typeof contenido === 'string' ? contenido.substring(0, 50) : '[Media]'}"`);
    console.log(`🔍 [ENVIAR MENSAJE] Stack trace:`, new Error().stack.split('\n')[2]?.trim());

    if (!whatsappListo) {
        console.log(`❌ [ENVIAR MENSAJE] WhatsApp no está listo para ${chatId}`);
        registrarLog(`No se envío mensaje a ${chatId} porque WhatsApp no está listo.`);
        return false;
    }

    try {
        if (typeof contenido === 'string') {
            await client.sendMessage(chatId, contenido);
            
            // Si es de API externa, agregarlo al caché para filtrar cuando regrese
            if (esAPIExterna) {
                agregarMensajeAPICache(chatId, contenido);
            } else {
                // Solo actualizar chat activo si NO es de API externa
                actualizarChatActivo(chatId, {
                    body: contenido,
                    fromMe: true
                });
            }
        } else {
            // Es un MessageMedia
            await client.sendMessage(chatId, contenido);
            
            // Actualizar chat activo con media enviado
            let bodyContent = '[Media]';
            
            // Si tenemos la ruta del archivo, generar HTML apropiado
            if (rutaImagen) {
                // Convertir ruta relativa a URL web
                const webPath = rutaImagen.replace('./images/', '/images/')
                                         .replace('./imagenes/', '/imagenes/')
                                         .replace('./uploads/', '/uploads/');
                
                // Detectar tipo de archivo y generar HTML apropiado
                if (rutaImagen.includes('.jpg') || rutaImagen.includes('.jpeg') || rutaImagen.includes('.png') || rutaImagen.includes('.gif')) {
                    // Es una imagen
                    bodyContent = `<img src="${webPath}" alt="Imagen enviada" style="max-width: 200px; border-radius: 8px;">`;
                } else if (rutaImagen.includes('.ogg') || rutaImagen.includes('.webm') || rutaImagen.includes('.mp3') || rutaImagen.includes('.m4a') || rutaImagen.includes('.wav')) {
                    // Es un archivo de audio
                    const fileName = rutaImagen.split('/').pop();
                    bodyContent = `<div class="audio-message-container"><div class="audio-message-header"><i class="fas fa-microphone" style="color: #0084ff;"></i><span>Audio enviado</span></div><audio controls preload="metadata" class="sent-audio-player"><source src="${webPath}" type="audio/${rutaImagen.includes('.ogg') ? 'ogg' : rutaImagen.includes('.webm') ? 'webm' : rutaImagen.includes('.mp3') ? 'mpeg' : rutaImagen.includes('.m4a') ? 'mp4' : 'wav'}"><p>Tu navegador no soporta la reproducción de audio. <a href="${webPath}" download="${fileName}">Descargar audio</a></p></audio></div>`;
                } else {
                    // Otros tipos de archivos
                    const fileName = rutaImagen.split('/').pop();
                    bodyContent = `<a href="${webPath}" download="${fileName}">📁 ${fileName}</a>`;
                }
            }
            
            // Si es de API externa, agregarlo al caché con identificador especial
            if (esAPIExterna && rutaImagen) {
                const mediaIdentifier = `[MEDIA:${rutaImagen.split('/').pop()}]`;
                agregarMensajeAPICache(chatId, mediaIdentifier);
            } else if (!esAPIExterna) {
                // Solo actualizar chat activo si NO es de API externa
                actualizarChatActivo(chatId, {
                    body: bodyContent,
                    fromMe: true,
                    isMedia: true
                });
            }
        }
        console.log(`✅ [ENVIAR MENSAJE] Mensaje enviado exitosamente a ${chatId}`);
        return true;
    } catch (err) {
        console.error(`❌ [ENVIAR MENSAJE] Error enviando mensaje a ${chatId}: ${err.message}`);
        registrarLog(`Error enviando mensaje a ${chatId}: ${err.message}`);

        // Si es un error específico de WhatsApp Web, intentar reiniciar la sesión
        if (err.message.includes('Evaluation failed') || err.message.includes('Protocol error')) {
            console.log(`🔄 [REINICIO] Error de WhatsApp Web detectado. Intentando solución alternativa...`);
            registrarLog(`Error de WhatsApp Web detectado: ${err.message}`);

            // En lugar de reiniciar todo WhatsApp, intentar una solución más específica
            // para archivos multimedia: marcar como error pero no reiniciar toda la sesión

                            if (rutaImagen && (rutaImagen.includes('audio') || rutaImagen.includes('m4a') || rutaImagen.includes('wav') || rutaImagen.includes('grabado'))) {
                    console.log(`🎵 [AUDIO] Error específico con archivo de audio: ${err.message}`);
                    console.log(`🎵 [AUDIO] WhatsApp Web tiene restricciones temporales para archivos multimedia`);

                    // Marcar globalmente que hay un error de WhatsApp Web con audio
                    if (!global.lastAudioError) {
                        global.lastAudioError = {};
                    }
                    global.lastAudioError.isWhatsAppError = true;
                    global.lastAudioError.errorMessage = err.message;
                    global.lastAudioError.timestamp = new Date().toISOString();

                    // Para archivos de audio, intentar enviar como mensaje de texto alternativo
                    console.log(`🎵 [AUDIO] Intentando enviar mensaje alternativo sobre el audio...`);

                    try {
                        // Intentar extraer chatId de diferentes formas
                        let chatId = null;

                        // Intentar del stack trace si está disponible
                        if (err.stack) {
                            const chatMatch = err.stack.match(/573\d+@c\.us/);
                            if (chatMatch) {
                                chatId = chatMatch[0];
                            }
                        }

                        // Si no se pudo extraer, al menos registrar el error sin chat específico
                        if (!chatId) {
                            console.log(`🎵 [AUDIO] No se pudo determinar el chatId para mensaje alternativo`);
                            console.log(`🎵 [AUDIO] Error registrado en logs para análisis`);
                            registrarLog(`Error de audio sin chat específico - WhatsApp Web restricciones: ${err.message}`);
                            return false;
                        }

                        const mensajeAlternativo = `🎵 No se pudo enviar el audio grabado. Esto puede deberse a restricciones temporales de WhatsApp Web.\n\n💡 Sugerencias:\n• Espera 5-10 minutos e intenta nuevamente\n• Graba un audio más corto (menos de 30 segundos)\n• Verifica tu conexión a internet\n\nSi el problema persiste, intenta enviar un mensaje de texto en su lugar.`;

                        // Intentar enviar el mensaje alternativo
                        const success = await enviarMensaje(chatId, mensajeAlternativo);
                        if (success) {
                            console.log(`✅ [AUDIO] Mensaje alternativo enviado exitosamente a ${chatId}`);
                            registrarLog(`Mensaje alternativo sobre audio fallido enviado a ${chatId}`);
                        } else {
                            console.log(`❌ [AUDIO] No se pudo enviar mensaje alternativo a ${chatId}`);
                        }
                    } catch (altError) {
                        console.log(`❌ [AUDIO] Error enviando mensaje alternativo: ${altError.message}`);
                        registrarLog(`Error enviando mensaje alternativo sobre audio fallido: ${altError.message}`);
                    }

                    registrarLog(`Error con archivo de audio - WhatsApp Web restricciones: ${err.message}`);

                    // No marcar como no listo para no afectar otros mensajes
                    return false;
                }

            // Para otros tipos de archivos, intentar reinicio
            console.log(`🔄 [REINICIO] Error con archivo no-audio. Procediendo con reinicio...`);
            registrarLog(`Reinicio automático por error de WhatsApp Web: ${err.message}`);

            // Marcar como no listo para forzar reinicio
            whatsappListo = false;
            whatsappEstabilizado = false;
            ultimoReinicio = Date.now();

            // Reiniciar cliente después de una pausa
            setTimeout(() => {
                console.log(`🔄 [REINICIO] Ejecutando reinicio del cliente...`);
                if (client) {
                    client.destroy().catch(err => {
                        console.log(`🔄 [REINICIO] Error cerrando cliente anterior: ${err.message}`);
                    });
                }

                setTimeout(() => {
                    borrarSesion();
                    clienteIniciando = false;
                    iniciarCliente();
                }, 3000);
            }, 2000);
        }

        return false;
    }
}

// ===== VARIACIONES DE MENÚS =====
const variacionesMenuPrincipal = [
    {
        emoji: '📋',
        opciones: [
            '1️⃣ Usuarios registrados (*reporte de daño, pagos e intermitencias*)',
            '2️⃣ Adquirir un nuevo servicio (*nuevos usuarios*)',
            '3️⃣ Reactivación de servicio suspendido o retirado',
            '4️⃣ Soy cliente activo y chatbot no reconoce mi cédula',
            '#️⃣ Volver al menú principal'
        ]
    },
    {
        emoji: '📱',
        opciones: [
            '1. Clientes existentes (reportes, pagos, intermitencias)',
            '2. Contratar servicio nuevo (clientes nuevos)',
            '3. Reactivar servicio previo',
            '4. Cliente activo con problema de cédula',
            '#. Regresar al menú'
        ]
    },
    {
        emoji: '🏢',
        opciones: [
            '1) Ya soy cliente (reportar, pagar, consultar)',
            '2) Quiero contratar servicio (nuevos)',
            '3) Reactivar mi servicio',
            '4) Problema reconociendo mi cédula',
            '#) Volver al inicio'
        ]
    },
    {
        emoji: '📞',
        opciones: [
            '[1] Usuario registrado - reportes, pagos, intermitencias',
            '[2] Nuevo cliente - adquirir servicio',
            '[3] Reactivación de servicio',
            '[4] Cliente activo - error con cédula',
            '[#] Menú principal'
        ]
    }
];

async function mostrarMenuPrincipal(chatId) {
    const estado = obtenerEstadoUsuario(chatId);
    const ahora = Date.now();
    const TIEMPO_MIN_ENTRE_MENUS = 10000; // 10 segundos mínimo entre menús consecutivos

    // Verificar si ya se envió recientemente el menú
    if (estado.ultimoMenuEnviado && (ahora - estado.ultimoMenuEnviado) < TIEMPO_MIN_ENTRE_MENUS) {
        registrarLog(`Evitando envío duplicado de menú para ${chatId}`);
        return;
    }

    const mensaje = mensajesBienvenida[Math.floor(Math.random() * mensajesBienvenida.length)];

    // Seleccionar variación aleatoria del menú
    const variacion = variacionesMenuPrincipal[Math.floor(Math.random() * variacionesMenuPrincipal.length)];

    const menuTexto = `${variacion.emoji} *MENÚ PRINCIPAL*\n*Recuerda completar el proceso para que tu solicitud sea atendida*\n\n*Elige el número que corresponda a tu solicitud:*\n\n${variacion.opciones.join('\n')}`;

    await enviarMensajeSeguro(chatId, mensaje);
    await enviarMensajeSeguro(chatId, menuTexto);

    actualizarEstadoUsuario(chatId, {
        ultimaInteraccion: ahora,
        erroresConsecutivos: 0,
        ultimoMenuEnviado: ahora
    });
}

// ===== Limpieza periódica de memoria =====
setInterval(() => {
    const ahora = Date.now();
    const TIEMPO_LIMPIEZA = 2 * 60 * 60 * 1000; // 2 horas
    
    for (const [chatId, estado] of estadosUsuario.entries()) {
        if (ahora - estado.ultimaInteraccion > TIEMPO_LIMPIEZA) {
            if (estado.enEsperaHumano?.temporizador) {
                clearTimeout(estado.enEsperaHumano.temporizador);
            }
            estadosUsuario.delete(chatId);
            registrarLog(`Limpieza: Estado de usuario ${chatId} eliminado por inactividad`);
        }
    }
}, 30 * 60 * 1000); // Ejecutar cada 30 minutos

// ===== API Endpoints =====

// ===== ENDPOINTS DE AUTENTICACIÓN =====

// Endpoint para login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        const usuario = await buscarUsuario(username, password);

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const token = await crearToken(usuario.id, usuario);

        if (!token) {
            return res.status(500).json({
                success: false,
                message: 'Error creando token'
            });
        }

        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: usuario.id,
                username: usuario.username,
                nombre: usuario.nombre,
                rol: usuario.rol
            },
            token: token
        });
    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para verificar sesión
app.get('/api/session', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') ||
                     req.query.token ||
                     req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const usuario = await verificarToken(token);

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        res.json({
            success: true,
            user: {
                id: usuario.usuario_id,
                username: usuario.username,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error('Error verificando sesión:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para logout
app.post('/api/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') ||
                     req.body.token ||
                     req.cookies?.token;

        if (token) {
            await cerrarSesion(token);
        }

        res.json({
            success: true,
            message: 'Token invalidado correctamente'
        });
    } catch (error) {
        console.error('Error en logout:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== MIDDLEWARES DE AUTENTICACIÓN =====

// Middleware para verificar autenticación
const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') ||
                     req.query.token ||
                     req.cookies?.token ||
                     req.headers.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token requerido'
            });
        }

        // Primero intentar verificar como token eterno
        let usuario = await verificarTokenEterno(token);

        // Si no es token eterno, intentar verificar como token normal
        if (!usuario) {
            usuario = await verificarToken(token);
        }

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        req.user = usuario;
        next();
    } catch (error) {
        console.error('Error en autenticación:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Middleware para verificar rol de administrador
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') ||
                     req.query.token ||
                     req.cookies?.token ||
                     req.headers.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token requerido'
            });
        }

        const usuario = await verificarToken(token);

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        if (usuario.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Se requiere rol de administrador'
            });
        }

        req.user = usuario;
        next();
    } catch (error) {
        console.error('Error en verificación de admin:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Endpoint para validar conexión de base de datos
app.get('/api/validate-db-connection', requireAuth, async (req, res) => {
    try {
        // Validar conexión al sistema de autenticación
        const authResult = await validarConexionBD({
            host: process.env.DB_SYSTEM_HOST || 'localhost',
            user: process.env.DB_SYSTEM_USER || 'root',
            password: process.env.DB_SYSTEM_PASSWORD || '',
            database: 'solucnet_auth_system'
        });

        // Validar conexiones a las bases de datos principales
        const basesDatos = [
            { host: '19.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', name: 'BD 1' },
            { host: '19.168.99.11', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', name: 'BD 2' },
            { host: '19.168.99.2', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', name: 'BD 3' },
            { host: '19.168.99.51', user: 'ADFZ2I', password: 'MOZ1BWZ86BRMXFW', database: 'Mikrowisp6', name: 'BD 4' }
        ];

        const resultadosBD = [];
        
        for (const bd of basesDatos) {
            const resultado = await validarConexionBD({
                host: bd.host,
                user: bd.user,
                password: bd.password,
                database: bd.database
            });
            
            resultadosBD.push({
                name: bd.name,
                host: bd.host,
                database: bd.database,
                status: resultado.success ? 'conectado' : 'error',
                message: resultado.message
            });
        }

        res.json({
            success: true,
            connections: {
                auth_system: {
                    name: 'Sistema de Autenticación',
                    status: authResult.success ? 'conectado' : 'error',
                    message: authResult.message
                },
                databases: resultadosBD
            }
        });
    } catch (error) {
        console.error('Error validando conexiones:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ENDPOINTS PARA NÚMEROS OMITIDOS =====

// Endpoint para obtener números omitidos
app.get('/api/omitted-numbers', requireAuth, async (req, res) => {
    try {
        const result = await obtenerNumerosOmitidos();
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo números omitidos:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para agregar número omitido
app.post('/api/omitted-numbers', requireAuth, async (req, res) => {
    try {
        const { numero, motivo } = req.body;
        const usuarioId = req.user.usuario_id;

        if (!numero) {
            return res.status(400).json({
                success: false,
                message: 'El número es requerido'
            });
        }

        const result = await agregarNumeroOmitido(numero, motivo, usuarioId);
        res.json(result);
    } catch (error) {
        console.error('Error agregando número omitido:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para eliminar número omitido
app.delete('/api/omitted-numbers/:id', requireAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await eliminarNumeroOmitido(id);
        res.json(result);
    } catch (error) {
        console.error('Error eliminando número omitido:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ENDPOINTS PARA GESTIÓN DE USUARIOS =====

// Endpoint de prueba para verificar que funciona
app.get('/api/users-test', (req, res) => {
    console.log('Endpoint de prueba /api/users-test llamado');
    res.json({
        success: true,
        message: 'Endpoint de usuarios funcionando',
        timestamp: new Date().toISOString()
    });
});

// Endpoint para obtener usuarios (solo admin)
app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        console.log('Endpoint /api/users llamado por usuario:', req.user); // Debug
        const result = await obtenerUsuarios();
        console.log('Resultado obtenerUsuarios:', result); // Debug
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error.message);
        console.error('Stack:', error.stack); // Debug
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para crear usuario (solo admin)
app.post('/api/users', requireAdmin, async (req, res) => {
    try {
        const { username, password, nombre, rol } = req.body;
        const usuarioId = req.user.usuario_id;

        if (!username || !password || !nombre || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar rol
        if (!['admin', 'soporte'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        const result = await crearUsuario(username, password, nombre, rol);
        res.json(result);
    } catch (error) {
        console.error('Error creando usuario:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para eliminar usuario (solo admin)
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        
        // No permitir que se elimine a sí mismo
        if (parseInt(id) === req.user.usuario_id) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propio usuario'
            });
        }

        const result = await eliminarUsuario(id);
        res.json(result);
    } catch (error) {
        console.error('Error eliminando usuario:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para actualizar usuario (solo admin)
app.put('/api/users/:id', requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const { username, password, nombre, rol, sessionId } = req.body;

        // Validar datos requeridos
        if (!username || !nombre || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Los campos username, nombre y rol son obligatorios'
            });
        }

        // Validar rol
        if (!['admin', 'soporte'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        // No permitir que un usuario se quite el rol de admin a sí mismo
        if (parseInt(id) === req.user.usuario_id && rol !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'No puedes quitarte el rol de administrador a ti mismo'
            });
        }

        // Preparar datos para actualizar
        const datosActualizar = {
            username,
            nombre,
            rol
        };

        // Solo incluir contraseña si se proporcionó
        if (password && password.trim()) {
            datosActualizar.password = password.trim();
        }

        const result = await actualizarUsuario(id, datosActualizar);
        res.json(result);
    } catch (error) {
        console.error('Error actualizando usuario:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===== ENDPOINTS PARA LOGS DE API =====

// Endpoint para obtener logs de API
app.get('/api/logs-api', requireAuth, async (req, res) => {
    try {
        const limite = parseInt(req.query.limit) || 100;
        const result = await obtenerLogsAPI(limite);
        res.json(result);
    } catch (error) {
        console.error('Error obteniendo logs API:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para limpiar logs antiguos (solo admin)
app.post('/api/logs-api/cleanup', requireAdmin, async (req, res) => {
    try {
        const dias = parseInt(req.body.dias) || 30;
        const result = await limpiarLogsAPI(dias);
        res.json(result);
    } catch (error) {
        console.error('Error limpiando logs API:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint GET con query params (requiere autenticación)
// Función para normalizar números y agregar prefijo 57 si es necesario
function normalizarNumero(numero) {
    if (!numero) return null;

    // Remover espacios y caracteres especiales
    let numeroLimpio = numero.replace(/\s+/g, '').replace(/[^\d]/g, '');

    // Si el número no tiene el prefijo 57, agregarlo
    if (!numeroLimpio.startsWith('57')) {
        numeroLimpio = '57' + numeroLimpio;
    }

    return numeroLimpio;
}

// Endpoint de prueba para verificar API sin WhatsApp
app.get('/api/test', requireAuth, async (req, res) => {
    try {
        const numero = req.query.numero;
        const mensaje = req.query.mensaje || '';

        console.log('🧪 [API TEST] Solicitud recibida:', {
            numero: numero,
            mensaje: mensaje,
            user: req.user?.username || 'unknown'
        });

        return res.json({
            status: 'API funcionando correctamente',
            message: 'Este es un endpoint de prueba sin WhatsApp',
            data: {
                numero: numero,
                mensaje: mensaje,
                user: req.user?.username || 'unknown',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ [API TEST ERROR]:', error.message);
        return res.status(500).json({
            error: 'Error en endpoint de prueba',
            details: error.message
        });
    }
});

app.get('/api/enviar', requireAuth, async (req, res) => {
    try {
        let numero = req.query.numero;
        const mensaje = req.query.mensaje || '';
        const ipOrigen = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

        if (!numero) {
            // Registrar intento fallido por falta de número
            await registrarLogAPI(ipOrigen, 'N/A', mensaje, 'error_parametros');
            return res.status(400).json({ error: 'Falta el parametro numero' });
        }

        // Normalizar el número agregando prefijo 57 si es necesario
        const numeroOriginal = numero;
        numero = normalizarNumero(numero);

        console.log(`📱 [API ENVIAR] Número original: ${numeroOriginal} → Normalizado: ${numero}`);

        if (!whatsappListo) {
            // Modo de prueba: responder como si el mensaje se enviara
            console.log(`⚠️ [API ENVIAR] WhatsApp no listo - Modo simulación activado`);
            console.log(`📱 Número: ${numeroOriginal} → ${numero}`);
            console.log(`💬 Mensaje: ${mensaje}`);

            // Registrar como si se enviara
            await registrarLogAPI(ipOrigen, numero, mensaje, 'simulado_whatsapp_no_listo');

            return res.json({
                status: 'Mensaje simulado (WhatsApp no conectado)',
                numeroOriginal: numeroOriginal,
                numeroNormalizado: numero,
                mensaje: mensaje,
                nota: 'WhatsApp no está listo. Mensaje simulado para pruebas.',
                timestamp: new Date().toISOString()
            });
        }

        const chatId = `${numero}@c.us`;
        const exito = await enviarMensajeAPIConProteccion(chatId, mensaje, null);

        if (exito) {
            // Registrar envío exitoso
            await registrarLogAPI(ipOrigen, numero, mensaje, 'enviado');
            return res.json({
                status: 'Mensaje enviado',
                numeroOriginal: numeroOriginal,
                numeroNormalizado: numero,
                mensaje
            });
        } else {
            // Registrar envío fallido
            await registrarLogAPI(ipOrigen, numero, mensaje, 'error_envio');
            return res.status(500).json({ error: 'Error enviando mensaje' });
        }
    } catch (err) {
        const ipOrigen = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        let numero = req.query.numero || 'N/A';
        const mensaje = req.query.mensaje || '';

        // Normalizar el número para los logs de error también
        const numeroOriginal = numero;
        if (numero !== 'N/A') {
            numero = normalizarNumero(numero);
        }

        // Registrar error de excepción
        await registrarLogAPI(ipOrigen, numero, mensaje, 'error_excepcion');

        console.error(`❌ [API ENVIAR ERROR] Número original: ${numeroOriginal} → Normalizado: ${numero}`, err);
        return res.status(500).json({
            error: 'Error enviando mensaje',
            numeroOriginal: numeroOriginal,
            numeroNormalizado: numero,
            details: err.message
        });
    }
});

// Función para reintentar archivos de audio fallidos
async function retryFailedAudioFile(fileInfo) {
    try {
        if (fileInfo.retryCount >= fileInfo.maxRetries) {
            console.log(`❌ Máximo de reintentos alcanzado para: ${fileInfo.originalName}`);
            return;
        }

        console.log(`🔄 Intentando reenviar archivo de audio: ${fileInfo.originalName} (intento ${fileInfo.retryCount + 1}/${fileInfo.maxRetries})`);

        // Verificar que el archivo aún existe
        if (!fs.existsSync(fileInfo.path)) {
            console.log(`❌ Archivo ya no existe: ${fileInfo.path}`);
            return;
        }

        // Verificar que WhatsApp esté listo
        if (!whatsappListo || !whatsappEstabilizado) {
            console.log(`⏳ WhatsApp no está listo para reintento. Reintentando en 1 minuto...`);
            setTimeout(() => retryFailedAudioFile(fileInfo), 60 * 1000);
            return;
        }

        // Crear media y enviar
        const media = MessageMedia.fromFilePath(fileInfo.path);
        const success = await enviarMensaje(fileInfo.chatId, media, fileInfo.path, true);

        if (success) {
            console.log(`✅ Archivo reenviado exitosamente: ${fileInfo.originalName}`);

            // Enviar mensaje de confirmación
            const confirmMessage = `✅ Audio reenviado exitosamente: ${fileInfo.originalName}\n\n📅 Reenviado desde cola de archivos fallidos.`;
            await enviarMensaje(fileInfo.chatId, confirmMessage);

            // Limpiar archivo temporal
            try {
                fs.unlinkSync(fileInfo.path);
                console.log(`🗑️ Archivo temporal eliminado: ${fileInfo.path}`);
            } catch (error) {
                console.log(`⚠️ Error eliminando archivo temporal: ${error.message}`);
            }

            // Remover de la cola
            if (global.failedAudioFiles) {
                global.failedAudioFiles = global.failedAudioFiles.filter(f => f.path !== fileInfo.path);
            }

        } else {
            fileInfo.retryCount++;
            console.log(`❌ Reintento fallido ${fileInfo.retryCount}/${fileInfo.maxRetries} para: ${fileInfo.originalName}`);

            if (fileInfo.retryCount < fileInfo.maxRetries) {
                // Programar siguiente reintento con delay progresivo
                const delayMinutes = 2 * (fileInfo.retryCount + 1); // 2, 4, 6 minutos
                setTimeout(() => retryFailedAudioFile(fileInfo), delayMinutes * 60 * 1000);
            } else {
                console.log(`❌ Todos los reintentos fallaron para: ${fileInfo.originalName}`);
                // Enviar mensaje final de error
                const finalErrorMessage = `❌ No se pudo reenviar el audio después de ${fileInfo.maxRetries} intentos: ${fileInfo.originalName}\n\n💡 Recomendaciones:\n• Grabe un audio más corto\n• Espere más tiempo entre grabaciones\n• Verifique su conexión a internet`;
                await enviarMensaje(fileInfo.chatId, finalErrorMessage);
            }
        }

    } catch (error) {
        console.error(`💥 Error en reintento de archivo: ${error.message}`);
        fileInfo.retryCount++;

        if (fileInfo.retryCount < fileInfo.maxRetries) {
            setTimeout(() => retryFailedAudioFile(fileInfo), 2 * 60 * 1000);
        }
    }
}

// Endpoint para obtener estadísticas
// Endpoint de diagnóstico sin autenticación para debugging
app.get('/api/debug-status', async (req, res) => {
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        whatsapp: {
            listo: whatsappListo,
            estabilizado: whatsappEstabilizado,
            ultimoReinicio: ultimoReinicio
        },
        sistema: {
            usuariosActivos: estadosUsuario.size,
            clienteIniciando: clienteIniciando,
            qrActual: global.currentQR ? 'PRESENTE' : null,
            failedAudioFiles: global.failedAudioFiles ? global.failedAudioFiles.length : 0
        },
        request: {
            headers: {
                authorization: req.headers.authorization ? 'PRESENTE' : 'FALTANTE',
                'content-type': req.headers['content-type'] || 'No especificado'
            },
            ip: req.ip,
            userAgent: req.headers['user-agent']
        }
    });
});

// Endpoint para ver archivos de audio fallidos
app.get('/api/failed-audio-files', requireAuth, (req, res) => {
    const failedFiles = global.failedAudioFiles || [];

    res.json({
        success: true,
        failedFilesCount: failedFiles.length,
        failedFiles: failedFiles.map(file => ({
            originalName: file.originalName,
            size: file.size,
            chatId: file.chatId,
            retryCount: file.retryCount,
            maxRetries: file.maxRetries,
            timestamp: file.timestamp,
            nextRetryIn: file.retryCount < file.maxRetries ? `${2 * (file.retryCount + 1)} minutos` : 'Sin reintentos'
        })),
        timestamp: new Date().toISOString()
    });
});

// Endpoint para forzar reintento de archivo fallido
app.post('/api/retry-failed-audio/:filePath', requireAuth, async (req, res) => {
    try {
        const filePath = decodeURIComponent(req.params.filePath);

        if (!global.failedAudioFiles) {
            return res.status(404).json({
                success: false,
                error: 'No hay archivos fallidos en cola'
            });
        }

        const fileInfo = global.failedAudioFiles.find(f => f.path === filePath);

        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado en cola de fallidos'
            });
        }

        if (fileInfo.retryCount >= fileInfo.maxRetries) {
            return res.status(400).json({
                success: false,
                error: 'Máximo de reintentos alcanzado'
            });
        }

        // Forzar reintento inmediato
        fileInfo.retryCount = 0; // Reset retry count
        await retryFailedAudioFile(fileInfo);

        res.json({
            success: true,
            message: `Reintento forzado para: ${fileInfo.originalName}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error forzando reintento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/stats', (req, res) => {
    const stats = {
        usuariosActivos: estadosUsuario.size,
        whatsappListo,
        whatsappEstabilizado,
        timestamp: new Date().toISOString()
    };
    res.json(stats);
});

// Endpoint para obtener QR actual
app.get('/api/qr', (req, res) => {
    if (global.currentQR) {
        res.json({
            qr: global.currentQR,
            hasQR: true,
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({
            hasQR: false,
            message: 'No hay QR disponible',
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para obtener la imagen del QR
app.get('/api/qr-image', async (req, res) => {
    try {
        if (!global.currentQR) {
            return res.status(404).json({
                error: 'No hay QR disponible',
                message: 'Primero debe generarse un QR desde la consola'
            });
        }

        // Generar imagen QR como buffer
        const qrBuffer = await QRCode.toBuffer(global.currentQR, {
            type: 'png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Enviar imagen como respuesta con headers agresivos anti-cache
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="whatsapp-qr.png"');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Last-Modified', new Date().toUTCString());
        res.setHeader('ETag', `"${Date.now()}-${Math.random().toString(36).substring(7)}"`);
        res.send(qrBuffer);

    } catch (error) {
        console.error('Error generando imagen QR:', error);
        res.status(500).json({
            error: 'Error generando imagen QR',
            details: error.message
        });
    }
});

// Endpoint para forzar actualización de la imagen QR (cache buster agresivo)
app.get('/api/qr-image/force', async (req, res) => {
    try {
        if (!global.currentQR) {
            return res.status(404).json({
                error: 'No hay QR disponible para actualizar',
                message: 'Primero debe generarse un QR desde la consola'
            });
        }

        console.log('🔄 Forzando actualización de imagen QR con cache buster máximo');

        // Generar imagen QR con cache buster extremo
        const qrBuffer = await QRCode.toBuffer(global.currentQR, {
            type: 'png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Headers ultra-agresivos anti-cache
        const now = new Date();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="whatsapp-qr.png"');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate, s-maxage=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Last-Modified', now.toUTCString());
        res.setHeader('ETag', `"force-${Date.now()}-${Math.random().toString(36).substring(7)}"`);
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-QR-Force-Refresh', 'true');

        console.log('✅ Imagen QR forzada enviada con headers anti-cache extremos');
        res.send(qrBuffer);

    } catch (error) {
        console.error('Error en actualización forzada de QR:', error);
        res.status(500).json({
            error: 'Error actualizando imagen QR',
            details: error.message
        });
    }
});

// Endpoint para forzar regeneración del QR
app.post('/api/qr/refresh', async (req, res) => {
    try {
        if (!clienteIniciando && client) {
            registrarLog('🔄 Forzando regeneración del QR - reiniciando cliente...');
            
            // Limpiar QR actual
            global.currentQR = null;
            whatsappListo = false;
            
            // Reiniciar cliente
            setTimeout(async () => {
                try {
                    await client.destroy();
                } catch (err) {
                    registrarLog(`Error cerrando cliente para regenerar QR: ${err.message}`);
                }
                borrarSesion();
                setTimeout(iniciarCliente, 2000);
            }, 1000);
            
            res.json({
                success: true,
                message: 'Regeneración de QR iniciada',
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: false,
                message: 'Cliente ya está iniciando o no existe',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        registrarLog(`Error forzando regeneración QR: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para obtener lista de chats
app.get('/api/chats', (req, res) => {
    try {
        const chats = Array.from(chatsActivos.values()).map(chat => ({
            id: chat.id,
            phone: chat.phone,
            name: chat.name,
            mode: chat.mode,
            lastActivity: chat.lastActivity,
            lastMessage: chat.lastMessage,
            unreadCount: chat.unreadCount || 0
        }));
        
        // Ordenar por actividad más reciente
        chats.sort((a, b) => b.lastActivity - a.lastActivity);
        
        res.json({
            success: true,
            chats: chats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo chats',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para obtener mensajes de un chat específico
app.get('/api/chats/:chatId/messages', (req, res) => {
    try {
        const chatId = req.params.chatId;
        const messages = mensajesChat.get(chatId) || [];

        console.log(`📋 [API MESSAGES] Solicitando mensajes para ${chatId}: ${messages.length} mensajes encontrados`);

        // Log de los mensajes para debugging
        messages.slice(-5).forEach((msg, index) => {
            console.log(`   ${index + 1}. [${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.fromMe ? 'OUT' : 'IN'}: "${msg.body.substring(0, 30)}"`);
        });

        res.json({
            success: true,
            messages: messages,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error obteniendo mensajes',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para enviar mensaje a un chat (requiere autenticación)
app.post('/api/send-message', requireAuth, async (req, res) => {
    try {
        const { chatId, message } = req.body;
        
        if (!chatId || !message) {
            return res.status(400).json({
                success: false,
                message: 'chatId y message son requeridos'
            });
        }
        
        if (!whatsappListo) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp no está conectado'
            });
        }
        
        const exito = await enviarMensajeAPIConProteccion(chatId, message, null);

        if (exito) {
            res.json({
                success: true,
                message: 'Mensaje enviado correctamente',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error enviando mensaje'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error procesando solicitud',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para enviar audio (requiere autenticación)
app.post('/api/send-audio', requireAuth, multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo para audio
    fileFilter: (req, file, cb) => {
        // Aceptar archivos de audio y WebM
        if (file.mimetype.startsWith('audio/') || file.mimetype.includes('webm')) {
            console.log('✅ Archivo aceptado:', file.mimetype);
            cb(null, true);
        } else {
            console.error('❌ Archivo rechazado:', file.mimetype);
            cb(new Error(`Solo se permiten archivos de audio. Recibido: ${file.mimetype}`));
        }
    }
}).single('audio'), (req, res, next) => {
    // Handler de errores de multer
    if (req.multerError) {
        console.error('❌ Error de multer:', req.multerError);
        return res.status(400).json({
            success: false,
            message: `Error de multer: ${req.multerError.message}`
        });
    }
    next();
}, async (req, res) => {
    try {
        console.log('📥 Solicitud POST /api/send-audio recibida');
        console.log('📊 Headers:', {
            'content-type': req.headers['content-type']?.substring(0, 50),
            'content-length': req.headers['content-length'],
            'user-agent': req.headers['user-agent']?.substring(0, 50),
            'authorization': req.headers['authorization'] ? 'PRESENTE' : 'AUSENTE'
        });
        
        console.log('🔍 Multer file processing result:', {
            fileReceived: !!req.file,
            bodyData: Object.keys(req.body)
        });

        const { chatId } = req.body;
        const audioFile = req.file;

        console.log('📋 Datos recibidos:', {
            chatId: chatId,
            audioFile: audioFile ? {
                filename: audioFile.filename,
                originalname: audioFile.originalname,
                mimetype: audioFile.mimetype,
                size: audioFile.size,
                path: audioFile.path
            } : 'null'
        });

        // Validaciones
        if (!chatId || !audioFile) {
            return res.status(400).json({
                success: false,
                message: 'chatId y archivo de audio son requeridos'
            });
        }

        if (!whatsappListo) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp no está conectado'
            });
        }

        // Crear MessageMedia desde el archivo de audio
        const { MessageMedia } = require('whatsapp-web.js');
        const fs = require('fs');

        // Convertir WebM a OGG para mejor compatibilidad con WhatsApp
        let finalAudioPath = audioFile.path;
        
        if (audioFile.mimetype.includes('webm')) {
            const path = require('path');
            const { execSync } = require('child_process');
            
            const oggPath = audioFile.path.replace(path.extname(audioFile.path), '.ogg');
            
            try {
                console.log('🔄 Convirtiendo WebM a OGG para compatibilidad WhatsApp...');
                
                // Usar FFmpeg para convertir WebM a OGG
                execSync(`ffmpeg -i "${audioFile.path}" -c:a libopus -b:a 64k "${oggPath}"`, {
                    timeout: 30000 // 30 segundos timeout
                });
                
                finalAudioPath = oggPath;
                console.log('✅ Audio convertido a OGG:', oggPath);
                
            } catch (conversionError) {
                console.warn('⚠️ Error convirtiendo audio, usando original:', conversionError.message);
                // Si falla la conversión, usar el archivo original
            }
        }
        
        console.log('🎵 Preparando archivo de audio:', {
            originalPath: audioFile.path,
            finalPath: finalAudioPath,
            mimetype: audioFile.mimetype
        });

        // Crear MessageMedia
        const media = MessageMedia.fromFilePath(finalAudioPath);
        
        // Enviar el audio
        console.log('📤 Enviando audio a:', chatId);
        const exito = await enviarMensajeAPIConProteccion(chatId, media, finalAudioPath);

        if (exito) {
            console.log('✅ Audio enviado exitosamente a:', chatId);
            
            // Conservar archivos de audio permanentemente
            console.log('💾 Archivos de audio conservados permanentemente:', {
                original: audioFile.path,
                final: finalAudioPath
            });

            res.json({
                success: true,
                message: 'Audio enviado correctamente',
                chatId: chatId,
                filename: audioFile.originalname,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error enviando audio'
            });
        }

    } catch (error) {
        console.error('❌ Error en /api/send-audio:', error);
        
        // Conservar archivos incluso en caso de error (para debugging)
        if (req.file && req.file.path) {
            console.log('💾 Archivo conservado incluso con error:', req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Error procesando audio',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para enviar archivos (requiere autenticación)
app.post('/api/send-files', requireAuth, multer({storage: storage, limits: {fileSize: 50 * 1024 * 1024, files: 10}}).array('files', 10), async (req, res) => {
    try {
        console.log('📥 Solicitud POST /api/send-files recibida');
        console.log('📊 Headers:', {
            authorization: req.headers.authorization ? 'Bearer token presente' : 'Sin token',
            'content-type': req.headers['content-type']
        });
        const { chatId, caption } = req.body;
        const files = req.files;
        
        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: 'Chat ID es requerido'
            });
        }
        
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se recibieron archivos'
            });
        }
        
        if (!whatsappListo) {
            console.log('⚠️ Solicitud rechazada: WhatsApp no está listo');
            console.log('📊 Estado actual:', { whatsappListo, whatsappEstabilizado });
            return res.status(503).json({
                success: false,
                error: 'WhatsApp no está conectado. Estado: whatsappListo=false',
                status: { whatsappListo, whatsappEstabilizado }
            });
        }

        if (!whatsappEstabilizado) {
            console.log('⚠️ Solicitud rechazada: WhatsApp se está estabilizando');
            console.log('📊 Estado actual:', { whatsappListo, whatsappEstabilizado });
            return res.status(503).json({
                success: false,
                error: 'WhatsApp se está estabilizando. Espere unos momentos e intente nuevamente.',
                isWhatsAppError: true,
                status: { whatsappListo, whatsappEstabilizado }
            });
        }
        
        registrarLog(`Enviando ${files.length} archivo(s) a ${chatId}`);
        
        let successCount = 0;
        let errors = [];
        
        // Enviar cada archivo
        for (const file of files) {
            try {
                const media = MessageMedia.fromFilePath(file.path);

                // Configurar nombre del archivo si es necesario
                if (file.originalname) {
                    media.filename = file.originalname;
                }

                // Log específico para archivos de audio
                if (file.originalname && (file.originalname.includes('.m4a') || file.originalname.includes('.wav') || file.originalname.includes('.ogg') || file.originalname.includes('grabado'))) {
                    console.log(`🎵 Procesando archivo de audio: ${file.originalname}`);
                    console.log(`🎵 Tamaño del archivo: ${file.size} bytes`);
                    console.log(`🎵 Tipo MIME: ${file.mimetype}`);
                    console.log(`🎵 Ruta del archivo: ${file.path}`);
                }

                // Log antes de enviar
                if (file.originalname && (file.originalname.includes('.m4a') || file.originalname.includes('.wav') || file.originalname.includes('.ogg') || file.originalname.includes('grabado'))) {
                    console.log(`🎵 Intentando enviar audio a ${chatId}...`);
                }

                const success = await enviarMensajeAPIConProteccion(chatId, media, file.path);

                // Log después de enviar
                if (file.originalname && (file.originalname.includes('.m4a') || file.originalname.includes('.wav') || file.originalname.includes('.ogg') || file.originalname.includes('grabado'))) {
                    console.log(`🎵 Resultado del envío: ${success ? '✅ Éxito' : '❌ Falló'}`);
                }
                
                if (success) {
                    successCount++;
                    registrarLog(`Archivo enviado: ${file.originalname}`);
                } else {
                    errors.push(`Error enviando ${file.originalname}`);
                }
                
                // Pequeña pausa entre archivos para evitar spam
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                let errorMessage = `Error enviando ${file.originalname}: ${error.message}`;
                registrarLog(errorMessage);

                // Manejo específico para archivos de audio
                const isAudioFile = file.originalname && (file.originalname.includes('.m4a') || file.originalname.includes('.wav') || file.originalname.includes('.ogg') || file.originalname.includes('.webm'));

                if (isAudioFile) {
                    console.log(`🎵 Error específico con archivo de audio: ${file.originalname}`);
                    console.log(`🎵 Detalles del error: ${error.message}`);
                    console.log(`🎵 Stack trace: ${error.stack}`);

                    // Almacenar archivo para reintento posterior
                    const fileInfo = {
                        originalName: file.originalname,
                        path: file.path,
                        size: file.size,
                        mimetype: file.mimetype,
                        chatId: chatId,
                        timestamp: new Date().toISOString(),
                        retryCount: 0,
                        maxRetries: 3
                    };

                    // Guardar en cola de archivos fallidos para reintento
                    if (!global.failedAudioFiles) {
                        global.failedAudioFiles = [];
                    }
                    global.failedAudioFiles.push(fileInfo);

                    console.log(`📝 Archivo de audio guardado para reintento posterior: ${file.originalname}`);

                    // Programar reintento automático después de 2 minutos
                    setTimeout(async () => {
                        await retryFailedAudioFile(fileInfo);
                    }, 2 * 60 * 1000); // 2 minutos

                    // Intentar enviar mensaje alternativo sobre el audio fallido
                    try {
                        const mensajeAlternativo = `🎵 No se pudo enviar el audio grabado (${file.originalname}).\n\n⚠️ WhatsApp Web está bloqueando temporalmente archivos de audio.\n\n💡 Opciones:\n• El sistema intentará reenviar automáticamente en 2 minutos\n• Grabe un audio más corto (15-30 segundos)\n• Espere 5-10 minutos y reintente manualmente\n• Use "debugFileUpload()" en la consola para más opciones\n\n📝 El archivo se guardó para reintento automático.`;

                        const successAlt = await enviarMensaje(chatId, mensajeAlternativo);
                        if (successAlt) {
                            console.log(`✅ Mensaje alternativo enviado para audio fallido: ${file.originalname}`);
                            registrarLog(`Mensaje alternativo enviado para audio fallido: ${file.originalname}`);
                        }
                    } catch (altError) {
                        console.log(`❌ Error enviando mensaje alternativo: ${altError.message}`);
                    }
                }

                // Mensajes de error más específicos para el usuario
                if (error.message.includes('Evaluation failed')) {
                    if (isAudioFile) {
                        errorMessage = `Error de WhatsApp Web con archivo de audio ${file.originalname}. Se envió un mensaje alternativo con sugerencias.`;
                    } else {
                        errorMessage = `Error de WhatsApp Web al enviar ${file.originalname}. La sesión se reiniciará automáticamente.`;
                    }
                } else if (error.message.includes('Protocol error')) {
                    errorMessage = `Problema de conexión con WhatsApp al enviar ${file.originalname}. Inténtelo nuevamente en unos momentos.`;
                } else if (error.message.includes('Session closed')) {
                    errorMessage = `Sesión de WhatsApp cerrada al enviar ${file.originalname}. Espere a que se reconecte.`;
                } else if (error.message.includes('Token') || error.message.includes('jwt') || error.message.includes('malformed')) {
                    errorMessage = `Error de autenticación al enviar ${file.originalname}. Por favor, vuelve a iniciar sesión.`;
                } else {
                    errorMessage = `Error interno del servidor al enviar ${file.originalname}: ${error.message}`;
                }

                errors.push(errorMessage);
            }
        }
        
        // Enviar caption como mensaje separado si existe
        if (caption && caption.trim()) {
            try {
                await enviarMensaje(chatId, caption.trim());
                registrarLog(`Caption enviado: ${caption.trim()}`);
            } catch (error) {
                registrarLog(`Error enviando caption: ${error.message}`);
                errors.push(`Error enviando caption: ${error.message}`);
            }
        }
        
        // Limpiar archivos temporales después de un tiempo (excepto audios)
        setTimeout(() => {
            files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        // Preservar archivos de audio permanentemente
                        const isAudioFile = file.mimetype && (
                            file.mimetype.startsWith('audio/') || 
                            file.mimetype.includes('webm') ||
                            file.path.includes('.ogg') ||
                            file.path.includes('.webm') ||
                            file.path.includes('.m4a') ||
                            file.path.includes('.wav')
                        );
                        
                        if (isAudioFile) {
                            registrarLog(`📁 Archivo de audio preservado: ${file.path}`);
                        } else {
                            fs.unlinkSync(file.path);
                            registrarLog(`Archivo temporal eliminado: ${file.path}`);
                        }
                    }
                } catch (error) {
                    registrarLog(`Error eliminando archivo temporal ${file.path}: ${error.message}`);
                }
            });
        }, 60000); // Eliminar después de 1 minuto
        
        if (successCount === files.length && errors.length === 0) {
            res.json({
                success: true,
                message: `${successCount} archivo(s) enviado(s) correctamente`,
                filesProcessed: successCount,
                timestamp: new Date().toISOString()
            });
        } else if (successCount > 0) {
            res.json({
                success: true,
                message: `${successCount} de ${files.length} archivo(s) enviado(s)`,
                filesProcessed: successCount,
                errors: errors,
                timestamp: new Date().toISOString()
            });
        } else {
            // Detectar si el error es específico de WhatsApp Web
            let isWhatsAppError = false;
            let errorMessage = 'No se pudo enviar ningún archivo';
            let detailedMessage = '';

            // Verificar si hay un error de WhatsApp Web registrado globalmente (de archivos de audio)
            if (global.lastAudioError && global.lastAudioError.isWhatsAppError) {
                isWhatsAppError = true;
                errorMessage = 'WhatsApp Web tiene restricciones temporales para archivos de audio';
                detailedMessage = 'Los archivos de audio grabados desde el navegador pueden ser bloqueados temporalmente por WhatsApp Web. Esto es un comportamiento normal y temporal.';

                // Limpiar el flag después de usarlo
                delete global.lastAudioError;
            } else if (errors.some(e => e.includes('Evaluation failed') || e.includes('Protocol error') || e.includes('Session closed'))) {
                isWhatsAppError = true;

                // Verificar si es específicamente un archivo de audio
                const hasAudioFiles = files.some(file =>
                    file.originalname &&
                    (file.originalname.includes('.m4a') ||
                     file.originalname.includes('.wav') ||
                     file.originalname.includes('.ogg') ||
                     file.originalname.includes('.webm') ||
                     file.originalname.includes('grabado'))
                );

                if (hasAudioFiles) {
                    errorMessage = 'WhatsApp Web tiene restricciones temporales para archivos de audio';
                    detailedMessage = 'Los archivos de audio grabados desde el navegador pueden ser bloqueados temporalmente por WhatsApp Web. Esto es un comportamiento normal y temporal.';
                } else {
                    errorMessage = 'WhatsApp Web está experimentando problemas técnicos';
                    detailedMessage = 'Se ha detectado un problema con WhatsApp Web. La sesión se reiniciará automáticamente.';
                }
            }

            res.status(500).json({
                success: false,
                error: errorMessage,
                detailedMessage: detailedMessage,
                errors: errors,
                isWhatsAppError: isWhatsAppError,
                suggestions: [
                    'Espere 2-3 minutos y reintente',
                    'Grabe un audio más corto (15-30 segundos)',
                    'Envíe un mensaje de texto en lugar de audio',
                    'Verifique su conexión a internet'
                ],
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('💥 Error crítico en /api/send-files:', error);
        console.error('📊 Stack trace completo:', error.stack);
        console.error('📊 Request body:', {
            chatId: req.body?.chatId,
            filesCount: req.files?.length,
            user: req.user?.usuario_id
        });

        registrarLog(`Error crítico en /api/send-files: ${error.message}`);

        res.status(500).json({
            success: false,
            error: `Error interno del servidor: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para cambiar modo de chat (bot/human) (requiere autenticación)
app.post('/api/chats/:chatId/toggle-mode', requireAuth, async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const estado = obtenerEstadoUsuario(chatId);
        
        if (estado.enEsperaHumano) {
            // Cambiar a modo bot
            if (estado.enEsperaHumano.temporizador) {
                clearTimeout(estado.enEsperaHumano.temporizador);
            }
            actualizarEstadoUsuario(chatId, { enEsperaHumano: null });
            await enviarMensaje(chatId, '🤖 Has sido transferido al modo automático. Puedes usar el menú principal.');
            await mostrarMenuPrincipal(chatId);
        } else {
            // Cambiar a modo humano
            await activarModoHumano(chatId);
            await enviarMensaje(chatId, '📩 Tu consulta ha sido enviada al área correspondiente. Nos pondremos en contacto contigo muy pronto. ✨');
        }
        
        // Actualizar información del chat
        actualizarChatActivo(chatId);
        const chatInfo = chatsActivos.get(chatId);
        
        res.json({
            success: true,
            mode: chatInfo ? chatInfo.mode : 'bot',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cambiando modo',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para finalizar un chat (requiere autenticación)
app.post('/api/chats/:chatId/end', requireAuth, async (req, res) => {
    try {
        const chatId = req.params.chatId;
        
        await enviarMensajeSeguro(chatId, '😊 Chat finalizado. Gracias por comunicarte con *SOLUCNET.SAS*');
        limpiarEstadoUsuario(chatId);
        limpiarChatActivo(chatId);
        
        res.json({
            success: true,
            message: 'Chat finalizado correctamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error finalizando chat',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para marcar chat como leído
app.post('/api/chats/:chatId/mark-read', (req, res) => {
    try {
        const chatId = req.params.chatId;
        const chatInfo = chatsActivos.get(chatId);
        
        if (chatInfo) {
            chatInfo.unreadCount = 0;
            chatsActivos.set(chatId, chatInfo);
        }
        
        res.json({
            success: true,
            message: 'Chat marcado como leído',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marcando como leído',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para limpiar mensajes duplicados (requiere autenticación de admin)
app.post('/api/clean-duplicates', requireAdmin, (req, res) => {
    try {
        console.log('🧹 Solicitud de limpieza de mensajes duplicados recibida');

        const duplicadosEliminados = limpiarMensajesDuplicados();

        res.json({
            success: true,
            message: `Limpieza completada: ${duplicadosEliminados} mensajes duplicados eliminados`,
            duplicatesRemoved: duplicadosEliminados,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error en limpieza manual:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error limpiando mensajes duplicados',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para probar base de datos
app.get('/api/test-db', async (req, res) => {
    try {
        const resultado = await consultarCliente('1067950020'); // Cliente de prueba
        res.json({
            success: true,
            message: 'Conexión exitosa a la base de datos',
            totalClientes: resultado ? 1 : 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error conectando a la base de datos',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/images', express.static('images'));
app.use('/imagenes', express.static('imagenes'));
app.use('/images/users', express.static('images/users'));
app.use('/uploads', express.static('uploads'));
app.use('/uploads/audios', express.static('uploads/audios'));
app.use('/uploads/videos', express.static('uploads/videos'));
app.use('/uploads/files', express.static('uploads/files'));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ===== Inicialización del servidor =====
// Nota: El servidor se inicia después de la inicialización del sistema de autenticación

// Limpiar procesos previos de Puppeteer
try {
    require('child_process').execSync('pkill -f "puppeteer" || true');
    registrarLog('Procesos previos de Puppeteer eliminados');
} catch (e) {
    registrarLog("No se encontraron procesos previos de puppeteer");
}

// Manejo de señales del sistema para limpieza
process.on('SIGINT', () => {
    registrarLog('Recibida señal SIGINT, cerrando aplicación...');
    if (client) {
        client.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    registrarLog('Recibida señal SIGTERM, cerrando aplicación...');
    if (client) {
        client.destroy();
    }
    process.exit(0);
});

// Función principal de inicialización
// ===== FUNCIONES DE LIMPIEZA TOTAL =====

// Función para limpiar todos los listeners de mensajes
function cleanAllMessageListeners() {
    try {
        if (client) {
            // Remover todos los listeners de message
            client.removeAllListeners('message');
            console.log('🧹 Todos los listeners de message removidos');
        }
    } catch (error) {
        console.error('❌ Error removiendo listeners:', error.message);
    }
}

// Función para limpiar estado de formularios
function cleanFormularioState() {
    try {
        // Limpiar estado de todos los usuarios
        for (const [chatId, estado] of estadosUsuario.entries()) {
            if (estado.formularioListener) {
                try {
                    if (client) {
                        client.removeListener('message', estado.formularioListener);
                    }
                } catch (error) {
                    console.error(`Error removiendo listener de formulario para ${chatId}:`, error.message);
                }
            }

            // Resetear estado de formulario
            actualizarEstadoUsuario(chatId, {
                formularioListener: null,
                formularioListenerId: null
            });
        }
        console.log('🧹 Estado de formularios limpiado');
    } catch (error) {
        console.error('❌ Error limpiando estado de formularios:', error.message);
    }
}

// Función para iniciar cliente completamente limpio
async function startCleanClient() {
    console.log('🔄 Iniciando cliente completamente limpio...');

    try {
        // 1. Limpiar todos los listeners existentes
        cleanAllMessageListeners();

        // 2. Limpiar estado de formularios
        cleanFormularioState();

        // 3. Destruir cliente anterior si existe
        if (client) {
            console.log('💥 Destruyendo cliente anterior...');
            try {
                await client.destroy();
                console.log('✅ Cliente anterior destruido');
            } catch (destroyError) {
                console.error('⚠️ Error destruyendo cliente anterior:', destroyError.message);
            }
        }

        // 4. Resetear variables globales
        whatsappListo = false;
        clienteIniciando = false;

        // 5. Pequeña pausa para asegurar limpieza completa
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 6. Iniciar cliente limpio
        console.log('🚀 Iniciando cliente limpio...');
        await iniciarCliente();

    } catch (error) {
        console.error('❌ Error en startCleanClient:', error.message);
        // Intentar iniciar cliente de todas formas
        try {
            await iniciarCliente();
        } catch (fallbackError) {
            console.error('❌ Error en fallback de iniciarCliente:', fallbackError.message);
        }
    }
}

async function inicializarSistemaCompleto() {
    try {
        console.log('🔐 Inicializando sistema de autenticación...');
        await inicializarSistema();
        console.log('✅ Sistema de autenticación inicializado correctamente');

        // Ahora que el sistema está inicializado, iniciar el servidor y cliente
        console.log('🚀 Iniciando servidor y cliente de WhatsApp...');

        // Iniciar el servidor
        if (useHTTPS && sslOptions) {
            https.createServer(sslOptions, app).listen(3000, () => {
                registrarLog('API escuchando en https://localhost:3000');
                registrarLog('Panel web disponible en https://localhost:3000');
                console.log('🔒 Servidor HTTPS iniciado correctamente');
            });
        } else {
            app.listen(3000, () => {
                registrarLog('API escuchando en http://localhost:3000');
                registrarLog('Panel web disponible en http://localhost:3000');
                console.log('🌐 Servidor HTTP iniciado correctamente');
            });
        }

        // Iniciar cliente de WhatsApp LIMPIO
        await startCleanClient();

        // Limpiar mensajes duplicados existentes
        setTimeout(() => {
            const duplicadosEliminados = limpiarMensajesDuplicados();
            console.log(`🎯 Servidor iniciado con ${duplicadosEliminados} mensajes duplicados eliminados`);
        }, 3000);

    } catch (error) {
        console.error('❌ Error inicializando sistema de autenticación:', error.message);
        console.log('⚠️  Iniciando servidor y cliente de WhatsApp sin sistema de autenticación...');

        // Iniciar servidor y cliente aunque falle la inicialización del sistema
        if (useHTTPS && sslOptions) {
            https.createServer(sslOptions, app).listen(3000, () => {
                registrarLog('API escuchando en https://localhost:3000');
                registrarLog('Panel web disponible en https://localhost:3000');
                console.log('🔒 Servidor HTTPS iniciado correctamente (sin auth)');
            });
        } else {
            app.listen(3000, () => {
                registrarLog('API escuchando en http://localhost:3000');
                registrarLog('Panel web disponible en http://localhost:3000');
                console.log('🌐 Servidor HTTP iniciado correctamente (sin auth)');
            });
        }

        // Iniciar cliente limpio
        await startCleanClient();

        // Limpiar mensajes duplicados existentes
        setTimeout(() => {
            const duplicadosEliminados = limpiarMensajesDuplicados();
            console.log(`🎯 Servidor iniciado con ${duplicadosEliminados} mensajes duplicados eliminados`);
        }, 3000);
    }
}

// Iniciar todo el sistema
inicializarSistemaCompleto();