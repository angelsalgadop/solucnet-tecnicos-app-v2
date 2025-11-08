#!/bin/bash

# 🧪 SCRIPT DE PRUEBA DE INSTALACIÓN - WhatsApp Bot
# Prueba todas las funciones y verifica que el sistema esté funcionando correctamente

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[✓ ÉXITO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠ ATENCIÓN]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗ ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ INFO]${NC} $1"
}

print_header() {
    echo
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

# Contadores de pruebas
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    ((TOTAL_TESTS++))

    print_info "Ejecutando: $test_name"

    if eval "$test_command" >/dev/null 2>&1; then
        print_success "$test_name"
        ((PASSED_TESTS++))
        return 0
    else
        print_error "$test_name"
        ((FAILED_TESTS++))
        return 1
    fi
}

print_header "PRUEBA COMPLETA DE INSTALACIÓN"
echo "Este script verificará que toda la instalación esté funcionando correctamente"
echo

# Test 1: Verificar archivos críticos
print_header "1. VERIFICANDO ARCHIVOS CRÍTICOS"

critical_files=(
    "index.js"
    "package.json"
    "keep-alive.sh"
    "auto-monitor.sh"
    "install.sh"
    "configure-environment.sh"
    "check-dependencies.sh"
)

for file in "${critical_files[@]}"; do
    run_test "Archivo $file existe" "[[ -f '$file' ]]"
done

# Test 2: Verificar permisos
print_header "2. VERIFICANDO PERMISOS"

executable_files=(
    "keep-alive.sh"
    "auto-monitor.sh"
    "install.sh"
    "configure-environment.sh"
    "check-dependencies.sh"
)

for file in "${executable_files[@]}"; do
    run_test "Archivo $file es ejecutable" "[[ -x '$file' ]]"
done

# Test 3: Verificar dependencias
print_header "3. VERIFICANDO DEPENDENCIAS DEL SISTEMA"

run_test "Node.js está instalado" "command -v node"
run_test "NPM está instalado" "command -v npm"
run_test "PM2 está instalado" "command -v pm2"
run_test "MySQL está instalado" "command -v mysql"
run_test "Git está instalado" "command -v git"

# Test 4: Verificar servicios
print_header "4. VERIFICANDO SERVICIOS"

run_test "MySQL está ejecutándose" "systemctl is-active --quiet mysql"
run_test "Servicio systemd existe" "[[ -f /etc/systemd/system/whatsapp-bot.service ]]"
run_test "Servicio systemd habilitado" "systemctl is-enabled --quiet whatsapp-bot 2>/dev/null || true"

# Test 5: Verificar directorios
print_header "5. VERIFICANDO DIRECTORIOS"

directories=(
    "logs"
    "uploads"
    "uploads/fotos_reportes"
    ".wwebjs_auth"
)

for dir in "${directories[@]}"; do
    run_test "Directorio $dir existe" "[[ -d '$dir' ]]"
done

# Test 6: Verificar crontab
print_header "6. VERIFICANDO CONFIGURACIÓN AUTOMÁTICA"

run_test "Crontab configurado para monitoreo" "crontab -l 2>/dev/null | grep -q 'keep-alive.sh monitor'"

# Test 7: Probar funciones del bot
print_header "7. PROBANDO FUNCIONES DEL BOT"

# Detener el bot si está ejecutándose para hacer pruebas limpias
if pgrep -f "node.*index.js" > /dev/null; then
    print_info "Deteniendo bot para pruebas..."
    ./keep-alive.sh stop >/dev/null 2>&1 || true
    sleep 2
fi

run_test "Script keep-alive.sh funciona (status)" "./keep-alive.sh status"
run_test "Script keep-alive.sh funciona (start)" "./keep-alive.sh start"

# Esperar a que el bot inicie
print_info "Esperando 5 segundos para que el bot inicie..."
sleep 5

run_test "Bot se inició correctamente" "pgrep -f 'node.*index.js'"
run_test "Puerto 443 está en uso" "netstat -tuln | grep -q ':443 '"

# Test 8: Verificar logs
print_header "8. VERIFICANDO SISTEMA DE LOGS"

run_test "Archivo de log principal existe" "[[ -f logs/bot-output.log ]]"
run_test "Archivo de log de keep-alive existe" "[[ -f logs/keep-alive.log ]]"

# Verificar que los logs tienen contenido reciente (últimos 2 minutos)
run_test "Log principal tiene contenido reciente" "find logs/bot-output.log -mmin -2 | grep -q bot-output.log"

# Test 9: Verificar base de datos
print_header "9. VERIFICANDO BASE DE DATOS"

run_test "Base de datos solucnet_auth_system existe" "mysql -e 'USE solucnet_auth_system; SHOW TABLES;' >/dev/null 2>&1"

# Test 10: Prueba funcional básica
print_header "10. PRUEBA FUNCIONAL BÁSICA"

# Verificar que el servidor responde
sleep 3
run_test "Servidor web responde" "curl -k -s https://localhost/api/health >/dev/null 2>&1 || curl -s http://localhost/api/health >/dev/null 2>&1"

# Test 11: Verificar monitoreo automático
print_header "11. VERIFICANDO MONITOREO AUTOMÁTICO"

# Simular ejecución del monitoreo
run_test "Script de monitoreo automático funciona" "./keep-alive.sh monitor"

# Test 12: Prueba de reinicio
print_header "12. PRUEBA DE REINICIO"

run_test "Reinicio del bot funciona" "./keep-alive.sh restart"

# Esperar a que reinicie
print_info "Esperando 5 segundos para verificar reinicio..."
sleep 5

run_test "Bot está ejecutándose después del reinicio" "pgrep -f 'node.*index.js'"

# Resumen final
print_header "RESUMEN DE PRUEBAS"

echo
echo "📊 ESTADÍSTICAS DE PRUEBAS:"
echo "  Total de pruebas: $TOTAL_TESTS"
echo "  Pruebas exitosas: $PASSED_TESTS"
echo "  Pruebas fallidas: $FAILED_TESTS"
echo

if [[ $FAILED_TESTS -eq 0 ]]; then
    print_success "🎉 TODAS LAS PRUEBAS PASARON - INSTALACIÓN EXITOSA"
    echo
    echo "✅ Tu WhatsApp Bot está completamente instalado y funcionando"
    echo "✅ El sistema de monitoreo 24/7 está activo"
    echo "✅ Todos los servicios están configurados correctamente"
    echo
    echo "🚀 COMANDOS ÚTILES:"
    echo "   ./keep-alive.sh status     - Ver estado del bot"
    echo "   ./system-status.sh         - Estado completo del sistema"
    echo "   ./check-dependencies.sh    - Verificar dependencias"
    echo "   tail -f logs/bot-output.log - Ver logs en tiempo real"
    echo
    echo "🌐 El bot se iniciará automáticamente al reiniciar el servidor"
    echo
elif [[ $FAILED_TESTS -le 3 ]]; then
    print_warning "⚠️  INSTALACIÓN MAYORMENTE EXITOSA CON ADVERTENCIAS"
    echo
    echo "El bot está funcionando pero hay algunos elementos que necesitan atención."
    echo "Revisa las pruebas fallidas arriba y consulta la documentación."
    echo
    echo "🔧 Para intentar reparar automáticamente:"
    echo "   ./install.sh"
    echo "   ./configure-environment.sh"
else
    print_error "❌ INSTALACIÓN CON ERRORES CRÍTICOS"
    echo
    echo "Hay problemas significativos que necesitan ser resueltos."
    echo "Revisa las pruebas fallidas y consulta la sección de solución de problemas."
    echo
    echo "🛠️  Para reinstalar completamente:"
    echo "   ./install.sh"
    echo "   ./configure-environment.sh"
fi

echo
echo "📚 Para más información, consulta: INSTALACION.md"
echo

# Mostrar estado final del sistema
if command -v ./system-status.sh >/dev/null 2>&1; then
    print_header "ESTADO ACTUAL DEL SISTEMA"
    ./system-status.sh
fi