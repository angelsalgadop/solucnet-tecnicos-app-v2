# 🚀 GUÍA COMPLETA DE INSTALACIÓN - WhatsApp Bot SolucNet

## 📋 ÍNDICE
1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación Automática](#instalación-automática)
3. [Instalación Manual](#instalación-manual)
4. [Configuración](#configuración)
5. [Verificación](#verificación)
6. [Solución de Problemas](#solución-de-problemas)
7. [Mantenimiento](#mantenimiento)

---

## 📊 REQUISITOS DEL SISTEMA

### Sistema Operativo Soportado
- **Ubuntu 18.04 LTS o superior**
- **Debian 10 o superior**
- **CentOS 8 o superior** (requiere ajustes manuales)

### Especificaciones Mínimas
- **RAM**: 2GB mínimo, 4GB recomendado
- **Almacenamiento**: 10GB libres mínimo
- **CPU**: 1 core mínimo, 2 cores recomendado
- **Red**: Conexión estable a internet

### Puertos Requeridos
- **80**: HTTP
- **443**: HTTPS
- **3306**: MySQL
- **22**: SSH (administración)

---

## 🎯 INSTALACIÓN AUTOMÁTICA (RECOMENDADA)

### Paso 1: Descargar el Proyecto
```bash
# Clonar o descargar el proyecto al directorio correcto
cd /root
git clone [URL_DEL_REPOSITORIO] whatsapp-chatbot
# O mover los archivos existentes a /root/whatsapp-chatbot

cd whatsapp-chatbot
```

### Paso 2: Ejecutar Script de Instalación
```bash
# Hacer ejecutable el script de instalación
chmod +x install.sh

# Ejecutar instalación automática
sudo ./install.sh
```

### Paso 3: Configurar Entorno
```bash
# Configurar variables de entorno y servicios adicionales
chmod +x configure-environment.sh
sudo ./configure-environment.sh
```

### Paso 4: Verificar Instalación
```bash
# Verificar que todo esté instalado correctamente
chmod +x check-dependencies.sh
./check-dependencies.sh
```

¡Listo! Tu bot debe estar funcionando. Salta a la sección [Verificación](#verificación).

---

## 🔧 INSTALACIÓN MANUAL

Si prefieres instalar paso a paso o el script automático falló:

### 1. Actualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y curl wget git build-essential python3 python3-pip \
                    sqlite3 mysql-client mysql-server nginx ufw htop \
                    nano unzip cron systemd ca-certificates gnupg lsb-release
```

### 2. Instalar Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node -v
npm -v
```

### 3. Instalar PM2
```bash
sudo npm install -g pm2

# Configurar PM2 para inicio automático
sudo pm2 startup systemd -u root --hp /root
sudo pm2 save
```

### 4. Configurar MySQL
```bash
sudo systemctl start mysql
sudo systemctl enable mysql

# Crear base de datos (opcional si ya existe)
sudo mysql -e "CREATE DATABASE IF NOT EXISTS solucnet_auth_system;"
```

### 5. Configurar Aplicación
```bash
cd /root/whatsapp-chatbot

# Instalar dependencias
npm install

# Crear directorios necesarios
mkdir -p logs uploads/fotos_reportes .wwebjs_auth

# Configurar permisos
chmod +x keep-alive.sh auto-monitor.sh
chmod 755 logs uploads
```

### 6. Configurar Servicio Systemd
```bash
sudo tee /etc/systemd/system/whatsapp-bot.service > /dev/null <<EOF
[Unit]
Description=WhatsApp Chatbot Solucnet
After=network.target mysql.service
Wants=network.target

[Service]
Type=forking
User=root
WorkingDirectory=/root/whatsapp-chatbot
ExecStart=/root/whatsapp-chatbot/keep-alive.sh start
ExecStop=/root/whatsapp-chatbot/keep-alive.sh stop
ExecReload=/root/whatsapp-chatbot/keep-alive.sh restart
Restart=always
RestartSec=10
PIDFile=/tmp/whatsapp-bot.lock

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable whatsapp-bot
```

### 7. Configurar Crontab
```bash
# Agregar monitoreo automático cada 2 minutos
(crontab -l 2>/dev/null; echo "*/2 * * * * /root/whatsapp-chatbot/keep-alive.sh monitor >> /root/whatsapp-chatbot/logs/cron.log 2>&1") | crontab -
```

### 8. Configurar Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno
Edita el archivo `.env` para configurar la conexión a la base de datos:

```bash
nano .env
```

Contenido típico del archivo `.env`:
```env
# Base de datos
DB_SYSTEM_HOST=localhost
DB_SYSTEM_PORT=3306
DB_SYSTEM_DATABASE=solucnet_auth_system
DB_SYSTEM_USER=debian-sys-maint
DB_SYSTEM_PASSWORD=TU_PASSWORD_MYSQL

# Servidor
HTTPS_PORT=443
HTTP_PORT=80
NODE_ENV=production
```

### Configuración de PM2 (Opcional)
Si quieres usar PM2 en lugar del script keep-alive:

```bash
# Iniciar con PM2
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save
```

---

## ✅ VERIFICACIÓN

### 1. Verificar Servicios
```bash
# Estado del bot
./keep-alive.sh status

# Estado del servicio systemd
sudo systemctl status whatsapp-bot

# Verificar procesos
ps aux | grep node | grep -v grep

# Estado completo del sistema
./system-status.sh
```

### 2. Verificar Logs
```bash
# Logs del bot en tiempo real
tail -f logs/bot-output.log

# Logs de monitoreo
tail -f logs/keep-alive.log

# Logs del sistema
tail -f logs/cron.log
```

### 3. Verificar Puertos
```bash
# Verificar puertos abiertos
netstat -tuln | grep -E ":(80|443|3306) "

# O usar ss
ss -tuln | grep -E ":(80|443|3306) "
```

### 4. Verificar Base de Datos
```bash
# Conectar a MySQL
mysql -u debian-sys-maint -p

# Dentro de MySQL:
SHOW DATABASES;
USE solucnet_auth_system;
SHOW TABLES;
```

---

## 🚀 COMANDOS ÚTILES

### Gestión del Bot
```bash
./keep-alive.sh start      # Iniciar bot
./keep-alive.sh stop       # Detener bot
./keep-alive.sh restart    # Reiniciar bot
./keep-alive.sh status     # Ver estado
./keep-alive.sh monitor    # Monitoreo manual
```

### Gestión del Servicio
```bash
sudo systemctl start whatsapp-bot      # Iniciar servicio
sudo systemctl stop whatsapp-bot       # Detener servicio
sudo systemctl restart whatsapp-bot    # Reiniciar servicio
sudo systemctl status whatsapp-bot     # Ver estado
```

### Logs y Monitoreo
```bash
./system-status.sh              # Estado completo del sistema
./check-dependencies.sh         # Verificar dependencias
./cleanup-logs.sh              # Limpiar logs antiguos
./monitor-resources.sh         # Monitoreo de recursos
./backup.sh                    # Crear backup manual
```

### PM2 (Si está configurado)
```bash
pm2 list                       # Listar procesos
pm2 logs solucnet-bot          # Ver logs
pm2 restart solucnet-bot       # Reiniciar
pm2 stop solucnet-bot          # Detener
pm2 monit                      # Monitor en tiempo real
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Problema: El bot no inicia
```bash
# Verificar logs de error
tail -50 logs/bot-output.log

# Verificar dependencias
./check-dependencies.sh

# Verificar permisos
ls -la keep-alive.sh

# Reinstalar dependencias
npm install
```

### Problema: Error de base de datos
```bash
# Verificar conexión a MySQL
mysql -u debian-sys-maint -p -e "SHOW DATABASES;"

# Verificar archivo .env
cat .env | grep DB_

# Obtener contraseña del sistema MySQL
sudo cat /etc/mysql/debian.cnf | grep password
```

### Problema: Puerto ocupado
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :443
sudo lsof -i :80

# Matar proceso si es necesario
sudo kill -9 PID_DEL_PROCESO
```

### Problema: Certificados SSL
```bash
# Verificar certificados
ls -la ssl/

# Recrear certificados autofirmados
./configure-environment.sh

# Para certificados válidos con Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### Problema: Permisos
```bash
# Corregir permisos de archivos
sudo chown -R root:root /root/whatsapp-chatbot
sudo chmod +x /root/whatsapp-chatbot/*.sh
sudo chmod 600 /root/whatsapp-chatbot/.env
```

### Problema: Crontab no funciona
```bash
# Verificar crontab
crontab -l

# Ver logs de cron
tail -f /var/log/cron.log

# Reinstalar crontab
./configure-environment.sh
```

---

## 🔄 MANTENIMIENTO

### Actualización del Sistema
```bash
# Actualizar paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Reiniciar servicios si es necesario
sudo systemctl restart whatsapp-bot
```

### Actualización de Node.js
```bash
# Verificar versión actual
node -v

# Actualizar Node.js (si es necesario)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Limpieza Regular
```bash
# Limpiar logs automáticamente
./cleanup-logs.sh

# Limpiar archivos temporales
sudo apt autoremove -y
sudo apt autoclean
```

### Backup y Restauración
```bash
# Crear backup manual
./backup.sh

# Ubicación de backups
ls -la /root/backups/whatsapp-bot/

# Restaurar desde backup (ejemplo)
# tar -xzf /root/backups/whatsapp-bot/config_TIMESTAMP.tar.gz
# mysql solucnet_auth_system < /root/backups/whatsapp-bot/database_TIMESTAMP.sql
```

### Monitoreo de Rendimiento
```bash
# Ver uso de recursos
htop

# Estadísticas del bot
./system-status.sh

# Logs de recursos
tail -f logs/resources.log

# Alertas del sistema
tail -f logs/alerts.log
```

---

## 🆘 SOPORTE Y CONTACTO

### Logs Importantes
- **Bot**: `logs/bot-output.log`
- **Errores**: `logs/err.log`
- **Sistema**: `logs/keep-alive.log`
- **Cron**: `logs/cron.log`
- **Recursos**: `logs/resources.log`
- **Alertas**: `logs/alerts.log`

### Información del Sistema
```bash
# Información completa para soporte
./system-status.sh > system-info.txt
./check-dependencies.sh >> system-info.txt
uname -a >> system-info.txt
cat /etc/os-release >> system-info.txt
```

### Scripts de Diagnóstico
```bash
# Verificación completa
./check-dependencies.sh

# Estado del sistema
./system-status.sh

# Monitoreo de recursos
./monitor-resources.sh
```

---

## 📚 ARCHIVOS INCLUIDOS

| Archivo | Descripción |
|---------|-------------|
| `install.sh` | Script principal de instalación |
| `configure-environment.sh` | Configuración del entorno |
| `check-dependencies.sh` | Verificación de dependencias |
| `keep-alive.sh` | Gestión del proceso del bot |
| `auto-monitor.sh` | Monitoreo automático |
| `system-status.sh` | Estado completo del sistema |
| `cleanup-logs.sh` | Limpieza de logs |
| `backup.sh` | Script de backup |
| `monitor-resources.sh` | Monitoreo de recursos |
| `ecosystem.config.js` | Configuración de PM2 |
| `.env` | Variables de entorno |

---

**¡Tu WhatsApp Bot SolucNet está listo para funcionar 24/7!** 🎉

Para cualquier problema, revisa los logs y utiliza los scripts de diagnóstico incluidos.