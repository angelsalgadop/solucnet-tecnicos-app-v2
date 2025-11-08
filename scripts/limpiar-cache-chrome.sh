#!/bin/bash
# Script para limpiar cache de Chrome automáticamente
# Ejecutar cada 1 hora para prevenir crecimiento de cache

LOG_FILE="/root/whatsapp-chatbot/logs/limpieza-cache.log"
FECHA=$(date '+%Y-%m-%d %H:%M:%S')
CACHE_DIR="/root/whatsapp-chatbot/.wwebjs_auth/session-whatsapp-bot-session/Default"

log() {
    echo "[$FECHA] $1" | tee -a "$LOG_FILE"
}

# Verificar tamaño del cache antes
CACHE_ANTES=$(du -sh "$CACHE_DIR/Cache" 2>/dev/null | awk '{print $1}')
CODE_CACHE_ANTES=$(du -sh "$CACHE_DIR/Code Cache" 2>/dev/null | awk '{print $1}')

log "📊 Cache antes - Cache: $CACHE_ANTES, Code Cache: $CODE_CACHE_ANTES"

# Limpiar solo si el cache supera 200MB
CACHE_SIZE=$(du -sm "$CACHE_DIR/Cache" 2>/dev/null | awk '{print $1}')

if [ -z "$CACHE_SIZE" ]; then
    log "⚠️ No se pudo obtener tamaño de cache"
    exit 0
fi

if [ "$CACHE_SIZE" -lt 200 ]; then
    log "✅ Cache OK ($CACHE_SIZE MB) - No requiere limpieza"
    exit 0
fi

log "🧹 Cache grande ($CACHE_SIZE MB) - Iniciando limpieza..."

# Limpiar archivos de cache (no eliminar directorios base)
rm -rf "$CACHE_DIR/Cache/"* 2>/dev/null
rm -rf "$CACHE_DIR/Code Cache/"* 2>/dev/null
rm -rf "$CACHE_DIR/Service Worker/CacheStorage/"* 2>/dev/null
rm -rf "$CACHE_DIR/GPUCache/"* 2>/dev/null

# Verificar tamaño después
CACHE_DESPUES=$(du -sh "$CACHE_DIR/Cache" 2>/dev/null | awk '{print $1}')
CODE_CACHE_DESPUES=$(du -sh "$CACHE_DIR/Code Cache" 2>/dev/null | awk '{print $1}')

log "✅ Limpieza completada - Cache: $CACHE_DESPUES, Code Cache: $CODE_CACHE_DESPUES"

# Limpiar logs viejos (mantener últimas 100 líneas)
if [ -f "$LOG_FILE" ]; then
    LINES=$(wc -l < "$LOG_FILE")
    if [ "$LINES" -gt 100 ]; then
        tail -100 "$LOG_FILE" > "${LOG_FILE}.tmp"
        mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
fi

exit 0
