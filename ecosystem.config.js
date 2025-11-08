module.exports = {
  apps: [{
    name: 'solucnet-bot',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '3G', // Reiniciar si excede 3GB de RAM
    max_restarts: 100, // Aumentado para permitir más reintentos
    min_uptime: '30s', // Aumentado a 30 segundos para estabilidad
    restart_delay: 5000, // 5 segundos entre reinicios
    exp_backoff_restart_delay: 100, // Backoff exponencial
    // Límite de CPU - reiniciar si promedio supera 90% por 1 minuto
    max_cpu: 90,
    kill_timeout: 60000, // 60 segundos para cerrar limpiamente
    listen_timeout: 60000, // Aumentado a 60 segundos
    // Scripts de mantenimiento
    pre_stop: './scripts/cleanup-orphans.sh', // Limpiar antes de detener
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Configuraciones adicionales para mantener en línea
    // cron_restart: '0 4 * * *', // Reinicio diario a las 4 AM (DESHABILITADO)
    ignore_watch: ['node_modules', 'logs', '.git'],
    node_args: '--max-old-space-size=4096', // Aumentado a 4GB para mayor estabilidad
    // Monitoreo avanzado
    pmx: true,
    monitoring: true,
    // Reinicio automático por cron a las 4 AM para limpiar memoria
    cron_restart: '0 4 * * *'
    // Health check deshabilitado temporalmente para debugging
    // health_check: {
    //   enable: false
    // }
  }]
};