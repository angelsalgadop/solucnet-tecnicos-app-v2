#!/bin/bash
# Script de monitoreo para detectar y resolver problemas de "Session closed"

LOG_FILE="/root/whatsapp-chatbot/logs/err.log"
SESSION_DIR="/root/whatsapp-chatbot/.wwebjs_auth/session-whatsapp-bot-session"
RESTART_FLAG="/tmp/whatsapp_restart_in_progress"

# Verificar si hay errores de "Session closed" en los últimos logs
if grep -q "Session closed" "$LOG_FILE" 2>/dev/null; then
    # Obtener timestamp del último error (formato: 2025-10-28T17:30:05:)
    LAST_ERROR=$(grep "Session closed" "$LOG_FILE" | tail -1 | awk '{print $1}' | sed 's/:$//')

    # Convertir timestamp del error a epoch (formato: 2025-10-28T21:30:05)
    ERROR_EPOCH=$(date -d "${LAST_ERROR/T/ }" +%s 2>/dev/null)
    CURRENT_EPOCH=$(date +%s)

    # Calcular diferencia en minutos
    TIME_DIFF=$(( (CURRENT_EPOCH - ERROR_EPOCH) / 60 ))

    # Solo actuar si el error es de los últimos 10 minutos y no estamos en proceso de reinicio
    if [ "$TIME_DIFF" -le 10 ] && [ "$TIME_DIFF" -ge 0 ]; then
        if [ ! -f "$RESTART_FLAG" ]; then
            echo "[$(date)] ⚠️ Detectado error 'Session closed' reciente (hace $TIME_DIFF minutos) - Iniciando recuperación automática"

            # Marcar que estamos reiniciando
            touch "$RESTART_FLAG"

            # 1. Detener el bot
            echo "[$(date)] 🛑 Deteniendo bot..."
            pm2 stop solucnet-bot
            sleep 3

            # 2. Matar procesos de Chrome
            echo "[$(date)] 🧹 Limpiando procesos de Chrome..."
            pkill -9 -f "chrome.*whatsapp-bot-session" 2>/dev/null
            sleep 2

            # 3. Eliminar archivo de bloqueo
            echo "[$(date)] 🗑️ Eliminando archivo de bloqueo..."
            rm -f "$SESSION_DIR/SingletonLock" 2>/dev/null

            # 4. Reiniciar el bot
            echo "[$(date)] 🔄 Reiniciando bot..."
            pm2 start solucnet-bot
            sleep 10

            # 5. Verificar que se inició correctamente
            if pm2 list | grep -q "solucnet-bot.*online"; then
                echo "[$(date)] ✅ Bot reiniciado exitosamente"
            else
                echo "[$(date)] ❌ Error al reiniciar el bot"
            fi

            # Limpiar flag después de 2 minutos
            sleep 120
            rm -f "$RESTART_FLAG"
        else
            echo "[$(date)] ℹ️ Error 'Session closed' detectado pero ya hay un reinicio en progreso"
        fi
    else
        echo "[$(date)] ℹ️ Error 'Session closed' detectado pero es antiguo (hace $TIME_DIFF minutos) - No se requiere acción"
    fi
fi
