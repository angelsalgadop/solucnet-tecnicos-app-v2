// ============================================
// RUTAS DE API PARA HISTORIAL DE CHAT
// ============================================

const express = require('express');
const mysql = require('mysql2/promise');

// Estado global de sincronización (ahora se guarda también en BD)
let estadoSincronizacion = {
    enProgreso: false,
    totalChats: 0,
    chatsProcessed: 0,
    totalMensajes: 0,
    chatsConError: 0,
    iniciada: null,
    finalizada: null,
    error: null,
    chatsFallidos: [] // Lista de chats que fallaron
};

// Función para obtener conexión a la base de datos
async function getDBConnection() {
    return await mysql.createConnection({
        host: 'localhost',
        user: 'debian-sys-maint',
        password: 'IOHcXunF7795fMRI',
        database: 'solucnet_auth_system'
    });
}

// Función para formatear número de teléfono
function formatPhoneNumber(number) {
    // Limpiar el número de caracteres especiales
    let cleaned = number.replace(/[^0-9]/g, '');

    // Si tiene @c.us o @s.whatsapp.net, quitarlo
    cleaned = cleaned.replace(/@.*/, '');

    return cleaned;
}

// ============================================
// RUTA: Obtener lista de contactos con mensajes
// ============================================
async function getContactsList(req, res) {
    try {
        const conexion = await getDBConnection();

        // Obtener contactos únicos con su último mensaje y modo de chat
        const [contactos] = await conexion.execute(`
            SELECT
                cm.numero_telefono,
                cm.nombre_contacto,
                MAX(cm.timestamp) as ultimo_timestamp,
                MAX(cm.fecha_mensaje) as ultima_fecha,
                COUNT(*) as total_mensajes,
                (SELECT contenido_texto
                 FROM chat_messages
                 WHERE numero_telefono = cm.numero_telefono
                 ORDER BY timestamp DESC
                 LIMIT 1) as ultimo_mensaje,
                (SELECT tipo_mensaje
                 FROM chat_messages
                 WHERE numero_telefono = cm.numero_telefono
                 ORDER BY timestamp DESC
                 LIMIT 1) as tipo_ultimo_mensaje,
                (SELECT COALESCE(modo_chat, 'bot')
                 FROM chat_sync_status
                 WHERE numero_telefono = cm.numero_telefono
                 LIMIT 1) as modo_chat
            FROM chat_messages cm
            GROUP BY cm.numero_telefono, cm.nombre_contacto
            ORDER BY ultimo_timestamp DESC
        `);

        await conexion.end();

        res.json({
            success: true,
            contactos: contactos.map(c => ({
                numero: c.numero_telefono,
                nombre: c.nombre_contacto || c.numero_telefono,
                ultimoMensaje: c.ultimo_mensaje || (c.tipo_ultimo_mensaje !== 'text' ? `📎 ${c.tipo_ultimo_mensaje}` : 'Sin mensajes'),
                ultimaFecha: c.ultima_fecha,
                totalMensajes: c.total_mensajes,
                modoChat: c.modo_chat || 'bot'
            }))
        });
    } catch (error) {
        console.error('❌ Error obteniendo lista de contactos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================
// RUTA: Obtener mensajes de un contacto
// ============================================
async function getContactMessages(req, res) {
    let conexion = null;
    try {
        const { numero } = req.params;
        const { limit = 100, offset = 0, order = 'asc' } = req.query;

        // Validar y sanitizar parámetros (aumentar límite máximo a 10000)
        const limitNum = Math.max(1, Math.min(10000, parseInt(limit) || 100));
        const offsetNum = Math.max(0, parseInt(offset) || 0);
        const orderDir = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

        console.log(`📥 Obteniendo mensajes para ${numero} (limit: ${limitNum}, offset: ${offsetNum}, order: ${orderDir})`);

        conexion = await getDBConnection();

        // Obtener mensajes del contacto - usar valores directos en la query
        const [mensajes] = await conexion.execute(`
            SELECT
                mensaje_id,
                numero_telefono,
                nombre_contacto,
                tipo_mensaje,
                contenido_texto,
                media_url,
                media_mimetype,
                media_filename,
                media_size,
                from_me,
                timestamp,
                fecha_mensaje,
                quote_mensaje_id,
                metadata
            FROM chat_messages
            WHERE numero_telefono = ?
            ORDER BY timestamp ${orderDir}
            LIMIT ${limitNum} OFFSET ${offsetNum}
        `, [numero]);

        // Obtener total de mensajes
        const [total] = await conexion.execute(
            'SELECT COUNT(*) as total FROM chat_messages WHERE numero_telefono = ?',
            [numero]
        );

        console.log(`✅ ${mensajes.length} mensajes obtenidos de ${total[0].total} totales`);

        res.json({
            success: true,
            mensajes: mensajes,
            total: total[0].total,
            hasMore: (offsetNum + mensajes.length) < total[0].total
        });
    } catch (error) {
        console.error('❌ Error obteniendo mensajes del contacto:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if (conexion) {
            await conexion.end();
        }
    }
}

// ============================================
// RUTA: Sincronizar historial de chats
// ============================================
async function syncChatHistory(req, res, client) {
    try {
        // Verificar si ya hay una sincronización en progreso
        if (estadoSincronizacion.enProgreso) {
            return res.json({
                success: false,
                message: 'Ya hay una sincronización en progreso',
                estado: estadoSincronizacion
            });
        }

        if (!client || !client.info) {
            return res.status(503).json({
                success: false,
                error: 'Cliente de WhatsApp no conectado'
            });
        }

        // Obtener todos los chats (incluyendo archivados)
        console.log('📥 Obteniendo chats de WhatsApp...');
        const chats = await client.getChats();

        console.log(`📊 Total de chats encontrados: ${chats.length}`);
        console.log(`📋 Tipos de chats: ${chats.map(c => c.isGroup ? 'grupo' : 'individual').filter((v, i, a) => a.indexOf(v) === i).join(', ')}`);

        // Mostrar algunos ejemplos de chats
        if (chats.length > 0) {
            console.log(`📝 Primeros 5 chats:`);
            chats.slice(0, 5).forEach((chat, idx) => {
                console.log(`   ${idx + 1}. ${chat.name || 'Sin nombre'} (${chat.id._serialized}) - ${chat.isGroup ? 'Grupo' : 'Individual'}`);
            });
        }

        // Inicializar estado de sincronización
        estadoSincronizacion = {
            enProgreso: true,
            totalChats: chats.length,
            chatsProcessed: 0,
            totalMensajes: 0,
            chatsConError: 0,
            iniciada: new Date(),
            finalizada: null,
            error: null,
            chatsFallidos: []
        };

        // Enviar respuesta inicial
        res.json({
            success: true,
            message: 'Sincronización iniciada en segundo plano',
            totalChats: chats.length
        });

        // Procesar chats de forma asíncrona en segundo plano
        procesarChatsProgresivo(chats, client).catch(error => {
            console.error('❌ Error en sincronización:', error);
            estadoSincronizacion.enProgreso = false;
            estadoSincronizacion.error = error.message;
            estadoSincronizacion.finalizada = new Date();
        });

    } catch (error) {
        console.error('❌ Error iniciando sincronización:', error);
        estadoSincronizacion.enProgreso = false;
        estadoSincronizacion.error = error.message;
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================
// Función para procesar chats progresivamente con REINTENTOS
// ============================================
async function procesarChatsProgresivo(chats, client) {
    const totalChats = chats.length;
    let procesados = 0;
    let totalMensajesSincronizados = 0;
    let conexion = null;
    let chatsConError = [];
    const MAX_REINTENTOS = 3; // Número máximo de reintentos por chat

    try {
        conexion = await getDBConnection();
        console.log(`🔄 ========================================`);
        console.log(`🔄 INICIANDO SINCRONIZACIÓN ROBUSTA`);
        console.log(`🔄 ========================================`);
        console.log(`📊 Total de chats a procesar: ${totalChats}`);
        console.log(`🔁 Reintentos automáticos: ${MAX_REINTENTOS} por chat`);
        console.log(`🔄 ========================================\n`);

        // Guardar estado inicial en BD
        await guardarEstadoSincronizacion(conexion, {
            enProgreso: true,
            totalChats: totalChats,
            chatsProcessed: 0,
            totalMensajes: 0,
            chatsConError: 0
        });

        for (const chat of chats) {
            let exito = false;
            let intentos = 0;
            let ultimoError = null;
            let conexionChat = null;

            // SISTEMA DE REINTENTOS
            while (!exito && intentos < MAX_REINTENTOS) {
                try {
                    intentos++;

                    // Crear nueva conexión para cada intento (evita timeout de MySQL)
                    if (conexionChat) {
                        try { await conexionChat.end(); } catch (e) {}
                    }
                    conexionChat = await getDBConnection();

                    // Obtener número de teléfono limpio
                    const numero = formatPhoneNumber(chat.id._serialized);
                    const nombreChat = chat.name || numero;

                    if (intentos > 1) {
                        console.log(`🔁 [REINTENTO ${intentos}/${MAX_REINTENTOS}] Chat ${procesados + 1}/${totalChats}: ${nombreChat}`);
                        // Esperar más tiempo entre reintentos (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, intentos * 2000));
                    } else {
                        console.log(`\n🔄 [${procesados + 1}/${totalChats}] Procesando: ${nombreChat} (${chat.isGroup ? 'grupo' : 'individual'})`);
                    }

                    // Verificar si ya existe sincronización completa
                    const [existente] = await conexionChat.execute(
                        'SELECT sincronizado_completo, ultimo_timestamp, total_mensajes FROM chat_sync_status WHERE numero_telefono = ?',
                        [numero]
                    );

                    let mensajes = [];
                    const esNuevaSincronizacion = !existente.length || !existente[0].sincronizado_completo;

                    console.log(`   📊 Estado: ${esNuevaSincronizacion ? 'NUEVA sincronización' : 'Actualización incremental'}`);

                    if (esNuevaSincronizacion) {
                        // Primera sincronización: obtener TODO el historial
                        console.log(`   📥 Obteniendo TODO el historial...`);

                        const LIMITE_MAXIMO = 100000;
                        const FETCH_TIMEOUT = 90000; // 90 segundos timeout para fetchMessages

                        try {
                            // Aplicar timeout a fetchMessages
                            const timeoutPromise = new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Fetch timeout - chat muy grande')), FETCH_TIMEOUT)
                            );

                            mensajes = await Promise.race([
                                chat.fetchMessages({ limit: LIMITE_MAXIMO }),
                                timeoutPromise
                            ]);
                            console.log(`   ✅ ${mensajes.length} mensajes obtenidos`);

                            if (mensajes.length === LIMITE_MAXIMO) {
                                console.log(`   ⚠️  ADVERTENCIA: Límite alcanzado (${LIMITE_MAXIMO}). Puede haber más mensajes antiguos.`);
                            }
                        } catch (err) {
                            if (err.message === 'Fetch timeout - chat muy grande') {
                                console.log(`   ⏱️  TIMEOUT: Chat muy grande - usando límite reducido...`);
                                mensajes = await Promise.race([
                                    chat.fetchMessages({ limit: 5000 }),
                                    new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 60000))
                                ]);
                                console.log(`   ✅ ${mensajes.length} mensajes obtenidos (límite reducido por timeout)`);
                            } else {
                                console.log(`   ⚠️  Error con límite alto: ${err.message}`);
                                console.log(`   🔄 Reintentando con límite reducido...`);
                                mensajes = await chat.fetchMessages({ limit: 10000 });
                                console.log(`   ✅ ${mensajes.length} mensajes obtenidos (límite reducido)`);
                            }
                        }
                    } else {
                        // Ya sincronizado: solo obtener mensajes nuevos
                        console.log(`   ⏭️  Chat ya sincronizado, buscando nuevos mensajes...`);
                        mensajes = await chat.fetchMessages({ limit: 50 });
                        console.log(`   ✅ ${mensajes.length} mensajes recientes obtenidos`);
                    }

                    // Si no hay mensajes, marcar como exitoso y saltar
                    if (mensajes.length === 0) {
                        console.log(`   ℹ️  Sin mensajes. Marcando como completado.`);
                        procesados++;
                        estadoSincronizacion.chatsProcessed = procesados;
                        await guardarEstadoSincronizacion(conexionChat, estadoSincronizacion);
                        exito = true;
                        continue;
                    }

                    let mensajesNuevos = 0;
                    let archivosDescargados = 0;
                    let erroresMensajes = 0;

                    // Función para validar y normalizar el tipo de mensaje
                    const normalizarTipoMensaje = (type) => {
                        if (!type || typeof type !== 'string' || type.trim() === '') {
                            return 'text';
                        }
                        const tipoLimpio = type.trim().toLowerCase();
                        const tiposValidos = ['text', 'image', 'video', 'audio', 'document', 'ptt', 'sticker', 'location', 'vcard', 'call_log', 'chat'];
                        if (tiposValidos.includes(tipoLimpio)) {
                            return tipoLimpio;
                        }
                        console.log(`   ⚠️  Tipo desconocido: "${type}" → usando 'text'`);
                        return 'text';
                    };

                    // Guardar cada mensaje
                    console.log(`   💾 Guardando ${mensajes.length} mensajes...`);

                    // Para chats muy grandes (>5000 mensajes), NO descargar multimedia (por performance)
                    const SKIP_MULTIMEDIA_THRESHOLD = 5000;
                    const skipMultimedia = mensajes.length > SKIP_MULTIMEDIA_THRESHOLD;
                    if (skipMultimedia) {
                        console.log(`   ⚡ Chat grande (${mensajes.length} mensajes) - multimedia DESACTIVADO para velocidad`);
                    }

                    for (const mensaje of mensajes) {
                        try {
                            const tipoMensaje = normalizarTipoMensaje(mensaje.type);

                            const mensajeData = {
                                mensaje_id: mensaje.id._serialized,
                                numero_telefono: numero,
                                nombre_contacto: nombreChat,
                                tipo_mensaje: tipoMensaje,
                                contenido_texto: mensaje.body || null,
                                from_me: mensaje.fromMe,
                                timestamp: mensaje.timestamp * 1000,
                                fecha_mensaje: new Date(mensaje.timestamp * 1000),
                                quote_mensaje_id: mensaje.hasQuotedMsg ? (mensaje._data.quotedMsg?.id?._serialized || null) : null,
                                media_url: null,
                                media_mimetype: null,
                                media_filename: null,
                                media_size: null
                            };

                            // Descargar multimedia si existe (con timeout de 30 segundos)
                            // SKIP si el chat es muy grande (>5000 mensajes) por performance
                            if (!skipMultimedia && mensaje.hasMedia && ['image', 'video', 'audio', 'document', 'ptt', 'album'].includes(tipoMensaje)) {
                                try {
                                    // Timeout de 30 segundos para descargas
                                    const TIMEOUT_MS = 30000;
                                    const timeoutPromise = new Promise((_, reject) =>
                                        setTimeout(() => reject(new Error('Download timeout')), TIMEOUT_MS)
                                    );

                                    const media = await Promise.race([
                                        mensaje.downloadMedia(),
                                        timeoutPromise
                                    ]);

                                    if (media) {
                                        mensajeData.media_mimetype = media.mimetype;
                                        mensajeData.media_filename = media.filename || `${tipoMensaje}_${mensaje.timestamp}`;
                                        mensajeData.media_size = media.data.length;
                                        mensajeData.media_url = `data:${media.mimetype};base64,${media.data}`;
                                        archivosDescargados++;
                                    }
                                    // Pausa entre descargas
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                } catch (mediaError) {
                                    if (mediaError.message === 'Download timeout') {
                                        console.log(`   ⏱️  Timeout descargando ${tipoMensaje} - saltando archivo`);
                                    } else {
                                        console.log(`   ⚠️  Error descargando multimedia: ${mediaError.message}`);
                                    }
                                    // Guardar metadata aunque falle la descarga
                                    mensajeData.media_mimetype = mensaje._data.mimetype || null;
                                    mensajeData.media_filename = mensaje._data.filename || `${tipoMensaje}_${mensaje.timestamp}`;
                                    mensajeData.media_size = mensaje._data.size || null;
                                }
                            }

                            // Insertar mensaje
                            await conexionChat.execute(`
                                INSERT IGNORE INTO chat_messages
                                (mensaje_id, numero_telefono, nombre_contacto, tipo_mensaje, contenido_texto,
                                 media_url, media_mimetype, media_filename, media_size, from_me, timestamp, fecha_mensaje, quote_mensaje_id)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [
                                mensajeData.mensaje_id,
                                mensajeData.numero_telefono,
                                mensajeData.nombre_contacto,
                                mensajeData.tipo_mensaje,
                                mensajeData.contenido_texto,
                                mensajeData.media_url,
                                mensajeData.media_mimetype,
                                mensajeData.media_filename,
                                mensajeData.media_size,
                                mensajeData.from_me,
                                mensajeData.timestamp,
                                mensajeData.fecha_mensaje,
                                mensajeData.quote_mensaje_id
                            ]);

                            mensajesNuevos++;
                        } catch (msgError) {
                            if (!msgError.message.includes('Duplicate')) {
                                erroresMensajes++;
                                console.error(`   ❌ Error en mensaje: ${msgError.message}`);
                            }
                        }
                    }

                    // Actualizar estado de sincronización del chat
                    await conexionChat.execute(`
                        INSERT INTO chat_sync_status
                        (numero_telefono, nombre_contacto, total_mensajes, sincronizado_completo, fecha_ultima_sincronizacion)
                        VALUES (?, ?, ?, TRUE, NOW())
                        ON DUPLICATE KEY UPDATE
                            nombre_contacto = VALUES(nombre_contacto),
                            total_mensajes = total_mensajes + ?,
                            sincronizado_completo = TRUE,
                            fecha_ultima_sincronizacion = NOW()
                    `, [numero, nombreChat, mensajesNuevos, mensajesNuevos]);

                    totalMensajesSincronizados += mensajesNuevos;
                    procesados++;

                    // Actualizar estado global
                    estadoSincronizacion.chatsProcessed = procesados;
                    estadoSincronizacion.totalMensajes = totalMensajesSincronizados;
                    await guardarEstadoSincronizacion(conexionChat, estadoSincronizacion);

                    console.log(`   ✅ COMPLETADO: ${mensajesNuevos} mensajes guardados | ${archivosDescargados} archivos | ${erroresMensajes} errores`);
                    console.log(`   📊 Progreso global: ${procesados}/${totalChats} (${Math.round(procesados/totalChats*100)}%) | Total mensajes: ${totalMensajesSincronizados}`);

                    // Marcar como exitoso
                    exito = true;

                    // Pausa entre chats
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (chatError) {
                    ultimoError = chatError;
                    console.error(`   ❌ ERROR en intento ${intentos}/${MAX_REINTENTOS}: ${chatError.message}`);

                    if (intentos < MAX_REINTENTOS) {
                        console.log(`   🔁 Reintentando en ${intentos * 2} segundos...`);
                    } else {
                        console.error(`   💥 FALLO DEFINITIVO después de ${MAX_REINTENTOS} intentos`);
                        const numero = formatPhoneNumber(chat.id._serialized);
                        chatsConError.push({
                            numero: numero,
                            nombre: chat.name || numero,
                            error: chatError.message
                        });
                        procesados++;
                        estadoSincronizacion.chatsProcessed = procesados;
                        estadoSincronizacion.chatsConError++;
                        estadoSincronizacion.chatsFallidos.push({
                            numero: numero,
                            nombre: chat.name || numero,
                            error: chatError.message
                        });
                        await guardarEstadoSincronizacion(conexionChat, estadoSincronizacion);
                    }
                }
            }

            // Cerrar conexión del chat
            if (conexionChat) {
                try { await conexionChat.end(); } catch (e) {}
            }
        }

        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 SINCRONIZACIÓN COMPLETADA                      ║
╚════════════════════════════════════════════════════════════════╝
📊 Chats procesados: ${procesados}/${totalChats}
✅ Chats exitosos: ${procesados - chatsConError.length}
❌ Chats con error: ${chatsConError.length}
💬 Total mensajes: ${totalMensajesSincronizados}
⏱️  Duración: ${((new Date() - estadoSincronizacion.iniciada) / 1000 / 60).toFixed(1)} minutos
${chatsConError.length > 0 ? '\n⚠️  CHATS CON ERROR:\n' + chatsConError.map(c => `   - ${c.nombre} (${c.numero}): ${c.error}`).join('\n') : ''}
╚════════════════════════════════════════════════════════════════╝
        `);

        // Marcar como finalizada
        estadoSincronizacion.enProgreso = false;
        estadoSincronizacion.finalizada = new Date();
        await guardarEstadoSincronizacion(conexion, estadoSincronizacion);

    } catch (error) {
        console.error('\n╔════════════════════════════════════════════════════════════════╗');
        console.error('║              ERROR CRÍTICO EN SINCRONIZACIÓN                   ║');
        console.error('╚════════════════════════════════════════════════════════════════╝');
        console.error(`❌ Error: ${error.message}`);
        console.error(`📍 Stack: ${error.stack}`);
        estadoSincronizacion.enProgreso = false;
        estadoSincronizacion.error = error.message;
        estadoSincronizacion.finalizada = new Date();
        if (conexion) {
            await guardarEstadoSincronizacion(conexion, estadoSincronizacion);
        }
        throw error;
    } finally {
        if (conexion) {
            await conexion.end();
        }
    }
}

// ============================================
// Función para guardar estado en base de datos
// ============================================
async function guardarEstadoSincronizacion(conexion, estado) {
    try {
        await conexion.execute(`
            INSERT INTO sync_state
            (id, en_progreso, total_chats, chats_processed, total_mensajes, chats_con_error, iniciada, finalizada, error, chats_fallidos, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                en_progreso = VALUES(en_progreso),
                total_chats = VALUES(total_chats),
                chats_processed = VALUES(chats_processed),
                total_mensajes = VALUES(total_mensajes),
                chats_con_error = VALUES(chats_con_error),
                iniciada = VALUES(iniciada),
                finalizada = VALUES(finalizada),
                error = VALUES(error),
                chats_fallidos = VALUES(chats_fallidos),
                updated_at = NOW()
        `, [
            estado.enProgreso || false,
            estado.totalChats || 0,
            estado.chatsProcessed || 0,
            estado.totalMensajes || 0,
            estado.chatsConError || 0,
            estado.iniciada || null,
            estado.finalizada || null,
            estado.error || null,
            JSON.stringify(estado.chatsFallidos || [])
        ]);
    } catch (err) {
        console.error(`⚠️  Error guardando estado en BD: ${err.message}`);
        console.error(`⚠️  Estado que causó el error:`, JSON.stringify(estado, null, 2));
    }
}

// ============================================
// Función para restaurar estado desde base de datos
// ============================================
async function restaurarEstadoSincronizacion() {
    let conexion = null;
    try {
        conexion = await getDBConnection();
        const [rows] = await conexion.execute('SELECT * FROM sync_state WHERE id = 1');

        if (rows.length > 0) {
            const estado = rows[0];
            estadoSincronizacion = {
                enProgreso: estado.en_progreso,
                totalChats: estado.total_chats,
                chatsProcessed: estado.chats_processed,
                totalMensajes: estado.total_mensajes,
                chatsConError: estado.chats_con_error || 0,
                iniciada: estado.iniciada,
                finalizada: estado.finalizada,
                error: estado.error,
                chatsFallidos: JSON.parse(estado.chats_fallidos || '[]')
            };
            console.log('✅ Estado de sincronización restaurado desde BD');
        }
    } catch (err) {
        console.log(`⚠️  No se pudo restaurar estado: ${err.message}`);
    } finally {
        if (conexion) await conexion.end();
    }
}

// ============================================
// RUTA: Obtener estado de sincronización
// ============================================
async function getSyncStatus(req, res) {
    try {
        const conexion = await getDBConnection();

        const [stats] = await conexion.execute(`
            SELECT
                COUNT(*) as total_contactos,
                SUM(total_mensajes) as total_mensajes,
                SUM(CASE WHEN sincronizado_completo = TRUE THEN 1 ELSE 0 END) as contactos_sincronizados,
                MAX(fecha_ultima_sincronizacion) as ultima_sincronizacion
            FROM chat_sync_status
        `);

        await conexion.end();

        // Combinar estadísticas de BD con estado de sincronización en progreso
        res.json({
            success: true,
            stats: stats[0],
            sincronizacionEnProgreso: estadoSincronizacion.enProgreso,
            progresoActual: estadoSincronizacion.enProgreso ? {
                totalChats: estadoSincronizacion.totalChats,
                chatsProcessed: estadoSincronizacion.chatsProcessed,
                porcentaje: Math.round((estadoSincronizacion.chatsProcessed / estadoSincronizacion.totalChats) * 100),
                totalMensajes: estadoSincronizacion.totalMensajes,
                iniciada: estadoSincronizacion.iniciada
            } : null,
            ultimaSincronizacion: estadoSincronizacion.finalizada
        });
    } catch (error) {
        console.error('❌ Error obteniendo estado de sincronización:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================
// RUTA: Búsqueda de mensajes
// ============================================
async function searchMessages(req, res) {
    try {
        const { query } = req.query;

        if (!query || query.length < 3) {
            return res.json({
                success: true,
                resultados: []
            });
        }

        const conexion = await getDBConnection();

        const [resultados] = await conexion.execute(`
            SELECT
                mensaje_id,
                numero_telefono,
                nombre_contacto,
                contenido_texto,
                tipo_mensaje,
                fecha_mensaje,
                from_me
            FROM chat_messages
            WHERE contenido_texto LIKE ?
            ORDER BY timestamp DESC
            LIMIT 50
        `, [`%${query}%`]);

        await conexion.end();

        res.json({
            success: true,
            resultados: resultados
        });
    } catch (error) {
        console.error('❌ Error buscando mensajes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================
// RUTA: Descargar archivo multimedia
// ============================================
async function downloadMedia(req, res, client) {
    try {
        const { messageId } = req.params;

        if (!client || !client.info) {
            return res.status(503).json({
                success: false,
                error: 'Cliente de WhatsApp no conectado'
            });
        }

        console.log(`📥 Descargando media para mensaje: ${messageId}`);

        // Buscar el mensaje en WhatsApp
        const message = await client.getMessageById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado'
            });
        }

        if (!message.hasMedia) {
            return res.status(400).json({
                success: false,
                error: 'El mensaje no contiene archivos multimedia'
            });
        }

        // Descargar el archivo
        const media = await message.downloadMedia();

        if (!media) {
            return res.status(404).json({
                success: false,
                error: 'No se pudo descargar el archivo'
            });
        }

        console.log(`✅ Media descargado: ${media.mimetype}, ${media.data.length} bytes`);

        // Devolver el archivo en base64
        res.json({
            success: true,
            media: {
                data: media.data,
                mimetype: media.mimetype,
                filename: media.filename || 'archivo'
            }
        });

    } catch (error) {
        console.error('❌ Error descargando media:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================
// RUTA: Limpiar sincronización (forzar re-sincronización)
// ============================================
async function clearSyncStatus(req, res) {
    try {
        const conexion = await getDBConnection();

        // Marcar todos los chats como no sincronizados
        await conexion.execute(`
            UPDATE chat_sync_status
            SET sincronizado_completo = FALSE,
                total_mensajes = 0,
                fecha_ultima_sincronizacion = NULL
        `);

        // Opcional: también podemos borrar los mensajes (descomentado si quieres borrar todo)
        // await conexion.execute('DELETE FROM chat_messages');

        await conexion.end();

        res.json({
            success: true,
            message: 'Estado de sincronización limpiado. La próxima sincronización descargará todo de nuevo.'
        });

        console.log('✅ Estado de sincronización limpiado');
    } catch (error) {
        console.error('❌ Error limpiando sincronización:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================
// RUTA: Listar todos los chats disponibles (sin sincronizar)
// ============================================
async function listAvailableChats(req, res, client) {
    try {
        if (!client || !client.info) {
            return res.status(503).json({
                success: false,
                error: 'Cliente de WhatsApp no conectado'
            });
        }

        console.log('📥 Obteniendo lista de chats disponibles...');
        const chats = await client.getChats();

        const chatsList = chats.map(chat => ({
            id: chat.id._serialized,
            numero: formatPhoneNumber(chat.id._serialized),
            nombre: chat.name || 'Sin nombre',
            esGrupo: chat.isGroup,
            timestamp: chat.timestamp,
            archivado: chat.archived || false,
            mensajesNoLeidos: chat.unreadCount || 0
        }));

        console.log(`📊 Total de chats disponibles: ${chatsList.length}`);
        console.log(`   - Individuales: ${chatsList.filter(c => !c.esGrupo).length}`);
        console.log(`   - Grupos: ${chatsList.filter(c => c.esGrupo).length}`);
        console.log(`   - Archivados: ${chatsList.filter(c => c.archivado).length}`);

        res.json({
            success: true,
            totalChats: chatsList.length,
            chats: chatsList
        });

    } catch (error) {
        console.error('❌ Error obteniendo chats disponibles:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================
// FUNCIÓN: Guardar mensaje individual automáticamente
// ============================================
async function guardarMensajeAutomatico(mensaje, chat, client) {
    try {
        const conexion = await getDBConnection();

        // Obtener número de teléfono limpio
        const numero = formatPhoneNumber(chat.id._serialized);
        const nombreContacto = chat.name || numero;

        // Función para validar y normalizar el tipo de mensaje
        const normalizarTipoMensaje = (type) => {
            if (!type || typeof type !== 'string' || type.trim() === '') {
                return 'text';
            }
            const tipoLimpio = type.trim().toLowerCase();
            const tiposValidos = ['text', 'image', 'video', 'audio', 'document', 'ptt', 'sticker', 'location', 'vcard', 'call_log', 'chat'];
            if (tiposValidos.includes(tipoLimpio)) {
                return tipoLimpio;
            }
            return 'text';
        };

        // Validar y normalizar el tipo de mensaje
        const tipoMensaje = normalizarTipoMensaje(mensaje.type);

        const mensajeData = {
            mensaje_id: mensaje.id._serialized,
            numero_telefono: numero,
            nombre_contacto: nombreContacto,
            tipo_mensaje: tipoMensaje,
            contenido_texto: mensaje.body || null,
            from_me: mensaje.fromMe,
            timestamp: mensaje.timestamp * 1000,
            fecha_mensaje: new Date(mensaje.timestamp * 1000),
            quote_mensaje_id: mensaje.hasQuotedMsg ? (mensaje._data.quotedMsg?.id?._serialized || null) : null,
            media_url: null,
            media_mimetype: null,
            media_filename: null,
            media_size: null
        };

        // Descargar multimedia si existe
        if (mensaje.hasMedia && ['image', 'video', 'audio', 'document', 'ptt'].includes(tipoMensaje)) {
            try {
                const media = await mensaje.downloadMedia();
                if (media) {
                    mensajeData.media_mimetype = media.mimetype;
                    mensajeData.media_filename = media.filename || `${tipoMensaje}_${mensaje.timestamp}`;
                    mensajeData.media_size = media.data.length;
                    mensajeData.media_url = `data:${media.mimetype};base64,${media.data}`;
                }
            } catch (mediaError) {
                console.log(`⚠️  Error descargando multimedia automático: ${mediaError.message}`);
            }
        }

        // Insertar mensaje (ignorar duplicados)
        await conexion.execute(`
            INSERT IGNORE INTO chat_messages
            (mensaje_id, numero_telefono, nombre_contacto, tipo_mensaje, contenido_texto,
             media_url, media_mimetype, media_filename, media_size, from_me, timestamp, fecha_mensaje, quote_mensaje_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            mensajeData.mensaje_id,
            mensajeData.numero_telefono,
            mensajeData.nombre_contacto,
            mensajeData.tipo_mensaje,
            mensajeData.contenido_texto,
            mensajeData.media_url,
            mensajeData.media_mimetype,
            mensajeData.media_filename,
            mensajeData.media_size,
            mensajeData.from_me,
            mensajeData.timestamp,
            mensajeData.fecha_mensaje,
            mensajeData.quote_mensaje_id
        ]);

        await conexion.end();
        console.log(`✅ [AUTO-SYNC] Mensaje guardado: ${numero} - ${tipoMensaje}`);
        return true;

    } catch (error) {
        console.error(`❌ [AUTO-SYNC] Error guardando mensaje: ${error.message}`);
        return false;
    }
}

// ============================================
// RUTA: Cambiar modo de chat (bot/humano)
// ============================================
async function cambiarModoChat(req, res) {
    try {
        const { numero, modo } = req.body;

        if (!numero || !modo) {
            return res.status(400).json({
                success: false,
                error: 'Número y modo son requeridos'
            });
        }

        if (!['bot', 'humano'].includes(modo)) {
            return res.status(400).json({
                success: false,
                error: 'Modo debe ser "bot" o "humano"'
            });
        }

        const conexion = await getDBConnection();

        // Actualizar o crear el registro en chat_sync_status
        await conexion.execute(`
            INSERT INTO chat_sync_status (numero_telefono, modo_chat, updated_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                modo_chat = VALUES(modo_chat),
                updated_at = NOW()
        `, [numero, modo]);

        await conexion.end();

        console.log(`✅ Modo de chat cambiado: ${numero} → ${modo}`);

        res.json({
            success: true,
            message: `Modo cambiado a ${modo}`,
            numero: numero,
            modo: modo
        });

    } catch (error) {
        console.error('❌ Error cambiando modo de chat:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    getContactsList,
    getContactMessages,
    syncChatHistory,
    getSyncStatus,
    searchMessages,
    downloadMedia,
    clearSyncStatus,
    listAvailableChats,
    guardarMensajeAutomatico,
    restaurarEstadoSincronizacion,
    cambiarModoChat
};
