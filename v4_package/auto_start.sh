#!/bin/bash

# ===========================================
# AUTO-START SYSTEM - SOLUCNET BOT V4
# Sistema de auto-inicio automático en reinicio
# ===========================================

PROJECT_NAME="solucnet-bot-v4"
PROJECT_DIR="/opt/${PROJECT_NAME}"
LOG_DIR="/var/log/${PROJECT_NAME}"
AUTO_START_LOG="${LOG_DIR}/auto_start.log"

# Función de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - AUTO-START: $1" >> "$AUTO_START_LOG"
}

# Verificar si el sistema está instalado
check_installation() {
    if [ -d "$PROJECT_DIR" ] && [ -f "${PROJECT_DIR}/package.json" ]; then
        return 0
    else
        return 1
    fi
}

# Iniciar servicios del sistema
start_system_services() {
    log_message "Iniciando servicios del sistema..."

    # Verificar si los servicios existen
    if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        systemctl start "${PROJECT_NAME}.service" 2>/dev/null || true
        log_message "Servicio principal iniciado"
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}-monitor.service" ]; then
        systemctl start "${PROJECT_NAME}-monitor.service" 2>/dev/null || true
        log_message "Servicio de monitoreo iniciado"
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}-watchdog.service" ]; then
        systemctl start "${PROJECT_NAME}-watchdog.service" 2>/dev/null || true
        log_message "Servicio watchdog iniciado"
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}-backup.service" ]; then
        systemctl start "${PROJECT_NAME}-backup.service" 2>/dev/null || true
        log_message "Servicio de backup iniciado"
    fi
}

# Verificar estado de servicios
check_services_status() {
    log_message "Verificando estado de servicios..."

    local services_ok=0

    if systemctl is-active --quiet "${PROJECT_NAME}.service" 2>/dev/null; then
        ((services_ok++))
        log_message "Servicio principal: ACTIVO"
    else
        log_message "Servicio principal: INACTIVO"
    fi

    if systemctl is-active --quiet "${PROJECT_NAME}-monitor.service" 2>/dev/null; then
        ((services_ok++))
        log_message "Servicio de monitoreo: ACTIVO"
    else
        log_message "Servicio de monitoreo: INACTIVO"
    fi

    if systemctl is-active --quiet "${PROJECT_NAME}-watchdog.service" 2>/dev/null; then
        ((services_ok++))
        log_message "Servicio watchdog: ACTIVO"
    else
        log_message "Servicio watchdog: INACTIVO"
    fi

    return $services_ok
}

# Función principal
main() {
    log_message "=== SISTEMA DE AUTO-START INICIADO ==="

    # Verificar instalación
    if ! check_installation; then
        log_message "ERROR: Sistema no instalado en $PROJECT_DIR"
        exit 1
    fi

    log_message "Sistema detectado correctamente"

    # Iniciar servicios
    start_system_services

    # Esperar a que los servicios se inicien
    sleep 10

    # Verificar estado
    check_services_status

    if [ $? -ge 3 ]; then
        log_message "AUTO-START COMPLETADO EXITOSAMENTE"
    else
        log_message "ADVERTENCIA: Algunos servicios no se iniciaron correctamente"
    fi

    log_message "=== AUTO-START FINALIZADO ==="
}

# Ejecutar auto-start
main
