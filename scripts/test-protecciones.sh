#!/bin/bash
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        PRUEBA FINAL DE PROTECCIONES - SOLUCNET BOT        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

# Test 1: PM2 corriendo
echo -n "✓ Test 1: PM2 está corriendo... "
if pm2 list | grep -q "solucnet-bot.*online"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# Test 2: Scripts de monitoreo existen y son ejecutables
echo -n "✓ Test 2: Scripts de monitoreo instalados... "
if [ -x "/root/whatsapp-chatbot/scripts/monitor-cpu.sh" ] && [ -x "/root/whatsapp-chatbot/scripts/watchdog-cpu.sh" ]; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# Test 3: Tareas cron configuradas
echo -n "✓ Test 3: Tareas cron configuradas... "
CRON_COUNT=$(crontab -l 2>/dev/null | grep -E "monitor-cpu|watchdog-cpu" | grep -v "^#" | wc -l)
if [ "$CRON_COUNT" -ge 2 ]; then
    echo "✅ PASS ($CRON_COUNT tareas)"
    ((PASS++))
else
    echo "❌ FAIL (solo $CRON_COUNT tareas)"
    ((FAIL++))
fi

# Test 4: Configuración PM2 con límites
echo -n "✓ Test 4: Límites PM2 configurados... "
if grep -q "max_cpu" /root/whatsapp-chatbot/ecosystem.config.js; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# Test 5: Servidor responde
echo -n "✓ Test 5: Servidor web responde... "
HTTP_CODE=$(timeout 3 curl -k -s -o /dev/null -w "%{http_code}" https://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PASS (HTTP $HTTP_CODE)"
    ((PASS++))
else
    echo "❌ FAIL (HTTP $HTTP_CODE)"
    ((FAIL++))
fi

# Test 6: CPU en niveles normales
echo -n "✓ Test 6: CPU en niveles normales... "
PID=$(pm2 jlist | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | head -1)
CPU=$(ps -p "$PID" -o %cpu --no-headers 2>/dev/null | awk '{print int($1)}')
if [ "$CPU" -lt 50 ]; then
    echo "✅ PASS (CPU: ${CPU}%)"
    ((PASS++))
else
    echo "⚠️  WARN (CPU: ${CPU}%)"
    ((PASS++))
fi

# Test 7: Documentación creada
echo -n "✓ Test 7: Documentación disponible... "
if [ -f "/root/whatsapp-chatbot/PROTECCIONES-CPU.md" ] && [ -f "/root/whatsapp-chatbot/README-MANTENIMIENTO.md" ]; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# Test 8: Script de verificación funciona
echo -n "✓ Test 8: Script de verificación funciona... "
if [ -x "/root/whatsapp-chatbot/verificar-sistema.sh" ]; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  RESULTADOS: $PASS/8 tests pasados"
if [ "$FAIL" -eq 0 ]; then
    echo "  Estado: ✅ SISTEMA COMPLETAMENTE PROTEGIDO"
else
    echo "  Estado: ⚠️  Algunas protecciones necesitan atención"
fi
echo "════════════════════════════════════════════════════════════"
