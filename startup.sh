#!/bin/bash
# Script de inicio para mantener el bot en línea permanentemente

BOT_DIR="/root/whatsapp-chatbot"
BOT_NAME="solucnet-bot"

cd "$BOT_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Iniciando sistema de WhatsApp Bot SOLUCNET..."

# Detener cualquier instancia previa
log "🛑 Deteniendo instancias previas..."
pm2 stop "$BOT_NAME" 2>/dev/null || true
pm2 delete "$BOT_NAME" 2>/dev/null || true
sleep 5

# Limpiar logs antiguos (mantener últimos 7 días)
find ./logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

# Iniciar con PM2
log "🔄 Iniciando bot con PM2..."
pm2 start ecosystem.config.js --env production

# Esperar a que se estabilice
sleep 15

# Verificar estado
if pm2 list | grep -q "$BOT_NAME.*online"; then
    log "✅ Bot iniciado correctamente"
    pm2 logs "$BOT_NAME" --lines 10
else
    log "❌ Error iniciando bot"
    pm2 logs "$BOT_NAME" --lines 20
    exit 1
fi

# Configurar crontab para auto-monitoreo
log "⏰ Configurando monitoreo automático..."

# Crear entrada de cron si no existe
CRON_JOB="*/5 * * * * /root/whatsapp-chatbot/auto-monitor.sh >> /root/whatsapp-chatbot/logs/cron-monitor.log 2>&1"
(crontab -l 2>/dev/null | grep -v "auto-monitor.sh"; echo "$CRON_JOB") | crontab -

log "✅ Sistema configurado para mantenerse en línea 24/7"
log "📊 Monitoreo: cada 5 minutos"
log "🔄 Reinicio automático: diario a las 4 AM"
log "📧 Emails de desconexión: cada 5 minutos si falla WhatsApp"

# Mostrar estado final
log "📈 Estado actual del sistema:"
pm2 status
pm2 monit