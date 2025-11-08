#!/bin/bash
# Script de monitoreo de CPU y memoria para solucnet-bot
# Reinicia el servicio automáticamente si detecta problemas

# Configuración
CPU_THRESHOLD=80  # Reiniciar si CPU supera 80%
MEM_THRESHOLD=80  # Reiniciar si memoria supera 80%
CHECK_DURATION=30 # Segundos para confirmar problema sostenido
LOG_FILE="/root/whatsapp-chatbot/logs/monitor-cpu.log"

# Función para registrar con timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Función para obtener PID del proceso
get_pid() {
    pm2 jlist | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | head -1
}

# Función para obtener uso de CPU
get_cpu_usage() {
    local pid=$1
    ps -p "$pid" -o %cpu --no-headers 2>/dev/null | awk '{print int($1)}'
}

# Función para obtener uso de memoria
get_mem_usage() {
    local pid=$1
    ps -p "$pid" -o %mem --no-headers 2>/dev/null | awk '{print int($1)}'
}

# Verificar si el proceso existe
PID=$(get_pid)
if [ -z "$PID" ] || [ "$PID" = "0" ]; then
    log "⚠️  Proceso solucnet-bot no encontrado o no está corriendo"
    exit 1
fi

log "🔍 Monitoreando proceso PID: $PID"

# Primera lectura
CPU_USAGE=$(get_cpu_usage "$PID")
MEM_USAGE=$(get_mem_usage "$PID")

log "📊 CPU: ${CPU_USAGE}% | Memoria: ${MEM_USAGE}%"

# Verificar si excede los límites
if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
    log "⚠️  CPU ALTA detectada: ${CPU_USAGE}% (límite: ${CPU_THRESHOLD}%)"
    log "⏳ Esperando ${CHECK_DURATION} segundos para confirmar..."

    sleep "$CHECK_DURATION"

    # Segunda lectura para confirmar
    PID=$(get_pid)
    CPU_USAGE=$(get_cpu_usage "$PID")

    if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
        log "🚨 CPU SOSTENIDAMENTE ALTA: ${CPU_USAGE}%"
        log "🔄 Reiniciando solucnet-bot..."

        # Registrar alerta crítica
        /root/whatsapp-chatbot/scripts/alerta-critica.sh &

        # Guardar información de debug
        log "📋 Estado antes del reinicio:"
        pm2 describe solucnet-bot | grep -E "cpu|memory|uptime|restarts" >> "$LOG_FILE"

        # Reiniciar el servicio
        pm2 restart solucnet-bot --update-env

        if [ $? -eq 0 ]; then
            log "✅ Servicio reiniciado exitosamente"

            # Esperar 30 segundos y verificar
            sleep 30
            NEW_PID=$(get_pid)
            NEW_CPU=$(get_cpu_usage "$NEW_PID")
            log "📊 Nuevo PID: $NEW_PID | CPU: ${NEW_CPU}%"
        else
            log "❌ Error al reiniciar el servicio"
            exit 1
        fi
    else
        log "✅ CPU normalizada: ${CPU_USAGE}% - No se requiere acción"
    fi
elif [ "$MEM_USAGE" -gt "$MEM_THRESHOLD" ]; then
    log "⚠️  MEMORIA ALTA detectada: ${MEM_USAGE}% (límite: ${MEM_THRESHOLD}%)"
    log "🔄 Reiniciando solucnet-bot por consumo de memoria..."

    pm2 restart solucnet-bot --update-env
    log "✅ Servicio reiniciado por memoria alta"
else
    log "✅ Sistema operando normalmente - CPU: ${CPU_USAGE}% | Memoria: ${MEM_USAGE}%"
fi

# Limpiar logs antiguos (mantener solo últimos 1000 líneas)
if [ -f "$LOG_FILE" ]; then
    LINES=$(wc -l < "$LOG_FILE")
    if [ "$LINES" -gt 1000 ]; then
        tail -1000 "$LOG_FILE" > "${LOG_FILE}.tmp"
        mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
fi

exit 0
