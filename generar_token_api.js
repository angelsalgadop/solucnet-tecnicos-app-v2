#!/usr/bin/env node

/**
 * Script para generar token eterno API
 * Este script genera un token JWT que nunca expira para uso en API
 */

const jwt = require('jsonwebtoken');

// Función para crear token eterno
function crearTokenEternoAPI() {
    try {
        console.log('🔧 Generando token eterno para API...');

        const SECRET_KEY = 'solucnet_api_eternal_token_2024_permanent_key';

        const payload = {
            userId: 'api_system_permanent',
            username: 'api',
            nombre: 'Usuario API Eterno',
            rol: 'api',
            iat: Math.floor(Date.now() / 1000),
            // NO incluir 'exp' para que nunca expire
            permanent: true,
            description: 'Token API permanente que nunca expira'
        };

        const token = jwt.sign(payload, SECRET_KEY);
        console.log('✅ Token eterno generado exitosamente');

        return {
            token: token,
            secret: SECRET_KEY,
            payload: payload
        };
    } catch (error) {
        console.error('❌ Error creando token eterno:', error.message);
        return null;
    }
}

async function main() {
    try {
        console.log('🚀 Iniciando generación de token API eterno...\n');

        console.log('🔧 Generando token eterno...');
        const resultado = crearTokenEternoAPI();

        if (resultado) {
            const { token, secret, payload } = resultado;

            console.log('\n🎉 ¡TOKEN ETERNO GENERADO EXITOSAMENTE!');
            console.log('=' .repeat(60));
            console.log('📋 TU TOKEN API ETERNO (NUNCA EXPIRA):');
            console.log('=' .repeat(60));
            console.log(token);
            console.log('=' .repeat(60));

            console.log('\n🔑 CLAVE SECRETA (guarda esta también):');
            console.log('=' .repeat(60));
            console.log(secret);
            console.log('=' .repeat(60));

            console.log('\n📖 INSTRUCCIONES DE USO:');
            console.log('- Copia este token y guárdalo en un lugar seguro');
            console.log('- Este token NUNCA expira, así que no necesitarás regenerarlo');
            console.log('- Úsalo en el header Authorization: Bearer TU_TOKEN_AQUI');
            console.log('- También guarda la clave secreta por si necesitas regenerar el token');

            console.log('\n🔗 EJEMPLO DE USO:');
            console.log(`curl -X GET "https://192.168.99.122:3000/api/enviar?numero=573001234567&mensaje=Hola" \\`);
            console.log(`  -H "Authorization: Bearer ${token}"`);

            console.log('\n💡 NOTA IMPORTANTE:');
            console.log('- Este token es permanente y no requiere base de datos');
            console.log('- Funciona directamente con el middleware de autenticación');
            console.log('- Si necesitas cambiarlo, usa la clave secreta para generar uno nuevo');

        } else {
            console.log('❌ Error generando token eterno');
            process.exit(1);
        }

    } catch (error) {
        console.error('💥 Error general:', error.message);
        process.exit(1);
    }
}

// Ejecutar el script
if (require.main === module) {
    main();
}

module.exports = { main };
