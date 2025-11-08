#!/usr/bin/env node
const mysql = require('mysql2/promise');

// Configuración correcta de las bases de datos
const basesDatos = [
    { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', nombre: 'BD Principal (50)' },
    { host: '192.168.99.11', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', nombre: 'BD Secundaria (11)' },
    { host: '192.168.99.2', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', nombre: 'BD Terciaria (2)' }
];

async function verificarEstructura() {
    console.log('🔍 Verificando estructura de tabla usuarios...\n');

    const bd = basesDatos[0]; // Usar la primera BD para verificar
    try {
        const conexion = await mysql.createConnection({
            host: bd.host,
            user: bd.user,
            password: bd.password,
            database: bd.database
        });

        const [columns] = await conexion.execute(`
            SHOW COLUMNS FROM usuarios
        `);

        console.log('📋 Columnas disponibles en tabla usuarios:');
        columns.forEach(col => {
            console.log(`  • ${col.Field} (${col.Type})`);
        });

        await conexion.end();
        return columns.map(c => c.Field);
    } catch (error) {
        console.error('❌ Error:', error.message);
        return [];
    }
}

async function analizarClientesSuspendidos() {
    console.log('🔍 ANÁLISIS DE CLIENTES SUSPENDIDOS POR MÁS DE 1 MES');
    console.log('='.repeat(70));
    console.log('');

    // Primero verificar estructura
    const columnas = await verificarEstructura();
    console.log('\n' + '='.repeat(70) + '\n');

    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - 1);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    let totalClientesSuspendidos = 0;
    const resultadosPorBD = [];

    for (const bd of basesDatos) {
        console.log(`\n📊 Consultando: ${bd.nombre} (${bd.host})`);
        console.log('-'.repeat(70));

        try {
            const conexion = await mysql.createConnection({
                host: bd.host,
                user: bd.user,
                password: bd.password,
                database: bd.database
            });

            // Consulta adaptada sin la columna celular
            const query = `
                SELECT
                    u.id,
                    u.nombre,
                    u.cedula,
                    u.estado,
                    u.fecha_cambio_estado,
                    DATEDIFF(NOW(), u.fecha_cambio_estado) as dias_suspendido,
                    COUNT(f.id) as facturas_pendientes,
                    SUM(f.total) as total_deuda
                FROM usuarios u
                LEFT JOIN facturas f ON u.id = f.idcliente
                    AND f.estado IN ('No pagado', 'vencida')
                WHERE u.estado = 'suspendido'
                    AND u.fecha_cambio_estado IS NOT NULL
                    AND u.fecha_cambio_estado < ?
                GROUP BY u.id, u.nombre, u.cedula, u.estado, u.fecha_cambio_estado
                ORDER BY dias_suspendido DESC
            `;

            const [clientes] = await conexion.execute(query, [fechaLimiteStr]);

            if (clientes.length > 0) {
                console.log(`✅ Encontrados ${clientes.length} clientes suspendidos por más de 1 mes\n`);

                clientes.forEach((cliente, index) => {
                    const mesesSuspendido = Math.floor(cliente.dias_suspendido / 30);
                    console.log(`${index + 1}. ${cliente.nombre || 'Sin nombre'} (ID: ${cliente.id})`);
                    console.log(`   🆔 Cédula: ${cliente.cedula || 'No registrada'}`);
                    console.log(`   📅 Suspendido: ${cliente.dias_suspendido} días (~${mesesSuspendido} meses)`);
                    console.log(`   💰 Deuda: $${(cliente.total_deuda || 0).toLocaleString('es-CO')}`);
                    console.log(`   📄 Facturas pendientes: ${cliente.facturas_pendientes}`);
                    console.log(`   📆 Fecha suspensión: ${cliente.fecha_cambio_estado ? new Date(cliente.fecha_cambio_estado).toLocaleDateString('es-CO') : 'No disponible'}`);
                    console.log('');
                });

                totalClientesSuspendidos += clientes.length;
                resultadosPorBD.push({
                    bd: bd.nombre,
                    host: bd.host,
                    cantidad: clientes.length,
                    clientes: clientes
                });
            } else {
                console.log('ℹ️  No se encontraron clientes suspendidos por más de 1 mes');
            }

            await conexion.end();

        } catch (error) {
            console.error(`❌ Error conectando a ${bd.nombre}:`, error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error(`   La base de datos no está accesible en ${bd.host}`);
            } else if (error.code === 'ENOTFOUND') {
                console.error(`   No se puede resolver el host ${bd.host}`);
            }
        }
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('📈 RESUMEN GENERAL');
    console.log('='.repeat(70));
    console.log(`Total de clientes suspendidos por más de 1 mes: ${totalClientesSuspendidos}`);
    console.log('');

    if (resultadosPorBD.length > 0) {
        console.log('Distribución por base de datos:');
        let totalDeuda = 0;
        resultadosPorBD.forEach(resultado => {
            const deudaBD = resultado.clientes.reduce((sum, c) => sum + (c.total_deuda || 0), 0);
            totalDeuda += deudaBD;
            console.log(`  • ${resultado.bd}: ${resultado.cantidad} clientes - Deuda: $${deudaBD.toLocaleString('es-CO')}`);
        });
        console.log(`\n💰 Deuda total acumulada: $${totalDeuda.toLocaleString('es-CO')}`);
    }

    // Generar reporte detallado si hay clientes
    if (totalClientesSuspendidos > 0) {
        console.log('\n📋 Generando reporte detallado...');
        const reporte = generarReporteJSON(resultadosPorBD);
        const fs = require('fs');
        const nombreArchivo = `clientes_suspendidos_${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(nombreArchivo, JSON.stringify(reporte, null, 2));
        console.log(`✅ Reporte JSON guardado en: ${nombreArchivo}`);

        // También generar CSV
        const csv = generarReporteCSV(resultadosPorBD);
        const nombreCSV = `clientes_suspendidos_${new Date().toISOString().split('T')[0]}.csv`;
        fs.writeFileSync(nombreCSV, csv);
        console.log(`✅ Reporte CSV guardado en: ${nombreCSV}`);
    }

    console.log('\n✅ Análisis completado\n');
}

function generarReporteJSON(resultadosPorBD) {
    return {
        fecha_reporte: new Date().toISOString(),
        fecha_reporte_legible: new Date().toLocaleString('es-CO'),
        total_clientes: resultadosPorBD.reduce((sum, r) => sum + r.cantidad, 0),
        deuda_total: resultadosPorBD.reduce((sum, r) =>
            sum + r.clientes.reduce((s, c) => s + (c.total_deuda || 0), 0), 0),
        bases_datos: resultadosPorBD.map(r => ({
            nombre: r.bd,
            host: r.host,
            cantidad_clientes: r.cantidad,
            clientes: r.clientes.map(c => ({
                id: c.id,
                nombre: c.nombre,
                cedula: c.cedula,
                dias_suspendido: c.dias_suspendido,
                meses_suspendido: Math.floor(c.dias_suspendido / 30),
                deuda_total: c.total_deuda,
                facturas_pendientes: c.facturas_pendientes,
                fecha_suspension: c.fecha_cambio_estado
            }))
        }))
    };
}

function generarReporteCSV(resultadosPorBD) {
    let csv = 'Base de Datos,ID Cliente,Nombre,Cédula,Días Suspendido,Meses Suspendido,Deuda Total,Facturas Pendientes,Fecha Suspensión\n';

    resultadosPorBD.forEach(bd => {
        bd.clientes.forEach(c => {
            csv += `"${bd.bd}",${c.id},"${c.nombre || ''}","${c.cedula || ''}",${c.dias_suspendido},${Math.floor(c.dias_suspendido / 30)},$${c.total_deuda || 0},${c.facturas_pendientes},"${c.fecha_cambio_estado || ''}"\n`;
        });
    });

    return csv;
}

// Ejecutar análisis
analizarClientesSuspendidos().catch(console.error);
