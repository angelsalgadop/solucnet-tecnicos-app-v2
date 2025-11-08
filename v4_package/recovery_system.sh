#!/bin/bash

# ===========================================
# RECOVERY SYSTEM - SOLUCNET BOT V4
# Sistema de recuperación automática de errores
# ===========================================

PROJECT_NAME="solucnet-bot-v4"
PROJECT_DIR="/opt/${PROJECT_NAME}"
LOG_DIR="/var/log/${PROJECT_NAME}"
RECOVERY_LOG="${LOG_DIR}/recovery.log"

# Función de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - RECOVERY: $1" >> "$RECOVERY_LOG"
}

# Verificar estado del sistema
check_system_status() {
    local errors=0

    # Verificar proceso
    if ! pgrep -f "node.*index.js" > /dev/null; then
        log_message "ERROR: Proceso principal no encontrado"
        ((errors++))
    fi

    # Verificar HTTP
    if ! curl -f -s --max-time 10 http://localhost:3000 > /dev/null 2>&1; then
        log_message "ERROR: Servicio HTTP no responde"
        ((errors++))
    fi

    # Verificar PM2
    if ! pm2 list | grep -q "${PROJECT_NAME}"; then
        log_message "ERROR: PM2 no gestiona el proceso"
        ((errors++))
    fi

    # Verificar espacio en disco
    local disk_usage=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_message "ERROR: Espacio en disco bajo: ${disk_usage}%"
        ((errors++))
    fi

    # Verificar memoria
    local mem_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    if [ "$mem_usage" -gt 90 ]; then
        log_message "ERROR: Uso de memoria alto: ${mem_usage}%"
        ((errors++))
    fi

    return $errors
}

# Recuperación básica
basic_recovery() {
    log_message "INICIANDO RECUPERACIÓN BÁSICA"

    cd "$PROJECT_DIR"

    # Reiniciar con PM2
    pm2 restart "${PROJECT_NAME}" 2>/dev/null || true

    sleep 5

    if check_system_status; then
        log_message "Recuperación básica exitosa"
        return 0
    else
        log_message "Recuperación básica fallida, intentando recuperación avanzada"
        return 1
    fi
}

# Recuperación avanzada
advanced_recovery() {
    log_message "INICIANDO RECUPERACIÓN AVANZADA"

    cd "$PROJECT_DIR"

    # Detener todo
    pm2 stop "${PROJECT_NAME}" 2>/dev/null || true
    pm2 delete "${PROJECT_NAME}" 2>/dev/null || true
    pkill -9 -f "node.*index.js" 2>/dev/null || true

    sleep 3

    # Limpiar caché y sesiones
    rm -rf "${PROJECT_DIR}/.wwebjs_auth/session" 2>/dev/null || true
    rm -rf "${PROJECT_DIR}/.pm2" 2>/dev/null || true

    # Reiniciar servicios del sistema
    systemctl restart mysql 2>/dev/null || true
    systemctl restart "${PROJECT_NAME}.service" 2>/dev/null || true

    sleep 10

    if check_system_status; then
        log_message "Recuperación avanzada exitosa"
        return 0
    else
        log_message "Recuperación avanzada fallida"
        return 1
    fi
}

# Recuperación de emergencia
emergency_recovery() {
    log_message "INICIANDO RECUPERACIÓN DE EMERGENCIA"

    # Backup de logs antes de reinicio
    mkdir -p "${PROJECT_DIR}/backup/emergency"
    cp "${LOG_DIR}"/*.log "${PROJECT_DIR}/backup/emergency/" 2>/dev/null || true

    # Reiniciar todos los servicios
    systemctl restart "${PROJECT_NAME}.service"
    sleep 2
    systemctl restart "${PROJECT_NAME}-monitor.service"
    sleep 2
    systemctl restart "${PROJECT_NAME}-watchdog.service"

    sleep 15

    if check_system_status; then
        log_message "Recuperación de emergencia exitosa"
        return 0
    else
        log_message "CRÍTICO: Recuperación de emergencia fallida"
        return 1
    fi
}

# Función principal
main() {
    log_message "=== SISTEMA DE RECUPERACIÓN INICIADO ==="

    # Verificar estado del sistema
    check_system_status
    local error_count=$?

    if [ $error_count -eq 0 ]; then
        log_message "Sistema funcionando correctamente"
        exit 0
    fi

    log_message "Detectados $error_count errores en el sistema"

    # Intentar recuperación básica
    if basic_recovery; then
        log_message "Recuperación completada con método básico"
        exit 0
    fi

    # Intentar recuperación avanzada
    if advanced_recovery; then
        log_message "Recuperación completada con método avanzado"
        exit 0
    fi

    # Último recurso: recuperación de emergencia
    if emergency_recovery; then
        log_message "Recuperación completada con método de emergencia"
        exit 0
    fi

    log_message "CRÍTICO: Todos los métodos de recuperación fallaron"
    log_message "Se requiere intervención manual"

    # Enviar notificación (puedes implementar envío de email aquí)
    echo "CRÍTICO: SolucNet Bot V4 requiere atención manual" >> "${LOG_DIR}/CRITICAL_ERROR.log"

    exit 1
}

# Ejecutar recuperación
main
