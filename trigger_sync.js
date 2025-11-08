// Script para iniciar sincronización manualmente
const mysql = require('mysql2/promise');

async function iniciarSincronizacion() {
    try {
        console.log('🔄 Iniciando sincronización manual...');

        const conexion = await mysql.createConnection({
            host: 'localhost',
            user: 'debian-sys-maint',
            password: 'IOHcXunF7795fMRI',
            database: 'solucnet_auth_system'
        });

        // Limpiar estado de sincronización anterior
        await conexion.execute(`
            UPDATE sync_state
            SET en_progreso = 0,
                finalizada = NOW()
            WHERE id = 1
        `);

        console.log('✅ Estado de sincronización limpiado');
        console.log('');
        console.log('📋 INSTRUCCIONES:');
        console.log('1. Abre tu navegador');
        console.log('2. Ve a: https://tudominio.com/historial.html');
        console.log('3. Haz clic en el botón de sincronizar (🔄)');
        console.log('4. NO cierres la pestaña hasta que termine');
        console.log('');
        console.log('La sincronización puede tardar 10-15 minutos para 502 chats.');
        console.log('');

        // Mostrar estadísticas actuales
        const [stats] = await conexion.execute(`
            SELECT
                COUNT(DISTINCT numero_telefono) as contactos_guardados,
                COUNT(*) as mensajes_totales
            FROM chat_messages
        `);

        console.log('📊 ESTADÍSTICAS ACTUALES:');
        console.log(`   • Contactos guardados: ${stats[0].contactos_guardados}`);
        console.log(`   • Mensajes totales: ${stats[0].mensajes_totales}`);
        console.log('');

        await conexion.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

iniciarSincronizacion();
