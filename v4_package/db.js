const mysql = require('mysql2/promise');

// Configuración de tus bases de datos
const basesDatos = [
    { host: '19.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '19.168.99.11', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '19.168.99.2', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6' },
    { host: '19.168.99.51', user: 'ADFZ2I', password: 'MOZ1BWZ86BRMXFW', database: 'Mikrowisp6' }
];

// Configuración para base de datos del sistema de autenticación
// Base de datos separada para usuarios y configuración del sistema
const dbSistema = {
    host: process.env.DB_SYSTEM_HOST || 'localhost',
    user: process.env.DB_SYSTEM_USER || 'root',
    password: process.env.DB_SYSTEM_PASSWORD || '',
    database: 'solucnet_auth_system'
};

async function consultarCliente(cedula) {
    for (const bd of basesDatos) {
        try {
            // Validar conexi�n antes de consultar
            const validacion = await validarConexionBD(bd);
            if (!validacion.success) {
                console.error(`� Error de conexi�n en BD ${bd.database}: ${validacion.message}`);
                continue;
            }

            const conexion = await mysql.createConnection(bd);
            const cedulaNormalizada = Number(cedula.trim());
            const [clientes] = await conexion.execute(
                'SELECT id, nombre AS nombre, estado, cedula FROM usuarios WHERE cedula = ?',
                [cedula]
            );

            if (clientes.length === 0) {
                await conexion.end();
                continue;
            }

            const cliente = clientes[0];

 const [facturas] = await conexion.execute(
    `SELECT 
        DATE_FORMAT(vencimiento, '%d/%m/%Y') AS vencimiento,
        total,
        estado,
        CASE 
            WHEN vencimiento < CURDATE() THEN 'Vencida'
            ELSE 'No pagado'
        END AS situacion
     FROM facturas
     WHERE idcliente = ? AND TRIM(estado) IN ('No pagado', 'vencida')
     ORDER BY vencimiento ASC`,
    [cliente.id]
);

const [cuentas] = await conexion.execute(
                'SELECT cuenta FROM numero_de_cuenta',

            );
            if (cuentas.length === 0) {
                await conexion.end();
                continue;
            }

            const cuenta = cuentas[0];
            

            await conexion.end();
            return { cliente, facturas, cuenta, bd }; // Incluimos la BD donde se encontr�
        } catch (err) {
            console.error(`Error en BD ${bd.database}: ${err.message}`);
            continue;
        }
    }
    return null;
}







// Funci�n para validar conexi�n a la base de datos
async function validarConexionBD(configBD) {
    try {
        const conexion = await mysql.createConnection(configBD);
        await conexion.ping();
        await conexion.end();
        return { success: true, message: 'Conexi�n exitosa' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Nueva funci�n para insertar soporte
async function crearSoporte(idCliente, bd) {
    try {
        // Validar conexi�n antes de proceder
        const validacion = await validarConexionBD(bd);
        if (!validacion.success) {
            console.error('� Error de conexi�n a BD:', validacion.message);
            return null;
        }

        const conexion = await mysql.createConnection(bd);

        const sql = `
            INSERT INTO soporte (
                idcliente,
                idsoporte,
                asunto,
                fecha_soporte,
                estado,
                operador,
                procede,
                solicitante,
                lastdate,
                dp,
                oculto
            ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, NOW(), ?, ?)
        `;

        const valores = [
            idCliente,                               // idcliente
            1,                                       // idsoporte
            'LUZ ROJA EN EL EQUIPO.',       // asunto
            'abierto',                               // estado
            'CHATBOOT',                           // operador
            'S�',                                    // procede
            'cliente',                      // solicitante
            0,                                       // dp
            0                                        // oculto
        ];

        const [result] = await conexion.execute(sql, valores);
        await conexion.end();
        console.log('? Soporte creado con ID:', result.insertId);
        return result.insertId;
    } catch (err) {
        console.error('? Error insertando soporte:', err.message);
        return null;
    }
}

// ===== FUNCIONES PARA SISTEMA DE USUARIOS =====

// Crear tablas del sistema si no existen
async function inicializarSistema() {
    try {
        // Crear conexión sin especificar base de datos para crear la BD
        const conexionSinDB = await mysql.createConnection({
            host: dbSistema.host,
            user: dbSistema.user,
            password: dbSistema.password
        });

        // Crear base de datos si no existe
        await conexionSinDB.query('CREATE DATABASE IF NOT EXISTS solucnet_auth_system');
        await conexionSinDB.end();

        // Ahora conectar con la base de datos específica
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Crear tabla de usuarios
        await conexion.query(`
            CREATE TABLE IF NOT EXISTS usuarios_sistema (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                rol ENUM('soporte', 'admin') NOT NULL DEFAULT 'soporte',
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ultimo_acceso TIMESTAMP NULL,
                INDEX idx_username (username),
                INDEX idx_rol (rol)
            )
        `);

        // Crear tabla de números omitidos
        await conexion.query(`
            CREATE TABLE IF NOT EXISTS numeros_omitidos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero VARCHAR(20) UNIQUE NOT NULL,
                motivo TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                creado_por INT,
                activo BOOLEAN DEFAULT TRUE,
                INDEX idx_numero (numero),
                INDEX idx_activo (activo),
                FOREIGN KEY (creado_por) REFERENCES usuarios_sistema(id)
            )
        `);

        // Crear tabla de sesiones
        await conexion.query(`
            CREATE TABLE IF NOT EXISTS sesiones (
                id VARCHAR(255) PRIMARY KEY,
                usuario_id INT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_expiracion TIMESTAMP NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                INDEX idx_usuario (usuario_id),
                INDEX idx_expiracion (fecha_expiracion),
                FOREIGN KEY (usuario_id) REFERENCES usuarios_sistema(id)
            )
        `);

        // Crear tabla de logs de API
        await conexion.query(`
            CREATE TABLE IF NOT EXISTS logs_api (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_origen VARCHAR(45) NOT NULL,
                numero_destino VARCHAR(20),
                mensaje TEXT,
                estado ENUM('enviado', 'error_envio', 'error_parametros', 'error_whatsapp_no_listo', 'error_excepcion') NOT NULL,
                fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_fecha (fecha_envio),
                INDEX idx_estado (estado)
            )
        `);

        // Insertar usuarios por defecto si no existen
        const [usuarios] = await conexion.execute(
            'SELECT id FROM usuarios_sistema WHERE username = ?',
            ['admin']
        );

        if (usuarios.length === 0) {
            // Contraseña: admin123 (debería ser cambiada)
            const hashedPassword = await hashPassword('admin123');
            await conexion.execute(
                'INSERT INTO usuarios_sistema (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'Administrador', 'admin']
            );
            console.log('Usuario admin creado por defecto en solucnet_auth_system');
        }

        // Crear usuario de soporte por defecto
        const [usuariosSoporte] = await conexion.execute(
            'SELECT id FROM usuarios_sistema WHERE username = ?',
            ['soporte']
        );

        if (usuariosSoporte.length === 0) {
            // Contraseña: soporte123 (debería ser cambiada)
            const hashedPassword = await hashPassword('soporte123');
            await conexion.execute(
                'INSERT INTO usuarios_sistema (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
                ['soporte', hashedPassword, 'Soporte Técnico', 'soporte']
            );
            console.log('Usuario soporte creado por defecto en solucnet_auth_system');
        }

        // Crear usuario API especial si no existe
        const [usuariosAPI] = await conexion.execute(
            'SELECT id FROM usuarios_sistema WHERE username = ?',
            ['api']
        );

        if (usuariosAPI.length === 0) {
            // Contraseña especial para API
            const hashedPassword = await hashPassword('api_system_secure_2024');
            await conexion.execute(
                'INSERT INTO usuarios_sistema (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
                ['api', hashedPassword, 'Usuario API Especial', 'api']
            );
            console.log('✅ Usuario API especial creado por defecto en solucnet_auth_system');
        }

        await conexion.end();
        console.log('Sistema de usuarios inicializado correctamente');
    } catch (error) {
        console.error('Error inicializando sistema de usuarios:', error.message);
    }
}

// Función de hash para contraseñas usando bcrypt
async function hashPassword(password) {
    const bcrypt = require('bcrypt');
    return await bcrypt.hash(password, 10);
}

// Verificar contraseña
async function verifyPassword(password, hashedPassword) {
    try {
        const bcrypt = require('bcrypt');
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        // Fallback para contraseñas antiguas con SHA256 (por compatibilidad)
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(password + 'solucnet_salt').digest('hex');
        return hash === hashedPassword;
    }
}

// Buscar usuario por credenciales
async function buscarUsuario(username, password) {
    try {
        console.log('🔍 Intentando conectar con:', {
            host: dbSistema.host,
            user: dbSistema.user,
            password: dbSistema.password ? '***' : 'no definido',
            database: dbSistema.database
        });
        
        // Validar conexión al sistema de autenticación
        const validacion = await validarConexionBD(dbSistema);
        if (!validacion.success) {
            console.error('✗ Error de conexión al sistema de autenticación:', validacion.message);
            throw new Error('Error de conexión al sistema de autenticación');
        }
        
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [usuarios] = await conexion.execute(
            'SELECT id, username, password, nombre, rol, activo FROM usuarios_sistema WHERE username = ? AND activo = TRUE',
            [username]
        );

        await conexion.end();

        if (usuarios.length === 0) {
            return null;
        }

        const usuario = usuarios[0];
        const passwordValida = await verifyPassword(password, usuario.password);

        if (passwordValida) {
            delete usuario.password; // No devolver la contraseña
            return usuario;
        }

        return null;
    } catch (error) {
        console.error('Error buscando usuario:', error.message);
        return null;
    }
}

// Crear token JWT
async function crearToken(usuarioId, userData) {
    try {
        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'solucnet_jwt_secret_2024';

        const payload = {
            userId: usuarioId,
            username: userData.username,
            nombre: userData.nombre,
            rol: userData.rol,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
        };

        const token = jwt.sign(payload, SECRET_KEY);

        // También guardamos una referencia en la base de datos para control de sesiones
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        await conexion.execute(
            'INSERT INTO sesiones (id, usuario_id, fecha_expiracion) VALUES (?, ?, ?)',
            [token.substring(0, 255), usuarioId, new Date(payload.exp * 1000)]
        );

        await conexion.end();
        return token;
    } catch (error) {
        console.error('Error creando token:', error.message);
        return null;
    }
}

// Crear token eterno (sin expiración) para usuario API
async function crearTokenEternoAPI() {
    try {
        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'solucnet_jwt_secret_2024';

        console.log('🔧 Generando token eterno para usuario API...');

        const payload = {
            userId: 'api_system',
            username: 'api',
            nombre: 'Usuario API Especial',
            rol: 'api',
            iat: Math.floor(Date.now() / 1000),
            // Sin exp (expiración) para que nunca expire
        };

        const token = jwt.sign(payload, SECRET_KEY);
        console.log('✅ Token eterno generado exitosamente');

        return token;
    } catch (error) {
        console.error('❌ Error creando token eterno:', error.message);
        return null;
    }
}

// Verificar token JWT
async function verificarToken(token) {
    try {
        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'solucnet_jwt_secret_2024';
        
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Verificar que el usuario aún existe y está activo
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [usuarios] = await conexion.execute(
            'SELECT id, username, nombre, rol, activo FROM usuarios_sistema WHERE id = ? AND activo = TRUE',
            [decoded.userId]
        );

        if (usuarios.length === 0) {
            await conexion.end();
            return null;
        }

        const usuario = usuarios[0];
        await conexion.end();
        
        return {
            usuario_id: usuario.id,
            username: usuario.username,
            nombre: usuario.nombre,
            rol: usuario.rol,
            token_data: decoded
        };
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            console.log('Token inválido o expirado:', error.message);
        } else {
            console.error('Error verificando token:', error.message);
        }
        return null;
    }
}

// Verificar token eterno (sin expiración)
async function verificarTokenEterno(token) {
    try {
        const jwt = require('jsonwebtoken');
        const SECRET_KEY = process.env.JWT_SECRET || 'solucnet_jwt_secret_2024';

        // Para tokens eternos, usamos decode en lugar de verify
        const decoded = jwt.decode(token, { complete: true });

        if (!decoded) {
            console.log('Token eterno inválido');
            return null;
        }

        const payload = decoded.payload;

        // Verificar que sea un token eterno (sin expiración y con propiedades específicas)
        if (payload.permanent !== true || payload.rol !== 'api') {
            console.log('El token no es un token eterno válido');
            return null;
        }

        // Verificar que sea un token eterno de nuestra API
        if (!payload.userId || !payload.username || !payload.description) {
            console.log('Token eterno con estructura inválida');
            return null;
        }

        // Retornar usuario simulado para token eterno
        return {
            usuario_id: payload.userId,
            username: payload.username,
            nombre: payload.nombre,
            rol: payload.rol,
            token_data: payload,
            is_eternal: true
        };

    } catch (error) {
        console.error('Error verificando token eterno:', error.message);
        return null;
    }
}

// Cerrar sesión (invalidar token)
async function cerrarSesion(token) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Marcar el token como inactivo en la base de datos
        await conexion.execute(
            'UPDATE sesiones SET activo = FALSE WHERE id = ?',
            [token.substring(0, 255)]
        );

        await conexion.end();
        return true;
    } catch (error) {
        console.error('Error cerrando sesión:', error.message);
        return false;
    }
}

// ===== FUNCIONES PARA NÚMEROS OMITIDOS =====

// Agregar número omitido
async function agregarNumeroOmitido(numero, motivo, usuarioId) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Verificar si el número ya existe
        const [existe] = await conexion.execute(
            'SELECT id FROM numeros_omitidos WHERE numero = ? AND activo = TRUE',
            [numero]
        );

        if (existe.length > 0) {
            await conexion.end();
            return { success: false, message: 'El número ya está en la lista de omitidos' };
        }

        await conexion.execute(
            'INSERT INTO numeros_omitidos (numero, motivo, creado_por) VALUES (?, ?, ?)',
            [numero, motivo, usuarioId]
        );

        await conexion.end();
        return { success: true, message: 'Número agregado a la lista de omitidos' };
    } catch (error) {
        console.error('Error agregando número omitido:', error.message);
        return { success: false, message: 'Error interno del servidor' };
    }
}

// Obtener lista de números omitidos
async function obtenerNumerosOmitidos() {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [numeros] = await conexion.execute(`
            SELECT n.id, n.numero, n.motivo, n.fecha_creacion, u.nombre as creado_por
            FROM numeros_omitidos n
            LEFT JOIN usuarios_sistema u ON n.creado_por = u.id
            WHERE n.activo = TRUE
            ORDER BY n.fecha_creacion DESC
        `);

        await conexion.end();
        return { success: true, numeros };
    } catch (error) {
        console.error('Error obteniendo números omitidos:', error.message);
        return { success: false, message: 'Error interno del servidor' };
    }
}

// Verificar si un número está omitido
async function estaNumeroOmitido(numero) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [numeros] = await conexion.execute(
            'SELECT id FROM numeros_omitidos WHERE numero = ? AND activo = TRUE',
            [numero]
        );

        await conexion.end();
        return numeros.length > 0;
    } catch (error) {
        console.error('Error verificando número omitido:', error.message);
        return false;
    }
}

// Eliminar número omitido
async function eliminarNumeroOmitido(id) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        await conexion.execute(
            'UPDATE numeros_omitidos SET activo = FALSE WHERE id = ?',
            [id]
        );

        await conexion.end();
        return { success: true, message: 'Número eliminado de la lista de omitidos' };
    } catch (error) {
        console.error('Error eliminando número omitido:', error.message);
        return { success: false, message: 'Error interno del servidor' };
    }
}

// ===== FUNCIONES DE GESTIÓN DE USUARIOS =====

// Obtener todos los usuarios
async function obtenerUsuarios() {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [usuarios] = await conexion.execute(
            'SELECT id, username, nombre, rol, fecha_creacion FROM usuarios_sistema ORDER BY fecha_creacion DESC'
        );

        await conexion.end();
        return { success: true, users: usuarios };
    } catch (error) {
        console.error('Error obteniendo usuarios:', error.message);
        return { success: false, message: 'Error interno del servidor' };
    }
}

// Crear nuevo usuario
async function crearUsuario(username, password, nombre, rol) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Verificar si el usuario ya existe
        const [existente] = await conexion.execute(
            'SELECT id FROM usuarios_sistema WHERE username = ?',
            [username]
        );

        if (existente.length > 0) {
            await conexion.end();
            return { success: false, message: 'El nombre de usuario ya existe' };
        }

        // Crear hash de la contraseña
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        await conexion.execute(
            'INSERT INTO usuarios_sistema (username, password, nombre, rol, fecha_creacion) VALUES (?, ?, ?, ?, NOW())',
            [username, hashedPassword, nombre, rol]
        );

        await conexion.end();
        return { success: true, message: 'Usuario creado exitosamente' };
    } catch (error) {
        console.error('Error creando usuario:', error.message);
        return { success: false, message: 'Error interno del servidor' };
    }
}

// Eliminar usuario
async function eliminarUsuario(id) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Verificar que no sea el usuario admin principal
        const [usuario] = await conexion.execute(
            'SELECT username FROM usuarios_sistema WHERE id = ?',
            [id]
        );

        if (usuario.length === 0) {
            await conexion.end();
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (usuario[0].username === 'admin') {
            await conexion.end();
            return { success: false, message: 'No se puede eliminar el usuario administrador principal' };
        }

        if (usuario[0].username === 'api_user' || usuario[0].username === 'api') {
            await conexion.end();
            return { success: false, message: 'No se puede eliminar el usuario API especial' };
        }

        // Cerrar todas las sesiones del usuario
        await conexion.execute(
            'DELETE FROM sesiones WHERE usuario_id = ?',
            [id]
        );

        // Eliminar usuario
        await conexion.execute(
            'DELETE FROM usuarios_sistema WHERE id = ?',
            [id]
        );

        await conexion.end();
        return { success: true, message: 'Usuario eliminado exitosamente' };
    } catch (error) {
        console.error('Error eliminando usuario:', error.message);
        return { success: false, message: 'Error interno del servidor' };
    }
}

// Actualizar usuario
async function actualizarUsuario(id, datos) {
    let conexion;
    try {
        // Validar parámetros de entrada
        if (!id || !datos) {
            return { success: false, message: 'ID y datos son requeridos' };
        }

        console.log('🔧 Intentando actualizar usuario ID:', id);
        console.log('📊 Datos a actualizar:', Object.keys(datos));

        conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Verificar que el usuario existe
        const [usuarioExistente] = await conexion.execute(
            'SELECT id, username FROM usuarios_sistema WHERE id = ?',
            [id]
        );

        if (usuarioExistente.length === 0) {
            await conexion.end();
            return { success: false, message: 'Usuario no encontrado' };
        }

        const usuarioActual = usuarioExistente[0];

        // Verificar si es usuario protegido (no se puede editar)
        if (usuarioActual.username === 'admin' || usuarioActual.username === 'api_user' || usuarioActual.username === 'api') {
            await conexion.end();
            return { success: false, message: 'No se puede modificar este usuario especial del sistema' };
        }

        // Verificar si el username ya existe (si cambió)
        if (datos.username && datos.username !== usuarioActual.username) {
            const [usuarioDuplicado] = await conexion.execute(
                'SELECT id FROM usuarios_sistema WHERE username = ? AND id != ?',
                [datos.username, id]
            );

            if (usuarioDuplicado.length > 0) {
                await conexion.end();
                return { success: false, message: 'El nombre de usuario ya existe' };
            }
        }

        // Preparar datos para actualizar
        const camposActualizar = [];
        const valores = [];

        if (datos.username) {
            camposActualizar.push('username = ?');
            valores.push(datos.username);
        }

        if (datos.nombre) {
            camposActualizar.push('nombre = ?');
            valores.push(datos.nombre);
        }

        if (datos.rol) {
            camposActualizar.push('rol = ?');
            valores.push(datos.rol);
        }

        if (datos.password) {
            try {
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(datos.password, 10);
                camposActualizar.push('password = ?');
                valores.push(hashedPassword);
            } catch (bcryptError) {
                console.error('Error procesando contraseña con bcrypt:', bcryptError.message);
                await conexion.end();
                return { success: false, message: 'Error procesando contraseña' };
            }
        }

        // Solo actualizar si hay campos para actualizar
        if (camposActualizar.length === 0) {
            await conexion.end();
            return { success: false, message: 'No hay datos para actualizar' };
        }

        // Agregar ID al final de los valores
        valores.push(id);

        const query = `UPDATE usuarios_sistema SET ${camposActualizar.join(', ')} WHERE id = ?`;

        await conexion.execute(query, valores);

        // Si se cambió el rol o el username, cerrar todas las sesiones del usuario
        if (datos.rol || datos.username) {
            await conexion.execute(
                'DELETE FROM sesiones WHERE usuario_id = ?',
                [id]
            );
        }

        await conexion.end();
        console.log('✅ Usuario actualizado exitosamente:', id);
        return { success: true, message: 'Usuario actualizado exitosamente' };
    } catch (error) {
        console.error('❌ Error actualizando usuario:', error.message);
        console.error('Stack trace:', error.stack);

        // Cerrar conexión si existe
        if (conexion) {
            try {
                await conexion.end();
            } catch (closeError) {
                console.error('Error cerrando conexión:', closeError.message);
            }
        }

        // Proporcionar mensajes de error más específicos
        if (error.code === 'ECONNREFUSED') {
            return { success: false, message: 'Error de conexión a la base de datos' };
        } else if (error.code === 'ER_DUP_ENTRY') {
            return { success: false, message: 'El nombre de usuario ya existe' };
        } else if (error.message.includes('bcrypt')) {
            return { success: false, message: 'Error procesando la contraseña' };
        } else {
            return { success: false, message: 'Error interno del servidor' };
        }
    }
}

// ===== FUNCIONES PARA LOGS DE API =====

// Registrar log de API
async function registrarLogAPI(ip, numero, mensaje, estado = 'enviado') {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        await conexion.execute(
            'INSERT INTO logs_api (ip_origen, numero_destino, mensaje, estado, fecha_envio) VALUES (?, ?, ?, ?, NOW())',
            [ip, numero, mensaje, estado]
        );

        await conexion.end();
        return { success: true };
    } catch (error) {
        console.error('Error registrando log API:', error.message);
        return { success: false, message: 'Error registrando log' };
    }
}

// Obtener logs de API
async function obtenerLogsAPI(limite = 100) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [logs] = await conexion.execute(
            'SELECT id, ip_origen, numero_destino, mensaje, estado, fecha_envio FROM logs_api ORDER BY fecha_envio DESC LIMIT ?',
            [String(limite)]
        );

        await conexion.end();
        return { success: true, logs: logs };
    } catch (error) {
        console.error('Error obteniendo logs API:', error.message);
        return { success: false, message: 'Error obteniendo logs' };
    }
}

// Eliminar logs antiguos (opcional - para mantenimiento)
async function limpiarLogsAPI(diasAntiguedad = 30) {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        await conexion.execute(
            'DELETE FROM logs_api WHERE fecha_envio < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [diasAntiguedad]
        );

        await conexion.end();
        return { success: true };
    } catch (error) {
        console.error('Error limpiando logs API:', error.message);
        return { success: false, message: 'Error limpiando logs' };
    }
}

// Limpiar sesiones expiradas
async function limpiarSesionesExpiradas() {
    try {
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        const [result] = await conexion.execute(
            'UPDATE sesiones SET activo = FALSE WHERE activo = TRUE AND fecha_expiracion <= NOW()'
        );

        await conexion.end();
        return {
            success: true,
            message: `Se marcaron como inactivas ${result.affectedRows} sesiones expiradas`
        };
    } catch (error) {
        console.error('Error limpiando sesiones expiradas:', error.message);
        return {
            success: false,
            message: 'Error interno del servidor'
        };
    }
}

// Migrar contraseñas antiguas de SHA256 a bcrypt
async function migrarContrasenas() {
    try {
        console.log('🔄 Iniciando migración de contraseñas a bcrypt...');
        const conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Obtener todos los usuarios
        const [usuarios] = await conexion.execute(
            'SELECT id, username, password FROM usuarios_sistema'
        );

        let migrados = 0;
        const bcrypt = require('bcrypt');

        for (const usuario of usuarios) {
            try {
                // Verificar si la contraseña usa SHA256 (longitud 64 caracteres hexadecimales)
                if (usuario.password && usuario.password.length === 64 && /^[a-f0-9]{64}$/i.test(usuario.password)) {
                    // Es una contraseña SHA256, convertir a bcrypt
                    const nuevaPassword = await bcrypt.hash(usuario.password, 10);

                    await conexion.execute(
                        'UPDATE usuarios_sistema SET password = ? WHERE id = ?',
                        [nuevaPassword, usuario.id]
                    );

                    console.log(`✅ Migrada contraseña para usuario: ${usuario.username}`);
                    migrados++;
                }
            } catch (error) {
                console.error(`❌ Error migrando usuario ${usuario.username}:`, error.message);
            }
        }

        await conexion.end();
        console.log(`🎯 Migración completada: ${migrados} contraseñas actualizadas`);
        return {
            success: true,
            message: `Migración completada: ${migrados} contraseñas actualizadas a bcrypt`
        };
    } catch (error) {
        console.error('❌ Error en migración de contraseñas:', error.message);
        return {
            success: false,
            message: 'Error interno del servidor durante migración'
        };
    }
}

// ===== FUNCIÓN PARA CREAR USUARIO API ESPECIAL =====
async function crearUsuarioAPI() {
    let conexion;
    try {
        console.log('🔧 Verificando existencia del usuario API especial...');

        conexion = await mysql.createConnection(dbSistema);
        await conexion.query('USE solucnet_auth_system');

        // Verificar si el usuario 'api' ya existe
        const [usuarioExistente] = await conexion.execute(
            'SELECT id FROM usuarios_sistema WHERE username = ?',
            ['api']
        );

        if (usuarioExistente.length > 0) {
            console.log('✅ El usuario API ya existe');
            await conexion.end();
            return { success: true, message: 'Usuario API ya existe' };
        }

        // Crear contraseña hash para el usuario API
        const bcrypt = require('bcrypt');
        const passwordAPI = 'api_system_secure_2024'; // Contraseña especial para API
        const hashedPassword = await bcrypt.hash(passwordAPI, 10);

        // Crear usuario API
        const result = await conexion.execute(
            'INSERT INTO usuarios_sistema (username, password, nombre, rol, fecha_creacion) VALUES (?, ?, ?, ?, NOW())',
            ['api', hashedPassword, 'Usuario API Especial', 'api', 'api']
        );

        await conexion.end();
        console.log('✅ Usuario API creado exitosamente con ID:', result[0].insertId);
        return {
            success: true,
            message: 'Usuario API creado exitosamente',
            password: passwordAPI // Devolver la contraseña para que el admin la conozca
        };

    } catch (error) {
        console.error('❌ Error creando usuario API:', error.message);
        if (conexion) {
            try {
                await conexion.end();
            } catch (closeError) {
                console.error('Error cerrando conexión:', closeError.message);
            }
        }
        return { success: false, message: 'Error creando usuario API: ' + error.message };
    }
}

module.exports = {
    consultarCliente,
    crearSoporte,
    inicializarSistema,
    buscarUsuario,
    crearToken,
    crearTokenEternoAPI,
    verificarToken,
    verificarTokenEterno,
    cerrarSesion,
    validarConexionBD,
    agregarNumeroOmitido,
    obtenerNumerosOmitidos,
    estaNumeroOmitido,
    eliminarNumeroOmitido,
    obtenerUsuarios,
    crearUsuario,
    eliminarUsuario,
    actualizarUsuario,
    registrarLogAPI,
    obtenerLogsAPI,
    limpiarLogsAPI,
    limpiarSesionesExpiradas,
    migrarContrasenas,
    crearUsuarioAPI
};
