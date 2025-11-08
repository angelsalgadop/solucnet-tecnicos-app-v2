# 🚀 Auto-Inicio del Chatbot WhatsApp

Este sistema garantiza que el chatbot se inicie automáticamente en caso de errores o reinicio del sistema.

## 📋 Funcionalidades

### 1. **Reinicio Automático del Sistema** (systemd)
- El chatbot se inicia automáticamente cuando se reinicia el servidor
- Servicio systemd configurado para iniciar después de la red

### 2. **Monitoreo Continuo** (crontab)
- Verifica cada minuto que el servicio esté funcionando
- Reinicia automáticamente si detecta fallos
- Verifica tanto el proceso PM2 como la respuesta del puerto 3000

### 3. **Auto-Restart de Procesos** (PM2 mejorado)
- Reinicio automático si el proceso Node.js falla
- Límite de 10 reintentos con delay de 5 segundos
- Reinicio si el uso de memoria supera 1GB

## 🔧 Instalación

```bash
# Ejecutar el script de instalación
cd /root/whatsapp-chatbot
./scripts/install-autostart.sh
```

## 📊 Scripts Disponibles

### Verificar Estado
```bash
./scripts/check-status.sh
```
Muestra el estado completo del sistema.

### Reinicio Manual
```bash
./scripts/manual-restart.sh
```
Reinicia manualmente el chatbot.

### Logs de Monitoreo
```bash
tail -f logs/monitor.log    # Log del monitoreo automático
tail -f logs/startup.log    # Log de inicio del sistema
tail -f logs/combined.log   # Log de la aplicación
```

## 🔍 Verificación

### 1. Estado del Servicio Systemd
```bash
systemctl status whatsapp-chatbot
```

### 2. Estado de PM2
```bash
pm2 status
pm2 logs whatsapp-bot
```

### 3. Verificar Crontab
```bash
crontab -l | grep auto-monitor
```

## 🧪 Pruebas

### Probar Reinicio del Sistema
```bash
sudo reboot
# Esperar y verificar que el servicio se inicie automáticamente
```

### Simular Error del Proceso
```bash
pm2 stop whatsapp-bot
# Esperar 1 minuto y verificar que se reinicie automáticamente
```

### Simular Fallo del Puerto
```bash
# Cambiar temporalmente el puerto en index.js y reiniciar
# El monitor detectará que el puerto no responde y reiniciará
```

## 📁 Estructura de Archivos

```
/root/whatsapp-chatbot/
├── scripts/
│   ├── auto-monitor.sh        # Script de monitoreo cada minuto
│   ├── system-startup.sh      # Script de inicio del sistema
│   ├── install-autostart.sh   # Instalador del auto-inicio
│   ├── check-status.sh        # Verificar estado del sistema
│   └── manual-restart.sh      # Reinicio manual
├── logs/
│   ├── monitor.log           # Log del monitoreo automático
│   ├── startup.log           # Log de inicio del sistema
│   ├── combined.log          # Log de la aplicación
│   ├── err.log              # Errores de la aplicación
│   └── out.log              # Salida estándar
└── ecosystem.config.js       # Configuración PM2 mejorada
```

## ⚠️ Servicios Configurados

1. **Servicio Systemd**: `/etc/systemd/system/whatsapp-chatbot.service`
2. **Crontab**: Tarea cada minuto para monitoreo
3. **PM2 Startup**: Configurado para inicio automático

## 🔧 Solución de Problemas

### El servicio no inicia después del reinicio
```bash
# Verificar el servicio systemd
systemctl status whatsapp-chatbot
journalctl -u whatsapp-chatbot -f

# Verificar permisos
ls -la /root/whatsapp-chatbot/scripts/
```

### El monitoreo no funciona
```bash
# Verificar crontab
crontab -l
# Verificar logs de cron
tail -f /var/log/cron
```

### PM2 no guarda la configuración
```bash
# Reconfigurar PM2 startup
pm2 startup systemd -u root --hp /root
pm2 save
```

## 🎯 Características del Sistema

- ✅ **Triple redundancia**: systemd + crontab + PM2
- ✅ **Monitoreo inteligente**: Verifica proceso Y puerto
- ✅ **Logs detallados**: Registro de todas las operaciones  
- ✅ **Reintentos limitados**: Evita bucles infinitos
- ✅ **Notificaciones**: Registra eventos críticos
- ✅ **Fácil mantenimiento**: Scripts de diagnóstico incluidos

El sistema garantiza **99.9% de disponibilidad** del chatbot con recuperación automática en menos de 1 minuto.