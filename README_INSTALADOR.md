# Instalador Automático - WhatsApp Chatbot Ubuntu

## 🚀 Descripción

Este es un instalador completamente automatizado para Ubuntu que configura el sistema WhatsApp Chatbot con todas sus dependencias, servicios y monitoreo automático.

## ✅ Características

- **Instalación completamente automatizada**
- **Servicio systemd con auto-arranque**
- **Monitoreo continuo y auto-recuperación**
- **Gestión de errores robusta**
- **Validación post-instalación**
- **Configuración de firewall automática**
- **Logs detallados de instalación**

## 📋 Requisitos del Sistema

- **Ubuntu 18.04 LTS o superior**
- **Acceso root (sudo)**
- **Conexión a internet**
- **Mínimo 2GB de RAM**
- **Mínimo 5GB de espacio libre**

## 🔧 Instrucciones de Instalación

### Paso 1: Descargar y Extraer
```bash
# Descomprimir el archivo ZIP
unzip whatsapp-chatbot-installer.zip
cd whatsapp-chatbot-installer
```

### Paso 2: Ejecutar Instalador
```bash
# Dar permisos de ejecución
chmod +x install_ubuntu.sh

# Ejecutar como root
sudo ./install_ubuntu.sh
```

### Paso 3: Seguir las Instrucciones
El instalador se ejecutará automáticamente y:
- Actualizará el sistema
- Instalará todas las dependencias
- Configurará la aplicación
- Creará los servicios necesarios
- Validará la instalación
- Ofrecerá reiniciar el sistema

## 🛠️ Componentes Instalados

### Software Base
- **Node.js LTS** - Runtime de JavaScript
- **PM2** - Gestor de procesos
- **Dependencias del sistema** - Build tools, git, etc.

### Servicios
- **whatsapp-chatbot.service** - Servicio principal systemd
- **Script de monitoreo** - Verificación cada 5 minutos
- **Auto-recuperación** - Reinicio automático en caso de fallo

### Estructura de Archivos
```
/opt/whatsapp-chatbot/          # Aplicación principal
/var/log/whatsapp-chatbot*.log  # Logs del sistema
/opt/scripts/                   # Scripts de monitoreo
/etc/systemd/system/            # Configuración de servicios
```

## 📊 Comandos Útiles

### Control del Servicio
```bash
# Ver estado
sudo systemctl status whatsapp-chatbot.service

# Reiniciar
sudo systemctl restart whatsapp-chatbot.service

# Parar
sudo systemctl stop whatsapp-chatbot.service

# Iniciar
sudo systemctl start whatsapp-chatbot.service
```

### Monitoreo y Logs
```bash
# Logs en tiempo real
sudo journalctl -u whatsapp-chatbot.service -f

# Últimos logs
sudo journalctl -u whatsapp-chatbot.service -n 50

# Logs de instalación
sudo cat /var/log/whatsapp-chatbot-install.log

# Logs de monitoreo
sudo cat /var/log/whatsapp-chatbot-monitor.log
```

### PM2 (Gestor de Procesos)
```bash
# Lista de procesos
pm2 list

# Logs de la aplicación
pm2 logs whatsapp-chatbot

# Reiniciar aplicación
pm2 restart whatsapp-chatbot

# Monitoreo en tiempo real
pm2 monit
```

## 🌐 Acceso a la Aplicación

Después de la instalación exitosa:

- **Local**: http://localhost:3000
- **Red**: http://IP_DEL_SERVIDOR:3000
- **Puerto**: 3000 (configurable en ecosystem.config.js)

## 🔒 Seguridad

### Usuario del Sistema
- Se crea un usuario específico: `chatbot`
- La aplicación NO se ejecuta como root
- Permisos mínimos necesarios

### Firewall
- Puerto 3000 abierto automáticamente
- SSH permitido
- Configuración básica de UFW

## 🚨 Solución de Problemas

### La aplicación no inicia
```bash
# Verificar logs
sudo journalctl -u whatsapp-chatbot.service -n 20

# Verificar configuración PM2
sudo -u chatbot pm2 list

# Verificar puerto
sudo netstat -tlnp | grep 3000
```

### Problemas de permisos
```bash
# Corregir permisos
sudo chown -R chatbot:chatbot /opt/whatsapp-chatbot/
sudo chmod -R 755 /opt/whatsapp-chatbot/
```

### Reinstalación
```bash
# Parar servicios
sudo systemctl stop whatsapp-chatbot.service
sudo systemctl disable whatsapp-chatbot.service

# Limpiar instalación anterior
sudo rm -rf /opt/whatsapp-chatbot/
sudo userdel -r chatbot
sudo rm /etc/systemd/system/whatsapp-chatbot.service
sudo systemctl daemon-reload

# Ejecutar instalador nuevamente
sudo ./install_ubuntu.sh
```

## 📋 Validación de la Instalación

El instalador incluye validación automática que verifica:

✅ **Servicio systemd activo**
✅ **Aplicación escuchando en puerto 3000**  
✅ **Respuesta HTTP correcta**
✅ **Logs sin errores críticos**
✅ **Monitoreo configurado**
✅ **Auto-arranque habilitado**

## 🔄 Auto-Recuperación

El sistema incluye un mecanismo robusto de auto-recuperación:

- **Monitoreo cada 5 minutos** vía cron
- **Reinicio automático** si el servicio falla
- **Máximo 5 intentos** antes de requerir intervención manual
- **Logs detallados** de todos los eventos

## 📞 Soporte

En caso de problemas:

1. **Revisar logs de instalación**: `/var/log/whatsapp-chatbot-install.log`
2. **Verificar logs del servicio**: `journalctl -u whatsapp-chatbot.service`
3. **Comprobar logs de monitoreo**: `/var/log/whatsapp-chatbot-monitor.log`
4. **Verificar estado del sistema**: `systemctl status whatsapp-chatbot.service`

## 📝 Notas Importantes

- **Respaldo**: Se recomienda hacer respaldo antes de la instalación
- **Reinicio**: El instalador ofrece reiniciar el sistema para completar la configuración
- **Actualizaciones**: Para actualizar, use el mismo proceso de instalación
- **Desinstalación**: Use el script cleanup_on_error incluido como referencia

---

**Instalador creado para Ubuntu - WhatsApp Chatbot System**  
**Versión**: 1.0  
**Compatibilidad**: Ubuntu 18.04+ LTS