#!/bin/bash
# Script para instalar el cron job del sistema de visitas automáticas

echo "═══════════════════════════════════════════════════════════════"
echo "🕒 INSTALACIÓN DE CRON JOB - VISITAS AUTOMÁTICAS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Ruta al script
SCRIPT_PATH="/root/whatsapp-chatbot/montar_visitas_suspendidos.js"
LOG_PATH="/root/whatsapp-chatbot/logs/visitas_automaticas.log"
NODE_PATH=$(which node)

# Crear directorio de logs si no existe
mkdir -p /root/whatsapp-chatbot/logs

# Verificar que el script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: No se encontró el script en $SCRIPT_PATH"
    exit 1
fi

# Crear entrada de cron
CRON_ENTRY="0 6 * * * $NODE_PATH $SCRIPT_PATH >> $LOG_PATH 2>&1"

# Verificar si ya existe el cron job
if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
    echo "⚠️  El cron job ya existe. Actualizando..."
    # Eliminar entrada existente
    crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" | crontab -
fi

# Agregar nuevo cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job instalado exitosamente"
echo ""
echo "📋 DETALLES:"
echo "   • Script: $SCRIPT_PATH"
echo "   • Horario: Todos los días a las 6:00 AM"
echo "   • Logs: $LOG_PATH"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 CRON JOBS ACTIVOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
crontab -l
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Instalación completada"
echo ""
