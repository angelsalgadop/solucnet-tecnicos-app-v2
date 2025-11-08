#!/bin/bash
# Script de Monitoreo Remoto WhatsApp Bot SOLUCNET
# Permite monitorear el bot desde otro PC de forma remota
# Versión: 1.0

# Configuración
REMOTE_HOST="TU_IP_SERVIDOR"  # Cambiar por la IP del servidor
REMOTE_USER="root"
SSH_KEY=""  # Opcional: ruta a la clave SSH privada
BOT_SERVICE="solucnet-bot"
MONITOR_SERVICE="whatsapp-monitor"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
show_banner() {
    clear
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║               MONITOR REMOTO WHATSAPP BOT                    ║"
    echo "║                     SOLUCNET v1.0                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar configuración
check_config() {
    if [ "$REMOTE_HOST" = "TU_IP_SERVIDOR" ]; then
        log_error "Debes configurar REMOTE_HOST con la IP del servidor"
        log_info "Edita este script y cambia REMOTE_HOST por la IP real del servidor"
        exit 1
    fi

    # Verificar conectividad SSH
    log_info "Verificando conectividad con $REMOTE_HOST..."

    local ssh_cmd="ssh"
    if [ -n "$SSH_KEY" ]; then
        ssh_cmd="ssh -i $SSH_KEY"
    fi

    if timeout 10 $ssh_cmd -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_USER@$REMOTE_HOST" "echo 'test'" >/dev/null 2>&1; then
        log "✅ Conexión SSH exitosa"
        return 0
    else
        log_error "No se pudo conectar al servidor via SSH"
        log_info "Verifica la IP, usuario y configuración SSH"
        return 1
    fi
}

# Ejecutar comando remoto
remote_exec() {
    local command="$1"
    local ssh_cmd="ssh"

    if [ -n "$SSH_KEY" ]; then
        ssh_cmd="ssh -i $SSH_KEY"
    fi

    $ssh_cmd "$REMOTE_USER@$REMOTE_HOST" "$command"
}

# Obtener estado del sistema
get_status() {
    log_info "Obteniendo estado del sistema remoto..."
    echo

    echo -e "${BLUE}📊 Estado de servicios:${NC}"
    remote_exec "systemctl is-active $BOT_SERVICE && echo '✅ Bot: ACTIVO' || echo '❌ Bot: INACTIVO'"
    remote_exec "systemctl is-active $MONITOR_SERVICE && echo '✅ Monitor: ACTIVO' || echo '❌ Monitor: INACTIVO'"
    echo

    echo -e "${BLUE}🔍 Detalles del bot:${NC}"
    remote_exec "systemctl status $BOT_SERVICE --no-pager -l | head -n 10"
    echo

    echo -e "${BLUE}🔍 Detalles del monitor:${NC}"
    remote_exec "systemctl status $MONITOR_SERVICE --no-pager -l | head -n 10"
    echo

    echo -e "${BLUE}💾 Uso de recursos:${NC}"
    remote_exec "top -bn1 | grep -E '(node|pm2|chrome)' | head -n 5" || echo "No se encontraron procesos relacionados"
    echo

    echo -e "${BLUE}💿 Espacio en disco:${NC}"
    remote_exec "df -h /root/whatsapp-chatbot | tail -n 1"
    echo
}

# Ver logs en tiempo real
view_logs() {
    local service="${1:-$BOT_SERVICE}"

    log_info "Mostrando logs de $service (Ctrl+C para salir)..."
    echo

    local ssh_cmd="ssh"
    if [ -n "$SSH_KEY" ]; then
        ssh_cmd="ssh -i $SSH_KEY"
    fi

    $ssh_cmd "$REMOTE_USER@$REMOTE_HOST" "journalctl -u $service -f"
}

# Reiniciar servicios
restart_services() {
    log_warning "¿Estás seguro de reiniciar los servicios? (y/N)"
    read -r confirm

    if [[ $confirm =~ ^[Yy]$ ]]; then
        log_info "Reiniciando servicios remotos..."

        remote_exec "systemctl restart $BOT_SERVICE"
        sleep 5
        remote_exec "systemctl restart $MONITOR_SERVICE"

        log "✅ Servicios reiniciados"

        # Mostrar estado después del reinicio
        sleep 10
        get_status
    else
        log_info "Operación cancelada"
    fi
}

# Limpiar sesión WhatsApp
clean_session() {
    log_warning "⚠️ ADVERTENCIA: Esto eliminará la sesión de WhatsApp y requerirá escanear QR nuevamente"
    log_warning "¿Estás seguro de continuar? (y/N)"
    read -r confirm

    if [[ $confirm =~ ^[Yy]$ ]]; then
        log_info "Limpiando sesión WhatsApp..."

        remote_exec "cd /root/whatsapp-chatbot && ./monitor-recovery.sh clean"

        log "✅ Sesión limpiada. Será necesario escanear el código QR"

        sleep 10
        get_status
    else
        log_info "Operación cancelada"
    fi
}

# Monitoreo continuo
continuous_monitor() {
    log_info "Iniciando monitoreo continuo (Ctrl+C para detener)..."
    echo

    while true; do
        clear
        show_banner
        echo -e "${YELLOW}Monitoreo continuo - $(date)${NC}"
        echo

        # Estado básico
        echo -e "${BLUE}📊 Estado rápido:${NC}"
        if remote_exec "systemctl is-active $BOT_SERVICE" >/dev/null 2>&1; then
            echo "✅ Bot: FUNCIONANDO"
        else
            echo "❌ Bot: PROBLEMA"
        fi

        if remote_exec "systemctl is-active $MONITOR_SERVICE" >/dev/null 2>&1; then
            echo "✅ Monitor: FUNCIONANDO"
        else
            echo "❌ Monitor: PROBLEMA"
        fi
        echo

        # Logs recientes
        echo -e "${BLUE}📋 Últimos logs del bot:${NC}"
        remote_exec "journalctl -u $BOT_SERVICE --no-pager -n 5 --since '1 minute ago'" 2>/dev/null || echo "Sin logs recientes"
        echo

        echo -e "${YELLOW}Próxima actualización en 30 segundos...${NC}"
        sleep 30
    done
}

# Instalar script en servidor remoto
install_remote() {
    log_info "Instalando sistema de monitoreo en servidor remoto..."

    # Copiar script de instalación
    local scp_cmd="scp"
    if [ -n "$SSH_KEY" ]; then
        scp_cmd="scp -i $SSH_KEY"
    fi

    if [ -f "./setup-monitoring.sh" ]; then
        $scp_cmd "./setup-monitoring.sh" "$REMOTE_USER@$REMOTE_HOST:/tmp/setup-monitoring.sh"

        # Ejecutar instalación remota
        remote_exec "cd /tmp && chmod +x setup-monitoring.sh && ./setup-monitoring.sh install"

        log "✅ Instalación remota completada"
    else
        log_error "Archivo setup-monitoring.sh no encontrado"
        log_info "Asegúrate de tener el script de instalación en el directorio actual"
    fi
}

# Configurar este script
configure_script() {
    log_info "Configuración del monitor remoto:"
    echo

    echo "1. Edita este archivo: $0"
    echo "2. Cambia la línea: REMOTE_HOST=\"TU_IP_SERVIDOR\""
    echo "3. Por: REMOTE_HOST=\"[IP_DE_TU_SERVIDOR]\""
    echo
    echo "Ejemplo: REMOTE_HOST=\"192.168.1.100\""
    echo
    echo "Opcionalmente puedes configurar:"
    echo "- REMOTE_USER: usuario SSH (por defecto 'root')"
    echo "- SSH_KEY: ruta a clave privada SSH (opcional)"
    echo
}

# Menú principal
show_menu() {
    show_banner
    echo -e "${BLUE}Selecciona una opción:${NC}"
    echo
    echo "1. 📊 Ver estado del sistema"
    echo "2. 📋 Ver logs del bot"
    echo "3. 🔍 Ver logs del monitor"
    echo "4. 🔄 Reiniciar servicios"
    echo "5. 🧹 Limpiar sesión WhatsApp"
    echo "6. 📺 Monitoreo continuo"
    echo "7. 🚀 Instalar monitoreo remoto"
    echo "8. ⚙️  Configurar este script"
    echo "9. ❌ Salir"
    echo
}

# Función principal
main() {
    # Si se pasa un parámetro, ejecutar directamente
    case "$1" in
        "status")
            show_banner
            check_config && get_status
            exit 0
            ;;
        "logs")
            check_config && view_logs "$2"
            exit 0
            ;;
        "restart")
            show_banner
            check_config && restart_services
            exit 0
            ;;
        "clean")
            show_banner
            check_config && clean_session
            exit 0
            ;;
        "monitor")
            check_config && continuous_monitor
            exit 0
            ;;
        "install")
            show_banner
            check_config && install_remote
            exit 0
            ;;
        "config")
            show_banner
            configure_script
            exit 0
            ;;
    esac

    # Verificar configuración solo si no es el comando config
    if [ "$1" != "config" ]; then
        if ! check_config; then
            echo
            log_info "Usa: $0 config para ver instrucciones de configuración"
            exit 1
        fi
    fi

    # Menú interactivo
    while true; do
        show_menu
        read -p "Opción: " choice

        case $choice in
            1)
                get_status
                echo
                read -p "Presiona Enter para continuar..."
                ;;
            2)
                view_logs "$BOT_SERVICE"
                ;;
            3)
                view_logs "$MONITOR_SERVICE"
                ;;
            4)
                restart_services
                echo
                read -p "Presiona Enter para continuar..."
                ;;
            5)
                clean_session
                echo
                read -p "Presiona Enter para continuar..."
                ;;
            6)
                continuous_monitor
                ;;
            7)
                install_remote
                echo
                read -p "Presiona Enter para continuar..."
                ;;
            8)
                configure_script
                echo
                read -p "Presiona Enter para continuar..."
                ;;
            9)
                log "👋 ¡Hasta luego!"
                exit 0
                ;;
            *)
                log_error "Opción inválida"
                sleep 2
                ;;
        esac
    done
}

# Ejecutar función principal
main "$@"