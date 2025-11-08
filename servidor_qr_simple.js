const express = require('express');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const app = express();
const PORT = 3001;

// Servir archivos estáticos
app.use(express.static('public'));

// Variable para almacenar el QR
let currentQR = null;
let qrGeneratedAt = null;

// Endpoint para obtener QR en formato JSON
app.get('/api/qr', (req, res) => {
    if (currentQR) {
        res.json({
            qr: currentQR,
            hasQR: true,
            timestamp: qrGeneratedAt,
            message: 'QR disponible'
        });
    } else {
        res.json({
            hasQR: false,
            message: 'QR no disponible - cliente iniciando...',
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint para obtener QR como imagen
app.get('/api/qr-image', async (req, res) => {
    try {
        if (!currentQR) {
            return res.status(404).json({
                error: 'No hay QR disponible'
            });
        }

        const qrBuffer = await QRCode.toBuffer(currentQR, {
            type: 'png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.set({
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.send(qrBuffer);
    } catch (error) {
        console.error('Error generando imagen QR:', error);
        res.status(500).json({ error: 'Error generando QR' });
    }
});

// Endpoint de estado
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        hasQR: !!currentQR,
        timestamp: new Date().toISOString()
    });
});

// Página simple para mostrar QR
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR WhatsApp - Servidor Simple</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .qr-container { margin: 20px 0; }
                .qr-image { max-width: 300px; border: 2px solid #25d366; border-radius: 10px; }
                .status { margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px; }
                .refresh-btn { padding: 10px 20px; background: #25d366; color: white; border: none; border-radius: 5px; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>🚀 Servidor QR WhatsApp</h1>
            <div class="status" id="status">Verificando estado...</div>
            <div class="qr-container">
                <img id="qr-image" class="qr-image" style="display: none;" />
                <div id="no-qr" style="display: none;">
                    <p>⏳ Generando código QR...</p>
                    <p>El QR aparecerá aquí cuando esté listo</p>
                </div>
            </div>
            <button class="refresh-btn" onclick="checkStatus()">🔄 Actualizar</button>

            <script>
                function checkStatus() {
                    fetch('/api/status')
                        .then(r => r.json())
                        .then(data => {
                            document.getElementById('status').innerHTML =
                                `Estado: ${data.status} | QR: ${data.hasQR ? '✅ Disponible' : '❌ No disponible'} | ${new Date(data.timestamp).toLocaleTimeString()}`;

                            if (data.hasQR) {
                                document.getElementById('qr-image').src = '/api/qr-image?' + Date.now();
                                document.getElementById('qr-image').style.display = 'block';
                                document.getElementById('no-qr').style.display = 'none';
                            } else {
                                document.getElementById('qr-image').style.display = 'none';
                                document.getElementById('no-qr').style.display = 'block';
                            }
                        })
                        .catch(err => {
                            document.getElementById('status').innerHTML = 'Error: ' + err.message;
                        });
                }

                // Verificar estado cada 3 segundos
                setInterval(checkStatus, 3000);
                checkStatus();
            </script>
        </body>
        </html>
    `);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🌐 Servidor QR iniciado en http://localhost:${PORT}`);
    console.log(`📱 Ve a http://localhost:${PORT} para ver el QR`);

    // Iniciar cliente WhatsApp
    initWhatsApp();
});

async function initWhatsApp() {
    console.log('🚀 Iniciando cliente WhatsApp...');

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: "qr-simple-session"
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
        console.log('📱 ¡QR GENERADO!');
        currentQR = qr;
        qrGeneratedAt = new Date().toISOString();
        console.log(`✅ QR disponible en http://localhost:${PORT}`);
    });

    client.on('ready', () => {
        console.log('✅ Cliente WhatsApp conectado!');
        currentQR = null; // Limpiar QR después de conectar
    });

    client.on('auth_failure', msg => {
        console.error('❌ Fallo de autenticación:', msg);
        currentQR = null;
    });

    try {
        await client.initialize();
    } catch (error) {
        console.error('❌ Error inicializando cliente:', error);
    }
}