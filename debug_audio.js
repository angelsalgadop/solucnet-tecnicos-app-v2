// Script para debug del problema de audio
const fs = require('fs');
const https = require('https');

const audioFilePath = '/root/v3/uploads/files-1755995538404-77171304.m4a';

async function testWithValidToken() {
    try {
        console.log('🔍 Analizando archivo de audio...');

        // Verificar que el archivo existe
        if (!fs.existsSync(audioFilePath)) {
            console.log('❌ Archivo no encontrado');
            return;
        }

        const stats = fs.statSync(audioFilePath);
        console.log(`📁 Archivo: ${audioFilePath}`);
        console.log(`📊 Tamaño: ${stats.size} bytes`);
        console.log(`📅 Modificado: ${stats.mtime}`);

        // Leer los primeros bytes para verificar el formato
        const buffer = fs.readFileSync(audioFilePath);
        console.log(`🔍 Primeros bytes (hex): ${buffer.slice(0, 16).toString('hex')}`);

        // Verificar el tipo MIME basado en la firma
        const signature = buffer.slice(0, 12).toString('hex');
        console.log(`🔍 Firma del archivo: ${signature}`);

        if (signature.startsWith('000000')) {
            console.log('📋 Formato detectado: M4A/AAC');
        } else {
            console.log('⚠️ Formato desconocido');
        }

        // Probar una conexión simple al servidor
        console.log('\n🌐 Probando conexión al servidor...');

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const response = await fetch('https://localhost:3000/api/stats', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid_token'
            },
            agent
        });

        console.log(`📡 Respuesta del servidor: ${response.status} ${response.statusText}`);

        if (response.status === 401) {
            console.log('✅ Autenticación funcionando correctamente');
        } else {
            console.log('⚠️ Respuesta inesperada del servidor');
        }

    } catch (error) {
        console.error('❌ Error en debug:', error.message);
    }
}

testWithValidToken();

