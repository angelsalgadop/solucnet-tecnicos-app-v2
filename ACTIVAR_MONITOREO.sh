#!/bin/bash
# Script de Instalación y Configuración Completa
# WhatsApp Bot SOLUCNET - Monitoreo y Recuperación Automática
# Versión: 3.0

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BOT_DIR="/root/whatsapp-chatbot"
SERVICE_NAME="solucnet-bot"
MONITOR_SERVICE="whatsapp-monitor"
USER_NAME="root"

# Función para logging con colores
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ADVERTENCIA:${NC} $1"
}

log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Banner
show_banner() {
    clear
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    SOLUCNET WHATSAPP BOT                     ║"
    echo "║           Sistema de Monitoreo y Recuperación               ║"
    echo "║                      Versión 3.0                            ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
}

# Verificar privilegios de root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Este script debe ejecutarse como root"
        log_info "Ejecute: sudo bash setup-monitoring.sh"
        exit 1
    fi
}

# Verificar dependencias del sistema
check_dependencies() {
    log_info "Verificando dependencias del sistema..."

    local missing_deps=()

    # Verificar systemd
    if ! command -v systemctl >/dev/null 2>&1; then
        missing_deps+=("systemd")
    fi

    # Verificar curl
    if ! command -v curl >/dev/null 2>&1; then
        missing_deps+=("curl")
    fi

    # Verificar Node.js
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("nodejs")
    fi

    # Verificar PM2
    if ! command -v pm2 >/dev/null 2>&1; then
        missing_deps+=("pm2")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_warning "Dependencias faltantes: ${missing_deps[*]}"
        return 1
    fi

    log "✅ Todas las dependencias están instaladas"
    return 0
}

# Instalar dependencias faltantes
install_dependencies() {
    log_info "Instalando dependencias faltantes..."

    # Actualizar repositorios
    apt-get update -qq

    # Instalar dependencias básicas
    apt-get install -y curl wget git systemd >/dev/null 2>&1

    # Instalar Node.js si no está
    if ! command -v node >/dev/null 2>&1; then
        log_info "Instalando Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >/dev/null 2>&1
        apt-get install -y nodejs >/dev/null 2>&1
    fi

    # Instalar PM2 si no está
    if ! command -v pm2 >/dev/null 2>&1; then
        log_info "Instalando PM2..."
        npm install -g pm2 >/dev/null 2>&1
    fi

    log "✅ Dependencias instaladas correctamente"
}

# Verificar archivos del bot
check_bot_files() {
    log_info "Verificando archivos del bot..."

    if [ ! -d "$BOT_DIR" ]; then
        log_error "Directorio del bot no encontrado: $BOT_DIR"
        return 1
    fi

    if [ ! -f "$BOT_DIR/index.js" ]; then
        log_error "Archivo principal no encontrado: $BOT_DIR/index.js"
        return 1
    fi

    if [ ! -f "$BOT_DIR/monitor-recovery.sh" ]; then
        log_error "Script de monitoreo no encontrado: $BOT_DIR/monitor-recovery.sh"
        return 1
    fi

    log "✅ Archivos del bot verificados"
    return 0
}

# Crear servicio systemd para el bot
create_bot_service() {
    log_info "Creando servicio systemd para el bot..."

    cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=WhatsApp Bot SOLUCNET
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$BOT_DIR
ExecStart=/usr/bin/pm2-runtime start ecosystem.config.js --name $SERVICE_NAME
ExecReload=/bin/kill -USR2 \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME
Environment=NODE_ENV=production
Environment=PM2_HOME=/root/.pm2

# Configuración de límites
LimitNOFILE=65535
LimitNPROC=65535
LimitCORE=infinity

[Install]
WantedBy=multi-user.target
EOF

    log "✅ Servicio del bot creado"
}

# Crear servicio systemd para el monitor
create_monitor_service() {
    log_info "Creando servicio systemd para el monitor..."

    cat > /etc/systemd/system/$MONITOR_SERVICE.service << EOF
[Unit]
Description=WhatsApp Bot Monitor and Recovery
After=network.target $SERVICE_NAME.service
Wants=$SERVICE_NAME.service

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$BOT_DIR
ExecStart=$BOT_DIR/monitor-recovery.sh monitor
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$MONITOR_SERVICE

[Install]
WantedBy=multi-user.target
EOF

    log "✅ Servicio del monitor creado"
}

# Crear archivo de configuración del ecosistema PM2
create_pm2_config() {
    log_info "Creando configuración PM2..."

    cat > "$BOT_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'index.js',
    cwd: '$BOT_DIR',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '$BOT_DIR/logs/pm2-error.log',
    out_file: '$BOT_DIR/logs/pm2-out.log',
    log_file: '$BOT_DIR/logs/pm2-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};
EOF

    log "✅ Configuración PM2 creada"
}

# Configurar logrotate para los logs
setup_logrotate() {
    log_info "Configurando rotación de logs..."

    cat > /etc/logrotate.d/whatsapp-bot << EOF
$BOT_DIR/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER_NAME $USER_NAME
    postrotate
        systemctl reload $SERVICE_NAME >/dev/null 2>&1 || true
    endscript
}
EOF

    log "✅ Rotación de logs configurada"
}

# Hacer scripts ejecutables
make_scripts_executable() {
    log_info "Configurando permisos de scripts..."

    chmod +x "$BOT_DIR/monitor-recovery.sh"
    chmod +x "$BOT_DIR/setup-monitoring.sh"

    # Crear directorio de logs si no existe
    mkdir -p "$BOT_DIR/logs"
    chown -R $USER_NAME:$USER_NAME "$BOT_DIR/logs"

    log "✅ Permisos configurados"
}

# Habilitar e iniciar servicios
enable_services() {
    log_info "Habilitando servicios en el sistema..."

    # Recargar systemd
    systemctl daemon-reload

    # Habilitar servicios para inicio automático
    systemctl enable $SERVICE_NAME
    systemctl enable $MONITOR_SERVICE

    log "✅ Servicios habilitados para inicio automático"
}

# Iniciar servicios
start_services() {
    log_info "Iniciando servicios..."

    # Detener servicios si están corriendo
    systemctl stop $MONITOR_SERVICE 2>/dev/null || true
    systemctl stop $SERVICE_NAME 2>/dev/null || true

    sleep 5

    # Iniciar servicio del bot
    systemctl start $SERVICE_NAME
    sleep 10

    # Verificar que el bot está funcionando
    if systemctl is-active --quiet $SERVICE_NAME; then
        log "✅ Bot iniciado correctamente"

        # Iniciar servicio de monitoreo
        systemctl start $MONITOR_SERVICE
        sleep 5

        if systemctl is-active --quiet $MONITOR_SERVICE; then
            log "✅ Monitor iniciado correctamente"
        else
            log_warning "Monitor no pudo iniciarse, pero el bot está funcionando"
        fi
    else
        log_error "Error al iniciar el bot"
        return 1
    fi
}

# Mostrar información del sistema
show_system_info() {
    log_info "Estado del sistema:"
    echo

    echo -e "${BLUE}📊 Estado de servicios:${NC}"
    systemctl status $SERVICE_NAME --no-pager -l | head -n 5
    echo
    systemctl status $MONITOR_SERVICE --no-pager -l | head -n 5
    echo

    echo -e "${BLUE}🔧 Comandos útiles:${NC}"
    echo "  Ver estado completo:    systemctl status $SERVICE_NAME"
    echo "  Ver logs del bot:       journalctl -u $SERVICE_NAME -f"
    echo "  Ver logs del monitor:   journalctl -u $MONITOR_SERVICE -f"
    echo "  Reiniciar bot:          systemctl restart $SERVICE_NAME"
    echo "  Reiniciar monitor:      systemctl restart $MONITOR_SERVICE"
    echo "  Parar todo:             systemctl stop $MONITOR_SERVICE $SERVICE_NAME"
    echo

    echo -e "${BLUE}📁 Ubicaciones importantes:${NC}"
    echo "  Bot:                    $BOT_DIR"
    echo "  Logs:                   $BOT_DIR/logs/"
    echo "  Configuración PM2:      $BOT_DIR/ecosystem.config.js"
    echo "  Script de monitoreo:    $BOT_DIR/monitor-recovery.sh"
    echo

    echo -e "${GREEN}✅ Instalación completada exitosamente${NC}"
    echo -e "${GREEN}🚀 El bot está configurado para iniciarse automáticamente después de reinicio${NC}"
    echo -e "${GREEN}🔄 El sistema de monitoreo mantendrá el bot en línea 24/7${NC}"
}

# Función de desinstalación
uninstall() {
    log_info "Desinstalando servicios de monitoreo..."

    # Parar servicios
    systemctl stop $MONITOR_SERVICE 2>/dev/null || true
    systemctl stop $SERVICE_NAME 2>/dev/null || true

    # Deshabilitar servicios
    systemctl disable $MONITOR_SERVICE 2>/dev/null || true
    systemctl disable $SERVICE_NAME 2>/dev/null || true

    # Eliminar archivos de servicio
    rm -f /etc/systemd/system/$SERVICE_NAME.service
    rm -f /etc/systemd/system/$MONITOR_SERVICE.service
    rm -f /etc/logrotate.d/whatsapp-bot

    # Recargar systemd
    systemctl daemon-reload

    log "✅ Servicios desinstalados"
}

# Función principal de instalación
install_monitoring() {
    show_banner

    log "🚀 Iniciando instalación del sistema de monitoreo..."
    echo

    # Verificaciones previas
    check_root

    if ! check_dependencies; then
        install_dependencies
    fi

    if ! check_bot_files; then
        log_error "Archivos del bot no encontrados. Instalación abortada."
        exit 1
    fi

    # Crear configuraciones
    create_pm2_config
    create_bot_service
    create_monitor_service
    setup_logrotate
    make_scripts_executable

    # Configurar servicios
    enable_services
    start_services

    echo
    show_system_info
}

# Función principal
main() {
    case "${1:-install}" in
        "install")
            install_monitoring
            ;;
        "uninstall")
            uninstall
            ;;
        "status")
            show_system_info
            ;;
        "restart")
            log_info "Reiniciando servicios..."
            systemctl restart $SERVICE_NAME
            sleep 5
            systemctl restart $MONITOR_SERVICE
            log "✅ Servicios reiniciados"
            ;;
        *)
            show_banner
            echo "Uso: $0 {install|uninstall|status|restart}"
            echo
            echo "Comandos:"
            echo "  install    - Instalar sistema de monitoreo completo (por defecto)"
            echo "  uninstall  - Desinstalar servicios de monitoreo"
            echo "  status     - Mostrar estado del sistema"
            echo "  restart    - Reiniciar todos los servicios"
            echo
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"