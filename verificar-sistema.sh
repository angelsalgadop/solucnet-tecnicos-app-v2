#!/bin/bash
# Script de verificación rápida del estado del sistema

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     VERIFICACIÓN DEL SISTEMA SOLUCNET BOT                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Estado de PM2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 ESTADO DEL SERVICIO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list
echo ""

# 2. Recursos del proceso
PID=$(pm2 jlist | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | head -1)
if [ ! -z "$PID" ] && [ "$PID" != "0" ]; then
    CPU=$(ps -p "$PID" -o %cpu --no-headers 2>/dev/null | awk '{print int($1)}')
    MEM=$(ps -p "$PID" -o %mem --no-headers 2>/dev/null | awk '{print int($1)}')

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}💻 USO DE RECURSOS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # CPU
    if [ "$CPU" -lt 50 ]; then
        echo -e "  CPU:    ${GREEN}${CPU}%${NC} ✅ Normal"
    elif [ "$CPU" -lt 80 ]; then
        echo -e "  CPU:    ${YELLOW}${CPU}%${NC} ⚠️  Moderado"
    else
        echo -e "  CPU:    ${RED}${CPU}%${NC} 🚨 Alto"
    fi

    # Memoria
    if [ "$MEM" -lt 50 ]; then
        echo -e "  Memoria: ${GREEN}${MEM}%${NC} ✅ Normal"
    elif [ "$MEM" -lt 80 ]; then
        echo -e "  Memoria: ${YELLOW}${MEM}%${NC} ⚠️  Moderado"
    else
        echo -e "  Memoria: ${RED}${MEM}%${NC} 🚨 Alto"
    fi

    echo -e "  PID:     ${PID}"
    echo ""
fi

# 3. Memoria del servidor
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🖥️  MEMORIA DEL SERVIDOR${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
free -h | grep -E "Mem|Swap"
echo ""

# 4. Estado de las protecciones
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🛡️  PROTECCIONES ACTIVAS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar tareas cron
CRON_COUNT=$(crontab -l 2>/dev/null | grep -E "monitor-cpu|watchdog-cpu" | grep -v "^#" | wc -l)
if [ "$CRON_COUNT" -ge 2 ]; then
    echo -e "  ${GREEN}✅${NC} Monitores Cron:     ${CRON_COUNT} activos"
else
    echo -e "  ${RED}❌${NC} Monitores Cron:     ${CRON_COUNT} activos (esperados: 2+)"
fi

# Verificar scripts
if [ -x "/root/whatsapp-chatbot/scripts/monitor-cpu.sh" ]; then
    echo -e "  ${GREEN}✅${NC} Monitor CPU:        Instalado y ejecutable"
else
    echo -e "  ${RED}❌${NC} Monitor CPU:        No encontrado"
fi

if [ -x "/root/whatsapp-chatbot/scripts/watchdog-cpu.sh" ]; then
    echo -e "  ${GREEN}✅${NC} Watchdog CPU:       Instalado y ejecutable"
else
    echo -e "  ${RED}❌${NC} Watchdog CPU:       No encontrado"
fi

# Verificar config PM2
if grep -q "max_cpu" /root/whatsapp-chatbot/ecosystem.config.js 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Límites PM2:        Configurados"
else
    echo -e "  ${YELLOW}⚠️${NC}  Límites PM2:        No configurados"
fi

# Reinicio automático
if grep -q "cron_restart" /root/whatsapp-chatbot/ecosystem.config.js 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Reinicio diario:    4:00 AM"
else
    echo -e "  ${YELLOW}⚠️${NC}  Reinicio diario:    No configurado"
fi

echo ""

# 5. Últimos logs de monitoreo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 ÚLTIMOS EVENTOS DE MONITOREO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "/root/whatsapp-chatbot/logs/monitor-cpu.log" ]; then
    echo -e "${YELLOW}Monitor CPU (últimas 3 líneas):${NC}"
    tail -3 /root/whatsapp-chatbot/logs/monitor-cpu.log 2>/dev/null || echo "  Sin registros"
    echo ""
fi

if [ -f "/root/whatsapp-chatbot/logs/watchdog-cpu.log" ]; then
    echo -e "${YELLOW}Watchdog CPU (últimas 3 líneas):${NC}"
    tail -3 /root/whatsapp-chatbot/logs/watchdog-cpu.log 2>/dev/null || echo "  Sin registros"
    echo ""
fi

# 6. Acceso a la aplicación
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🌐 ACCESO A LA APLICACIÓN${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que el puerto responda
if timeout 3 curl -k -s -o /dev/null -w "%{http_code}" https://localhost:3000 | grep -q "200"; then
    IP=$(hostname -I | awk '{print $1}')
    echo -e "  ${GREEN}✅${NC} Servidor HTTPS:     Respondiendo"
    echo -e "  🔗 Local:           https://localhost:3000"
    echo -e "  🔗 Remoto:          https://${IP}:3000"
else
    echo -e "  ${RED}❌${NC} Servidor HTTPS:     No responde"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Para más detalles: cat PROTECCIONES-CPU.md              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
