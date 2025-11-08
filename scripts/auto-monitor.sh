#!/bin/bash

# Script de monitoreo automático del chatbot WhatsApp
# Se ejecuta cada minuto para verificar que el servicio esté funcionando

LOG_FILE="/opt/whatsapp-chatbot/logs/monitor.log"
CHATBOT_DIR="/opt/whatsapp-chatbot"
APP_NAME="whatsapp-bot"
MAX_RETRIES=3
RETRY_COUNT=0

# Función para logging
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Función para verificar si el proceso está funcionando
check_service() {
    # Verificar si PM2 está ejecutando la app
    if pm2 list | grep -q "$APP_NAME.*online"; then
        return 0  # Servicio funcionando
    else
        return 1  # Servicio no funcionando
    fi
}

# Función para verificar si el puerto está respondiendo
check_port() {
    if curl -s -f -k https://localhost:3000/api/health > /dev/null 2>&1; then
        return 0  # Puerto responde
    else
        return 1  # Puerto no responde
    fi
}

# Función para reiniciar el servicio
restart_service() {
    log_message "REINICIANDO - Intento $((RETRY_COUNT + 1)) de $MAX_RETRIES"
    
    cd "$CHATBOT_DIR"
    
    # Detener PM2 si está ejecutándose
    pm2 stop "$APP_NAME" > /dev/null 2>&1
    pm2 delete "$APP_NAME" > /dev/null 2>&1
    
    # Esperar un poco
    sleep 5
    
    # Reiniciar con PM2
    pm2 start ecosystem.config.js
    
    # Esperar que se inicie
    sleep 10
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
}

# Función principal de monitoreo
main() {
    log_message "Verificando estado del servicio..."
    
    # Verificar si el servicio está funcionando
    if check_service; then
        log_message "✓ Servicio PM2 funcionando correctamente"
        
        # Verificar si el puerto responde
        if check_port; then
            log_message "✓ Puerto 3000 respondiendo correctamente"
            # Todo está bien, resetear contador
            RETRY_COUNT=0
            exit 0
        else
            log_message "✗ Puerto 3000 no responde - Reiniciando servicio"
            restart_service
        fi
    else
        log_message "✗ Servicio PM2 no funcionando - Reiniciando servicio"
        restart_service
    fi
    
    # Verificar si se alcanzó el máximo de reintentos
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        log_message "ERROR CRÍTICO - Se alcanzó el máximo de reintentos ($MAX_RETRIES)"
        log_message "Enviando notificación de error crítico..."
        
        # Opcional: Enviar notificación por email o webhook
        # echo "Chatbot falló después de $MAX_RETRIES intentos" | mail -s "Error Crítico Chatbot" admin@example.com
        
        RETRY_COUNT=0  # Resetear para el próximo ciclo
        exit 1
    fi
}

# Crear directorio de logs si no existe
mkdir -p "$(dirname "$LOG_FILE")"

# Ejecutar función principal
main