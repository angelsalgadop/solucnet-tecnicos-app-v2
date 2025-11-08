const express = require('express');
const https = require('https');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs');
const app = express();
const PORT = 443;

app.use(express.json());
app.use(express.static('public'));

// Función para obtener el QR actual desde los logs
function obtenerUltimoQR() {
    try {
        const logs = fs.readFileSync('/root/whatsapp-chatbot/logs/out.log', 'utf8');
        const qrMatches = logs.match(/🔍 \[QR REAL\] (.+)/g);
        if (qrMatches && qrMatches.length > 0) {
            const lastQR = qrMatches[qrMatches.length - 1];
            return lastQR.replace('🔍 [QR REAL] ', '');
        }
        return null;
    } catch (error) {
        console.log('Error leyendo QR de logs:', error.message);
        return null;
    }
}

// Función para verificar si WhatsApp está listo
function verificarWhatsAppListo() {
    try {
        const logs = fs.readFileSync('/root/whatsapp-chatbot/logs/out.log', 'utf8');
        // Buscar mensajes que indiquen que WhatsApp está listo
        const lineasRecientes = logs.split('\n').slice(-50).join('\n');
        return lineasRecientes.includes('✅ Cliente listo') ||
               lineasRecientes.includes('WhatsApp listo') ||
               lineasRecientes.includes('ready');
    } catch (error) {
        return false;
    }
}

app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

app.get('/api/whatsapp/status', (req, res) => {
    const whatsappListo = verificarWhatsAppListo();

    res.json({
        success: true,
        ready: whatsappListo,
        authenticated: whatsappListo,
        client: true
    });
});

app.get('/api/whatsapp/qr', async (req, res) => {
    try {
        const whatsappListo = verificarWhatsAppListo();

        if (whatsappListo) {
            return res.json({
                success: true,
                connected: true,
                message: 'WhatsApp ya está conectado'
            });
        }

        const qrData = obtenerUltimoQR();

        if (qrData) {
            // Generar imagen QR como data URL
            const qrDataURL = await QRCode.toDataURL(qrData, {
                type: 'image/png',
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            return res.json({
                success: true,
                qr: qrDataURL
            });
        } else {
            return res.json({
                success: false,
                message: 'QR no disponible en este momento. Espere unos segundos e intente nuevamente.'
            });
        }
    } catch (error) {
        console.error('Error obteniendo QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para la página de QR
app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qr.html'));
});

// Ruta de prueba para notificaciones (temporal)
app.post('/api/notificar-llegada-cliente', (req, res) => {
    const whatsappListo = verificarWhatsAppListo();

    if (!whatsappListo) {
        return res.status(503).json({
            success: false,
            message: 'WhatsApp no está conectado. Por favor espere unos momentos e intente nuevamente.'
        });
    }

    // Por ahora, simular éxito
    res.json({
        success: true,
        message: 'Notificación enviada exitosamente (usando servidor temporal)'
    });
});

// Configuración HTTPS
const httpsOptions = {
    key: fs.readFileSync('/etc/ssl/private/ssl-cert-snakeoil.key'),
    cert: fs.readFileSync('/etc/ssl/certs/ssl-cert-snakeoil.pem')
};

// Servidor HTTPS
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`QR Server running on HTTPS port ${PORT}`);
    console.log(`QR page available at: https://your-server/qr`);
});

// También mantener HTTP en puerto 8080 para compatibilidad
app.listen(8080, () => {
    console.log('HTTP fallback server on port 8080');
    console.log('QR page also available at: http://your-server:8080/qr');
});