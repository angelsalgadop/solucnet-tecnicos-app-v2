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

            // Consulta basada en fecha de vencimiento de facturas más antigua
            const query = `
                SELECT
                    u.id,
                    u.nombre,
                    u.cedula,
                    u.movil as telefono,
                    u.estado,
                    MIN(f.vencimiento) as primera_factura_vencida,
                    DATEDIFF(NOW(), MIN(f.vencimiento)) as dias_desde_primer_vencimiento,
                    COUNT(f.id) as facturas_pendientes,
                    SUM(f.total) as total_deuda
                FROM usuarios u
                INNER JOIN facturas f ON u.id = f.idcliente
                WHERE u.estado = 'suspendido'
                    AND f.estado IN ('No pagado', 'vencida')
                    AND f.vencimiento < ?
                GROUP BY u.id, u.nombre, u.cedula, u.movil, u.estado
                HAVING dias_desde_primer_vencimiento > 30
                ORDER BY dias_desde_primer_vencimiento DESC
            `;

            const [clientes] = await conexion.execute(query, [fechaLimiteStr]);

            if (clientes.length > 0) {
                console.log(`✅ Encontrados ${clientes.length} clientes suspendidos con deuda mayor a 1 mes\n`);

                clientes.forEach((cliente, index) => {
                    const mesesMorosos = Math.floor(cliente.dias_desde_primer_vencimiento / 30);
                    console.log(`${index + 1}. ${cliente.nombre || 'Sin nombre'} (ID: ${cliente.id})`);
                    console.log(`   🆔 Cédula: ${cliente.cedula || 'No registrada'}`);
                    console.log(`   📱 Teléfono: ${cliente.telefono || 'No registrado'}`);
                    console.log(`   📅 Moroso desde: ${cliente.dias_desde_primer_vencimiento} días (~${mesesMorosos} meses)`);
                    console.log(`   📆 Primera factura vencida: ${new Date(cliente.primera_factura_vencida).toLocaleDateString('es-CO')}`);
                    console.log(`   💰 Deuda total: $${(cliente.total_deuda || 0).toLocaleString('es-CO')}`);
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
                console.log('ℹ️  No se encontraron clientes suspendidos con deuda mayor a 1 mes');
            }

            await conexion.end();

        } catch (error) {
            console.error(`❌ Error conectando a ${bd.nombre}:`, error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error(`   La base de datos no está accesible en ${bd.host}`);
            } else if (error.code === 'ENOTFOUND') {
                console.error(`   No se puede resolver el host ${bd.host}`);
            } else if (error.code === 'ETIMEDOUT') {
                console.error(`   Tiempo de espera agotado conectando a ${bd.host}`);
            }
            console.error(`   Detalles: ${error.code || error.errno}`);
        }
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('📈 RESUMEN GENERAL');
    console.log('='.repeat(70));
    console.log(`Total de clientes suspendidos con deuda > 1 mes: ${totalClientesSuspendidos}`);
    console.log('');

    if (resultadosPorBD.length > 0) {
        console.log('Distribución por base de datos:');
        let totalDeuda = 0;
        let totalFacturas = 0;
        resultadosPorBD.forEach(resultado => {
            const deudaBD = resultado.clientes.reduce((sum, c) => sum + (c.total_deuda || 0), 0);
            const facturasBD = resultado.clientes.reduce((sum, c) => sum + (c.facturas_pendientes || 0), 0);
            totalDeuda += deudaBD;
            totalFacturas += facturasBD;
            console.log(`  • ${resultado.bd}:`);
            console.log(`    - ${resultado.cantidad} clientes`);
            console.log(`    - ${facturasBD} facturas pendientes`);
            console.log(`    - Deuda: $${deudaBD.toLocaleString('es-CO')}`);
        });
        console.log(`\n💰 Totales:`);
        console.log(`  - Deuda acumulada: $${totalDeuda.toLocaleString('es-CO')}`);
        console.log(`  - Facturas pendientes: ${totalFacturas}`);
    }

    // Generar reporte detallado si hay clientes
    if (totalClientesSuspendidos > 0) {
        console.log('\n📋 Generando reportes...');
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
    } else {
        console.log('\nℹ️  No se generaron reportes (no hay clientes suspendidos > 1 mes)');
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
                telefono: c.telefono,
                dias_moroso: c.dias_desde_primer_vencimiento,
                meses_moroso: Math.floor(c.dias_desde_primer_vencimiento / 30),
                primera_factura_vencida: c.primera_factura_vencida,
                deuda_total: c.total_deuda,
                facturas_pendientes: c.facturas_pendientes
            }))
        }))
    };
}

function generarReporteCSV(resultadosPorBD) {
    let csv = 'Base de Datos,ID Cliente,Nombre,Cédula,Teléfono,Días Moroso,Meses Moroso,Primera Factura Vencida,Deuda Total,Facturas Pendientes\n';

    resultadosPorBD.forEach(bd => {
        bd.clientes.forEach(c => {
            csv += `"${bd.bd}",${c.id},"${c.nombre || ''}","${c.cedula || ''}","${c.telefono || ''}",${c.dias_desde_primer_vencimiento},${Math.floor(c.dias_desde_primer_vencimiento / 30)},"${c.primera_factura_vencida}",$${c.total_deuda || 0},${c.facturas_pendientes}\n`;
        });
    });

    return csv;
}

// Ejecutar análisis
analizarClientesSuspendidos().catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
});
