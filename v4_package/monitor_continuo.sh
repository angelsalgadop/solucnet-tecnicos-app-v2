#!/bin/bash

# ===========================================
# MONITOR CONTINUO - SOLUCNET BOT V4
# Sistema de monitoreo automático con auto-inicio
# ===========================================

PROJECT_NAME="solucnet-bot-v4"
PROJECT_DIR="/opt/${PROJECT_NAME}"
LOG_DIR="/var/log/${PROJECT_NAME}"
MONITOR_LOG="${LOG_DIR}/monitor_continuo.log"

# Función de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - MONITOR CONTINUO: $1" >> "$MONITOR_LOG"
}

# Verificar si el proceso está corriendo
check_process() {
    if pgrep -f "node.*index.js" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Verificar conectividad HTTP
check_http() {
    if curl -f -s --max-time 10 http://localhost:3000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Verificar PM2
check_pm2() {
    if pm2 list | grep -q "${PROJECT_NAME}"; then
        return 0
    else
        return 1
    fi
}

# Verificar servicios systemd
check_services() {
    local services_running=0

    if systemctl is-active --quiet "${PROJECT_NAME}.service"; then
        ((services_running++))
    fi

    if systemctl is-active --quiet "${PROJECT_NAME}-monitor.service"; then
        ((services_running++))
    fi

    if systemctl is-active --quiet "${PROJECT_NAME}-watchdog.service"; then
        ((services_running++))
    fi

    return $services_running
}

# Reiniciar servicios
restart_services() {
    log_message "Reiniciando servicios del sistema..."

    # Detener servicios
    systemctl stop "${PROJECT_NAME}-watchdog.service" 2>/dev/null || true
    systemctl stop "${PROJECT_NAME}-monitor.service" 2>/dev/null || true
    systemctl stop "${PROJECT_NAME}.service" 2>/dev/null || true

    # Detener procesos manualmente
    pm2 stop "${PROJECT_NAME}" 2>/dev/null || true
    pkill -f "node.*index.js" 2>/dev/null || true

    sleep 5

    # Limpiar sesiones
    rm -rf "${PROJECT_DIR}/.wwebjs_auth/session" 2>/dev/null || true

    # Iniciar servicios
    systemctl start "${PROJECT_NAME}.service"
    sleep 3
    systemctl start "${PROJECT_NAME}-monitor.service"
    sleep 2
    systemctl start "${PROJECT_NAME}-watchdog.service"

    log_message "Servicios reiniciados"
}

# Función principal de monitoreo continuo
main() {
    log_message "=== INICIANDO MONITOR CONTINUO ==="

    while true; do
        local issues=0

        # Verificar proceso
        if ! check_process; then
            log_message "ERROR: Proceso principal no encontrado"
            ((issues++))
        fi

        # Verificar HTTP
        if ! check_http; then
            log_message "ERROR: Servicio HTTP no responde"
            ((issues++))
        fi

        # Verificar PM2
        if ! check_pm2; then
            log_message "ERROR: PM2 no gestiona el proceso"
            ((issues++))
        fi

        # Verificar servicios
        check_services
        if [ $? -lt 3 ]; then
            log_message "ERROR: No todos los servicios están ejecutándose"
            ((issues++))
        fi

        # Si hay problemas, reiniciar
        if [ $issues -gt 0 ]; then
            log_message "Se encontraron $issues problemas, reiniciando servicios..."
            restart_services

            # Verificar después del reinicio
            sleep 10

            if check_process && check_http && check_pm2; then
                log_message "Recuperación exitosa"
            else
                log_message "ERROR: Recuperación fallida"
            fi
        else
            log_message "Sistema funcionando correctamente"
        fi

        # Esperar antes de la próxima verificación
        sleep 30
    done
}

# Iniciar monitoreo continuo
main
