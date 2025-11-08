#!/bin/bash
# Monitor de salud de Chrome - detecta problemas antes de que crashee

LOG_FILE="/root/whatsapp-chatbot/logs/chrome-health.log"
FECHA=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$FECHA] $1" | tee -a "$LOG_FILE"
}

# Verificar si el bot está corriendo
BOT_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="solucnet-bot") | .pm2_env.status')

if [ "$BOT_STATUS" != "online" ]; then
    log "⚠️ Bot no está online: $BOT_STATUS"
    exit 0
fi

# Contar procesos de Chrome
CHROME_COUNT=$(ps aux | grep -E "chrome.*whatsapp" | grep -v grep | wc -l)

if [ "$CHROME_COUNT" -eq 0 ]; then
    log "🚨 ALERTA: No hay procesos Chrome corriendo pero bot está online!"
    log "Reiniciando bot..."
    pm2 restart solucnet-bot
    exit 0
fi

# Verificar memoria de procesos Chrome
CHROME_MEM=$(ps aux | grep -E "chrome.*whatsapp" | grep -v grep | awk '{sum+=$4} END {printf "%.1f", sum}')

if (( $(echo "$CHROME_MEM > 15.0" | bc -l) )); then
    log "⚠️ Chrome usando mucha memoria: ${CHROME_MEM}% - Programando reinicio"
    # No reiniciar ahora, dejar que el cron de 2 horas lo maneje
fi

# Verificar si hay procesos Chrome zombies
ZOMBIE_COUNT=$(ps aux | grep -E "chrome.*defunct" | grep -v grep | wc -l)

if [ "$ZOMBIE_COUNT" -gt 0 ]; then
    log "🧟 Detectados $ZOMBIE_COUNT procesos Chrome zombies - Limpiando..."
    /root/whatsapp-chatbot/scripts/limpiar-chrome-huerfanos.sh
fi

log "✅ Salud de Chrome OK - Procesos: $CHROME_COUNT, Mem: ${CHROME_MEM}%"

# Limpiar logs viejos
if [ -f "$LOG_FILE" ]; then
    LINES=$(wc -l < "$LOG_FILE")
    if [ "$LINES" -gt 300 ]; then
        tail -300 "$LOG_FILE" > "${LOG_FILE}.tmp"
        mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
fi

exit 0
