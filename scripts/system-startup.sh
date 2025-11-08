#!/bin/bash

# Script de inicio automático del sistema
# Se ejecuta al iniciar el sistema operativo

CHATBOT_DIR="/root/whatsapp-chatbot"
LOG_FILE="/root/whatsapp-chatbot/logs/startup.log"
USER="root"

# Función para logging
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Crear directorio de logs si no existe
mkdir -p "$(dirname "$LOG_FILE")"

log_message "=== INICIO DEL SISTEMA DETECTADO ==="
log_message "Iniciando configuración del chatbot WhatsApp..."

# Esperar a que el sistema esté completamente cargado
log_message "Esperando 30 segundos para que el sistema se cargue completamente..."
sleep 30

# Verificar que Node.js esté disponible
if ! command -v node &> /dev/null; then
    log_message "ERROR: Node.js no está instalado"
    exit 1
fi

# Verificar que PM2 esté disponible
if ! command -v pm2 &> /dev/null; then
    log_message "ERROR: PM2 no está instalado"
    exit 1
fi

# Navegar al directorio del chatbot
cd "$CHATBOT_DIR" || {
    log_message "ERROR: No se puede acceder al directorio $CHATBOT_DIR"
    exit 1
}

log_message "Directorio de trabajo: $(pwd)"

# Limpiar procesos PM2 previos (en caso de reinicio no limpio)
log_message "Limpiando procesos PM2 previos..."
pm2 stop all > /dev/null 2>&1
pm2 delete all > /dev/null 2>&1

# Esperar un poco
sleep 5

# Iniciar el chatbot con PM2
log_message "Iniciando chatbot con PM2..."
pm2 start ecosystem.config.js

# Verificar que se haya iniciado correctamente
sleep 10

if pm2 list | grep -q "whatsapp-bot.*online"; then
    log_message "✓ Chatbot iniciado correctamente"
    
    # Configurar PM2 para guardar la configuración
    pm2 save
    
    # Esperar un poco más y verificar que el puerto responda
    log_message "Verificando que el servicio responda en el puerto 3000..."
    sleep 20
    
    if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        log_message "✓ Servicio respondiendo correctamente en puerto 3000"
    else
        log_message "⚠ Servicio iniciado pero puerto 3000 no responde aún (puede tomar más tiempo)"
    fi
    
else
    log_message "✗ Error al iniciar el chatbot"
    pm2 logs whatsapp-bot --lines 20 >> "$LOG_FILE"
    exit 1
fi

log_message "=== CONFIGURACIÓN DE INICIO COMPLETADA ==="