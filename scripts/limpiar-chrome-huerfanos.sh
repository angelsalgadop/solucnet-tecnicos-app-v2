#!/bin/bash
# Script para limpiar procesos huérfanos de Chrome
# Ejecutar antes de reiniciar el bot

LOG_FILE="/root/whatsapp-chatbot/logs/limpieza-chrome.log"
FECHA=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$FECHA] $1" | tee -a "$LOG_FILE"
}

# Contar procesos de Chrome antes
CHROME_ANTES=$(ps aux | grep -E "chrome|chromium" | grep -v grep | wc -l)
log "🔍 Procesos Chrome antes: $CHROME_ANTES"

# Obtener PID del bot
BOT_PID=$(pm2 jlist | jq -r '.[] | select(.name=="solucnet-bot") | .pid')

if [ -z "$BOT_PID" ] || [ "$BOT_PID" = "0" ] || [ "$BOT_PID" = "null" ]; then
    log "⚠️ Bot no está corriendo, limpiando todos los Chrome"
    pkill -9 -f chrome 2>/dev/null
    pkill -9 -f chromium 2>/dev/null
else
    log "✅ Bot corriendo con PID: $BOT_PID"

    # Buscar Chrome asociados al bot
    BOT_CHROME=$(pgrep -P $BOT_PID | xargs -I {} pgrep -P {})

    # Matar Chrome huérfanos (los que NO son hijos del bot)
    ps aux | grep -E "chrome|chromium" | grep -v grep | awk '{print $2}' | while read pid; do
        if ! echo "$BOT_CHROME" | grep -q "^$pid$"; then
            log "🧹 Matando proceso Chrome huérfano: $pid"
            kill -9 $pid 2>/dev/null
        fi
    done
fi

# Contar procesos de Chrome después
sleep 1
CHROME_DESPUES=$(ps aux | grep -E "chrome|chromium" | grep -v grep | wc -l)
ELIMINADOS=$((CHROME_ANTES - CHROME_DESPUES))

log "✅ Limpieza completada - Procesos después: $CHROME_DESPUES (Eliminados: $ELIMINADOS)"

# Limpiar logs viejos (mantener últimas 200 líneas)
if [ -f "$LOG_FILE" ]; then
    LINES=$(wc -l < "$LOG_FILE")
    if [ "$LINES" -gt 200 ]; then
        tail -200 "$LOG_FILE" > "${LOG_FILE}.tmp"
        mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
fi

exit 0
