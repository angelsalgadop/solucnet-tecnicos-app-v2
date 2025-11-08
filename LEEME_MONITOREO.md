# 🤖 Sistema de Monitoreo WhatsApp Bot SOLUCNET

## 📋 Descripción
Sistema completo de monitoreo y recuperación automática para el bot de WhatsApp que garantiza que el programa se mantenga en línea 24/7, incluso después de reinicios del servidor.

## ✅ Características Instaladas

### 🔧 Servicios Systemd
- **whatsapp-bot** - Servicio principal del bot
- **whatsapp-monitor** - Monitor de recuperación automática

### 🛡️ Funciones de Recuperación
- ✅ Auto-inicio después de reinicio del servidor
- ✅ Detección automática de desconexiones
- ✅ Recuperación inteligente con límite de reintentos
- ✅ Limpieza automática de sesiones corruptas
- ✅ Gestión de códigos QR con timeout
- ✅ Rotación automática de logs
- ✅ Monitoreo continuo cada 60 segundos

## 🚀 Comandos de Gestión

### Script Principal de Utilidades
```bash
# Ver estado de servicios
./bot-utils.sh status

# Iniciar servicios
./bot-utils.sh start

# Detener servicios
./bot-utils.sh stop

# Reiniciar servicios
./bot-utils.sh restart

# Ver logs del bot en tiempo real
./bot-utils.sh logs

# Ver logs del monitor en tiempo real
./bot-utils.sh monitor-logs

# Limpiar sesión corrupta
./bot-utils.sh clean

# Ver información del QR
./bot-utils.sh qr
```

### Comandos Systemd Directos
```bash
# Estado de servicios
systemctl status whatsapp-bot
systemctl status whatsapp-monitor

# Reiniciar servicios
systemctl restart whatsapp-bot
systemctl restart whatsapp-monitor

# Ver logs
journalctl -u whatsapp-bot -f
journalctl -u whatsapp-monitor -f

# Habilitar/deshabilitar auto-inicio
systemctl enable whatsapp-bot
systemctl disable whatsapp-bot
```

## 📱 Configuración Inicial

### Paso 1: Conectar WhatsApp
1. Ejecuta: `./bot-utils.sh logs`
2. Espera a que aparezca el código QR en los logs
3. Escanea el QR con WhatsApp Web desde tu teléfono
4. Una vez conectado, el sistema mantendrá la sesión automáticamente

### Paso 2: Verificar Funcionamiento
```bash
# Verificar que ambos servicios estén activos
./bot-utils.sh status

# Si hay problemas, limpiar sesión y reiniciar
./bot-utils.sh clean
```

## 📊 Monitoreo y Logs

### Ubicación de Logs
- **Logs del bot:** `journalctl -u whatsapp-bot`
- **Logs del monitor:** `journalctl -u whatsapp-monitor`
- **Logs del sistema:** `/root/whatsapp-chatbot/logs/`

### Rotación de Logs
- Los logs se rotan automáticamente cada 7 días
- Los archivos de log grandes (>50MB) se rotan automáticamente
- Se mantiene un historial de logs rotados

## 🔄 Proceso de Recuperación Automática

### Detección de Problemas
1. **Servicio Caído:** Reinicio automático del servicio
2. **WhatsApp Desconectado:** Intento de reconexión
3. **Sesión Corrupta:** Limpieza automática y nueva autenticación
4. **Código QR:** Timeout de 5 minutos para escaneo manual

### Límites de Seguridad
- Máximo 3 reintentos por ciclo
- Después de 3 fallos: limpieza completa de sesión
- Pausa de 60 segundos entre verificaciones
- Pausa de 30 segundos después de recuperación exitosa

## 🛠️ Resolución de Problemas

### Problema: Bot no se conecta
```bash
# Limpiar sesión y reiniciar
./bot-utils.sh clean

# Ver logs para el nuevo QR
./bot-utils.sh logs
```

### Problema: Monitor no funciona
```bash
# Reiniciar solo el monitor
systemctl restart whatsapp-monitor

# Verificar estado
systemctl status whatsapp-monitor
```

### Problema: Servicios no inician al reiniciar
```bash
# Verificar que estén habilitados
systemctl is-enabled whatsapp-bot
systemctl is-enabled whatsapp-monitor

# Habilitar si es necesario
systemctl enable whatsapp-bot
systemctl enable whatsapp-monitor
```

### Problema: Errores de permisos
```bash
# Verificar propietario de archivos
chown -R root:root /root/whatsapp-chatbot

# Verificar permisos de ejecución
chmod +x /root/whatsapp-chatbot/*.sh
```

## 📋 Archivos del Sistema

### Scripts Creados
- `install-monitoring.sh` - Script de instalación completa
- `monitor-recovery.sh` - Script de monitoreo y recuperación
- `bot-utils.sh` - Utilidades de gestión del bot

### Servicios Systemd
- `/etc/systemd/system/whatsapp-bot.service`
- `/etc/systemd/system/whatsapp-monitor.service`

### Logs
- `/root/whatsapp-chatbot/logs/installation.log`
- `/root/whatsapp-chatbot/logs/monitor-recovery.log`

## 🔧 Reinstalación

Si necesitas reinstalar el sistema completo:
```bash
# Ejecutar instalador
./install-monitoring.sh
```

El instalador:
- ✅ Valida el sistema operativo
- ✅ Actualiza dependencias
- ✅ Verifica Node.js y npm
- ✅ Instala dependencias del bot
- ✅ Configura servicios systemd
- ✅ Inicia monitoreo automático
- ✅ Verifica la instalación

## 📞 Soporte

Para problemas específicos:
1. Revisar logs: `./bot-utils.sh logs`
2. Verificar estado: `./bot-utils.sh status`
3. Intentar limpieza: `./bot-utils.sh clean`

El sistema está diseñado para ser completamente autónomo y mantener el bot en línea sin intervención manual.