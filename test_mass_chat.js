#!/usr/bin/env node

// Script para probar 50 usuarios simultáneos y finalizarlos
const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TOTAL_USERS = 50;
const TEST_PHONE_BASE = '5730000'; // Base para números de prueba

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Función para simular un usuario enviando mensaje
async function simulateUser(userId) {
    const phoneNumber = TEST_PHONE_BASE + userId.toString().padStart(5, '0');
    
    try {
        console.log(`👤 Usuario ${userId}: Enviando mensaje desde ${phoneNumber}`);
        
        const result = await makeRequest(`/api/send-message?numero=${phoneNumber}&mensaje=Hola soy usuario ${userId}`);
        
        if (result.status === 200) {
            console.log(`✅ Usuario ${userId}: Mensaje enviado correctamente`);
            return { userId, success: true, phone: phoneNumber };
        } else {
            console.log(`❌ Usuario ${userId}: Error ${result.status}`);
            return { userId, success: false, phone: phoneNumber, error: result.status };
        }
    } catch (error) {
        console.log(`💥 Usuario ${userId}: Error de conexión - ${error.message}`);
        return { userId, success: false, phone: phoneNumber, error: error.message };
    }
}

// Función principal de prueba
async function runLoadTest() {
    console.log(`🚀 Iniciando prueba de carga con ${TOTAL_USERS} usuarios simultáneos...`);
    
    // 1. Verificar estado inicial
    try {
        console.log('📊 Verificando estado inicial del servidor...');
        const initialStatus = await makeRequest('/api/memory-status');
        console.log('Estado inicial:', JSON.stringify(initialStatus.data, null, 2));
    } catch (error) {
        console.log('⚠️ No se pudo obtener estado inicial:', error.message);
    }
    
    // 2. Simular usuarios enviando mensajes simultáneamente
    const userPromises = [];
    for (let i = 1; i <= TOTAL_USERS; i++) {
        userPromises.push(simulateUser(i));
    }
    
    console.log(`⏳ Esperando respuesta de ${TOTAL_USERS} usuarios simultáneos...`);
    const results = await Promise.allSettled(userPromises);
    
    // 3. Analizar resultados
    let successful = 0;
    let failed = 0;
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
            successful++;
        } else {
            failed++;
        }
    });
    
    console.log(`\n📈 RESULTADOS DE LA PRUEBA:`);
    console.log(`✅ Exitosos: ${successful}/${TOTAL_USERS}`);
    console.log(`❌ Fallidos: ${failed}/${TOTAL_USERS}`);
    
    // 4. Verificar estado después de la prueba
    try {
        console.log('\n📊 Verificando estado después de la prueba...');
        const afterStatus = await makeRequest('/api/memory-status');
        console.log('Estado después:', JSON.stringify(afterStatus.data, null, 2));
    } catch (error) {
        console.log('⚠️ No se pudo obtener estado posterior:', error.message);
    }
    
    // 5. Probar finalización masiva
    try {
        console.log('\n🧹 Probando finalización masiva de chats...');
        const massFinalize = await makeRequest('/api/test-mass-finalize', 'POST');
        console.log('Resultado finalización masiva:', JSON.stringify(massFinalize.data, null, 2));
    } catch (error) {
        console.log('⚠️ Error en finalización masiva:', error.message);
    }
    
    // 6. Verificar estado final
    try {
        console.log('\n📊 Estado final después de limpieza...');
        const finalStatus = await makeRequest('/api/memory-status');
        console.log('Estado final:', JSON.stringify(finalStatus.data, null, 2));
    } catch (error) {
        console.log('⚠️ No se pudo obtener estado final:', error.message);
    }
    
    console.log('\n🏁 Prueba de carga completada!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, simulateUser };