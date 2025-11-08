#!/bin/bash
# Script de optimización de memoria para prevenir cierres de aplicación

APP_NAME="solucnet-bot"
LOG_FILE="/root/whatsapp-chatbot/logs/memory-optimizer.log"
MEMORY_THRESHOLD_MB=3500  # 3.5GB - umbral de alerta
MEMORY_CRITICAL_MB=3800   # 3.8GB - reinicio preventivo

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Obtener uso de memoria actual
CURRENT_MEMORY_KB=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory")
CURRENT_MEMORY_MB=$((CURRENT_MEMORY_KB / 1024 / 1024))

log_message "📊 Memoria actual: ${CURRENT_MEMORY_MB}MB"

# Verificar si supera el umbral de alerta
if [ "$CURRENT_MEMORY_MB" -gt "$MEMORY_THRESHOLD_MB" ]; then
    log_message "⚠️ ALERTA: Uso de memoria alto (${CURRENT_MEMORY_MB}MB > ${MEMORY_THRESHOLD_MB}MB)"

    # Forzar garbage collection si es posible
    log_message "🧹 Limpiando recursos del sistema..."
    sync
    echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true

    # Verificar si es crítico y requiere reinicio
    if [ "$CURRENT_MEMORY_MB" -gt "$MEMORY_CRITICAL_MB" ]; then
        log_message "🚨 CRÍTICO: Memoria en nivel crítico (${CURRENT_MEMORY_MB}MB > ${MEMORY_CRITICAL_MB}MB)"
        log_message "🔄 Ejecutando reinicio preventivo..."

        # Reinicio suave con pm2
        pm2 reload "$APP_NAME" --update-env

        # Esperar a que reinicie
        sleep 10

        NEW_MEMORY_KB=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory")
        NEW_MEMORY_MB=$((NEW_MEMORY_KB / 1024 / 1024))

        log_message "✅ Reinicio completado. Nueva memoria: ${NEW_MEMORY_MB}MB"
    fi
fi

# Limpiar logs antiguos (más de 14 días)
find /root/whatsapp-chatbot/logs -name "*.log" -type f -mtime +14 -delete 2>/dev/null

# Limpiar archivos temporales
find /tmp -name "whatsapp-*" -type f -mtime +2 -delete 2>/dev/null
find /root/.wwebjs_cache -type f -mtime +7 -delete 2>/dev/null || true
find /root/.wwebjs_auth -type f -mtime +30 -delete 2>/dev/null || true

# Verificar espacio en disco
DISK_USAGE=$(df -h /root | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    log_message "⚠️ ALERTA: Espacio en disco crítico (${DISK_USAGE}%)"
    # Limpiar archivos de logs más agresivamente
    find /root/whatsapp-chatbot/logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null
fi

log_message "✅ Optimización completada"
