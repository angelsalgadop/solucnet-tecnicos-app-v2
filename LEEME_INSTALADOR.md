# 🚀 Instalador Automático WhatsApp Chatbot - Ubuntu

## 📋 INSTRUCCIONES RÁPIDAS

### Opción 1: Auto-Instalación (RECOMENDADO)
```bash
# 1. Extraer el ZIP
unzip whatsapp-chatbot-installer-complete.zip
cd whatsapp-chatbot-installer-complete/

# 2. Ejecutar auto-instalador
sudo ./auto_install.sh
```

### Opción 2: Instalación Manual
```bash
# 1. Dar permisos
chmod +x install_ubuntu.sh

# 2. Ejecutar
sudo ./install_ubuntu.sh
```

## ✅ Después de la Instalación

### Verificar que todo funciona:
```bash
sudo ./test_installation.sh
```

### Acceder a la aplicación:
- **Local**: http://localhost:3000
- **Red**: http://IP_DEL_SERVIDOR:3000

## 🔧 Comandos Útiles

```bash
# Ver estado del servicio
sudo systemctl status whatsapp-chatbot.service

# Reiniciar aplicación
sudo systemctl restart whatsapp-chatbot.service

# Ver logs en tiempo real
sudo journalctl -u whatsapp-chatbot.service -f

# Listar procesos PM2
pm2 list
```

## 🆘 Problemas Comunes

**La aplicación no inicia:**
```bash
sudo journalctl -u whatsapp-chatbot.service -n 20
```

**Puerto no disponible:**
```bash
sudo netstat -tlnp | grep 3000
```

**Reinstalar:**
```bash
sudo systemctl stop whatsapp-chatbot.service
sudo ./install_ubuntu.sh
```

## 📞 Soporte

Todos los logs de instalación se guardan en `/var/log/whatsapp-chatbot-install.log`

---

**¡El sistema incluye auto-recuperación y monitoreo automático!**