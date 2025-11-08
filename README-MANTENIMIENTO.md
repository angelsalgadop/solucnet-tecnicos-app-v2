# Guía de Mantenimiento - Sistema SOLUCNET Bot

## 🚀 Inicio Rápido

### Verificar estado del sistema
```bash
/root/whatsapp-chatbot/verificar-sistema.sh
# o usar el alias:
verificar-bot
```

### Reiniciar el bot
```bash
pm2 restart solucnet-bot
```

### Ver logs en tiempo real
```bash
pm2 logs solucnet-bot
```

## 📊 Monitoreo y Protecciones

### Sistema de protección contra alto CPU

El sistema cuenta con **4 capas de protección** que previenen problemas de alto consumo de CPU:

1. **PM2 Automático** - Límites configurados en `ecosystem.config.js`
2. **Monitor Regular** - Ejecuta cada 5 minutos
3. **Watchdog Crítico** - Ejecuta cada 2 minutos (respuesta rápida)
4. **Sistema de Alertas** - Registra todos los eventos críticos

Documentación completa: `cat PROTECCIONES-CPU.md`

### Logs importantes

```bash
# Logs del bot
tail -f /root/whatsapp-chatbot/logs/out.log    # Salida estándar
tail -f /root/whatsapp-chatbot/logs/err.log    # Errores

# Logs de monitoreo
tail -f /root/whatsapp-chatbot/logs/monitor-cpu.log       # Monitor regular
tail -f /root/whatsapp-chatbot/logs/watchdog-cpu.log      # Watchdog crítico
tail -f /root/whatsapp-chatbot/logs/alertas-criticas.log  # Alertas críticas

# Logs de cron
tail -f /root/whatsapp-chatbot/logs/cron-monitor.log
```

## 🔧 Solución de Problemas Comunes

### Bot no responde / Alto CPU

**Síntomas:**
- CPU > 80%
- Servidor no responde a peticiones HTTP
- Aplicación web no carga

**Solución automática:**
Las protecciones deberían reiniciar el bot automáticamente. Espera 2-5 minutos.

**Solución manual:**
```bash
pm2 restart solucnet-bot
```

**Verificar que se solucionó:**
```bash
verificar-bot
```

### WhatsApp desconectado

**Síntomas:**
- Bot no responde mensajes
- QR code aparece en los logs

**Solución:**
```bash
# Ver logs y buscar QR
pm2 logs solucnet-bot --lines 100

# Si aparece QR, escanear con WhatsApp
# Si no hay QR, reiniciar:
pm2 restart solucnet-bot
```

### Base de datos no responde

**Síntomas:**
- Errores de MySQL en logs
- "ECONNREFUSED" en logs

**Verificar MySQL:**
```bash
mysql -u debian-sys-maint -pIOHcXunF7795fMRI -e "SHOW DATABASES;"
```

**Reiniciar MySQL si es necesario:**
```bash
sudo systemctl restart mysql
```

### Puerto 3000 en uso

**Verificar qué proceso usa el puerto:**
```bash
lsof -i :3000
```

**Matar proceso conflictivo:**
```bash
kill -9 <PID>
pm2 restart solucnet-bot
```

## 📁 Estructura de Archivos Importantes

```
/root/whatsapp-chatbot/
├── index.js                      # Archivo principal del bot
├── ecosystem.config.js           # Configuración PM2
├── db.js                         # Conexiones a base de datos
├── PROTECCIONES-CPU.md          # Documentación de protecciones
├── README-MANTENIMIENTO.md      # Este archivo
├── verificar-sistema.sh         # Script de verificación
│
├── scripts/
│   ├── monitor-cpu.sh           # Monitor regular (cada 5 min)
│   ├── watchdog-cpu.sh          # Watchdog crítico (cada 2 min)
│   ├── alerta-critica.sh        # Sistema de alertas
│   └── health-check.sh          # Verificación de salud
│
├── logs/
│   ├── out.log                  # Salida estándar
│   ├── err.log                  # Errores
│   ├── monitor-cpu.log          # Logs del monitor
│   ├── watchdog-cpu.log         # Logs del watchdog
│   └── alertas-criticas.log     # Alertas críticas
│
└── .wwebjs_auth/                # Sesión de WhatsApp
    └── session-whatsapp-bot-session/
```

## 🔐 Acceso a la Aplicación

**URLs de acceso:**
- Local: `https://localhost:3000`
- Remota: `https://192.168.99.122:3000`

**Nota:** El certificado SSL es autofirmado. Acepta la advertencia del navegador.

## ⚙️ Comandos PM2 Útiles

```bash
# Ver todos los procesos
pm2 list

# Ver detalles de solucnet-bot
pm2 describe solucnet-bot

# Monitor en tiempo real
pm2 monit

# Reiniciar
pm2 restart solucnet-bot

# Detener
pm2 stop solucnet-bot

# Iniciar
pm2 start solucnet-bot

# Ver logs
pm2 logs solucnet-bot

# Limpiar logs
pm2 flush solucnet-bot

# Guardar configuración actual
pm2 save

# Configurar inicio automático al arrancar el servidor
pm2 startup
```

## 🔄 Reinicio Preventivo

El sistema se reinicia automáticamente todos los días a las **4:00 AM** para limpiar memoria y prevenir problemas.

Para cambiar la hora:
```bash
nano /root/whatsapp-chatbot/ecosystem.config.js
# Editar: cron_restart: '0 4 * * *'
pm2 reload ecosystem.config.js
```

## 🛠️ Mantenimiento Periódico

### Semanal
- Revisar logs de alertas críticas: `cat /root/whatsapp-chatbot/logs/alertas-criticas.log`
- Verificar espacio en disco: `df -h`
- Verificar uso de memoria: `free -h`

### Mensual
- Revisar y limpiar logs antiguos si es necesario
- Verificar actualizaciones de dependencias: `npm outdated`
- Revisar base de datos para optimizaciones

### Cuando sea necesario
- Actualizar Node.js si hay nueva versión LTS
- Revisar y optimizar consultas de base de datos lentas
- Actualizar certificados SSL si expiran

## 📞 Contacto y Soporte

Si los problemas persisten después de seguir esta guía:

1. Revisar `PROTECCIONES-CPU.md` para más detalles técnicos
2. Revisar logs completos: `pm2 logs solucnet-bot --lines 200`
3. Verificar sistema: `verificar-bot`
4. Contactar al equipo de desarrollo con los logs relevantes

---

**Última actualización:** 2025-10-31
**Versión del bot:** 1.0.0
**Node.js:** v18+
**PM2:** v5+
