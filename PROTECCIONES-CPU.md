# Sistema de Protección contra Alto Consumo de CPU

Este documento describe las protecciones implementadas para prevenir que el bot de WhatsApp consuma CPU excesiva y deje de responder.

## 🛡️ Protecciones Implementadas

### 1. Límites de PM2 (Automático)

**Archivo:** `/root/whatsapp-chatbot/ecosystem.config.js`

Configuraciones aplicadas:
- **max_memory_restart:** `3G` - Reinicia automáticamente si excede 3GB de RAM
- **max_cpu:** `90` - PM2 monitorea si el CPU promedio supera 90%
- **cron_restart:** `0 4 * * *` - Reinicio preventivo diario a las 4 AM
- **max_restarts:** `100` - Permite múltiples reinicios sin bloquear
- **restart_delay:** `5000ms` - Espera 5 segundos entre reinicios
- **kill_timeout:** `60000ms` - Da 60 segundos para cerrar limpiamente

**Estado:** ✅ Activo y funcionando

### 2. Monitor de CPU y Memoria (Cada 5 minutos)

**Script:** `/root/whatsapp-chatbot/scripts/monitor-cpu.sh`
**Cron:** `*/5 * * * *` (cada 5 minutos)
**Logs:** `/root/whatsapp-chatbot/logs/monitor-cpu.log`

Acciones:
- Verifica CPU cada 5 minutos
- Si CPU > 80% por 30 segundos consecutivos → Reinicia
- Si Memoria > 80% → Reinicia inmediatamente
- Registra estadísticas antes y después del reinicio
- Mantiene log de últimas 1000 líneas

**Umbrales:**
- CPU: 80% sostenido por 30 segundos
- Memoria: 80%

**Estado:** ✅ Activo y funcionando

### 3. Watchdog de CPU Crítico (Cada 2 minutos)

**Script:** `/root/whatsapp-chatbot/scripts/watchdog-cpu.sh`
**Cron:** `*/2 * * * *` (cada 2 minutos)
**Logs:** `/root/whatsapp-chatbot/logs/watchdog-cpu.log`

Acciones:
- Monitorea CPU cada 5 segundos durante 1 minuto (12 muestras)
- Si CPU ≥ 95% → Reinicio inmediato (emergencia)
- Si CPU ≥ 85% en 3 muestras consecutivas → Reinicio preventivo
- Respuesta más rápida que el monitor regular

**Umbrales:**
- CPU Crítica: 95% (reinicio inmediato)
- CPU Alta: 85% (3 advertencias = reinicio)

**Estado:** ✅ Activo y funcionando

### 4. Otros Monitores Existentes

- **monitor_whatsapp.sh:** Cada 5 minutos - Verifica conexión WhatsApp
- **monitor-health.sh:** Cada 10 minutos - Verifica salud general del sistema

## 📊 Verificación del Sistema

### Ver estado de PM2:
```bash
pm2 describe solucnet-bot
pm2 monit
```

### Ver logs de monitoreo:
```bash
# Monitor regular de CPU
tail -f /root/whatsapp-chatbot/logs/monitor-cpu.log

# Watchdog crítico
tail -f /root/whatsapp-chatbot/logs/watchdog-cpu.log

# Logs de cron
tail -f /root/whatsapp-chatbot/logs/cron-monitor.log
tail -f /root/whatsapp-chatbot/logs/watchdog-cron.log
```

### Ver tareas programadas:
```bash
crontab -l
```

### Probar scripts manualmente:
```bash
# Probar monitor regular
/root/whatsapp-chatbot/scripts/monitor-cpu.sh

# Probar watchdog
/root/whatsapp-chatbot/scripts/watchdog-cpu.sh
```

## 🔧 Mantenimiento

### Ajustar umbrales

Si necesitas cambiar los umbrales de CPU o memoria:

1. **Monitor regular** (`monitor-cpu.sh`):
   ```bash
   nano /root/whatsapp-chatbot/scripts/monitor-cpu.sh
   # Editar: CPU_THRESHOLD=80, MEM_THRESHOLD=80
   ```

2. **Watchdog crítico** (`watchdog-cpu.sh`):
   ```bash
   nano /root/whatsapp-chatbot/scripts/watchdog-cpu.sh
   # Editar: CRITICAL_CPU=95, WARNING_CPU=85
   ```

3. **PM2** (`ecosystem.config.js`):
   ```bash
   nano /root/whatsapp-chatbot/ecosystem.config.js
   # Editar: max_cpu, max_memory_restart
   pm2 reload ecosystem.config.js
   ```

### Deshabilitar temporalmente

Para deshabilitar temporalmente los monitores:

```bash
# Ver tareas cron
crontab -l

# Editar cron (comentar líneas con #)
crontab -e
```

## 📈 Estadísticas de Protección

Las protecciones se activarán automáticamente si:
- CPU > 80% por más de 30 segundos
- CPU > 85% en 3 muestras de 5 segundos (15 segundos total)
- CPU > 95% (reinicio inmediato de emergencia)
- Memoria > 80%
- Memoria > 3GB (PM2)
- CPU promedio > 90% (PM2)

## ⚠️ Historial de Incidentes

### 2025-10-31
- **Problema:** CPU al 95.6%, servidor no respondía
- **Causa:** Acumulación de setInterval (85 intervalos activos detectados)
- **Solución:** Reinicio manual + implementación de protecciones automáticas
- **Prevención:** Todos los sistemas de monitoreo descritos arriba

## 🚀 Estado Actual

- ✅ Servidor funcionando normalmente
- ✅ CPU: ~2-3% (normal)
- ✅ Memoria: ~2% (normal)
- ✅ 4 sistemas de protección activos:
  1. PM2 con límites
  2. Monitor CPU/Memoria (5 min)
  3. Watchdog crítico (2 min)
  4. Reinicio preventivo diario (4 AM)

---

**Última actualización:** 2025-10-31
**Mantenido por:** Equipo de Soporte Técnico
