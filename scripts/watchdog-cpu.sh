#!/bin/bash
# Watchdog agresivo para CPU - responde inmediatamente a picos críticos
# Este script complementa el monitoreo regular con verificaciones más frecuentes

LOG_FILE="/root/whatsapp-chatbot/logs/watchdog-cpu.log"
CRITICAL_CPU=95  # Umbral crítico - reiniciar inmediatamente
WARNING_CPU=85   # Umbral de advertencia
MAX_WARNINGS=3   # Máximo de advertencias antes de reiniciar
WARNING_COUNT=0

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

get_bot_cpu() {
    local pid=$(pm2 jlist | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | head -1)
    if [ -z "$pid" ] || [ "$pid" = "0" ]; then
        echo "0"
        return
    fi
    ps -p "$pid" -o %cpu --no-headers 2>/dev/null | awk '{printf "%.0f", $1}' || echo "0"
}

# Monitoreo continuo por 1 minuto
log "🔍 Iniciando watchdog de CPU crítico..."

for i in {1..12}; do
    CPU=$(get_bot_cpu)

    if [ -z "$CPU" ]; then
        CPU=0
    fi

    # CPU Crítica - acción inmediata
    if [ "$CPU" -ge "$CRITICAL_CPU" ]; then
        log "🚨 CPU CRÍTICA: ${CPU}% - Reiniciando inmediatamente!"

        # Registrar alerta crítica
        /root/whatsapp-chatbot/scripts/alerta-critica.sh &

        # Obtener info antes de reiniciar
        pm2 describe solucnet-bot | grep -E "cpu|memory" >> "$LOG_FILE"

        # Reinicio forzado
        pm2 restart solucnet-bot --update-env

        if [ $? -eq 0 ]; then
            log "✅ Reinicio de emergencia completado"
        else
            log "❌ Error en reinicio de emergencia - enviando alerta"
        fi

        exit 0
    fi

    # CPU Alta - incrementar contador
    if [ "$CPU" -ge "$WARNING_CPU" ]; then
        WARNING_COUNT=$((WARNING_COUNT + 1))
        log "⚠️  Advertencia ${WARNING_COUNT}/${MAX_WARNINGS} - CPU: ${CPU}%"

        if [ "$WARNING_COUNT" -ge "$MAX_WARNINGS" ]; then
            log "🚨 CPU sostenidamente alta (${WARNING_COUNT} muestras) - Reiniciando..."
            pm2 restart solucnet-bot --update-env
            log "✅ Reinicio preventivo completado"
            exit 0
        fi
    else
        # CPU normal - resetear contador si había advertencias
        if [ "$WARNING_COUNT" -gt 0 ]; then
            log "✅ CPU normalizada: ${CPU}% (advertencias reseteadas)"
            WARNING_COUNT=0
        fi
    fi

    # Esperar 5 segundos entre muestras
    sleep 5
done

log "✅ Watchdog completado - Sistema estable"

# Limpiar logs antiguos
if [ -f "$LOG_FILE" ]; then
    LINES=$(wc -l < "$LOG_FILE")
    if [ "$LINES" -gt 500 ]; then
        tail -500 "$LOG_FILE" > "${LOG_FILE}.tmp"
        mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
fi

exit 0
