#!/bin/bash

# ===========================================
# INSTALADOR ROOT COMPLETO V4 - SOLUCNET BOT
# Instalación completa con auto-inicio automático
# Sistema de monitoreo y recuperación automática
# Backup automático y restauración
# Versión: 4.0 - Complete Auto-Start System
# ===========================================

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # Sin color

# Variables globales
PROJECT_NAME="solucnet-bot-v4"
INSTALL_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/${PROJECT_NAME}_backup"
LOG_DIR="/var/log/${PROJECT_NAME}"
MONITOR_DIR="/opt/${PROJECT_NAME}_monitor"
SERVICE_NAME="${PROJECT_NAME}.service"
MONITOR_SERVICE_NAME="${PROJECT_NAME}-monitor.service"
WATCHDOG_SERVICE_NAME="${PROJECT_NAME}-watchdog.service"
BACKUP_SERVICE_NAME="${PROJECT_NAME}-backup.service"
CURRENT_DIR="$(pwd)"
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Credenciales
DB_ROOT_PASSWORD=""
DB_USER_PASSWORD=""

# Función para mostrar mensajes
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

print_header() {
    echo -e "${CYAN}[HEADER]${NC} $1"
}

# Verificar permisos de root
check_root() {
    print_header "Verificando permisos de administrador..."

    if [[ $EUID -ne 0 ]]; then
        print_error "Este script debe ejecutarse como root (sudo)"
        echo
        echo "Uso correcto:"
        echo "  sudo $0"
        echo
        echo "Opciones disponibles:"
        echo "  sudo $0 --install     # Instalación completa"
        echo "  sudo $0 --uninstall   # Desinstalación completa"
        echo "  sudo $0 --backup      # Crear backup manual"
        echo "  sudo $0 --restore     # Restaurar desde backup"
        echo "  sudo $0 --status      # Ver estado del sistema"
        echo
        exit 1
    fi

    print_success "Permisos de root verificados ✓"
}

# Función para verificar si el comando se ejecutó correctamente
check_command() {
    if [ $? -eq 0 ]; then
        print_message "$1 - ✓ Completado"
    else
        print_error "$1 - ✗ Falló"
        exit 1
    fi
}

# Detectar sistema operativo
detect_os() {
    print_header "Detectando sistema operativo..."

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
            OS_NAME="Debian/Ubuntu"
            PACKAGE_MANAGER="apt"
            FIREWALL_CMD="ufw"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
            OS_NAME="RedHat/CentOS/Fedora"
            PACKAGE_MANAGER="yum"
            FIREWALL_CMD="firewall-cmd"
        else
            OS="linux"
            OS_NAME="Linux genérico"
            PACKAGE_MANAGER="apt"
            FIREWALL_CMD="ufw"
        fi
    else
        print_error "Sistema operativo no soportado: $OSTYPE"
        exit 1
    fi

    print_message "Sistema detectado: $OS_NAME"
    print_message "Gestor de paquetes: $PACKAGE_MANAGER"
}

# Crear directorio de logs
create_log_directory() {
    print_header "Creando directorios del sistema..."

    # Crear directorios principales
    mkdir -p "$LOG_DIR"
    mkdir -p "$MONITOR_DIR"
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$BACKUP_DIR"

    # Crear subdirectorios
    mkdir -p "$LOG_DIR/archive"
    mkdir -p "$MONITOR_DIR/data"
    mkdir -p "$INSTALL_DIR/uploads"
    mkdir -p "$INSTALL_DIR/images/users"
    mkdir -p "$INSTALL_DIR/.wwebjs_auth"
    mkdir -p "$INSTALL_DIR/backup"
    mkdir -p "$INSTALL_DIR/scripts"

    # Crear archivos de log iniciales
    touch "$LOG_DIR/install.log"
    touch "$LOG_DIR/error.log"
    touch "$LOG_DIR/monitor.log"
    touch "$LOG_DIR/watchdog.log"
    touch "$LOG_DIR/backup.log"
    touch "$LOG_DIR/system.log"

    # Establecer permisos
    chmod 755 "$LOG_DIR"
    chmod 755 "$MONITOR_DIR"
    chmod 755 "$INSTALL_DIR"
    chmod 755 "$BACKUP_DIR"
    chmod 755 "$INSTALL_DIR/uploads"
    chmod 755 "$INSTALL_DIR/images"
    chmod 700 "$INSTALL_DIR/.wwebjs_auth"

    print_message "Directorios del sistema creados:"
    echo "  - Logs: $LOG_DIR"
    echo "  - Monitor: $MONITOR_DIR"
    echo "  - Instalación: $INSTALL_DIR"
    echo "  - Backup: $BACKUP_DIR"
}

# Actualizar repositorios del sistema
update_system() {
    print_header "Actualizando repositorios del sistema..."

    if [[ "$OS" == "debian" ]]; then
        apt update && apt upgrade -y
    elif [[ "$OS" == "redhat" ]]; then
        yum update -y || dnf update -y
    fi

    check_command "Actualización del sistema"
}

# Instalar dependencias del sistema
install_system_dependencies() {
    print_header "Instalando dependencias del sistema..."

    if [[ "$OS" == "debian" ]]; then
        apt install -y \
            curl \
            wget \
            git \
            build-essential \
            python3 \
            python3-pip \
            mysql-server \
            mysql-client \
            nodejs \
            npm \
            zip \
            unzip \
            htop \
            iotop \
            sysstat \
            ufw \
            fail2ban \
            unattended-upgrades \
            cron \
            logrotate \
            rsyslog \
            net-tools \
            ntp \
            rsync \
            screen \
            tmux \
            supervisor \
            inotify-tools
    elif [[ "$OS" == "redhat" ]]; then
        yum install -y \
            curl \
            wget \
            git \
            gcc \
            gcc-c++ \
            python3 \
            python3-pip \
            mysql-server \
            mysql \
            nodejs \
            npm \
            zip \
            unzip \
            htop \
            iotop \
            sysstat \
            firewalld \
            fail2ban \
            yum-cron \
            cronie \
            logrotate \
            rsyslog \
            net-tools \
            ntp \
            rsync \
            screen \
            tmux \
            supervisor \
            inotify-tools
    fi

    check_command "Instalación de dependencias del sistema"
}

# Instalar Node.js si no está disponible
install_nodejs() {
    print_header "Verificando Node.js..."

    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_message "Node.js ya está instalado: $NODE_VERSION"

        # Verificar si la versión es compatible (mínimo v16)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_MAJOR -ge 16 ]]; then
            print_message "Versión de Node.js compatible"
            return 0
        else
            print_warning "Versión de Node.js muy antigua, instalando versión reciente..."
        fi
    fi

    # Instalar Node.js desde NodeSource
    if [[ "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    elif [[ "$OS" == "redhat" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    fi

    check_command "Instalación de Node.js"

    node --version
    npm --version
}

# Instalar PM2 globalmente
install_pm2() {
    print_header "Instalando PM2 (Process Manager)..."

    if command -v pm2 >/dev/null 2>&1; then
        print_message "PM2 ya está instalado"
        return 0
    fi

    npm install -g pm2
    check_command "Instalación de PM2"

    # Configurar PM2 para inicio automático
    pm2 startup
    pm2 save

    print_message "PM2 configurado para inicio automático"
}

# Configurar MySQL
setup_mysql() {
    print_header "Configurando MySQL..."

    # Iniciar y habilitar MySQL
    systemctl start mysql 2>/dev/null || systemctl start mysqld 2>/dev/null
    systemctl enable mysql 2>/dev/null || systemctl enable mysqld 2>/dev/null

    # Generar contraseña aleatoria para root
    DB_ROOT_PASSWORD=$(openssl rand -base64 32)

    # Configurar MySQL de forma segura
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_ROOT_PASSWORD';" 2>/dev/null || true
    mysql -e "DELETE FROM mysql.user WHERE User='';" 2>/dev/null || true
    mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" 2>/dev/null || true
    mysql -e "DROP DATABASE IF EXISTS test;" 2>/dev/null || true
    mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" 2>/dev/null || true
    mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

    print_message "MySQL configurado con contraseña segura"
}

# Crear usuario y base de datos
setup_database() {
    print_header "Configurando base de datos..."

    # Generar contraseña para el usuario del proyecto
    DB_USER_PASSWORD=$(openssl rand -base64 24)

    # Crear base de datos y usuario
    mysql -u root -p"$DB_ROOT_PASSWORD" <<EOF 2>/dev/null || true
CREATE DATABASE IF NOT EXISTS solucnet_auth_system_v4;
CREATE USER IF NOT EXISTS 'solucnet_user'@'localhost' IDENTIFIED BY '$DB_USER_PASSWORD';
GRANT ALL PRIVILEGES ON solucnet_auth_system_v4.* TO 'solucnet_user'@'localhost';
FLUSH PRIVILEGES;
EOF

    check_command "Configuración de base de datos"
}

# Copiar archivos del proyecto
copy_project_files() {
    print_header "Copiando archivos del proyecto..."

    # Backup si existe
    if [ -d "$INSTALL_DIR" ] && [ "$(ls -A $INSTALL_DIR)" ]; then
        print_warning "Directorio existente encontrado, creando backup..."
        rm -rf "$BACKUP_DIR" 2>/dev/null || true
        cp -r "$INSTALL_DIR" "$BACKUP_DIR.$TIMESTAMP"
    fi

    # Copiar todos los archivos del directorio actual al directorio de instalación
    if [ -f "$CURRENT_DIR/package.json" ]; then
        print_message "Proyecto detectado, copiando archivos..."

        cp "$CURRENT_DIR/package.json" "$INSTALL_DIR/"
        cp "$CURRENT_DIR/package-lock.json" "$INSTALL_DIR/" 2>/dev/null || true
        cp "$CURRENT_DIR/index.js" "$INSTALL_DIR/"
        cp "$CURRENT_DIR/db.js" "$INSTALL_DIR/"
        cp "$CURRENT_DIR/ecosystem.config.js" "$INSTALL_DIR/"
        cp -r "$CURRENT_DIR/public" "$INSTALL_DIR/" 2>/dev/null || true
        cp -r "$CURRENT_DIR/src" "$INSTALL_DIR/" 2>/dev/null || true
        cp -r "$CURRENT_DIR/views" "$INSTALL_DIR/" 2>/dev/null || true
        cp -r "$CURRENT_DIR/routes" "$INSTALL_DIR/" 2>/dev/null || true

        # Copiar archivos de configuración
        cp "$CURRENT_DIR/.env" "$INSTALL_DIR/" 2>/dev/null || true
        cp "$CURRENT_DIR/.env.example" "$INSTALL_DIR/" 2>/dev/null || true
    else
        print_warning "No se detectó proyecto en el directorio actual"
    fi

    print_message "Archivos del proyecto copiados"
}

# Instalar dependencias del proyecto
install_project_dependencies() {
    print_header "Instalando dependencias del proyecto..."

    cd "$INSTALL_DIR"

    if [ -f "package.json" ]; then
        npm install --production
        check_command "Instalación de dependencias"
    else
        print_error "No se encontró package.json en el directorio de instalación"
        exit 1
    fi
}

# Crear archivos de configuración
create_config_files() {
    print_header "Creando archivos de configuración..."

    # Archivo de variables de entorno
    cat > "$INSTALL_DIR/.env" <<EOF
# Configuración de Base de Datos del Sistema
DB_SYSTEM_HOST=localhost
DB_SYSTEM_USER=solucnet_user
DB_SYSTEM_PASSWORD=$DB_USER_PASSWORD
DB_SYSTEM_DATABASE=solucnet_auth_system_v4

# Configuración de MySQL Root (para administración)
DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD

# Puerto de la aplicación
PORT=3000

# Ambiente
NODE_ENV=production

# Configuración de logs
LOG_DIR=$LOG_DIR
PROJECT_DIR=$INSTALL_DIR
MONITOR_DIR=$MONITOR_DIR

# Configuración de auto-inicio
AUTO_RESTART=true
MONITOR_ENABLED=true
WATCHDOG_ENABLED=true
BACKUP_ENABLED=true

# Configuración de backup
BACKUP_DIR=$BACKUP_DIR
BACKUP_INTERVAL_HOURS=6
BACKUP_RETENTION_DAYS=7

# Configuración del sistema
SYSTEM_NAME=$PROJECT_NAME
SYSTEM_VERSION=4.0
INSTALL_TIMESTAMP=$TIMESTAMP
EOF

    # Archivo de configuración PM2
    cat > "$INSTALL_DIR/ecosystem.config.js" <<EOF
module.exports = {
  apps: [{
    name: '${PROJECT_NAME}',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '${LOG_DIR}/error.log',
    out_file: '${LOG_DIR}/out.log',
    log_file: '${LOG_DIR}/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

    print_message "Archivos de configuración creados"
}

# Crear script de monitoreo avanzado
create_monitor_script() {
    print_header "Creando sistema de monitoreo avanzado..."

    cat > "$INSTALL_DIR/scripts/monitor.sh" <<'EOF'
#!/bin/bash

# Script de monitoreo avanzado para SolucNet Bot V4
# Verifica el estado del bot y reinicia si es necesario

PROJECT_NAME="solucnet-bot-v4"
LOG_DIR="/var/log/${PROJECT_NAME}"
PROJECT_DIR="/opt/${PROJECT_NAME}"
MONITOR_DIR="/opt/${PROJECT_NAME}_monitor"
MONITOR_LOG="${LOG_DIR}/monitor.log"

# Función de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - MONITOR: $1" >> "$MONITOR_LOG"
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

# Verificar uso de recursos
check_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local mem_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    local disk_usage=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')

    # Verificar si los recursos están por encima de los límites
    if [ "${cpu_usage%.*}" -gt 90 ] || [ "$mem_usage" -gt 90 ] || [ "$disk_usage" -gt 90 ]; then
        return 1
    else
        return 0
    fi
}

# Recolectar métricas del sistema
collect_metrics() {
    local timestamp=$(date +%s)
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    local mem_usage=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    local disk_usage=$(df /opt | tail -1 | awk '{print $5}' | sed 's/%//')
    local process_count=$(pgrep -f "node.*index.js" | wc -l)

    # Guardar métricas
    echo "$timestamp,$cpu_usage,$mem_usage,$disk_usage,$process_count" >> "$MONITOR_DIR/data/metrics.csv"

    # Mantener solo las últimas 1000 entradas
    tail -1000 "$MONITOR_DIR/data/metrics.csv" > "$MONITOR_DIR/data/metrics.tmp"
    mv "$MONITOR_DIR/data/metrics.tmp" "$MONITOR_DIR/data/metrics.csv"
}

# Reiniciar servicio
restart_service() {
    log_message "Reiniciando servicio ${PROJECT_NAME}..."

    cd "$PROJECT_DIR"

    # Detener proceso si existe
    pm2 stop "${PROJECT_NAME}" 2>/dev/null || true
    pkill -f "node.*index.js" 2>/dev/null || true

    sleep 3

    # Limpiar caché
    rm -rf "$PROJECT_DIR/.wwebjs_auth/session" 2>/dev/null || true

    # Iniciar con PM2
    pm2 start ecosystem.config.js --env production

    sleep 5

    if check_process && check_http; then
        log_message "Servicio reiniciado exitosamente"
        return 0
    else
        log_message "Error: No se pudo reiniciar el servicio"
        return 1
    fi
}

# Función principal
main() {
    log_message "=== Iniciando monitoreo ==="

    # Recolectar métricas
    collect_metrics

    # Verificar procesos
    if ! check_process; then
        log_message "Proceso no encontrado, intentando reiniciar..."
        restart_service
    elif ! check_http; then
        log_message "Servicio HTTP no responde, intentando reiniciar..."
        restart_service
    elif ! check_pm2; then
        log_message "PM2 no está gestionando el proceso, intentando reiniciar..."
        restart_service
    elif ! check_resources; then
        log_message "Recursos del sistema críticos, reiniciando..."
        restart_service
    else
        log_message "Servicio funcionando correctamente"
    fi

    log_message "=== Monitoreo completado ==="
}

# Ejecutar monitoreo
main
EOF

    chmod +x "$INSTALL_DIR/scripts/monitor.sh"
    print_message "Script de monitoreo creado"
}

# Crear script de watchdog avanzado
create_watchdog_script() {
    print_header "Creando script de watchdog avanzado..."

    cat > "$INSTALL_DIR/scripts/watchdog.sh" <<'EOF'
#!/bin/bash

# Watchdog avanzado para SolucNet Bot V4
# Monitoreo continuo con recuperación automática

PROJECT_NAME="solucnet-bot-v4"
LOG_DIR="/var/log/${PROJECT_NAME}"
PROJECT_DIR="/opt/${PROJECT_NAME}"
MONITOR_DIR="/opt/${PROJECT_NAME}_monitor"
WATCHDOG_LOG="${LOG_DIR}/watchdog.log"
MONITOR_INTERVAL=30  # segundos
MAX_RETRIES=5
RETRY_COUNT=0
LAST_SUCCESS=$(date +%s)

# Función de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - WATCHDOG: $1" >> "$WATCHDOG_LOG"
}

# Verificar estado del sistema
check_system_health() {
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

    # Verificar conectividad de red
    if ! ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        log_message "ERROR: Sin conectividad de red"
        ((errors++))
    fi

    return $errors
}

# Recuperación de emergencia
emergency_recovery() {
    log_message "INICIANDO RECUPERACIÓN DE EMERGENCIA"

    cd "$PROJECT_DIR"

    # Backup de logs antes del reinicio
    mkdir -p "$PROJECT_DIR/backup/emergency"
    cp "$LOG_DIR"/*.log "$PROJECT_DIR/backup/emergency/" 2>/dev/null || true

    # Detener todos los procesos relacionados
    pm2 stop "${PROJECT_NAME}" 2>/dev/null || true
    pm2 delete "${PROJECT_NAME}" 2>/dev/null || true
    pkill -9 -f "node.*index.js" 2>/dev/null || true

    sleep 5

    # Limpiar caché y sesiones
    rm -rf "$PROJECT_DIR/.wwebjs_auth/session" 2>/dev/null || true
    rm -rf "$PROJECT_DIR/.pm2" 2>/dev/null || true

    # Reiniciar servicios del sistema
    systemctl restart mysql 2>/dev/null || true

    sleep 3

    # Iniciar aplicación
    pm2 start ecosystem.config.js --env production

    sleep 10

    # Verificar recuperación
    if check_system_health; then
        log_message "RECUPERACIÓN EXITOSA"
        RETRY_COUNT=0
        LAST_SUCCESS=$(date +%s)
        return 0
    else
        log_message "RECUPERACIÓN FALLIDA"
        return 1
    fi
}

# Notificar por email (si está configurado)
send_notification() {
    local subject="$1"
    local message="$2"

    # Aquí se podría implementar envío de email si hay un servidor SMTP configurado
    log_message "NOTIFICATION: $subject - $message"
}

# Función principal del watchdog
main() {
    log_message "=== WATCHDOG INICIADO ==="

    while true; do
        if check_system_health; then
            RETRY_COUNT=0
            LAST_SUCCESS=$(date +%s)
            log_message "Sistema funcionando correctamente"
        else
            ((RETRY_COUNT++))
            log_message "Intento de recuperación $RETRY_COUNT de $MAX_RETRIES"

            if [ $RETRY_COUNT -le $MAX_RETRIES ]; then
                send_notification "Sistema con problemas" "Intento de recuperación $RETRY_COUNT"

                if emergency_recovery; then
                    log_message "Recuperación exitosa en intento $RETRY_COUNT"
                    send_notification "Sistema recuperado" "Recuperación exitosa en intento $RETRY_COUNT"
                    RETRY_COUNT=0
                fi
            else
                log_message "MÁXIMOS INTENTOS ALCANZADOS - REINICIANDO SISTEMA"
                send_notification "Reinicio del sistema" "Máximos intentos de recuperación alcanzados"

                # Reinicio del sistema como última medida
                shutdown -r +1 "Reinicio automático por watchdog"
                exit 1
            fi
        fi

        sleep $MONITOR_INTERVAL
    done
}

# Capturar señales para salir limpiamente
trap 'log_message "Watchdog detenido por señal"; exit 0' INT TERM

# Ejecutar watchdog
main
EOF

    chmod +x "$INSTALL_DIR/scripts/watchdog.sh"
    print_message "Script de watchdog creado"
}

# Crear sistema de backup automático
create_backup_system() {
    print_header "Creando sistema de backup automático..."

    # Script de backup
    cat > "$INSTALL_DIR/scripts/backup.sh" <<'EOF'
#!/bin/bash

# Sistema de backup automático para SolucNet Bot V4

PROJECT_NAME="solucnet-bot-v4"
PROJECT_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/${PROJECT_NAME}_backup"
LOG_DIR="/var/log/${PROJECT_NAME}"
BACKUP_LOG="${LOG_DIR}/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Función de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - BACKUP: $1" >> "$BACKUP_LOG"
}

# Crear backup de base de datos
backup_database() {
    log_message "Iniciando backup de base de datos..."

    # Obtener credenciales
    if [ -f "$PROJECT_DIR/.env" ]; then
        DB_PASSWORD=$(grep "DB_SYSTEM_PASSWORD" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        DB_USER=$(grep "DB_SYSTEM_USER" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        DB_NAME=$(grep "DB_SYSTEM_DATABASE" "$PROJECT_DIR/.env" | cut -d'=' -f2)
    else
        log_message "ERROR: No se encontró archivo .env"
        return 1
    fi

    # Crear directorio de backup
    mkdir -p "$BACKUP_DIR/databases"

    # Backup de MySQL
    mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/databases/${DB_NAME}_${TIMESTAMP}.sql"

    if [ $? -eq 0 ]; then
        log_message "Backup de base de datos completado"

        # Comprimir
        gzip "$BACKUP_DIR/databases/${DB_NAME}_${TIMESTAMP}.sql"
        log_message "Backup comprimido"

        return 0
    else
        log_message "ERROR: Falló el backup de base de datos"
        return 1
    fi
}

# Crear backup de archivos
backup_files() {
    log_message "Iniciando backup de archivos..."

    # Crear directorio de backup
    mkdir -p "$BACKUP_DIR/files"

    # Backup de archivos importantes
    rsync -av --exclude 'node_modules' --exclude '.wwebjs_auth' --exclude 'backup' \
        "$PROJECT_DIR/" "$BACKUP_DIR/files/backup_${TIMESTAMP}/"

    if [ $? -eq 0 ]; then
        log_message "Backup de archivos completado"

        # Crear archivo tar.gz
        cd "$BACKUP_DIR/files"
        tar -czf "backup_files_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}"
        rm -rf "backup_${TIMESTAMP}"

        log_message "Backup de archivos comprimido"
        return 0
    else
        log_message "ERROR: Falló el backup de archivos"
        return 1
    fi
}

# Limpiar backups antiguos
cleanup_old_backups() {
    log_message "Limpiando backups antiguos..."

    # Mantener solo los últimos 7 días de backups
    find "$BACKUP_DIR/databases" -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR/files" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

    log_message "Limpieza de backups antiguos completada"
}

# Función principal
main() {
    log_message "=== INICIANDO BACKUP AUTOMÁTICO ==="

    local errors=0

    # Backup de base de datos
    if ! backup_database; then
        ((errors++))
    fi

    # Backup de archivos
    if ! backup_files; then
        ((errors++))
    fi

    # Limpiar backups antiguos
    cleanup_old_backups

    if [ $errors -eq 0 ]; then
        log_message "BACKUP COMPLETADO EXITOSAMENTE"

        # Crear archivo de información del backup
        cat > "$BACKUP_DIR/backup_info_${TIMESTAMP}.txt" <<EOF
BACKUP COMPLETADO - $TIMESTAMP
=====================================
Archivos incluidos:
- Base de datos: ${DB_NAME}_${TIMESTAMP}.sql.gz
- Archivos: backup_files_${TIMESTAMP}.tar.gz

Ubicación: $BACKUP_DIR
Próximo backup: $(date -d '+6 hours' '+%Y-%m-%d %H:%M:%S')
EOF

    else
        log_message "BACKUP COMPLETADO CON ERRORES ($errors errores)"
    fi

    log_message "=== BACKUP FINALIZADO ==="
}

# Ejecutar backup
main
EOF

    # Script de restauración
    cat > "$INSTALL_DIR/scripts/restore.sh" <<'EOF'
#!/bin/bash

# Script de restauración para SolucNet Bot V4

PROJECT_NAME="solucnet-bot-v4"
PROJECT_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/${PROJECT_NAME}_backup"
LOG_DIR="/var/log/${PROJECT_NAME}"
RESTORE_LOG="${LOG_DIR}/restore.log"

# Función de log
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - RESTORE: $1" >> "$RESTORE_LOG"
}

# Listar backups disponibles
list_backups() {
    echo "=== BACKUPS DISPONIBLES ==="
    echo
    echo "Bases de datos:"
    ls -la "$BACKUP_DIR/databases/"*.sql.gz 2>/dev/null || echo "No hay backups de base de datos"
    echo
    echo "Archivos:"
    ls -la "$BACKUP_DIR/files/"*.tar.gz 2>/dev/null || echo "No hay backups de archivos"
}

# Restaurar base de datos
restore_database() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_message "ERROR: Archivo de backup no encontrado: $backup_file"
        return 1
    fi

    log_message "Restaurando base de datos desde: $backup_file"

    # Obtener credenciales
    if [ -f "$PROJECT_DIR/.env" ]; then
        DB_PASSWORD=$(grep "DB_SYSTEM_PASSWORD" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        DB_USER=$(grep "DB_SYSTEM_USER" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        DB_NAME=$(grep "DB_SYSTEM_DATABASE" "$PROJECT_DIR/.env" | cut -d'=' -f2)
    else
        log_message "ERROR: No se encontró archivo .env"
        return 1
    fi

    # Descomprimir y restaurar
    gunzip -c "$backup_file" | mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"

    if [ $? -eq 0 ]; then
        log_message "Base de datos restaurada exitosamente"
        return 0
    else
        log_message "ERROR: Falló la restauración de la base de datos"
        return 1
    fi
}

# Restaurar archivos
restore_files() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_message "ERROR: Archivo de backup no encontrado: $backup_file"
        return 1
    fi

    log_message "Restaurando archivos desde: $backup_file"

    # Crear backup del estado actual
    local temp_backup="/tmp/restore_backup_$(date +%s)"
    mkdir -p "$temp_backup"
    cp -r "$PROJECT_DIR" "$temp_backup/"

    # Restaurar archivos
    cd "$PROJECT_DIR"
    tar -xzf "$backup_file"

    if [ $? -eq 0 ]; then
        log_message "Archivos restaurados exitosamente"
        rm -rf "$temp_backup"
        return 0
    else
        log_message "ERROR: Falló la restauración de archivos"
        # Restaurar desde backup temporal
        rm -rf "$PROJECT_DIR"/*
        cp -r "$temp_backup/${PROJECT_NAME}"/* "$PROJECT_DIR/"
        rm -rf "$temp_backup"
        return 1
    fi
}

# Función principal
main() {
    echo "=== SISTEMA DE RESTAURACIÓN - SOLUCNET BOT V4 ==="
    echo

    case "$1" in
        "--list")
            list_backups
            ;;
        "--database")
            if [ -z "$2" ]; then
                echo "Uso: $0 --database <archivo_backup>"
                exit 1
            fi
            restore_database "$2"
            ;;
        "--files")
            if [ -z "$2" ]; then
                echo "Uso: $0 --files <archivo_backup>"
                exit 1
            fi
            restore_files "$2"
            ;;
        "--full")
            echo "Función de restauración completa no implementada aún"
            ;;
        *)
            echo "Uso: $0 [opción]"
            echo "Opciones:"
            echo "  --list              Listar backups disponibles"
            echo "  --database <file>   Restaurar base de datos"
            echo "  --files <file>      Restaurar archivos"
            echo "  --full              Restauración completa"
            exit 1
            ;;
    esac
}

# Ejecutar restauración
main "$@"
EOF

    chmod +x "$INSTALL_DIR/scripts/backup.sh"
    chmod +x "$INSTALL_DIR/scripts/restore.sh"
    print_message "Sistema de backup creado"
}

# Crear servicios systemd
create_systemd_services() {
    print_header "Creando servicios systemd..."

    # Servicio principal
    cat > "/etc/systemd/system/${SERVICE_NAME}" <<EOF
[Unit]
Description=SolucNet WhatsApp Bot V4 - Servicio Principal
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=forking
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/scripts/start.sh
ExecStop=${INSTALL_DIR}/scripts/stop.sh
ExecReload=${INSTALL_DIR}/scripts/restart.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

    # Servicio de monitoreo
    cat > "/etc/systemd/system/${MONITOR_SERVICE_NAME}" <<EOF
[Unit]
Description=SolucNet Bot V4 Monitor
After=network.target ${SERVICE_NAME}

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/scripts/monitor.sh
Restart=always
RestartSec=60
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Servicio de watchdog
    cat > "/etc/systemd/system/${WATCHDOG_SERVICE_NAME}" <<EOF
[Unit]
Description=SolucNet Bot V4 Watchdog
After=network.target ${SERVICE_NAME}

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/scripts/watchdog.sh
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Servicio de backup
    cat > "/etc/systemd/system/${BACKUP_SERVICE_NAME}" <<EOF
[Unit]
Description=SolucNet Bot V4 Backup
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/scripts/backup.sh
Restart=always
RestartSec=3600
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Timer para backup automático
    cat > "/etc/systemd/system/${PROJECT_NAME}-backup.timer" <<EOF
[Unit]
Description=SolucNet Bot V4 Backup Timer

[Timer]
OnBootSec=300
OnUnitActiveSec=6h
Unit=${BACKUP_SERVICE_NAME}

[Install]
WantedBy=timers.target
EOF

    # Recargar systemd
    systemctl daemon-reload

    print_message "Servicios systemd creados"
}

# Crear scripts de control
create_control_scripts() {
    print_header "Creando scripts de control..."

    # Script de inicio
    cat > "$INSTALL_DIR/scripts/start.sh" <<EOF
#!/bin/bash
cd "${INSTALL_DIR}"
pm2 start ecosystem.config.js --env production
EOF

    # Script de parada
    cat > "$INSTALL_DIR/scripts/stop.sh" <<EOF
#!/bin/bash
pm2 stop ${PROJECT_NAME}
EOF

    # Script de reinicio
    cat > "$INSTALL_DIR/scripts/restart.sh" <<EOF
#!/bin/bash
cd "${INSTALL_DIR}"
pm2 restart ${PROJECT_NAME}
EOF

    # Script de status
    cat > "$INSTALL_DIR/scripts/status.sh" <<EOF
#!/bin/bash
echo "=== ESTADO DEL SISTEMA ==="
echo
echo "Servicio principal:"
systemctl status ${SERVICE_NAME} --no-pager -l
echo
echo "Servicio de monitoreo:"
systemctl status ${MONITOR_SERVICE_NAME} --no-pager -l
echo
echo "Servicio watchdog:"
systemctl status ${WATCHDOG_SERVICE_NAME} --no-pager -l
echo
echo "Servicio de backup:"
systemctl status ${BACKUP_SERVICE_NAME} --no-pager -l
echo
echo "Procesos PM2:"
pm2 status
echo
echo "Logs recientes:"
tail -20 ${LOG_DIR}/combined.log 2>/dev/null || echo "No hay logs disponibles"
echo
echo "Métricas del sistema:"
tail -5 ${MONITOR_DIR}/data/metrics.csv 2>/dev/null || echo "No hay métricas disponibles"
EOF

    # Script de desinstalación
    cat > "$INSTALL_DIR/scripts/uninstall.sh" <<EOF
#!/bin/bash

# Script de desinstalación para SolucNet Bot V4

PROJECT_NAME="solucnet-bot-v4"
INSTALL_DIR="/opt/${PROJECT_NAME}"
BACKUP_DIR="/opt/${PROJECT_NAME}_backup"
LOG_DIR="/var/log/${PROJECT_NAME}"

echo "=== DESINSTALACIÓN DE SOLUCNET BOT V4 ==="
echo
read -p "¿Está seguro de que desea desinstalar completamente el sistema? (y/N): " -r
if [[ ! \$REPLY =~ ^[Yy]$ ]]; then
    echo "Desinstalación cancelada"
    exit 1
fi

echo "Deteniendo servicios..."
systemctl stop ${PROJECT_NAME}.service 2>/dev/null || true
systemctl stop ${PROJECT_NAME}-monitor.service 2>/dev/null || true
systemctl stop ${PROJECT_NAME}-watchdog.service 2>/dev/null || true
systemctl stop ${PROJECT_NAME}-backup.service 2>/dev/null || true

echo "Deshabilitando servicios..."
systemctl disable ${PROJECT_NAME}.service 2>/dev/null || true
systemctl disable ${PROJECT_NAME}-monitor.service 2>/dev/null || true
systemctl disable ${PROJECT_NAME}-watchdog.service 2>/dev/null || true
systemctl disable ${PROJECT_NAME}-backup.service 2>/dev/null || true
systemctl disable ${PROJECT_NAME}-backup.timer 2>/dev/null || true

echo "Eliminando servicios..."
rm -f /etc/systemd/system/${PROJECT_NAME}.service
rm -f /etc/systemd/system/${PROJECT_NAME}-monitor.service
rm -f /etc/systemd/system/${PROJECT_NAME}-watchdog.service
rm -f /etc/systemd/system/${PROJECT_NAME}-backup.service
rm -f /etc/systemd/system/${PROJECT_NAME}-backup.timer

echo "Deteniendo PM2..."
pm2 stop ${PROJECT_NAME} 2>/dev/null || true
pm2 delete ${PROJECT_NAME} 2>/dev/null || true

echo "Recargando systemd..."
systemctl daemon-reload

echo "Archivos del sistema:"
echo "  Instalación: \$INSTALL_DIR"
echo "  Logs: \$LOG_DIR"
echo "  Backup: \$BACKUP_DIR"
echo
read -p "¿Desea eliminar todos los archivos del sistema? (y/N): " -r
if [[ \$REPLY =~ ^[Yy]$ ]]; then
    echo "Eliminando archivos..."
    rm -rf "\$INSTALL_DIR"
    rm -rf "\$LOG_DIR"
    rm -rf "\$BACKUP_DIR"
    echo "Archivos eliminados"
else
    echo "Archivos conservados"
fi

echo
echo "Desinstalación completada"
echo "Para reinstalar, ejecute el script de instalación nuevamente"
EOF

    # Dar permisos de ejecución
    chmod +x "$INSTALL_DIR/scripts"/*.sh

    print_message "Scripts de control creados"
}

# Configurar firewall
setup_firewall() {
    print_header "Configurando firewall..."

    if command -v ufw >/dev/null 2>&1; then
        # UFW (Ubuntu/Debian)
        ufw --force enable
        ufw allow ssh
        ufw allow 3000/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force reload

        print_message "UFW configurado"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        # Firewalld (CentOS/RHEL)
        systemctl start firewalld
        systemctl enable firewalld

        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-port=3000/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --reload

        print_message "Firewalld configurado"
    else
        print_warning "No se encontró gestor de firewall compatible"
    fi
}

# Configurar logrotate
setup_logrotate() {
    print_header "Configurando rotación de logs..."

    cat > "/etc/logrotate.d/${PROJECT_NAME}" <<EOF
${LOG_DIR}/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 root root
    postrotate
        systemctl reload ${SERVICE_NAME} 2>/dev/null || true
    endscript
}
EOF

    print_message "Logrotate configurado"
}

# Inicializar base de datos
initialize_database() {
    print_header "Inicializando base de datos..."

    cd "$INSTALL_DIR"

    if [ -f "db.js" ]; then
        node -e "
const { inicializarSistema } = require('./db.js');
inicializarSistema().then(() => {
    console.log('Base de datos inicializada correctamente');
    process.exit(0);
}).catch((error) => {
    console.error('Error inicializando base de datos:', error);
    process.exit(1);
});
" 2>&1 | tee -a "$LOG_DIR/install.log"

        check_command "Inicialización de base de datos"
    else
        print_warning "No se encontró archivo db.js, omitiendo inicialización de BD"
    fi
}

# Crear archivo ZIP del proyecto
create_zip_package() {
    print_header "Creando paquetes de distribución..."

    cd "$INSTALL_DIR"

    # Crear ZIP completo del proyecto
    zip -r "${PROJECT_NAME}-completo-${TIMESTAMP}.zip" . \
        -x "*.log" \
        -x "*.tmp" \
        -x "node_modules/*" \
        -x ".git/*" \
        -x "backup/*" \
        -x ".wwebjs_auth/*" \
        2>/dev/null || true

    # Crear ZIP solo con scripts de instalación
    mkdir -p "$INSTALL_DIR/installer"
    cp "$CURRENT_DIR/instalador_root_v4.sh" "$INSTALL_DIR/installer/" 2>/dev/null || true
    cp "$CURRENT_DIR/README.md" "$INSTALL_DIR/installer/" 2>/dev/null || true
    cp "$CURRENT_DIR/README_INSTALLATION.md" "$INSTALL_DIR/installer/" 2>/dev/null || true

    cd "$INSTALL_DIR/installer"
    zip -r "../${PROJECT_NAME}-installer-${TIMESTAMP}.zip" . 2>/dev/null || true

    print_message "Paquetes de distribución creados:"
    ls -la "$INSTALL_DIR"/*.zip 2>/dev/null || true
}

# Habilitar y iniciar servicios
enable_services() {
    print_header "Habilitando e iniciando servicios..."

    # Habilitar servicios
    systemctl enable "${SERVICE_NAME}"
    systemctl enable "${MONITOR_SERVICE_NAME}"
    systemctl enable "${WATCHDOG_SERVICE_NAME}"
    systemctl enable "${BACKUP_SERVICE_NAME}"
    systemctl enable "${PROJECT_NAME}-backup.timer"

    # Iniciar servicios
    systemctl start "${SERVICE_NAME}"
    sleep 5
    systemctl start "${MONITOR_SERVICE_NAME}"
    sleep 3
    systemctl start "${WATCHDOG_SERVICE_NAME}"
    sleep 3
    systemctl start "${BACKUP_SERVICE_NAME}"

    print_message "Servicios habilitados e iniciados"
}

# Mostrar información final
show_final_info() {
    print_header "¡Instalación completada exitosamente!"

    echo
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 INSTALACIÓN COMPLETA V4                     ║"
    echo "║           Sistema de Auto-Inicio Automático                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo

    print_success "Directorio de instalación: $INSTALL_DIR"
    print_success "Directorio de logs: $LOG_DIR"
    print_success "Directorio de monitoreo: $MONITOR_DIR"
    print_success "Directorio de backup: $BACKUP_DIR"
    print_success "Puerto de la aplicación: 3000"
    echo

    print_message "SERVICIOS CONFIGURADOS:"
    echo "  ✓ Servicio principal: ${SERVICE_NAME}"
    echo "  ✓ Servicio de monitoreo: ${MONITOR_SERVICE_NAME}"
    echo "  ✓ Servicio watchdog: ${WATCHDOG_SERVICE_NAME}"
    echo "  ✓ Servicio de backup: ${BACKUP_SERVICE_NAME}"
    echo "  ✓ Timer de backup automático: ${PROJECT_NAME}-backup.timer"
    echo

    print_message "CREDENCIALES DE BASE DE DATOS:"
    echo "  Root MySQL: $DB_ROOT_PASSWORD"
    echo "  Usuario del proyecto: $DB_USER_PASSWORD"
    echo

    print_message "COMANDOS ÚTILES:"
    echo "  Ver estado completo:           sudo $INSTALL_DIR/scripts/status.sh"
    echo "  Ver logs del sistema:          sudo journalctl -u ${SERVICE_NAME} -f"
    echo "  Ver logs de PM2:               pm2 logs ${PROJECT_NAME}"
    echo "  Ver logs de monitoreo:         tail -f $LOG_DIR/monitor.log"
    echo "  Ver métricas del sistema:      tail -f $MONITOR_DIR/data/metrics.csv"
    echo "  Realizar backup manual:        sudo $INSTALL_DIR/scripts/backup.sh"
    echo "  Listar backups:                sudo $INSTALL_DIR/scripts/restore.sh --list"
    echo "  Reiniciar todos los servicios: sudo systemctl restart ${SERVICE_NAME}"
    echo "  Parar todos:                   sudo $INSTALL_DIR/scripts/uninstall.sh"
    echo

    print_warning "¡IMPORTANTE!"
    echo "  1. El sistema se reiniciará automáticamente en caso de errores"
    echo "  2. Los backups se crean automáticamente cada 6 horas"
    echo "  3. Los logs se rotan diariamente"
    echo "  4. El monitoreo está activo 24/7"
    echo "  5. Los logs se guardan en: $LOG_DIR"
    echo

    print_message "ARCHIVOS CREADOS:"
    echo "  Paquete completo: ${INSTALL_DIR}/${PROJECT_NAME}-completo-${TIMESTAMP}.zip"
    echo "  Instalador: ${INSTALL_DIR}/${PROJECT_NAME}-installer-${TIMESTAMP}.zip"
    echo

    # Guardar información en archivo
    cat > "$INSTALL_DIR/CREDENCIALES.txt" <<EOF
╔══════════════════════════════════════════════════════════════╗
║              CREDENCIALES DE INSTALACIÓN V4                  ║
╚══════════════════════════════════════════════════════════════╝

Base de datos MySQL Root: $DB_ROOT_PASSWORD
Usuario solucnet_user: $DB_USER_PASSWORD

Usuarios por defecto del sistema:
- Admin: admin / admin123
- Soporte: soporte / soporte123

¡CAMBIA ESTAS CONTRASEÑAS DESPUÉS DEL PRIMER ACCESO!

Información del sistema:
- Directorio: $INSTALL_DIR
- Logs: $LOG_DIR
- Monitor: $MONITOR_DIR
- Backup: $BACKUP_DIR
- Puerto: 3000

Fecha de instalación: $(date)
Versión del sistema: 4.0 - Complete Auto-Start System
════════════════════════════════════════════════════════════════
EOF

    chmod 600 "$INSTALL_DIR/CREDENCIALES.txt"
    print_message "Credenciales guardadas en: $INSTALL_DIR/CREDENCIALES.txt"
}

# Función principal
main() {
    clear
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║       INSTALADOR ROOT COMPLETO V4 - SOLUCNET BOT            ║"
    echo "║      Sistema de Auto-Inicio Completo Automático             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo

    print_message "Iniciando instalación completa con permisos de root..."
    echo

    # Verificar modo de operación
    if [[ $# -gt 0 ]]; then
        case "$1" in
            "--uninstall")
                print_message "Modo desinstalación seleccionado"
                if [ -f "$INSTALL_DIR/scripts/uninstall.sh" ]; then
                    bash "$INSTALL_DIR/scripts/uninstall.sh"
                else
                    print_error "Script de desinstalación no encontrado"
                fi
                exit 0
                ;;
            "--backup")
                print_message "Modo backup manual seleccionado"
                if [ -f "$INSTALL_DIR/scripts/backup.sh" ]; then
                    bash "$INSTALL_DIR/scripts/backup.sh"
                else
                    print_error "Script de backup no encontrado"
                fi
                exit 0
                ;;
            "--restore")
                print_message "Modo restauración seleccionado"
                if [ -f "$INSTALL_DIR/scripts/restore.sh" ]; then
                    bash "$INSTALL_DIR/scripts/restore.sh" "--list"
                else
                    print_error "Script de restauración no encontrado"
                fi
                exit 0
                ;;
            "--status")
                print_message "Modo estado del sistema seleccionado"
                if [ -f "$INSTALL_DIR/scripts/status.sh" ]; then
                    bash "$INSTALL_DIR/scripts/status.sh"
                else
                    print_error "Script de estado no encontrado"
                fi
                exit 0
                ;;
        esac
    fi

    # Ejecutar instalación paso a paso
    check_root
    detect_os
    create_log_directory
    update_system
    install_system_dependencies
    install_nodejs
    install_pm2
    setup_mysql
    setup_database
    copy_project_files
    install_project_dependencies
    create_config_files
    create_monitor_script
    create_watchdog_script
    create_backup_system
    create_systemd_services
    create_control_scripts
    setup_firewall
    setup_logrotate
    initialize_database
    create_zip_package
    enable_services

    show_final_info

    print_success "¡INSTALACIÓN COMPLETA!"
    print_success "El sistema está funcionando con auto-inicio automático"
    print_success "Monitoreo y recuperación automática habilitados"
    print_success "Sistema de backup automático configurado"
}

# Capturar errores
trap 'print_error "Instalación interrumpida por el usuario"; exit 1' INT TERM

# Ejecutar función principal
main "$@"
