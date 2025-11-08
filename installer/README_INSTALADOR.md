# INSTALADOR ROOT COMPLETO FINAL - SOLUCNET BOT

## Descripción
Este es un instalador completo que requiere permisos de root para instalar el sistema SolucNet Bot con auto-inicio automático, monitoreo continuo, backup automático y recuperación de fallos.

## Características Principales

### 🚀 Auto-Inicio Completo
- **Servicio Principal**: Bot de WhatsApp con PM2
- **Servicio de Monitoreo**: Verificación cada 60 segundos
- **Servicio Watchdog**: Recuperación automática avanzada
- **Servicio de Backup**: Backups automáticos cada 6 horas

### 📊 Sistema de Monitoreo
- Verificación de procesos cada 30 segundos
- Monitoreo de recursos del sistema (CPU, memoria, disco)
- Recuperación automática en caso de fallos
- Reinicio del sistema si es necesario (última medida)

### 💾 Sistema de Backup
- Backup automático de base de datos MySQL
- Backup de archivos del proyecto
- Retención de 7 días
- Compresión automática
- Sistema de restauración

### 🔧 Instalación Automática
- Verificación de dependencias del sistema
- Configuración de MySQL con credenciales seguras
- Instalación de Node.js y PM2
- Configuración de firewall
- Creación de servicios systemd

## Requisitos del Sistema

### Hardware Mínimo
- CPU: 1 GHz
- RAM: 1 GB
- Disco: 2 GB libres

### Software
- Sistema operativo Linux (Ubuntu/Debian/CentOS/RHEL)
- Permisos de root/sudo

### Puertos Requeridos
- 3000 (Aplicación principal)
- 80 (HTTP - opcional)
- 443 (HTTPS - opcional)
- 22 (SSH)

## Instalación

### Método 1: Instalación Directa
```bash
# Descargar el instalador
wget https://tu-dominio.com/instalador_root_completo_final.sh

# Dar permisos de ejecución
chmod +x instalador_root_completo_final.sh

# Ejecutar instalación completa
sudo ./instalador_root_completo_final.sh
```

### Método 2: Instalación desde ZIP
```bash
# Descargar y extraer el ZIP
wget https://tu-dominio.com/solucnet-bot-installer.zip
unzip solucnet-bot-installer.zip

# Ejecutar instalador
cd solucnet-bot-installer
sudo ./instalador_root_completo_final.sh
```

## Comandos de Uso

### Después de la Instalación

#### Ver Estado del Sistema
```bash
sudo /opt/solucnet-bot/scripts/status.sh
```

#### Ver Logs en Tiempo Real
```bash
# Logs del sistema
sudo journalctl -u solucnet-bot.service -f

# Logs de PM2
pm2 logs solucnet-bot

# Logs de monitoreo
tail -f /var/log/solucnet-bot/monitor.log

# Logs del watchdog
tail -f /var/log/solucnet-bot/watchdog.log
```

#### Gestión de Servicios
```bash
# Reiniciar todos los servicios
sudo systemctl restart solucnet-bot.service

# Ver estado de servicios individuales
sudo systemctl status solucnet-bot.service
sudo systemctl status solucnet-bot-monitor.service
sudo systemctl status solucnet-bot-watchdog.service
```

#### Backup Manual
```bash
# Realizar backup inmediato
sudo /opt/solucnet-bot/scripts/backup.sh

# Listar backups disponibles
sudo /opt/solucnet-bot/scripts/restore.sh --list

# Restaurar base de datos
sudo /opt/solucnet-bot/scripts/restore.sh --database /opt/solucnet-bot_backup/databases/solucnet_auth_system_20241201_120000.sql.gz

# Restaurar archivos
sudo /opt/solucnet-bot/scripts/restore.sh --files /opt/solucnet-bot_backup/files/backup_files_20241201_120000.tar.gz
```

### Operaciones de Mantenimiento

#### Actualizar el Sistema
```bash
# Detener servicios
sudo systemctl stop solucnet-bot.service
sudo systemctl stop solucnet-bot-monitor.service
sudo systemctl stop solucnet-bot-watchdog.service

# Actualizar código (reemplazar archivos)
# ... copiar nuevos archivos ...

# Reiniciar servicios
sudo systemctl start solucnet-bot.service
sudo systemctl start solucnet-bot-monitor.service
sudo systemctl start solucnet-bot-watchdog.service
```

#### Desinstalación Completa
```bash
sudo /opt/solucnet-bot/scripts/uninstall.sh
```

## Estructura de Archivos

```
/opt/solucnet-bot/                    # Directorio principal
├── scripts/                           # Scripts del sistema
│   ├── start.sh                       # Inicio del servicio
│   ├── stop.sh                        # Parada del servicio
│   ├── restart.sh                     # Reinicio del servicio
│   ├── status.sh                      # Estado del sistema
│   ├── monitor.sh                     # Monitoreo avanzado
│   ├── watchdog.sh                    # Watchdog con recuperación
│   ├── backup.sh                      # Backup automático
│   ├── restore.sh                     # Restauración
│   └── uninstall.sh                   # Desinstalación
├── uploads/                           # Archivos subidos
├── images/                            # Imágenes del sistema
│   └── users/                         # Avatares de usuarios
├── .wwebjs_auth/                      # Sesión de WhatsApp
├── backup/                            # Backups locales
├── CREDENCIALES.txt                   # Credenciales generadas
├── .env                               # Variables de entorno
├── ecosystem.config.js                # Configuración PM2
├── package.json                       # Dependencias Node.js
└── index.js                           # Aplicación principal

/var/log/solucnet-bot/                 # Logs del sistema
├── install.log                        # Log de instalación
├── error.log                          # Errores del sistema
├── monitor.log                        # Log del monitoreo
├── watchdog.log                       # Log del watchdog
├── backup.log                         # Log de backups
├── system.log                         # Log general del sistema
└── archive/                           # Logs rotados

/opt/solucnet-bot_monitor/             # Datos de monitoreo
└── data/
    └── metrics.csv                    # Métricas del sistema

/opt/solucnet-bot_backup/              # Backups automáticos
├── databases/                         # Backups de MySQL
└── files/                            # Backups de archivos
```

## Configuración de Servicios

### Servicios Systemd Creados

1. **solucnet-bot.service** - Servicio principal
   - Gestiona la aplicación Node.js con PM2
   - Reinicio automático en caso de fallos
   - Dependencia de MySQL

2. **solucnet-bot-monitor.service** - Servicio de monitoreo
   - Verifica estado cada 60 segundos
   - Recolecta métricas del sistema
   - Reinicia servicios si es necesario

3. **solucnet-bot-watchdog.service** - Watchdog avanzado
   - Monitoreo continuo cada 30 segundos
   - Recuperación automática de fallos
   - Reinicio del sistema si es necesario

4. **solucnet-bot-backup.service** - Servicio de backup
   - Backup automático de BD y archivos
   - Compresión y rotación de backups

5. **solucnet-bot-backup.timer** - Timer de backup
   - Ejecuta backup cada 6 horas
   - Inicia 5 minutos después del arranque

## Seguridad Implementada

### Credenciales Seguras
- Contraseñas aleatorias generadas automáticamente
- Archivo de credenciales con permisos 600
- Separación de usuarios de base de datos

### Firewall
- Configuración automática de UFW/Firewalld
- Puertos esenciales abiertos
- Reglas de seguridad por defecto

### Permisos del Sistema
- Usuario root para servicios críticos
- Permisos restrictivos en directorios
- Logs con permisos adecuados

## Solución de Problemas

### El Servicio No Inicia
```bash
# Verificar estado del servicio
sudo systemctl status solucnet-bot.service

# Ver logs detallados
sudo journalctl -u solucnet-bot.service -f

# Verificar PM2
pm2 status
pm2 logs solucnet-bot
```

### Problemas de Base de Datos
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Ver logs de MySQL
sudo tail -f /var/log/mysql/error.log

# Reiniciar MySQL
sudo systemctl restart mysql
```

### Problemas de Espacio en Disco
```bash
# Verificar uso de disco
df -h

# Limpiar logs antiguos
sudo find /var/log/solucnet-bot -name "*.log" -mtime +7 -delete

# Limpiar backups antiguos
sudo find /opt/solucnet-bot_backup -mtime +7 -delete
```

### Recuperación de Emergencia
Si el sistema no responde, el watchdog automáticamente:
1. Detiene todos los procesos
2. Limpia cachés y sesiones
3. Reinicia servicios
4. Verifica recuperación
5. Reinicia el sistema si es necesario

## Soporte y Contacto

Para soporte técnico o reportar problemas:
- Crear issue en el repositorio
- Revisar logs en `/var/log/solucnet-bot/`
- Ejecutar `sudo /opt/solucnet-bot/scripts/status.sh` para diagnóstico

## Changelog

### Versión 3.0 - Root Complete Final
- ✅ Instalador completo con permisos root
- ✅ Auto-inicio automático con systemd
- ✅ Sistema de monitoreo avanzado
- ✅ Watchdog con recuperación automática
- ✅ Backup automático y restauración
- ✅ Paquetes ZIP para distribución
- ✅ Configuración de firewall automática
- ✅ Logs rotativos y compresión
- ✅ Métricas del sistema en tiempo real

---

**¡Importante!** Después de la instalación, cambia las contraseñas por defecto y configura las notificaciones de email si es necesario.
