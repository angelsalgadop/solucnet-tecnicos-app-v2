#!/usr/bin/env node
const mysql = require('mysql2/promise');

// Configuración correcta de las bases de datos
const basesDatos = [
    { host: '192.168.99.50', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', nombre: 'BD Principal (50)' },
    { host: '192.168.99.11', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', nombre: 'BD Secundaria (11)' },
    { host: '192.168.99.2', user: 'root', password: 'Y9T1Q6P39YI6TJ2', database: 'Mikrowisp6', nombre: 'BD Terciaria (2)' }
];

async function analizarClientesSuspendidos() {
    console.log('🔍 ANÁLISIS DE CLIENTES SUSPENDIDOS POR MÁS DE 1 MES');
    console.log('='.repeat(70));
    console.log('');

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

            // Consulta para clientes suspendidos hace más de 1 mes
            const query = `
                SELECT
                    u.id,
                    u.nombre,
                    u.cedula,
                    u.celular,
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
                GROUP BY u.id
                ORDER BY dias_suspendido DESC
            `;

            const [clientes] = await conexion.execute(query, [fechaLimiteStr]);

            if (clientes.length > 0) {
                console.log(`✅ Encontrados ${clientes.length} clientes suspendidos por más de 1 mes\n`);

                clientes.forEach((cliente, index) => {
                    console.log(`${index + 1}. ${cliente.nombre || 'Sin nombre'}`);
                    console.log(`   📱 Celular: ${cliente.celular || 'No registrado'}`);
                    console.log(`   🆔 Cédula: ${cliente.cedula || 'No registrada'}`);
                    console.log(`   📅 Días suspendido: ${cliente.dias_suspendido} días`);
                    console.log(`   💰 Deuda: $${(cliente.total_deuda || 0).toLocaleString('es-CO')}`);
                    console.log(`   📄 Facturas pendientes: ${cliente.facturas_pendientes}`);
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
        resultadosPorBD.forEach(resultado => {
            console.log(`  • ${resultado.bd}: ${resultado.cantidad} clientes`);
        });
    }

    // Generar reporte detallado si hay clientes
    if (totalClientesSuspendidos > 0) {
        console.log('\n📋 Generando reporte detallado...');
        const reporte = generarReporteJSON(resultadosPorBD);
        const fs = require('fs');
        const nombreArchivo = `clientes_suspendidos_${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(nombreArchivo, JSON.stringify(reporte, null, 2));
        console.log(`✅ Reporte guardado en: ${nombreArchivo}`);
    }

    console.log('\n✅ Análisis completado\n');
}

function generarReporteJSON(resultadosPorBD) {
    return {
        fecha_reporte: new Date().toISOString(),
        total_clientes: resultadosPorBD.reduce((sum, r) => sum + r.cantidad, 0),
        bases_datos: resultadosPorBD.map(r => ({
            nombre: r.bd,
            host: r.host,
            cantidad_clientes: r.cantidad,
            clientes: r.clientes.map(c => ({
                id: c.id,
                nombre: c.nombre,
                cedula: c.cedula,
                celular: c.celular,
                dias_suspendido: c.dias_suspendido,
                deuda_total: c.total_deuda,
                facturas_pendientes: c.facturas_pendientes,
                fecha_suspension: c.fecha_cambio_estado
            }))
        }))
    };
}

// Ejecutar análisis
analizarClientesSuspendidos().catch(console.error);
