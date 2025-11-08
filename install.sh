#!/bin/bash

# 🚀 SCRIPT DE INSTALACIÓN AUTOMÁTICA - WhatsApp Bot SolucNet
# Este script instala y configura el bot de WhatsApp para funcionar 24/7
# Autor: Sistema automatizado
# Fecha: $(date)

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

# Variables de configuración
APP_DIR="/root/whatsapp-chatbot"
SERVICE_NAME="whatsapp-bot"
DB_NAME="solucnet_auth_system"
NODE_VERSION="18"

# Función para imprimir mensajes con color
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Función para verificar si el comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar distribución de Linux
check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        print_error "No se puede determinar la distribución del sistema operativo"
        exit 1
    fi

    print_status "Sistema operativo detectado: $OS $OS_VERSION"

    if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
        print_warning "Este script está optimizado para Ubuntu/Debian. Puede que necesites ajustes para otros sistemas."
    fi
}

# Función para actualizar el sistema
update_system() {
    print_header "ACTUALIZANDO SISTEMA"

    export DEBIAN_FRONTEND=noninteractive

    print_status "Actualizando lista de paquetes..."
    apt update -qq

    print_status "Actualizando paquetes del sistema..."
    apt upgrade -y -qq

    print_status "Instalando dependencias base..."
    apt install -y -qq \
        curl \
        wget \
        git \
        build-essential \
        python3 \
        python3-pip \
        sqlite3 \
        mysql-client \
        mysql-server \
        nginx \
        ufw \
        htop \
        nano \
        unzip \
        cron \
        systemd \
        ca-certificates \
        gnupg \
        lsb-release \
        software-properties-common
}

# Función para instalar Node.js
install_nodejs() {
    print_header "INSTALANDO NODE.JS"

    if command_exists node; then
        CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$CURRENT_NODE_VERSION" -ge "$NODE_VERSION" ]]; then
            print_status "Node.js ya está instalado (versión $(node -v))"
            return
        fi
    fi

    print_status "Descargando e instalando Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs

    print_status "Node.js instalado: $(node -v)"
    print_status "NPM instalado: $(npm -v)"
}

# Función para instalar PM2
install_pm2() {
    print_header "INSTALANDO PM2"

    if command_exists pm2; then
        print_status "PM2 ya está instalado"
        return
    fi

    print_status "Instalando PM2 globalmente..."
    npm install -g pm2

    print_status "Configurando PM2 para inicio automático..."
    pm2 startup systemd -u root --hp /root
    pm2 save
}

# Función para configurar MySQL
configure_mysql() {
    print_header "CONFIGURANDO MYSQL"

    print_status "Iniciando servicio MySQL..."
    systemctl start mysql
    systemctl enable mysql

    # Verificar si la base de datos existe
    if mysql -e "USE $DB_NAME;" 2>/dev/null; then
        print_status "Base de datos $DB_NAME ya existe"
    else
        print_warning "La base de datos $DB_NAME no existe. Debes crearla manualmente."
        print_warning "Comando sugerido: mysql -e 'CREATE DATABASE $DB_NAME;'"
    fi

    print_status "MySQL configurado correctamente"
}

# Función para configurar directorio de la aplicación
setup_application() {
    print_header "CONFIGURANDO APLICACIÓN"

    if [[ ! -d "$APP_DIR" ]]; then
        print_error "El directorio de la aplicación no existe: $APP_DIR"
        print_error "Asegúrate de que el código esté en el directorio correcto"
        exit 1
    fi

    cd "$APP_DIR"

    print_status "Instalando dependencias de Node.js..."
    if [[ -f "package.json" ]]; then
        npm install
    else
        print_error "No se encontró package.json en $APP_DIR"
        exit 1
    fi

    # Crear directorios necesarios
    print_status "Creando directorios necesarios..."
    mkdir -p logs
    mkdir -p uploads/fotos_reportes
    mkdir -p .wwebjs_auth

    # Configurar permisos
    print_status "Configurando permisos..."
    chmod +x keep-alive.sh
    chmod +x auto-monitor.sh
    chmod 755 logs
    chmod 755 uploads
    chmod -R 755 uploads/fotos_reportes
}

# Función para configurar el servicio systemd
configure_systemd_service() {
    print_header "CONFIGURANDO SERVICIO SYSTEMD"

    print_status "Creando archivo de servicio systemd..."
    cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=WhatsApp Chatbot Solucnet
After=network.target mysql.service
Wants=network.target

[Service]
Type=forking
User=root
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/keep-alive.sh start
ExecStop=$APP_DIR/keep-alive.sh stop
ExecReload=$APP_DIR/keep-alive.sh restart
Restart=always
RestartSec=10
PIDFile=/tmp/whatsapp-bot.lock

[Install]
WantedBy=multi-user.target
EOF

    print_status "Recargando configuración de systemd..."
    systemctl daemon-reload

    print_status "Habilitando servicio para inicio automático..."
    systemctl enable ${SERVICE_NAME}

    print_status "Servicio systemd configurado correctamente"
}

# Función para configurar crontab
configure_crontab() {
    print_header "CONFIGURANDO MONITOREO AUTOMÁTICO (CRONTAB)"

    # Verificar si ya existe la entrada en crontab
    if crontab -l 2>/dev/null | grep -q "keep-alive.sh monitor"; then
        print_status "Crontab ya está configurado"
        return
    fi

    print_status "Configurando crontab para monitoreo cada 2 minutos..."

    # Crear crontab temporal
    crontab -l 2>/dev/null > /tmp/crontab_temp || echo "# Crontab para WhatsApp Bot" > /tmp/crontab_temp

    # Agregar entrada de monitoreo
    echo "*/2 * * * * $APP_DIR/keep-alive.sh monitor >> $APP_DIR/logs/cron.log 2>&1" >> /tmp/crontab_temp

    # Instalar crontab
    crontab /tmp/crontab_temp
    rm /tmp/crontab_temp

    print_status "Crontab configurado correctamente"
}

# Función para configurar firewall
configure_firewall() {
    print_header "CONFIGURANDO FIREWALL"

    print_status "Configurando UFW (firewall)..."

    # Restablecer UFW
    ufw --force reset

    # Configurar reglas básicas
    ufw default deny incoming
    ufw default allow outgoing

    # Permitir SSH
    ufw allow ssh
    ufw allow 22

    # Permitir HTTP y HTTPS
    ufw allow 80
    ufw allow 443

    # Permitir puerto personalizado si existe
    if [[ -f "$APP_DIR/index.js" ]]; then
        PORT=$(grep -o "port.*[0-9]\+" "$APP_DIR/index.js" | grep -o "[0-9]\+" | head -1)
        if [[ -n "$PORT" && "$PORT" != "80" && "$PORT" != "443" ]]; then
            print_status "Permitiendo puerto de aplicación: $PORT"
            ufw allow $PORT
        fi
    fi

    # Habilitar firewall
    ufw --force enable

    print_status "Firewall configurado correctamente"
}

# Función para crear scripts de utilidad
create_utility_scripts() {
    print_header "CREANDO SCRIPTS DE UTILIDAD"

    # Script de estado del sistema
    cat > "$APP_DIR/system-status.sh" << 'EOF'
#!/bin/bash

echo "=== ESTADO DEL SISTEMA WHATSAPP BOT ==="
echo
echo "🤖 Estado del Bot:"
./keep-alive.sh status
echo
echo "🔧 Servicio Systemd:"
systemctl status whatsapp-bot --no-pager -l
echo
echo "📊 Procesos Node.js:"
ps aux | grep node | grep -v grep
echo
echo "💾 Uso de memoria:"
free -h
echo
echo "💿 Uso de disco:"
df -h /
echo
echo "🔍 Últimos logs:"
tail -10 logs/bot-output.log
EOF

    chmod +x "$APP_DIR/system-status.sh"

    # Script de limpieza de logs
    cat > "$APP_DIR/cleanup-logs.sh" << 'EOF'
#!/bin/bash

echo "🧹 Limpiando logs antiguos..."

# Limpiar logs mayores a 10MB
find logs/ -name "*.log" -size +10M -exec truncate -s 0 {} \;

# Comprimir logs antiguos
find logs/ -name "*.log" -mtime +7 -exec gzip {} \;

# Eliminar logs comprimidos muy antiguos
find logs/ -name "*.log.gz" -mtime +30 -delete

echo "✅ Limpieza completada"
EOF

    chmod +x "$APP_DIR/cleanup-logs.sh"

    print_status "Scripts de utilidad creados"
}

# Función para instalar certificados SSL (opcional)
setup_ssl_certificates() {
    print_header "CONFIGURANDO CERTIFICADOS SSL (OPCIONAL)"

    if command_exists certbot; then
        print_status "Certbot ya está instalado"
    else
        print_status "Instalando Certbot para certificados SSL..."
        apt install -y certbot python3-certbot-nginx
    fi

    print_warning "Para configurar SSL, ejecuta manualmente:"
    print_warning "certbot --nginx -d tu-dominio.com"
}

# Función para verificar instalación
verify_installation() {
    print_header "VERIFICANDO INSTALACIÓN"

    local errors=0

    # Verificar Node.js
    if command_exists node; then
        print_status "✅ Node.js: $(node -v)"
    else
        print_error "❌ Node.js no está instalado"
        ((errors++))
    fi

    # Verificar PM2
    if command_exists pm2; then
        print_status "✅ PM2 instalado"
    else
        print_error "❌ PM2 no está instalado"
        ((errors++))
    fi

    # Verificar MySQL
    if systemctl is-active --quiet mysql; then
        print_status "✅ MySQL ejecutándose"
    else
        print_error "❌ MySQL no está ejecutándose"
        ((errors++))
    fi

    # Verificar servicio systemd
    if systemctl is-enabled --quiet ${SERVICE_NAME}; then
        print_status "✅ Servicio systemd habilitado"
    else
        print_error "❌ Servicio systemd no habilitado"
        ((errors++))
    fi

    # Verificar crontab
    if crontab -l 2>/dev/null | grep -q "keep-alive.sh"; then
        print_status "✅ Crontab configurado"
    else
        print_error "❌ Crontab no configurado"
        ((errors++))
    fi

    # Verificar archivos de la aplicación
    if [[ -f "$APP_DIR/index.js" && -f "$APP_DIR/keep-alive.sh" ]]; then
        print_status "✅ Archivos de aplicación presentes"
    else
        print_error "❌ Archivos de aplicación faltantes"
        ((errors++))
    fi

    if [[ $errors -eq 0 ]]; then
        print_status "🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE"
        return 0
    else
        print_error "⚠️  Instalación completada con $errors errores"
        return 1
    fi
}

# Función para mostrar información post-instalación
show_post_install_info() {
    print_header "INFORMACIÓN POST-INSTALACIÓN"

    cat << EOF

🎯 INSTALACIÓN COMPLETADA

📂 Directorio de la aplicación: $APP_DIR
🔧 Servicio systemd: $SERVICE_NAME
📊 Base de datos: $DB_NAME

🚀 COMANDOS ÚTILES:

   Gestión del bot:
   - ./keep-alive.sh start     # Iniciar bot
   - ./keep-alive.sh stop      # Detener bot
   - ./keep-alive.sh status    # Ver estado
   - ./keep-alive.sh restart   # Reiniciar bot
   - ./system-status.sh        # Estado completo del sistema

   Gestión del servicio:
   - systemctl start $SERVICE_NAME      # Iniciar servicio
   - systemctl stop $SERVICE_NAME       # Detener servicio
   - systemctl status $SERVICE_NAME     # Ver estado del servicio
   - systemctl restart $SERVICE_NAME    # Reiniciar servicio

   Logs:
   - tail -f logs/bot-output.log       # Ver logs en tiempo real
   - tail -f logs/keep-alive.log       # Ver logs de monitoreo
   - ./cleanup-logs.sh                 # Limpiar logs antiguos

📋 ARCHIVOS DE CONFIGURACIÓN:
   - /etc/systemd/system/$SERVICE_NAME.service
   - Crontab: crontab -l

🔧 PRÓXIMOS PASOS:
   1. Configura las variables de entorno en $APP_DIR/.env (si es necesario)
   2. Configura la base de datos MySQL
   3. Inicia el bot: ./keep-alive.sh start
   4. Verifica el estado: ./system-status.sh

🌐 El bot se iniciará automáticamente al reiniciar el servidor.

EOF
}

# Función principal
main() {
    print_header "INSTALACIÓN AUTOMÁTICA - WHATSAPP BOT SOLUCNET"

    # Verificar que se ejecuta como root
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script debe ejecutarse como root (usa sudo)"
        exit 1
    fi

    # Verificar sistema operativo
    check_os

    # Preguntar confirmación
    echo
    print_warning "Este script instalará y configurará el WhatsApp Bot con todas sus dependencias."
    print_warning "Esto incluye: Node.js, PM2, MySQL, dependencias del sistema, servicios systemd y crontab."
    echo
    read -p "¿Deseas continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Instalación cancelada por el usuario"
        exit 0
    fi

    # Ejecutar instalación paso a paso
    update_system
    install_nodejs
    install_pm2
    configure_mysql
    setup_application
    configure_systemd_service
    configure_crontab
    configure_firewall
    create_utility_scripts
    setup_ssl_certificates

    # Verificar instalación
    if verify_installation; then
        show_post_install_info

        # Iniciar el bot
        print_status "Iniciando el bot por primera vez..."
        cd "$APP_DIR"
        ./keep-alive.sh start

        sleep 3
        ./system-status.sh

        print_status "🎉 ¡INSTALACIÓN Y CONFIGURACIÓN COMPLETADA!"
    else
        print_error "Hubo errores durante la instalación. Revisa los mensajes anteriores."
        exit 1
    fi
}

# Ejecutar función principal
main "$@"