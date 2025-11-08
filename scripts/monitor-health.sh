#!/bin/bash
# Script de monitoreo de salud del bot de WhatsApp

LOG_FILE="/root/whatsapp-chatbot/logs/monitor.log"
APP_NAME="solucnet-bot"
MAX_RESTARTS=5
TIME_WINDOW=3600 # 1 hora en segundos

# Función para logging
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Verificar si PM2 está corriendo
if ! command -v pm2 &> /dev/null; then
    log_message "❌ ERROR: PM2 no está instalado"
    exit 1
fi

# Obtener información del proceso
STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")
RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.restart_time")
MEMORY_MB=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory" | awk '{print int($1/1024/1024)}')
CPU=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.cpu")
UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.pm_uptime")

log_message "📊 Estado: $STATUS | Reinicios: $RESTARTS | Memoria: ${MEMORY_MB}MB | CPU: ${CPU}%"

# Verificar si la app está corriendo
if [ "$STATUS" != "online" ]; then
    log_message "⚠️ ALERTA: La aplicación NO está online (Estado: $STATUS)"
    log_message "🔄 Intentando reiniciar..."
    pm2 restart "$APP_NAME"
    sleep 10

    NEW_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status")
    if [ "$NEW_STATUS" = "online" ]; then
        log_message "✅ Aplicación reiniciada exitosamente"
    else
        log_message "❌ ERROR: No se pudo reiniciar la aplicación"
    fi
fi

# Verificar uso de memoria excesivo
if [ "$MEMORY_MB" -gt 2500 ]; then
    log_message "⚠️ ALERTA: Uso de memoria alto (${MEMORY_MB}MB > 2500MB)"
    log_message "🧹 Considerando reinicio preventivo..."
fi

# Verificar reinicios recientes excesivos
if [ "$RESTARTS" -gt "$MAX_RESTARTS" ]; then
    CURRENT_TIME=$(date +%s)
    START_TIME=$(date -d "@$((UPTIME/1000))" +%s)
    TIME_DIFF=$((CURRENT_TIME - START_TIME))

    if [ "$TIME_DIFF" -lt "$TIME_WINDOW" ]; then
        log_message "⚠️ ALERTA: Demasiados reinicios ($RESTARTS) en poco tiempo"
    fi
fi

# Verificar logs de errores recientes
ERROR_COUNT=$(tail -100 /root/whatsapp-chatbot/logs/err.log 2>/dev/null | grep -i "error\|exception\|fatal" | wc -l)
if [ "$ERROR_COUNT" -gt 10 ]; then
    log_message "⚠️ ALERTA: Se detectaron $ERROR_COUNT errores en los últimos 100 logs"
fi

# Verificar espacio en disco
DISK_USAGE=$(df -h /root | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    log_message "⚠️ ALERTA: Espacio en disco bajo (${DISK_USAGE}% usado)"
    # Limpiar logs antiguos
    find /root/whatsapp-chatbot/logs -name "*.log" -type f -mtime +7 -delete
    log_message "🧹 Logs antiguos limpiados"
fi

log_message "✅ Monitoreo completado"
