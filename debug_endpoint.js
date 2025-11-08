// Script para crear un endpoint de debug temporal
const express = require('express');
const mysql = require('mysql2/promise');

// Crear app express temporal
const app = express();

// Configurar variables como en index.js
process.env.DB_SYSTEM_HOST = 'localhost';
process.env.DB_SYSTEM_USER = 'debian-sys-maint';
process.env.DB_SYSTEM_PASSWORD = 'IOHcXunF7795fMRI';
process.env.DB_SYSTEM_DATABASE = 'solucnet_auth_system';

const dbSistema = {
    host: process.env.DB_SYSTEM_HOST || 'localhost',
    user: process.env.DB_SYSTEM_USER || 'debian-sys-maint',
    password: process.env.DB_SYSTEM_PASSWORD || 'IOHcXunF7795fMRI',
    database: 'solucnet_auth_system'
};

// Endpoint de debug
app.get('/debug', async (req, res) => {
    try {
        console.log('🔍 Debug endpoint llamado');
        console.log('Variables de entorno:', {
            DB_SYSTEM_HOST: process.env.DB_SYSTEM_HOST,
            DB_SYSTEM_USER: process.env.DB_SYSTEM_USER,
            DB_SYSTEM_PASSWORD: process.env.DB_SYSTEM_PASSWORD ? '[CONFIGURADA]' : '[NO CONFIGURADA]'
        });

        console.log('Configuración dbSistema:', {
            host: dbSistema.host,
            user: dbSistema.user,
            password: dbSistema.password ? '[CONFIGURADA]' : '[NO CONFIGURADA]',
            database: dbSistema.database
        });

        const conexion = await mysql.createConnection(dbSistema);

        const [visitas] = await conexion.execute(`
            SELECT id, cliente_nombre, serial_equipo_asignado, equipo_tipo, estado, tecnico_asignado_id
            FROM visitas_tecnicas
            WHERE tecnico_asignado_id = 22 AND estado IN ('asignada', 'en_progreso')
            ORDER BY fecha_programada ASC
        `);

        await conexion.end();

        const resultado = {
            success: true,
            debug: {
                variables_entorno: {
                    DB_SYSTEM_HOST: process.env.DB_SYSTEM_HOST,
                    DB_SYSTEM_USER: process.env.DB_SYSTEM_USER,
                    DB_SYSTEM_PASSWORD: process.env.DB_SYSTEM_PASSWORD ? '[SET]' : '[NOT SET]'
                },
                config_db: dbSistema,
                visitas_encontradas: visitas.length,
                visitas: visitas
            }
        };

        console.log('Resultado:', JSON.stringify(resultado, null, 2));
        res.json(resultado);

    } catch (error) {
        console.error('Error en debug:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            debug: {
                variables_entorno: {
                    DB_SYSTEM_HOST: process.env.DB_SYSTEM_HOST,
                    DB_SYSTEM_USER: process.env.DB_SYSTEM_USER,
                    DB_SYSTEM_PASSWORD: process.env.DB_SYSTEM_PASSWORD ? '[SET]' : '[NOT SET]'
                }
            }
        });
    }
});

// Iniciar servidor en puerto diferente
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🔍 Servidor de debug iniciado en puerto ${PORT}`);
    console.log(`Prueba: curl -k -s "http://localhost:${PORT}/debug"`);
});