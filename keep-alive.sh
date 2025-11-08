#!/bin/bash

# Script para mantener el chatbot siempre ejecutándose
BOT_DIR="/root/whatsapp-chatbot"
BOT_SCRIPT="index.js"
LOCKFILE="/tmp/whatsapp-bot.lock"

cd "$BOT_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a logs/keep-alive.log
}

# Función para verificar si el bot está ejecutándose
is_running() {
    if [ -f "$LOCKFILE" ]; then
        PID=$(cat "$LOCKFILE")
        if kill -0 "$PID" 2>/dev/null; then
            return 0  # Está ejecutándose
        else
            rm -f "$LOCKFILE"
            return 1  # No está ejecutándose
        fi
    else
        return 1  # No está ejecutándose
    fi
}

# Función para iniciar el bot
start_bot() {
    log "🚀 Iniciando WhatsApp Bot..."

    # Matar cualquier proceso node previo del bot
    pkill -f "node.*index.js" 2>/dev/null || true
    sleep 2

    # Iniciar el bot en background
    nohup node "$BOT_SCRIPT" > logs/bot-output.log 2>&1 &
    BOT_PID=$!

    # Guardar PID
    echo "$BOT_PID" > "$LOCKFILE"

    log "✅ Bot iniciado con PID: $BOT_PID"
    return 0
}

# Función para detener el bot
stop_bot() {
    if [ -f "$LOCKFILE" ]; then
        PID=$(cat "$LOCKFILE")
        log "🛑 Deteniendo bot con PID: $PID"
        kill "$PID" 2>/dev/null || true
        sleep 3
        kill -9 "$PID" 2>/dev/null || true
        rm -f "$LOCKFILE"
        log "✅ Bot detenido"
    fi
}

# Función principal
main() {
    case "${1:-start}" in
        "start")
            if is_running; then
                log "⚠️ El bot ya está ejecutándose"
                exit 0
            else
                start_bot
            fi
            ;;
        "stop")
            stop_bot
            ;;
        "restart")
            stop_bot
            sleep 2
            start_bot
            ;;
        "status")
            if is_running; then
                PID=$(cat "$LOCKFILE")
                log "✅ Bot ejecutándose con PID: $PID"
                exit 0
            else
                log "❌ Bot no está ejecutándose"
                exit 1
            fi
            ;;
        "monitor")
            while true; do
                if ! is_running; then
                    log "⚠️ Bot no está ejecutándose. Reiniciando..."
                    start_bot
                fi
                sleep 30
            done
            ;;
        *)
            echo "Uso: $0 {start|stop|restart|status|monitor}"
            exit 1
            ;;
    esac
}

# Crear directorio de logs si no existe
mkdir -p logs

# Ejecutar función principal
main "$@"