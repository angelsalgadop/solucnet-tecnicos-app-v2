#!/bin/bash
# Script de reinicio preventivo para evitar crashes de Chrome
# Se ejecuta cada 2 horas para reiniciar el bot antes de que Chrome crashee

LOG_FILE="/root/whatsapp-chatbot/logs/reinicio-preventivo.log"
FECHA=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$FECHA] Iniciando reinicio preventivo..." >> "$LOG_FILE"

# Limpiar procesos Chrome huérfanos antes de reiniciar
/root/whatsapp-chatbot/scripts/limpiar-chrome-huerfanos.sh

# Reiniciar el bot
pm2 restart solucnet-bot >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "[$FECHA] ✅ Bot reiniciado exitosamente" >> "$LOG_FILE"
else
    echo "[$FECHA] ❌ Error al reiniciar bot" >> "$LOG_FILE"
fi

# Esperar 15 segundos y verificar que esté online
sleep 15

STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="solucnet-bot") | .pm2_env.status')

if [ "$STATUS" = "online" ]; then
    echo "[$FECHA] ✅ Bot confirmado online después de reinicio" >> "$LOG_FILE"
else
    echo "[$FECHA] ⚠️ Bot no está online: $STATUS" >> "$LOG_FILE"
fi

echo "[$FECHA] Reinicio preventivo completado" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
