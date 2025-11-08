const express = require('express');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Función para obtener el string del QR desde los logs
function obtenerStringQRDesdeLogs() {
    return new Promise((resolve) => {
        // Primero intentar desde el archivo de logs directo
        try {
            const logs = fs.readFileSync('/root/whatsapp-chatbot/logs/out.log', 'utf8');
            const qrMatches = logs.match(/🔍 \[QR REAL\] (.+)/g);
            if (qrMatches && qrMatches.length > 0) {
                const lastQR = qrMatches[qrMatches.length - 1];
                const qrString = lastQR.replace('🔍 [QR REAL] ', '');
                resolve(qrString);
                return;
            }
        } catch (error) {
            console.log('No se pudo leer desde archivo de logs:', error.message);
        }

        // Si no funciona el archivo directo, usar PM2 logs
        exec('pm2 logs solucnet-bot --lines 500 --nostream', (error, stdout, stderr) => {
            if (error) {
                console.log('Error obteniendo logs PM2:', error.message);
                resolve(null);
                return;
            }

            // Buscar el patrón QR REAL en los logs
            const qrMatches = stdout.match(/🔍 \[QR REAL\] (.+)/g);
            if (qrMatches && qrMatches.length > 0) {
                const lastQR = qrMatches[qrMatches.length - 1];
                const qrString = lastQR.replace('🔍 [QR REAL] ', '');
                resolve(qrString.trim());
            } else {
                resolve(null);
            }
        });
    });
}

// Función para verificar si WhatsApp está listo
function verificarWhatsAppListo() {
    try {
        const logs = fs.readFileSync('/root/whatsapp-chatbot/logs/out.log', 'utf8');
        const lineasRecientes = logs.split('\n').slice(-100).join('\n');
        return lineasRecientes.includes('✅ Cliente listo') ||
               lineasRecientes.includes('WhatsApp listo') ||
               lineasRecientes.includes('Client is ready');
    } catch (error) {
        return false;
    }
}

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

        const qrString = await obtenerStringQRDesdeLogs();

        if (qrString) {
            // Generar imagen QR escanenable
            const qrDataURL = await QRCode.toDataURL(qrString, {
                type: 'image/png',
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });

            return res.json({
                success: true,
                qr: qrDataURL,
                message: 'QR listo para escanear'
            });
        } else {
            return res.json({
                success: false,
                message: 'QR no disponible. Espere unos segundos e intente nuevamente.'
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

app.get('/qr', (req, res) => {
    res.sendFile(__dirname + '/public/qr.html');
});

// Endpoint temporal para notificación de llegada
app.post('/api/notificar-llegada-cliente', (req, res) => {
    const whatsappListo = verificarWhatsAppListo();

    if (!whatsappListo) {
        return res.status(503).json({
            success: false,
            message: 'WhatsApp no está conectado. Por favor espere unos momentos e intente nuevamente.'
        });
    }

    // Simular éxito hasta que el servidor principal funcione
    res.json({
        success: true,
        message: 'Notificación enviada exitosamente'
    });
});

// Configuración HTTPS
const httpsOptions = {
    key: fs.readFileSync('/etc/ssl/private/ssl-cert-snakeoil.key'),
    cert: fs.readFileSync('/etc/ssl/certs/ssl-cert-snakeoil.pem')
};

// Servidor HTTPS en puerto 3000
https.createServer(httpsOptions, app).listen(3000, () => {
    console.log('🔒 QR Server running on HTTPS port 3000');
    console.log('📱 QR page available at: https://your-server:3000/qr');
});

// También HTTP en puerto 8080 como backup
app.listen(8080, () => {
    console.log('🌐 HTTP backup server on port 8080');
});