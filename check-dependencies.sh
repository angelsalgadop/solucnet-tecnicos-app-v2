#!/bin/bash

# 🔍 SCRIPT DE VERIFICACIÓN DE DEPENDENCIAS - WhatsApp Bot
# Verifica que todas las dependencias estén instaladas y funcionando

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        print_status "$1 está instalado"
        return 0
    else
        print_error "$1 NO está instalado"
        return 1
    fi
}

check_service() {
    if systemctl is-active --quiet "$1"; then
        print_status "Servicio $1 está ejecutándose"
        return 0
    else
        print_error "Servicio $1 NO está ejecutándose"
        return 1
    fi
}

check_port() {
    if netstat -tuln | grep -q ":$1 "; then
        print_status "Puerto $1 está en uso"
        return 0
    else
        print_warning "Puerto $1 NO está en uso"
        return 1
    fi
}

echo "🔍 VERIFICACIÓN DE DEPENDENCIAS DEL WHATSAPP BOT"
echo "================================================"

# Verificar comandos básicos
echo
echo "📦 VERIFICANDO COMANDOS BÁSICOS:"
check_command "node"
check_command "npm"
check_command "pm2"
check_command "mysql"
check_command "git"
check_command "curl"
check_command "systemctl"
check_command "crontab"

# Verificar versiones
echo
echo "📋 VERSIONES INSTALADAS:"
if command -v node >/dev/null 2>&1; then
    print_info "Node.js: $(node -v)"
fi
if command -v npm >/dev/null 2>&1; then
    print_info "NPM: $(npm -v)"
fi
if command -v pm2 >/dev/null 2>&1; then
    print_info "PM2: $(pm2 -v)"
fi

# Verificar servicios
echo
echo "🔧 VERIFICANDO SERVICIOS:"
check_service "mysql"
check_service "nginx" || print_warning "Nginx no está ejecutándose (opcional)"

# Verificar puertos
echo
echo "🌐 VERIFICANDO PUERTOS:"
check_port "3306"  # MySQL
check_port "443"   # HTTPS
check_port "80"    # HTTP

# Verificar archivos críticos
echo
echo "📁 VERIFICANDO ARCHIVOS CRÍTICOS:"
APP_DIR="/root/whatsapp-chatbot"

if [[ -f "$APP_DIR/index.js" ]]; then
    print_status "index.js existe"
else
    print_error "index.js NO existe"
fi

if [[ -f "$APP_DIR/package.json" ]]; then
    print_status "package.json existe"
else
    print_error "package.json NO existe"
fi

if [[ -f "$APP_DIR/keep-alive.sh" ]]; then
    print_status "keep-alive.sh existe"
    if [[ -x "$APP_DIR/keep-alive.sh" ]]; then
        print_status "keep-alive.sh es ejecutable"
    else
        print_error "keep-alive.sh NO es ejecutable"
    fi
else
    print_error "keep-alive.sh NO existe"
fi

# Verificar directorios
echo
echo "📂 VERIFICANDO DIRECTORIOS:"
for dir in "logs" "uploads" "uploads/fotos_reportes" ".wwebjs_auth"; do
    if [[ -d "$APP_DIR/$dir" ]]; then
        print_status "Directorio $dir existe"
    else
        print_warning "Directorio $dir NO existe"
    fi
done

# Verificar dependencias de Node.js
echo
echo "📦 VERIFICANDO DEPENDENCIAS DE NODE.JS:"
cd "$APP_DIR"

if [[ -f "package.json" ]]; then
    # Verificar si node_modules existe
    if [[ -d "node_modules" ]]; then
        print_status "node_modules existe"

        # Verificar algunas dependencias críticas
        critical_deps=("whatsapp-web.js" "express" "mysql2" "puppeteer" "multer")
        for dep in "${critical_deps[@]}"; do
            if [[ -d "node_modules/$dep" ]]; then
                print_status "Dependencia $dep instalada"
            else
                print_error "Dependencia $dep NO instalada"
            fi
        done
    else
        print_error "node_modules NO existe - ejecuta: npm install"
    fi
fi

# Verificar configuración de systemd
echo
echo "⚙️  VERIFICANDO CONFIGURACIÓN SYSTEMD:"
if [[ -f "/etc/systemd/system/whatsapp-bot.service" ]]; then
    print_status "Servicio systemd configurado"

    if systemctl is-enabled --quiet whatsapp-bot; then
        print_status "Servicio habilitado para inicio automático"
    else
        print_error "Servicio NO habilitado para inicio automático"
    fi
else
    print_error "Archivo de servicio systemd NO existe"
fi

# Verificar crontab
echo
echo "⏰ VERIFICANDO CRONTAB:"
if crontab -l 2>/dev/null | grep -q "keep-alive.sh monitor"; then
    print_status "Crontab configurado para monitoreo"
else
    print_error "Crontab NO configurado"
fi

# Verificar base de datos
echo
echo "🗄️  VERIFICANDO BASE DE DATOS:"
if mysql -e "SHOW DATABASES;" | grep -q "solucnet_auth_system"; then
    print_status "Base de datos solucnet_auth_system existe"
else
    print_error "Base de datos solucnet_auth_system NO existe"
fi

# Verificar procesos
echo
echo "🔄 VERIFICANDO PROCESOS:"
if pgrep -f "node.*index.js" > /dev/null; then
    print_status "Proceso Node.js ejecutándose"
    print_info "PID: $(pgrep -f 'node.*index.js')"
else
    print_warning "Proceso Node.js NO está ejecutándose"
fi

# Resumen final
echo
echo "📊 RESUMEN DE VERIFICACIÓN:"
echo "=========================="

# Contar errores y advertencias
total_checks=0
passed_checks=0

# Esta es una verificación simplificada - en un script real contarías los resultados
echo
print_info "Para reparar dependencias faltantes, ejecuta:"
print_info "./install.sh"
echo
print_info "Para iniciar el bot:"
print_info "./keep-alive.sh start"
echo
print_info "Para ver el estado completo:"
print_info "./system-status.sh"