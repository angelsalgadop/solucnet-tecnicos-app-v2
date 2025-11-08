#!/bin/bash
# Script de health check para detectar servidor no respondiendo
# Autor: Sistema de Monitoreo Automático
# Fecha: 2025-10-31

LOG_FILE="/root/whatsapp-chatbot/logs/health-check.log"
MAX_RETRIES=3
TIMEOUT=10

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Verificar si el servidor responde
check_server() {
    local protocol="https"
    local url="${protocol}://localhost:3000"

    # Intentar HTTPS primero
    if timeout $TIMEOUT curl -k -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q "200"; then
        return 0
    fi

    # Si falla HTTPS, intentar HTTP
    protocol="http"
    url="${protocol}://localhost:3000"
    if timeout $TIMEOUT curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q "200"; then
        return 0
    fi

    return 1
}

# Limpiar procesos huérfanos de Node
cleanup_orphaned_processes() {
    log "🧹 Verificando procesos huérfanos de Node..."

    # Obtener PID del proceso PM2 (método más robusto)
    PM2_PID=$(pm2 jlist 2>/dev/null | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | head -1)

    if [ -z "$PM2_PID" ]; then
        log "⚠️  No se encontró proceso PM2 activo"
        return 1
    fi

    log "✅ Proceso PM2 activo con PID: $PM2_PID"

    # Buscar procesos de node index.js que NO sean el de PM2 y NO tengan la ruta completa de PM2
    ORPHANS=$(ps aux | grep "node.*index.js" | grep -v "grep" | grep -v "/root/whatsapp-chatbot/index.js" | awk '{print $2}')

    if [ ! -z "$ORPHANS" ]; then
        log "🔴 Procesos huérfanos detectados: $ORPHANS"
        for pid in $ORPHANS; do
            # Verificar que no sea el PID de PM2
            if [ "$pid" != "$PM2_PID" ]; then
                log "💀 Matando proceso huérfano: $pid"
                kill -9 $pid 2>/dev/null
            else
                log "⚠️  Saltando PID $pid (es el proceso PM2)"
            fi
        done
        log "✅ Procesos huérfanos eliminados"
        return 0
    else
        log "✅ No hay procesos huérfanos"
        return 0
    fi
}

# Main
log "🏥 Iniciando health check..."

# Limpiar procesos huérfanos primero
cleanup_orphaned_processes

# Verificar si el servidor responde
retry_count=0
server_ok=false

while [ $retry_count -lt $MAX_RETRIES ]; do
    if check_server; then
        log "✅ Servidor respondiendo correctamente"
        server_ok=true
        break
    else
        retry_count=$((retry_count + 1))
        log "⚠️  Intento $retry_count/$MAX_RETRIES: Servidor no responde"

        if [ $retry_count -lt $MAX_RETRIES ]; then
            sleep 5
        fi
    fi
done

if [ "$server_ok" = false ]; then
    log "🔴 Servidor NO responde después de $MAX_RETRIES intentos"
    log "🔄 Reiniciando aplicación..."

    # Reiniciar PM2
    pm2 restart solucnet-bot

    # Esperar a que inicie
    sleep 15

    # Verificar de nuevo
    if check_server; then
        log "✅ Aplicación reiniciada exitosamente"
        exit 0
    else
        log "❌ Aplicación sigue sin responder después del reinicio"
        exit 1
    fi
else
    exit 0
fi
