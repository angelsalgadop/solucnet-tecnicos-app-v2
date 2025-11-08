#!/bin/bash

# 🔧 SCRIPT DE CONFIGURACIÓN DEL ENTORNO - WhatsApp Bot
# Configura variables de entorno y archivos de configuración

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Variables por defecto
APP_DIR="/root/whatsapp-chatbot"
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="solucnet_auth_system"
DB_USER="debian-sys-maint"
HTTPS_PORT="443"
HTTP_PORT="80"

# Función para obtener la contraseña de MySQL del sistema
get_mysql_system_password() {
    if [[ -f /etc/mysql/debian.cnf ]]; then
        grep password /etc/mysql/debian.cnf | head -1 | cut -d= -f2 | tr -d ' '
    else
        echo ""
    fi
}

# Función para configurar variables de entorno
configure_environment() {
    print_header "CONFIGURANDO VARIABLES DE ENTORNO"

    cd "$APP_DIR"

    # Obtener contraseña del sistema MySQL
    MYSQL_PASSWORD=$(get_mysql_system_password)

    if [[ -z "$MYSQL_PASSWORD" ]]; then
        print_warning "No se pudo obtener la contraseña automáticamente"
        read -s -p "Ingresa la contraseña de MySQL para $DB_USER: " MYSQL_PASSWORD
        echo
    fi

    # Crear archivo .env si no existe
    if [[ ! -f ".env" ]]; then
        print_status "Creando archivo .env..."

        cat > .env << EOF
# Configuración de Base de Datos
DB_SYSTEM_HOST=$DB_HOST
DB_SYSTEM_PORT=$DB_PORT
DB_SYSTEM_DATABASE=$DB_NAME
DB_SYSTEM_USER=$DB_USER
DB_SYSTEM_PASSWORD=$MYSQL_PASSWORD

# Configuración del Servidor
HTTPS_PORT=$HTTPS_PORT
HTTP_PORT=$HTTP_PORT

# Configuración del Bot
NODE_ENV=production
BOT_NAME=solucnet-bot

# Configuración de Logs
LOG_LEVEL=info
LOG_ROTATION=true

# Configuración de Archivos
UPLOAD_MAX_SIZE=10485760
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,pdf,doc,docx

# Configuración de Sesión
SESSION_SECRET=$(openssl rand -base64 32)
TOKEN_EXPIRY=3600

# Configuración de WhatsApp
WHATSAPP_SESSION_TIMEOUT=300000
WHATSAPP_AUTH_TIMEOUT=60000
WHATSAPP_RESTART_DELAY=10000

# Configuración de Monitoreo
MONITOR_INTERVAL=120
HEALTH_CHECK_INTERVAL=60
AUTO_RESTART=true

# Zona horaria
TZ=America/Bogota
EOF

        print_status "Archivo .env creado"
    else
        print_status "Archivo .env ya existe"
    fi

    # Configurar permisos del archivo .env
    chmod 600 .env
    print_status "Permisos de .env configurados (600)"
}

# Función para configurar PM2 ecosystem
configure_pm2_ecosystem() {
    print_header "CONFIGURANDO PM2 ECOSYSTEM"

    cd "$APP_DIR"

    if [[ ! -f "ecosystem.config.js" ]]; then
        print_status "Creando ecosystem.config.js..."

        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'solucnet-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.HTTPS_PORT || 443
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.HTTPS_PORT || 443
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    cron_restart: '0 4 * * *', // Reinicio diario a las 4 AM
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads',
      '.wwebjs_auth',
      'session.json'
    ],
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true
  }]
};
EOF

        print_status "ecosystem.config.js creado"
    else
        print_status "ecosystem.config.js ya existe"
    fi
}

# Función para configurar logrotate
configure_logrotate() {
    print_header "CONFIGURANDO ROTACIÓN DE LOGS"

    print_status "Creando configuración de logrotate..."

    cat > /etc/logrotate.d/whatsapp-bot << EOF
$APP_DIR/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        $APP_DIR/keep-alive.sh restart > /dev/null 2>&1 || true
    endscript
}
EOF

    print_status "Logrotate configurado"
}

# Función para configurar límites del sistema
configure_system_limits() {
    print_header "CONFIGURANDO LÍMITES DEL SISTEMA"

    print_status "Configurando límites de archivos abiertos..."

    # Configurar limits.conf
    if ! grep -q "whatsapp-bot" /etc/security/limits.conf; then
        cat >> /etc/security/limits.conf << EOF

# WhatsApp Bot limits
root soft nofile 65536
root hard nofile 65536
root soft nproc 32768
root hard nproc 32768
EOF
        print_status "Límites del sistema configurados"
    else
        print_status "Límites del sistema ya configurados"
    fi

    # Configurar sysctl
    if ! grep -q "fs.file-max" /etc/sysctl.conf; then
        cat >> /etc/sysctl.conf << EOF

# WhatsApp Bot system optimization
fs.file-max = 2097152
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
vm.swappiness = 10
EOF
        sysctl -p
        print_status "Parámetros del kernel configurados"
    else
        print_status "Parámetros del kernel ya configurados"
    fi
}

# Función para configurar certificados SSL automáticos
configure_ssl_auto() {
    print_header "CONFIGURANDO SSL AUTOMÁTICO"

    cd "$APP_DIR"

    # Crear certificado autofirmado para desarrollo/pruebas
    if [[ ! -f "ssl/server.crt" ]]; then
        print_status "Creando certificados SSL autofirmados..."

        mkdir -p ssl

        openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes \
            -subj "/C=CO/ST=Colombia/L=Bogota/O=SolucNet/OU=IT/CN=localhost"

        chmod 600 ssl/server.key
        chmod 644 ssl/server.crt

        print_status "Certificados SSL creados"
        print_warning "Usando certificados autofirmados (solo para desarrollo)"
        print_warning "Para producción, usa certificados válidos con Let's Encrypt"
    else
        print_status "Certificados SSL ya existen"
    fi
}

# Función para configurar backup automático
configure_backup() {
    print_header "CONFIGURANDO BACKUP AUTOMÁTICO"

    cd "$APP_DIR"

    # Crear script de backup
    cat > backup.sh << 'EOF'
#!/bin/bash

# Script de backup automático para WhatsApp Bot

BACKUP_DIR="/root/backups/whatsapp-bot"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
APP_DIR="/root/whatsapp-chatbot"

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"

# Backup de archivos de configuración
tar -czf "$BACKUP_DIR/config_$TIMESTAMP.tar.gz" \
    -C "$APP_DIR" \
    .env \
    ecosystem.config.js \
    keep-alive.sh \
    auto-monitor.sh 2>/dev/null || true

# Backup de la base de datos
mysqldump --defaults-extra-file="$APP_DIR/.my.cnf" solucnet_auth_system > "$BACKUP_DIR/database_$TIMESTAMP.sql" 2>/dev/null || \
mysqldump -u debian-sys-maint -p$(grep password /etc/mysql/debian.cnf | head -1 | cut -d= -f2 | tr -d ' ') solucnet_auth_system > "$BACKUP_DIR/database_$TIMESTAMP.sql" 2>/dev/null || true

# Backup de uploads (fotos)
if [[ -d "$APP_DIR/uploads" ]]; then
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C "$APP_DIR" uploads/
fi

# Limpiar backups antiguos (más de 7 días)
find "$BACKUP_DIR" -name "*.tar.gz" -o -name "*.sql" | head -n -7 | xargs rm -f

echo "Backup completado: $TIMESTAMP"
EOF

    chmod +x backup.sh

    # Agregar al crontab si no existe
    if ! crontab -l 2>/dev/null | grep -q "backup.sh"; then
        (crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> $APP_DIR/logs/backup.log 2>&1") | crontab -
        print_status "Backup automático configurado (diario a las 2 AM)"
    else
        print_status "Backup automático ya configurado"
    fi
}

# Función para configurar monitoreo de recursos
configure_monitoring() {
    print_header "CONFIGURANDO MONITOREO DE RECURSOS"

    cd "$APP_DIR"

    # Crear script de monitoreo de recursos
    cat > monitor-resources.sh << 'EOF'
#!/bin/bash

# Monitor de recursos del sistema

LOG_FILE="logs/resources.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Obtener métricas del sistema
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

# Obtener métricas del proceso Node.js
if pgrep -f "node.*index.js" > /dev/null; then
    NODE_PID=$(pgrep -f "node.*index.js")
    NODE_CPU=$(ps -p $NODE_PID -o %cpu --no-headers | tr -d ' ')
    NODE_MEM=$(ps -p $NODE_PID -o %mem --no-headers | tr -d ' ')
    NODE_STATUS="RUNNING"
else
    NODE_CPU="0"
    NODE_MEM="0"
    NODE_STATUS="STOPPED"
fi

# Escribir al log
echo "$TIMESTAMP,CPU:${CPU_USAGE}%,MEM:${MEMORY_USAGE}%,DISK:${DISK_USAGE}%,NODE_CPU:${NODE_CPU}%,NODE_MEM:${NODE_MEM}%,STATUS:${NODE_STATUS}" >> "$LOG_FILE"

# Alertas simples
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "$TIMESTAMP - ALERTA: CPU usage alto: ${CPU_USAGE}%" >> logs/alerts.log
fi

if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "$TIMESTAMP - ALERTA: Memory usage alto: ${MEMORY_USAGE}%" >> logs/alerts.log
fi

if [[ "$DISK_USAGE" -gt 90 ]]; then
    echo "$TIMESTAMP - ALERTA: Disk usage alto: ${DISK_USAGE}%" >> logs/alerts.log
fi
EOF

    chmod +x monitor-resources.sh

    # Agregar al crontab si no existe
    if ! crontab -l 2>/dev/null | grep -q "monitor-resources.sh"; then
        (crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor-resources.sh") | crontab -
        print_status "Monitoreo de recursos configurado (cada 5 minutos)"
    else
        print_status "Monitoreo de recursos ya configurado"
    fi
}

# Función principal
main() {
    print_header "CONFIGURACIÓN DEL ENTORNO - WHATSAPP BOT"

    # Verificar que se ejecuta como root
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script debe ejecutarse como root (usa sudo)"
        exit 1
    fi

    # Verificar que el directorio de la aplicación existe
    if [[ ! -d "$APP_DIR" ]]; then
        print_error "El directorio de la aplicación no existe: $APP_DIR"
        exit 1
    fi

    echo
    print_warning "Este script configurará el entorno completo del WhatsApp Bot."
    print_warning "Esto incluye: variables de entorno, PM2, logs, SSL, backup y monitoreo."
    echo
    read -p "¿Deseas continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Configuración cancelada por el usuario"
        exit 0
    fi

    # Ejecutar configuraciones
    configure_environment
    configure_pm2_ecosystem
    configure_logrotate
    configure_system_limits
    configure_ssl_auto
    configure_backup
    configure_monitoring

    print_header "CONFIGURACIÓN COMPLETADA"

    cat << EOF

🎯 ENTORNO CONFIGURADO EXITOSAMENTE

📁 Archivos creados/configurados:
   - .env (variables de entorno)
   - ecosystem.config.js (configuración PM2)
   - ssl/ (certificados SSL autofirmados)
   - backup.sh (script de backup)
   - monitor-resources.sh (monitoreo de recursos)

⚙️  Servicios configurados:
   - Logrotate (rotación de logs)
   - Límites del sistema optimizados
   - Backup automático (diario a las 2 AM)
   - Monitoreo de recursos (cada 5 minutos)

🔧 Próximos pasos:
   1. Revisa y ajusta las variables en .env si es necesario
   2. Para certificados SSL válidos: certbot --nginx -d tu-dominio.com
   3. Inicia el bot: ./keep-alive.sh start
   4. Verifica el estado: ./system-status.sh

📊 Archivos de monitoreo:
   - logs/resources.log (métricas del sistema)
   - logs/alerts.log (alertas automáticas)
   - logs/backup.log (logs de backup)

EOF
}

# Ejecutar función principal
main "$@"