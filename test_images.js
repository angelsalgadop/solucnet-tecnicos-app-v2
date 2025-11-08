const mysql = require('mysql2/promise');

async function testImageMessages() {
    try {
        const conexion = await mysql.createConnection({
            host: 'localhost',
            user: 'debian-sys-maint',
            password: 'IOHcXunF7795fMRI',
            database: 'solucnet_auth_system'
        });

        const numero_telefono = '120363419106346181';

        const [rows] = await conexion.query(
            `SELECT
                mensaje_id as id,
                contenido_texto as body,
                from_me as fromMe,
                timestamp,
                tipo_mensaje as type,
                media_url,
                media_filename,
                CASE
                    WHEN from_me = 1 AND leido = 1 THEN 'read'
                    WHEN from_me = 1 AND leido = 0 THEN 'sent'
                    ELSE 'received'
                END as status
            FROM chat_messages
            WHERE numero_telefono = ?
            AND tipo_mensaje = 'image'
            ORDER BY timestamp DESC
            LIMIT 3`,
            [numero_telefono]
        );

        console.log(`\n📊 Mensajes con imágenes encontrados: ${rows.length}\n`);

        rows.forEach((row, i) => {
            let body = row.body || '';
            let mediaUrl = null;

            if (row.media_url) {
                mediaUrl = row.media_url;
            }

            const message = {
                id: row.id,
                body: body,
                fromMe: row.fromMe === 1,
                timestamp: row.timestamp,
                status: row.status,
                type: row.type || 'text',
                hasMedia: row.media_url ? true : false,
                mediaUrl: mediaUrl,
                filename: row.media_filename,
                isFromAPI: false
            };

            console.log(`Mensaje ${i + 1}:`);
            console.log(`  - ID: ${message.id}`);
            console.log(`  - Type: ${message.type}`);
            console.log(`  - hasMedia: ${message.hasMedia}`);
            console.log(`  - mediaUrl: ${mediaUrl ? `${mediaUrl.substring(0, 50)}... (${mediaUrl.length} caracteres)` : 'NULL'}`);
            console.log(`  - body: "${body.substring(0, 50)}${body.length > 50 ? '...' : ''}"`);
            console.log(`  - filename: ${message.filename || 'N/A'}`);
            console.log('');
        });

        await conexion.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

testImageMessages();
