const mysql = require('mysql2/promise');

// Configuración de la base de datos del sistema
const dbSistema = {
    host: process.env.DB_SYSTEM_HOST || 'localhost',
    user: process.env.DB_SYSTEM_USER || 'debian-sys-maint',
    password: process.env.DB_SYSTEM_PASSWORD || 'IOHcXunF7795fMRI',
    database: process.env.DB_SYSTEM_DATABASE || 'solucnet_auth_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Función para obtener la configuración de la BD externa
async function obtenerConfigBDExterna() {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [configs] = await conexion.execute(
            'SELECT * FROM config_bd_externa WHERE activa = TRUE LIMIT 1'
        );

        await conexion.end();

        if (configs.length === 0) {
            return { success: false, message: 'No hay configuración de BD externa activa' };
        }

        return { success: true, config: configs[0] };

    } catch (error) {
        console.error('❌ Error obteniendo configuración BD externa:', error.message);
        return { success: false, message: error.message };
    }
}

// Función para actualizar o crear la configuración de la BD externa
async function actualizarConfigBDExterna(id, datos) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Si no hay ID válido (null, undefined, 0, '0', vacío), crear nueva configuración
        if (!id || id === '' || id === 'undefined' || id === '0' || id === 0) {
            // Desactivar cualquier configuración activa existente
            await conexion.execute('UPDATE config_bd_externa SET activa = FALSE');

            // Insertar nueva configuración
            const [result] = await conexion.execute(`
                INSERT INTO config_bd_externa
                (nombre, host, usuario, password, base_datos, puerto, activa)
                VALUES (?, ?, ?, ?, ?, ?, TRUE)
            `, [
                datos.nombre || 'Solucnet.com',
                datos.host,
                datos.usuario,
                datos.password,
                datos.base_datos,
                datos.puerto || 3306
            ]);

            await conexion.end();
            return { success: true, message: 'Configuración creada exitosamente', id: result.insertId };
        }

        // Si hay ID, actualizar configuración existente
        const campos = [];
        const valores = [];

        if (datos.nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(datos.nombre);
        }
        if (datos.host !== undefined) {
            campos.push('host = ?');
            valores.push(datos.host);
        }
        if (datos.usuario !== undefined) {
            campos.push('usuario = ?');
            valores.push(datos.usuario);
        }
        if (datos.password !== undefined) {
            campos.push('password = ?');
            valores.push(datos.password);
        }
        if (datos.base_datos !== undefined) {
            campos.push('base_datos = ?');
            valores.push(datos.base_datos);
        }
        if (datos.puerto !== undefined) {
            campos.push('puerto = ?');
            valores.push(datos.puerto);
        }
        if (datos.activa !== undefined) {
            campos.push('activa = ?');
            valores.push(datos.activa);
        }

        if (campos.length === 0) {
            await conexion.end();
            return { success: false, message: 'No hay datos para actualizar' };
        }

        valores.push(id);

        const query = `UPDATE config_bd_externa SET ${campos.join(', ')} WHERE id = ?`;
        await conexion.execute(query, valores);

        await conexion.end();

        return { success: true, message: 'Configuración actualizada exitosamente' };

    } catch (error) {
        console.error('❌ Error actualizando configuración BD externa:', error.message);
        return { success: false, message: error.message };
    }
}

// Función para sincronizar clientes desde la BD externa
async function sincronizarClientesExternos() {
    let conexionSistema = null;
    let conexionExterna = null;

    try {
        // Obtener configuración de BD externa
        const configResult = await obtenerConfigBDExterna();
        if (!configResult.success) {
            return { success: false, message: configResult.message };
        }

        const config = configResult.config;

        // Conectar a la base de datos del sistema
        conexionSistema = await mysql.createConnection(dbSistema);
        await conexionSistema.query('USE solucnet_auth_system');

        // Conectar a la base de datos externa
        const configExterna = {
            host: config.host,
            user: config.usuario,
            password: config.password,
            database: config.base_datos,
            port: config.puerto || 3306
        };

        console.log(`🔄 Conectando a BD externa: ${config.host}/${config.base_datos}`);
        conexionExterna = await mysql.createConnection(configExterna);

        // Consultar clientes de la BD externa
        const [clientesExternos] = await conexionExterna.execute(
            'SELECT id, nombre_completo, numero_documento, telefono, celular, direccion, email, plan_contratado, estado, fecha_registro FROM clientes WHERE estado = "Activo"'
        );

        console.log(`📥 Clientes encontrados en BD externa: ${clientesExternos.length}`);

        let nuevos = 0;
        let actualizados = 0;

        // Insertar o actualizar clientes en la tabla local
        for (const cliente of clientesExternos) {
            const [existe] = await conexionSistema.execute(
                'SELECT id FROM clientes_externos WHERE id_externo = ? AND bd_origen = "solucnet.com"',
                [cliente.id]
            );

            if (existe.length === 0) {
                // Insertar nuevo cliente
                await conexionSistema.execute(`
                    INSERT INTO clientes_externos (
                        id_externo, nombre, cedula, telefono, movil, direccion,
                        email, plan_contratado, coordenadas, estado, fecha_registro, bd_origen
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    cliente.id,
                    cliente.nombre_completo || '',
                    cliente.numero_documento || '',
                    cliente.telefono || '',
                    cliente.celular || '',
                    cliente.direccion || '',
                    cliente.email || '',
                    cliente.plan_contratado || '',
                    '', // coordenadas no existe en la BD externa
                    cliente.estado || 'Activo',
                    cliente.fecha_registro || null,
                    'solucnet.com'
                ]);
                nuevos++;
            } else {
                // Actualizar cliente existente
                await conexionSistema.execute(`
                    UPDATE clientes_externos SET
                        nombre = ?, cedula = ?, telefono = ?, movil = ?,
                        direccion = ?, email = ?, plan_contratado = ?, coordenadas = ?, estado = ?,
                        fecha_registro = ?
                    WHERE id_externo = ? AND bd_origen = "solucnet.com"
                `, [
                    cliente.nombre_completo || '',
                    cliente.numero_documento || '',
                    cliente.telefono || '',
                    cliente.celular || '',
                    cliente.direccion || '',
                    cliente.email || '',
                    cliente.plan_contratado || '',
                    '', // coordenadas no existe en la BD externa
                    cliente.estado || 'Activo',
                    cliente.fecha_registro || null,
                    cliente.id
                ]);
                actualizados++;
            }
        }

        // Actualizar timestamp de última sincronización
        await conexionSistema.execute(
            'UPDATE config_bd_externa SET ultima_sincronizacion = NOW() WHERE id = ?',
            [config.id]
        );

        await conexionSistema.end();
        await conexionExterna.end();

        console.log(`✅ Sincronización completada: ${nuevos} nuevos, ${actualizados} actualizados`);

        return {
            success: true,
            message: 'Sincronización completada exitosamente',
            nuevos: nuevos,
            actualizados: actualizados,
            total: clientesExternos.length
        };

    } catch (error) {
        if (conexionSistema) await conexionSistema.end();
        if (conexionExterna) await conexionExterna.end();

        console.error('❌ Error sincronizando clientes externos:', error.message);
        return { success: false, message: error.message };
    }
}

// Función para obtener todos los clientes externos sincronizados
async function obtenerClientesExternos(filtros = {}) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        let query = 'SELECT * FROM clientes_externos WHERE 1=1';
        const valores = [];

        if (filtros.estado) {
            query += ' AND estado = ?';
            valores.push(filtros.estado);
        }

        if (filtros.bd_origen) {
            query += ' AND bd_origen = ?';
            valores.push(filtros.bd_origen);
        }

        if (filtros.busqueda) {
            query += ' AND (nombre LIKE ? OR cedula LIKE ? OR telefono LIKE ?)';
            const busqueda = `%${filtros.busqueda}%`;
            valores.push(busqueda, busqueda, busqueda);
        }

        query += ' ORDER BY nombre ASC';

        const [clientes] = await conexion.execute(query, valores);
        await conexion.end();

        return { success: true, clientes: clientes };

    } catch (error) {
        console.error('❌ Error obteniendo clientes externos:', error.message);
        return { success: false, message: error.message };
    }
}

// Función para obtener estadísticas de clientes externos
async function obtenerEstadisticasClientesExternos() {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [stats] = await conexion.execute(`
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'Activo' THEN 1 END) as activos,
                COUNT(CASE WHEN estado != 'Activo' THEN 1 END) as inactivos,
                MAX(fecha_sincronizacion) as ultima_sincronizacion
            FROM clientes_externos
        `);

        const [configResult] = await conexion.execute(
            'SELECT ultima_sincronizacion, nombre FROM config_bd_externa WHERE activa = TRUE LIMIT 1'
        );

        await conexion.end();

        return {
            success: true,
            estadisticas: {
                total: stats[0].total || 0,
                activos: stats[0].activos || 0,
                inactivos: stats[0].inactivos || 0,
                ultima_sincronizacion: stats[0].ultima_sincronizacion,
                config_nombre: configResult[0]?.nombre || 'Sin configurar',
                config_ultima_sync: configResult[0]?.ultima_sincronizacion
            }
        };

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error.message);
        return { success: false, message: error.message };
    }
}

// Función para probar la conexión a la BD externa
async function probarConexionBDExterna(configDatos) {
    let conexion = null;

    try {
        const config = {
            host: configDatos.host,
            user: configDatos.usuario,
            password: configDatos.password,
            database: configDatos.base_datos,
            port: configDatos.puerto || 3306,
            connectTimeout: 10000 // 10 segundos de timeout
        };

        console.log(`🔍 Probando conexión a: ${config.host}:${config.port}/${config.database}`);

        // Intentar conectar
        conexion = await mysql.createConnection(config);

        // Probar que la conexión funciona ejecutando una query simple
        const [result] = await conexion.execute('SELECT 1 as test');

        // Verificar que existe la tabla de clientes
        const [tables] = await conexion.execute(
            "SHOW TABLES LIKE 'clientes'"
        );

        await conexion.end();

        if (tables.length === 0) {
            return {
                success: false,
                message: 'Conexión exitosa, pero no se encontró la tabla "clientes" en la base de datos'
            };
        }

        // Contar registros en la tabla clientes
        conexion = await mysql.createConnection(config);
        const [count] = await conexion.execute('SELECT COUNT(*) as total FROM clientes');
        await conexion.end();

        return {
            success: true,
            message: `✅ Conexión exitosa! Se encontraron ${count[0].total} clientes en la base de datos`,
            clientesCount: count[0].total
        };

    } catch (error) {
        if (conexion) {
            try {
                await conexion.end();
            } catch (e) {
                // Ignorar errores al cerrar
            }
        }

        let mensaje = 'Error de conexión: ';

        if (error.code === 'ENOTFOUND') {
            mensaje += 'No se pudo resolver el nombre del host. Verifica que el host sea correcto.';
        } else if (error.code === 'ECONNREFUSED') {
            mensaje += 'Conexión rechazada. Verifica que el puerto sea correcto y que el servidor esté activo.';
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            mensaje += 'Acceso denegado. Verifica el usuario y la contraseña.';
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            mensaje += 'La base de datos especificada no existe.';
        } else if (error.code === 'ETIMEDOUT') {
            mensaje += 'Tiempo de espera agotado. El servidor no responde.';
        } else {
            mensaje += error.message;
        }

        console.error('❌ Error probando conexión BD externa:', mensaje);
        return { success: false, message: mensaje };
    }
}

// Exportar funciones
module.exports = {
    obtenerConfigBDExterna,
    actualizarConfigBDExterna,
    sincronizarClientesExternos,
    obtenerClientesExternos,
    obtenerEstadisticasClientesExternos,
    probarConexionBDExterna
};
