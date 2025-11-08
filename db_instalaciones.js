const mysql = require('mysql2/promise');

// Configuraciones de las bases de datos
const basesDatos = {
    REPOSO: {
        host: '192.168.99.50',
        user: 'root',
        password: 'Y9T1Q6P39YI6TJ2',
        database: 'Mikrowisp6'
    },
    CHURIDO: {
        host: '192.168.99.11',
        user: 'root',
        password: 'Y9T1Q6P39YI6TJ2',
        database: 'Mikrowisp6'
    },
    RIO_GRANDE: {
        host: '192.168.99.2',
        user: 'root',
        password: 'Y9T1Q6P39YI6TJ2',
        database: 'Mikrowisp6'
    }
};

// Configuración de la base de datos del sistema
const dbSistema = {
    host: process.env.DB_SYSTEM_HOST || 'localhost',
    user: process.env.DB_SYSTEM_USER || 'debian-sys-maint',
    password: process.env.DB_SYSTEM_PASSWORD || 'IOHcXunF7795fMRI',
    database: process.env.DB_SYSTEM_DATABASE || 'solucnet_auth_system'
};

// Función para registrar instalación
async function registrarInstalacion(clienteId, baseDatosCodigo, notasAdicionales = '') {
    let conexionSistema = null;
    let conexionDestino = null;

    try {
        // Validar que la base de datos exista
        if (!basesDatos[baseDatosCodigo]) {
            return {
                success: false,
                message: `Base de datos inválida: ${baseDatosCodigo}`
            };
        }

        const configBD = basesDatos[baseDatosCodigo];

        // Conectar a la base de datos del sistema para obtener los datos del cliente
        conexionSistema = await mysql.createConnection(dbSistema);
        await conexionSistema.query('USE solucnet_auth_system');

        const [clientes] = await conexionSistema.execute(
            'SELECT * FROM clientes_externos WHERE id = ? AND bd_origen = "solucnet.com"',
            [clienteId]
        );

        if (clientes.length === 0) {
            await conexionSistema.end();
            return {
                success: false,
                message: 'Cliente no encontrado'
            };
        }

        const cliente = clientes[0];

        // Conectar a la base de datos de destino
        conexionDestino = await mysql.createConnection(configBD);
        await conexionDestino.query('USE Mikrowisp6');

        // Verificar si el cliente ya existe en la tabla de instalaciones
        const [existe] = await conexionDestino.execute(
            'SELECT id FROM instalaciones WHERE cedula = ? LIMIT 1',
            [cliente.cedula]
        );

        if (existe.length > 0) {
            await conexionSistema.end();
            await conexionDestino.end();
            return {
                success: false,
                message: `El cliente con cédula ${cliente.cedula} ya existe en la base de datos ${baseDatosCodigo}`
            };
        }

        // Insertar la instalación
        const fechaActual = new Date();
        const fechaSalida = new Date();
        fechaSalida.setDate(fechaSalida.getDate() + 30); // 30 días después

        // Preparar notas combinadas
        let notasCompletas = notasAdicionales || 'Registrado desde solucnet.com';
        if (notasAdicionales && !notasAdicionales.includes('solucnet.com')) {
            notasCompletas = `${notasAdicionales} - Registrado desde solucnet.com`;
        }

        await conexionDestino.execute(`
            INSERT INTO instalaciones (
                userid, fecha_ingreso, fecha_salida, idtecnico, direccion,
                telefono, movil, idnodo, email, cedula, estate, cliente,
                notas, fecha_instalacion, zona, idvendedor, tipo_estrato
            ) VALUES (0, ?, ?, 0, ?, ?, ?, 0, ?, ?, 'PENDIENTE', ?,
                      ?, ?, 0, 0, 1)
        `, [
            fechaActual.toISOString().split('T')[0],
            fechaSalida.toISOString().split('T')[0],
            (cliente.direccion || '').toUpperCase(),
            cliente.telefono || '',
            cliente.movil || '',
            cliente.email || '',
            cliente.cedula || '',
            (cliente.nombre || '').toUpperCase(),
            notasCompletas,
            fechaActual.toISOString().slice(0, 19).replace('T', ' ')
        ]);

        await conexionSistema.end();
        await conexionDestino.end();

        return {
            success: true,
            message: `Instalación registrada exitosamente en ${baseDatosCodigo} con estado PENDIENTE`
        };

    } catch (error) {
        if (conexionSistema) await conexionSistema.end();
        if (conexionDestino) await conexionDestino.end();

        console.error('❌ Error registrando instalación:', error.message);
        return {
            success: false,
            message: `Error: ${error.message}`
        };
    }
}

module.exports = {
    registrarInstalacion
};
