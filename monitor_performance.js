#!/usr/bin/env node

/**
 * Script de monitoreo de rendimiento para WhatsApp Chatbot
 * Optimizado para uso eficiente del procesador
 */

const os = require('os');
const fs = require('fs').promises;

class PerformanceMonitor {
    constructor() {
        this.stats = {
            startTime: Date.now(),
            cpuUsage: [],
            memoryUsage: [],
            dbConnections: 0,
            messagesProcessed: 0
        };
        this.intervalId = null;
    }

    // Monitor CPU usage optimizado
    async getCPUUsage() {
        return new Promise((resolve) => {
            const startMeasure = process.cpuUsage();
            const startTime = Date.now();

            setTimeout(() => {
                const endMeasure = process.cpuUsage(startMeasure);
                const duration = Date.now() - startTime;
                
                // Calcular porcentaje de uso de CPU
                const cpuPercent = ((endMeasure.user + endMeasure.system) / 1000 / duration) * 100;
                resolve(Math.min(100, Math.max(0, cpuPercent)));
            }, 100);
        });
    }

    // Monitor Memory usage
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: Math.round(usage.rss / 1024 / 1024), // MB
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
            external: Math.round(usage.external / 1024 / 1024) // MB
        };
    }

    // Monitor System resources
    getSystemStats() {
        const loadAvg = os.loadavg();
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        
        return {
            loadAverage: Math.round(loadAvg[0] * 100) / 100,
            freeMemoryMB: Math.round(freeMem / 1024 / 1024),
            totalMemoryMB: Math.round(totalMem / 1024 / 1024),
            memoryUsagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100)
        };
    }

    // Collect stats
    async collectStats() {
        const cpuUsage = await this.getCPUUsage();
        const memoryUsage = this.getMemoryUsage();
        const systemStats = this.getSystemStats();

        this.stats.cpuUsage.push({
            timestamp: Date.now(),
            percent: cpuUsage
        });

        this.stats.memoryUsage.push({
            timestamp: Date.now(),
            ...memoryUsage
        });

        // Mantener solo los últimos 60 registros (1 hora con intervalos de 1 minuto)
        if (this.stats.cpuUsage.length > 60) {
            this.stats.cpuUsage = this.stats.cpuUsage.slice(-60);
            this.stats.memoryUsage = this.stats.memoryUsage.slice(-60);
        }

        return {
            cpu: cpuUsage,
            memory: memoryUsage,
            system: systemStats,
            uptime: Math.round((Date.now() - this.stats.startTime) / 1000)
        };
    }

    // Generate performance report
    generateReport() {
        const currentStats = this.stats;
        const avgCPU = currentStats.cpuUsage.length > 0 
            ? currentStats.cpuUsage.reduce((sum, stat) => sum + stat.percent, 0) / currentStats.cpuUsage.length
            : 0;

        const avgMemory = currentStats.memoryUsage.length > 0
            ? currentStats.memoryUsage.reduce((sum, stat) => sum + stat.heapUsed, 0) / currentStats.memoryUsage.length
            : 0;

        return {
            uptime: Math.round((Date.now() - currentStats.startTime) / 1000),
            averageCPU: Math.round(avgCPU * 100) / 100,
            averageMemoryMB: Math.round(avgMemory),
            currentMemory: this.getMemoryUsage(),
            systemStats: this.getSystemStats(),
            messagesProcessed: currentStats.messagesProcessed,
            dbConnections: currentStats.dbConnections
        };
    }

    // Start monitoring
    start() {
        console.log('📊 Iniciando monitor de rendimiento optimizado...');
        
        this.intervalId = setInterval(async () => {
            try {
                const stats = await this.collectStats();
                
                // Solo mostrar estadísticas críticas para reducir overhead
                if (stats.cpu > 80 || stats.memory.heapUsed > 400) {
                    console.log(`⚠️  Alto uso de recursos - CPU: ${stats.cpu.toFixed(1)}%, Memoria: ${stats.memory.heapUsed}MB`);
                }
            } catch (error) {
                console.error('Error recolectando estadísticas:', error.message);
            }
        }, 60000); // Cada minuto para reducir overhead
    }

    // Stop monitoring
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('📊 Monitor de rendimiento detenido');
        }
    }

    // API endpoint handler
    getStatsForAPI() {
        return this.generateReport();
    }
}

// Export singleton instance
const monitor = new PerformanceMonitor();

// Handle process termination
process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
});

module.exports = monitor;

// Si se ejecuta directamente
if (require.main === module) {
    monitor.start();
    
    // Mostrar reporte inicial
    setTimeout(() => {
        console.log('📊 Reporte de rendimiento inicial:');
        console.log(JSON.stringify(monitor.generateReport(), null, 2));
    }, 5000);
}