const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🚀 Iniciando cliente simple para generar QR...');

// Eliminar sesión anterior
const fs = require('fs');
const path = require('path');

// Buscar y eliminar todas las carpetas de sesión
const sessionDirs = [
    '.wwebjs_auth',
    'session',
    '.wwebjs_cache',
    path.join(__dirname, '.wwebjs_auth'),
    path.join(__dirname, 'session'),
];

sessionDirs.forEach(dir => {
    try {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`✅ Eliminada carpeta de sesión: ${dir}`);
        }
    } catch (error) {
        console.log(`⚠️ No se pudo eliminar ${dir}: ${error.message}`);
    }
});

// Crear cliente simple
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "test-qr-session"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

client.on('qr', qr => {
    console.log('🎯 ¡QR GENERADO EXITOSAMENTE!');
    console.log('📱 Escanea este código QR con WhatsApp:');
    console.log('');
    qrcode.generate(qr, { small: true });
    console.log('');
    console.log('✅ El QR se ha generado correctamente en la terminal');
    console.log('📋 Para usar en la API web, el QR está disponible en: /api/qr');

    // Guardar QR globalmente para que la API pueda accederlo
    global.currentQR = qr;
});

client.on('authenticated', () => {
    console.log('✅ QR escaneado exitosamente!');
    console.log('🔐 Autenticando...');
});

client.on('ready', () => {
    console.log('✅ Cliente WhatsApp listo!');
    console.log('🎉 ¡Conexión exitosa!');
});

client.on('auth_failure', msg => {
    console.error('❌ Fallo de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('🔌 Cliente desconectado:', reason);
});

// Inicializar cliente
console.log('🔄 Inicializando cliente...');
client.initialize().catch(err => {
    console.error('❌ Error inicializando cliente:', err);
});

// Mantener el proceso vivo
process.on('SIGINT', () => {
    console.log('🛑 Cerrando cliente...');
    client.destroy();
    process.exit(0);
});