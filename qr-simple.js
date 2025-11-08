const express = require('express');
const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Función para obtener QR desde PM2 logs
function obtenerQRDesdePM2() {
    return new Promise((resolve) => {
        exec('pm2 logs solucnet-bot --lines 200 --nostream', (error, stdout, stderr) => {
            if (error) {
                console.log('Error obteniendo logs PM2:', error.message);
                resolve(null);
                return;
            }

            // Buscar QR en formato ASCII (bloques █)
            const lines = stdout.split('\n');
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].includes('█') && lines[i].includes('▄') && lines[i].length > 50) {
                    // Encontró un QR ASCII, buscar hacia arriba para el inicio
                    let qrLines = [];
                    let j = i;
                    while (j >= 0 && (lines[j].includes('█') || lines[j].includes('▄') || lines[j].trim() === '')) {
                        if (lines[j].includes('█') || lines[j].includes('▄')) {
                            qrLines.unshift(lines[j].split('|').slice(-1)[0].trim());
                        }
                        j--;
                    }
                    if (qrLines.length > 10) { // Un QR válido tiene muchas líneas
                        resolve(qrLines.join('\n'));
                        return;
                    }
                }
            }
            resolve(null);
        });
    });
}

app.get('/api/whatsapp/status', (req, res) => {
    res.json({
        success: true,
        ready: false,
        authenticated: false,
        client: true
    });
});

app.get('/api/whatsapp/qr', async (req, res) => {
    try {
        const qrAscii = await obtenerQRDesdePM2();

        if (qrAscii) {
            // El QR ASCII no se puede convertir directamente, necesitamos el string original
            res.json({
                success: true,
                qr_ascii: qrAscii,
                message: 'QR encontrado en formato ASCII. Escanealo desde la consola o usa el QR en: https://tu-servidor/admin para obtener uno escaneble.'
            });
        } else {
            res.json({
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
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp QR - SolucNet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
            .qr-ascii { font-family: monospace; font-size: 8px; line-height: 1; background: #000; color: #fff; padding: 10px; overflow-x: auto; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .loading { background: #fff3cd; color: #856404; }
            .ready { background: #d1edff; color: #0c5460; }
            .error { background: #f8d7da; color: #721c24; }
            button { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔗 Conectar WhatsApp - SolucNet</h1>
            <div id="status" class="status loading">⏳ Verificando estado...</div>

            <div style="text-align: center; margin: 20px 0;">
                <button onclick="cargarQR()">🔄 Actualizar QR</button>
                <button onclick="verificarEstado()">📊 Verificar Estado</button>
            </div>

            <div id="qr-container">
                <p>Haciendo clic en "Actualizar QR" para cargar el código QR...</p>
            </div>

            <div style="margin-top: 20px;">
                <h3>📱 Instrucciones:</h3>
                <ol>
                    <li>Abre WhatsApp en tu teléfono</li>
                    <li>Ve a <strong>Menú (3 puntos)</strong> → <strong>Dispositivos vinculados</strong></li>
                    <li>Toca <strong>Vincular un dispositivo</strong></li>
                    <li>Escanea el código QR que aparece arriba</li>
                </ol>
            </div>
        </div>

        <script>
            async function cargarQR() {
                document.getElementById('qr-container').innerHTML = '<p>⏳ Cargando QR...</p>';

                try {
                    const response = await fetch('/api/whatsapp/qr');
                    const data = await response.json();

                    if (data.success && data.qr_ascii) {
                        document.getElementById('qr-container').innerHTML =
                            '<h3>📱 Código QR:</h3><pre class="qr-ascii">' + data.qr_ascii + '</pre>';
                    } else {
                        document.getElementById('qr-container').innerHTML =
                            '<div class="status error">❌ ' + data.message + '</div>';
                    }
                } catch (error) {
                    document.getElementById('qr-container').innerHTML =
                        '<div class="status error">❌ Error cargando QR: ' + error.message + '</div>';
                }
            }

            async function verificarEstado() {
                try {
                    const response = await fetch('/api/whatsapp/status');
                    const data = await response.json();

                    const statusDiv = document.getElementById('status');
                    if (data.ready) {
                        statusDiv.className = 'status ready';
                        statusDiv.innerHTML = '✅ WhatsApp conectado y listo';
                    } else {
                        statusDiv.className = 'status loading';
                        statusDiv.innerHTML = '⏳ WhatsApp no conectado - Escanea el QR';
                    }
                } catch (error) {
                    document.getElementById('status').innerHTML = '❌ Error verificando estado';
                }
            }

            // Verificar estado al cargar
            verificarEstado();
        </script>
    </body>
    </html>
    `);
});

const httpsOptions = {
    key: fs.readFileSync('/etc/ssl/private/ssl-cert-snakeoil.key'),
    cert: fs.readFileSync('/etc/ssl/certs/ssl-cert-snakeoil.pem')
};

https.createServer(httpsOptions, app).listen(443, () => {
    console.log('QR Server running on HTTPS port 443');
    console.log('QR page available at: https://your-server/qr');
});

app.listen(8080, () => {
    console.log('HTTP server on port 8080');
});