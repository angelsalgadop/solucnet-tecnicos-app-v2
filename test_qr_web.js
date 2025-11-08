const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');

const app = express();
const PORT = 3001;

let currentQR = null;

app.get('/api/qr', (req, res) => {
    if (currentQR) {
        res.json({ hasQR: true, qr: currentQR });
    } else {
        res.json({ hasQR: false, message: 'Generando QR...' });
    }
});

app.get('/api/qr-image', async (req, res) => {
    if (!currentQR) {
        return res.status(404).send('QR no disponible');
    }

    const qrBuffer = await QRCode.toBuffer(currentQR, { width: 300 });
    res.set('Content-Type', 'image/png');
    res.send(qrBuffer);
});

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>QR WhatsApp</title></head>
        <body style="text-align:center; font-family:Arial;">
            <h1>🚀 QR WhatsApp</h1>
            <div id="status">Verificando...</div>
            <img id="qr" style="max-width:300px; margin:20px;" />
            <script>
                function check() {
                    fetch('/api/qr')
                        .then(r => r.json())
                        .then(data => {
                            if (data.hasQR) {
                                document.getElementById('status').innerHTML = '✅ QR Disponible';
                                document.getElementById('qr').src = '/api/qr-image?' + Date.now();
                            } else {
                                document.getElementById('status').innerHTML = '⏳ ' + (data.message || 'Generando...');
                            }
                        });
                }
                setInterval(check, 2000);
                check();
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log('🌐 Servidor iniciado en puerto', PORT);
    console.log('📱 Ve a http://localhost:' + PORT);
    initWhatsApp();
});

function initWhatsApp() {
    console.log('🚀 Iniciando WhatsApp...');

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: "test-web" }),
        puppeteer: { headless: true, args: ['--no-sandbox'] }
    });

    client.on('qr', qr => {
        console.log('📱 QR GENERADO');
        currentQR = qr;
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp conectado');
        currentQR = null;
    });

    client.initialize();
}