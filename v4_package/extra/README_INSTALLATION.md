# 🚀 SOLUCNET WHATSAPP BOT - INSTALACIÓN COMPLETA UBUNTU 24

## 📦 Paquete de Instalación Completo

Este paquete contiene todo lo necesario para instalar el bot de WhatsApp SOLUCNET en Ubuntu Server 24.04 LTS de forma completamente automatizada.

### 📋 Archivos Incluidos

```
📁 Paquete de Instalación
├── 🔧 install.sh              # Script principal de instalación
├── 📁 deploy-files.sh          # Script para desplegar archivos del proyecto
├── 🔍 verify-installation.sh   # Script de verificación
├── 📚 INSTALLATION_GUIDE.md    # Guía completa paso a paso
├── 📄 README_INSTALLATION.md   # Este archivo
├── 📱 index.js                 # Aplicación principal del bot
├── 🗄️ db.js                   # Configuración de base de datos
├── 🌐 public/index.html        # Interfaz web moderna
├── 🖼️ images/                 # Imágenes de localidades
├── 🤖 imagenes/                # Imágenes del bot
└── ⚙️ ecosystem.config.js      # Configuración PM2
```

## ⚡ Instalación Rápida (3 Comandos)

```bash
# 1. Ejecutar instalación base (como root)
sudo bash install.sh

# 2. Desplegar archivos del proyecto
sudo bash deploy-files.sh

# 3. Iniciar el bot
solucnet-bot start
```

**¡Listo!** Tu bot estará funcionando en: `http://tu-servidor-ip/`

## 🎯 ¿Qué Instala Automáticamente?

### 🔧 Software Base
- ✅ **Node.js 20 LTS** + NPM
- ✅ **MySQL Server 8.0** con base de datos configurada
- ✅ **Google Chrome** (para WhatsApp Web)
- ✅ **PM2** (gestor de procesos)
- ✅ **Nginx** (proxy reverso)

### 🛡️ Seguridad
- ✅ **UFW Firewall** configurado
- ✅ **Fail2Ban** contra ataques
- ✅ **Permisos** correctos
- ✅ **Usuario MySQL** específico

### 📊 Monitoreo
- ✅ **Logrotate** para rotación de logs
- ✅ **PM2 Monitoring** avanzado
- ✅ **Scripts de gestión** automática

### 🌐 Interfaz Web
- ✅ **Panel de control** moderno
- ✅ **Gestión de chats** en tiempo real
- ✅ **Modo bot/humano** intercambiable
- ✅ **Envío de mensajes** desde web

## 📋 Requisitos del Sistema

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **SO** | Ubuntu 20.04+ | Ubuntu 24.04 LTS |
| **RAM** | 2GB | 4GB |
| **Disco** | 20GB libres | 50GB |
| **CPU** | 2 cores | 4 cores |
| **Red** | Internet estable | Fibra óptica |

## 🚀 Proceso de Instalación Detallado

### Fase 1: install.sh (5-10 minutos)
```bash
sudo bash install.sh
```
**Instala y configura:**
- Actualiza Ubuntu completamente
- Instala Node.js, MySQL, Chrome, Nginx
- Configura firewall y seguridad
- Crea estructura de directorios
- Configura base de datos con tablas
- Instala dependencias NPM

### Fase 2: deploy-files.sh (1-2 minutos)
```bash
sudo bash deploy-files.sh
```
**Despliega el proyecto:**
- Copia archivos principales
- Configura interfaz web
- Instala imágenes reales
- Configura permisos correctos

### Fase 3: Verificación (opcional)
```bash
bash verify-installation.sh
```
**Verifica que todo esté correcto:**
- Comprueba todos los servicios
- Valida configuración
- Reporta estado del sistema

## 🎛️ Gestión del Bot

### Comandos Principales
```bash
# Gestión básica
solucnet-bot start     # Iniciar bot
solucnet-bot stop      # Detener bot
solucnet-bot restart   # Reiniciar bot
solucnet-bot status    # Ver estado
solucnet-bot logs      # Ver logs en tiempo real

# Monitoreo avanzado
solucnet-bot monitor   # Dashboard interactivo
```

### Comandos de Sistema
```bash
# Estado de servicios
systemctl status nginx mysql fail2ban

# Logs del sistema
tail -f /opt/solucnet-bot/logs/pm2-combined.log
tail -f /opt/solucnet-bot/mensajes.log

# Actualización rápida
cd /opt/solucnet-bot && ./update.sh
```

## 🌐 Acceso y Configuración

### URLs de Acceso
- **Panel Web**: `http://tu-servidor-ip/`
- **API REST**: `http://tu-servidor-ip/api/`
- **Estado**: `http://tu-servidor-ip/api/stats`

### Base de Datos
```env
Host: localhost
Usuario: solucnet
Contraseña: SolucnetBot2024!
Base de Datos: solucnet_bot
Puerto: 3306
```

### Estructura de Archivos
```bash
/opt/solucnet-bot/          # Directorio principal
├── index.js                # Bot principal
├── public/index.html       # Interfaz web
├── logs/                   # Logs automáticos
├── images/                 # Imágenes de localidades
├── whatsapp-session/       # Sesión de WhatsApp
└── update.sh              # Script de actualización
```

## 🔧 Personalización

### Cambiar Configuración
```bash
# Editar variables de entorno
nano /opt/solucnet-bot/.env

# Editar configuración PM2
nano /opt/solucnet-bot/ecosystem.config.js

# Reiniciar después de cambios
solucnet-bot restart
```

### Agregar Localidades
```bash
# Agregar imagen de nueva localidad
cp nueva-localidad.jpg /opt/solucnet-bot/images/

# Editar código para incluir nueva localidad
nano /opt/solucnet-bot/index.js
# Buscar: localidadesDisponibles

# Reiniciar
solucnet-bot restart
```

## 🛠️ Solución de Problemas

### Bot No Inicia
```bash
# Ver logs detallados
solucnet-bot logs

# Verificar instalación
bash verify-installation.sh

# Reinstalar dependencias
cd /opt/solucnet-bot && npm install
```

### QR No Aparece
```bash
# Limpiar sesión de WhatsApp
rm -rf /opt/solucnet-bot/whatsapp-session
solucnet-bot restart

# Verificar Chrome
google-chrome --version
```

### Error de Base de Datos
```bash
# Verificar MySQL
systemctl status mysql

# Probar conexión
mysql -u solucnet -p solucnet_bot
```

## 📊 Monitoreo y Mantenimiento

### Verificaciones Regulares
```bash
# Estado general del sistema
bash verify-installation.sh

# Uso de recursos
htop

# Espacio en disco
df -h

# Estado de servicios
systemctl status nginx mysql pm2-root
```

### Actualizaciones
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Actualizar bot (si hay cambios)
cd /opt/solucnet-bot && ./update.sh

# Actualizar dependencias NPM
cd /opt/solucnet-bot && npm update
```

## 🎯 Características del Bot

### Funcionalidades Principales
- ✅ **Chat automático** con clientes
- ✅ **Consulta de base de datos** de clientes
- ✅ **Envío de imágenes** de localidades
- ✅ **Modo humano** para intervención manual
- ✅ **Panel web** para gestión
- ✅ **Logs completos** de conversaciones

### Comandos del Bot
- `#` - Reiniciar conversación
- `##` - Activar modo humano
- `1` - Usuarios registrados
- `2` - Nuevos servicios
- `3` - Reactivaciones
- `4` - Problemas con cédula

## 📞 Soporte

### Información para Soporte
```bash
# Generar reporte completo
cd /opt/solucnet-bot
tar -czf soporte-$(date +%Y%m%d).tar.gz \
  SYSTEM_INFO.txt \
  DEPLOYMENT_LOG.txt \
  logs/ \
  mensajes.log
```

### Logs Importantes
- `/opt/solucnet-bot/logs/pm2-combined.log` - Logs de la aplicación
- `/opt/solucnet-bot/mensajes.log` - Mensajes de WhatsApp
- `/var/log/nginx/solucnet-bot.access.log` - Accesos web

## 🎉 ¡Instalación Exitosa!

Si has seguido estos pasos, ahora tienes:

- ✅ **Bot de WhatsApp** completamente funcional
- ✅ **Panel web moderno** para gestión
- ✅ **Base de datos MySQL** configurada
- ✅ **Sistema seguro** con firewall
- ✅ **Monitoreo automático** con logs
- ✅ **Scripts de gestión** incluidos

**🌐 Accede a tu bot en**: `http://tu-servidor-ip/`

---

**SOLUCNET WhatsApp Bot v2.0** - Sistema completo de gestión de chats 🚀


