#!/bin/bash

##############################################################################
#                    SCRIPT DE PRUEBA DE INSTALACIÓN                        #
#              Verifica que todos los componentes funcionen                 #
##############################################################################

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
APP_NAME="whatsapp-chatbot"
APP_DIR="/opt/$APP_NAME"
SERVICE_USER="chatbot"
TEST_RESULTS="/tmp/installation_test_results.log"

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Inicializar archivo de resultados
init_test() {
    echo "=== RESULTADOS DE PRUEBA DE INSTALACIÓN ===" > "$TEST_RESULTS"
    echo "Fecha: $(date)" >> "$TEST_RESULTS"
    echo "Sistema: $(uname -a)" >> "$TEST_RESULTS"
    echo "" >> "$TEST_RESULTS"
}

# Test 1: Verificar usuario del sistema
test_system_user() {
    print_test "Verificando usuario del sistema '$SERVICE_USER'..."
    
    if id "$SERVICE_USER" &>/dev/null; then
        print_pass "Usuario '$SERVICE_USER' existe"
        echo "✓ Usuario del sistema: OK" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "Usuario '$SERVICE_USER' no existe"
        echo "✗ Usuario del sistema: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 2: Verificar directorio de aplicación
test_app_directory() {
    print_test "Verificando directorio de aplicación..."
    
    if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/index.js" ] && [ -f "$APP_DIR/package.json" ]; then
        print_pass "Directorio de aplicación correcto: $APP_DIR"
        echo "✓ Directorio de aplicación: OK" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "Directorio de aplicación incompleto o faltante"
        echo "✗ Directorio de aplicación: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 3: Verificar permisos de archivos
test_file_permissions() {
    print_test "Verificando permisos de archivos..."
    
    APP_OWNER=$(stat -c '%U' "$APP_DIR" 2>/dev/null)
    
    if [ "$APP_OWNER" = "$SERVICE_USER" ]; then
        print_pass "Permisos de archivos correctos"
        echo "✓ Permisos de archivos: OK" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "Permisos de archivos incorrectos. Propietario: $APP_OWNER"
        echo "✗ Permisos de archivos: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 4: Verificar Node.js y npm
test_nodejs() {
    print_test "Verificando Node.js y npm..."
    
    NODE_VERSION=$(node --version 2>/dev/null)
    NPM_VERSION=$(npm --version 2>/dev/null)
    
    if [ -n "$NODE_VERSION" ] && [ -n "$NPM_VERSION" ]; then
        print_pass "Node.js $NODE_VERSION y npm $NPM_VERSION instalados"
        echo "✓ Node.js/npm: OK ($NODE_VERSION / $NPM_VERSION)" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "Node.js o npm no están instalados correctamente"
        echo "✗ Node.js/npm: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 5: Verificar dependencias npm
test_npm_dependencies() {
    print_test "Verificando dependencias npm..."
    
    if [ -d "$APP_DIR/node_modules" ] && [ -f "$APP_DIR/package-lock.json" ]; then
        print_pass "Dependencias npm instaladas"
        echo "✓ Dependencias npm: OK" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "Dependencias npm no instaladas"
        echo "✗ Dependencias npm: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 6: Verificar PM2
test_pm2() {
    print_test "Verificando PM2..."
    
    PM2_VERSION=$(pm2 --version 2>/dev/null)
    
    if [ -n "$PM2_VERSION" ]; then
        print_pass "PM2 $PM2_VERSION instalado"
        echo "✓ PM2: OK ($PM2_VERSION)" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "PM2 no está instalado"
        echo "✗ PM2: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 7: Verificar servicio systemd
test_systemd_service() {
    print_test "Verificando servicio systemd..."
    
    if systemctl is-enabled "$APP_NAME.service" &>/dev/null; then
        if systemctl is-active "$APP_NAME.service" &>/dev/null; then
            print_pass "Servicio systemd activo y habilitado"
            echo "✓ Servicio systemd: OK (activo y habilitado)" >> "$TEST_RESULTS"
            return 0
        else
            print_warn "Servicio habilitado pero no activo"
            echo "⚠ Servicio systemd: WARN (habilitado pero no activo)" >> "$TEST_RESULTS"
            return 1
        fi
    else
        print_fail "Servicio systemd no configurado"
        echo "✗ Servicio systemd: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 8: Verificar puerto de aplicación
test_application_port() {
    print_test "Verificando puerto de aplicación..."
    
    # Esperar un poco para que la aplicación se inicie
    sleep 5
    
    if netstat -tlnp 2>/dev/null | grep -q ":3000.*LISTEN" || ss -tlnp 2>/dev/null | grep -q ":3000.*LISTEN"; then
        print_pass "Aplicación escuchando en puerto 3000"
        echo "✓ Puerto de aplicación: OK (3000)" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "Aplicación no está escuchando en puerto 3000"
        echo "✗ Puerto de aplicación: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 9: Verificar respuesta HTTP
test_http_response() {
    print_test "Verificando respuesta HTTP..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    
    if [[ "$HTTP_CODE" =~ ^(200|301|302)$ ]]; then
        print_pass "Aplicación responde correctamente (HTTP $HTTP_CODE)"
        echo "✓ Respuesta HTTP: OK ($HTTP_CODE)" >> "$TEST_RESULTS"
        return 0
    else
        print_fail "Aplicación no responde correctamente (HTTP $HTTP_CODE)"
        echo "✗ Respuesta HTTP: FAIL ($HTTP_CODE)" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 10: Verificar script de monitoreo
test_monitoring_script() {
    print_test "Verificando script de monitoreo..."
    
    if [ -f "/opt/scripts/$APP_NAME-monitor.sh" ] && [ -x "/opt/scripts/$APP_NAME-monitor.sh" ]; then
        # Verificar cron job
        if crontab -l 2>/dev/null | grep -q "$APP_NAME-monitor.sh"; then
            print_pass "Script de monitoreo configurado correctamente"
            echo "✓ Script de monitoreo: OK" >> "$TEST_RESULTS"
            return 0
        else
            print_warn "Script existe pero no está en cron"
            echo "⚠ Script de monitoreo: WARN (no en cron)" >> "$TEST_RESULTS"
            return 1
        fi
    else
        print_fail "Script de monitoreo no encontrado o no ejecutable"
        echo "✗ Script de monitoreo: FAIL" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 11: Verificar logs
test_logs() {
    print_test "Verificando logs del sistema..."
    
    if [ -f "/var/log/$APP_NAME.log" ] || [ -f "/var/log/$APP_NAME-out.log" ]; then
        print_pass "Archivos de log configurados"
        echo "✓ Logs del sistema: OK" >> "$TEST_RESULTS"
        return 0
    else
        print_warn "Archivos de log no encontrados (pueden crearse dinámicamente)"
        echo "⚠ Logs del sistema: WARN (archivos no encontrados)" >> "$TEST_RESULTS"
        return 1
    fi
}

# Test 12: Verificar firewall
test_firewall() {
    print_test "Verificando configuración de firewall..."
    
    if command -v ufw >/dev/null 2>&1; then
        if ufw status 2>/dev/null | grep -q "3000"; then
            print_pass "Firewall configurado para puerto 3000"
            echo "✓ Firewall: OK (puerto 3000 abierto)" >> "$TEST_RESULTS"
            return 0
        else
            print_warn "UFW instalado pero puerto 3000 no configurado"
            echo "⚠ Firewall: WARN (puerto no configurado)" >> "$TEST_RESULTS"
            return 1
        fi
    else
        print_warn "UFW no instalado"
        echo "⚠ Firewall: WARN (UFW no instalado)" >> "$TEST_RESULTS"
        return 1
    fi
}

# Función principal de pruebas
run_all_tests() {
    echo ""
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}         PRUEBA DE INSTALACIÓN COMPLETA         ${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
    
    init_test
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local warned_tests=0
    
    # Lista de pruebas
    tests=(
        "test_system_user"
        "test_app_directory"
        "test_file_permissions"
        "test_nodejs"
        "test_npm_dependencies"
        "test_pm2"
        "test_systemd_service"
        "test_application_port"
        "test_http_response"
        "test_monitoring_script"
        "test_logs"
        "test_firewall"
    )
    
    # Ejecutar todas las pruebas
    for test_function in "${tests[@]}"; do
        total_tests=$((total_tests + 1))
        
        if $test_function; then
            passed_tests=$((passed_tests + 1))
        else
            failed_tests=$((failed_tests + 1))
        fi
        
        echo ""
    done
    
    # Mostrar resumen
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}                   RESUMEN                      ${NC}"
    echo -e "${BLUE}=================================================${NC}"
    
    echo "Total de pruebas: $total_tests"
    echo -e "Pruebas exitosas: ${GREEN}$passed_tests${NC}"
    echo -e "Pruebas fallidas: ${RED}$failed_tests${NC}"
    
    echo ""
    echo "Resultados detallados guardados en: $TEST_RESULTS"
    
    # Mostrar archivo de resultados
    echo ""
    echo -e "${BLUE}RESULTADOS DETALLADOS:${NC}"
    cat "$TEST_RESULTS"
    
    # Determinar resultado final
    if [ $failed_tests -eq 0 ]; then
        echo ""
        print_pass "¡TODAS LAS PRUEBAS PASARON! La instalación está completa y funcional."
        echo "RESULTADO FINAL: ÉXITO" >> "$TEST_RESULTS"
        return 0
    else
        echo ""
        print_fail "ALGUNAS PRUEBAS FALLARON. Revise los errores antes de usar la aplicación."
        echo "RESULTADO FINAL: FALLOS DETECTADOS" >> "$TEST_RESULTS"
        return 1
    fi
}

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Este script debe ejecutarse como root para acceder a todos los componentes del sistema"
    echo "Uso: sudo $0"
    exit 1
fi

# Ejecutar todas las pruebas
run_all_tests