#!/bin/bash

# Script para instalar el auto-inicio del chatbot
# Configura systemd, crontab y PM2 para reinicio automático

CHATBOT_DIR="/root/whatsapp-chatbot"
SERVICE_NAME="whatsapp-chatbot"

echo "🚀 Configurando auto-inicio del chatbot WhatsApp..."

# Hacer los scripts ejecutables
chmod +x "$CHATBOT_DIR/scripts/auto-monitor.sh"
chmod +x "$CHATBOT_DIR/scripts/system-startup.sh"

# 1. Crear servicio systemd para inicio automático del sistema
echo "📝 Creando servicio systemd..."

cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=WhatsApp Chatbot Service
After=network.target
Wants=network-online.target

[Service]
Type=forking
User=root
WorkingDirectory=$CHATBOT_DIR
ExecStart=$CHATBOT_DIR/scripts/system-startup.sh
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar el servicio
systemctl daemon-reload
systemctl enable "$SERVICE_NAME.service"

echo "✓ Servicio systemd creado y habilitado"

# 2. Configurar crontab para monitoreo continuo
echo "📝 Configurando monitoreo automático con crontab..."

# Eliminar entradas previas del crontab
crontab -l 2>/dev/null | grep -v "auto-monitor.sh" | crontab -

# Agregar nueva entrada para monitoreo cada minuto
(crontab -l 2>/dev/null; echo "* * * * * $CHATBOT_DIR/scripts/auto-monitor.sh") | crontab -

echo "✓ Crontab configurado para monitoreo cada minuto"

# 3. Configurar PM2 para inicio automático
echo "📝 Configurando PM2 startup..."

# Configurar PM2 startup para el usuario root
pm2 startup systemd -u root --hp /root

# Verificar que existe el proceso del chatbot y guardarlo
cd "$CHATBOT_DIR"

# Si no está funcionando, iniciarlo
if ! pm2 list | grep -q "whatsapp-bot.*online"; then
    echo "Iniciando chatbot para configurar PM2..."
    pm2 start ecosystem.config.js
    sleep 5
fi

# Guardar configuración actual de PM2
pm2 save

echo "✓ PM2 startup configurado"

# 4. Crear script de verificación manual
cat > "$CHATBOT_DIR/scripts/check-status.sh" << 'EOF'
#!/bin/bash

echo "=== ESTADO DEL CHATBOT WHATSAPP ==="
echo ""

echo "1. Estado del servicio systemd:"
systemctl status whatsapp-chatbot --no-pager -l

echo ""
echo "2. Estado de PM2:"
pm2 status

echo ""
echo "3. Verificación del puerto 3000:"
if curl -s -f http://localhost:3000 > /dev/null; then
    echo "✓ Puerto 3000 respondiendo correctamente"
else
    echo "✗ Puerto 3000 no responde"
fi

echo ""
echo "4. Procesos relacionados:"
ps aux | grep -E "(node|pm2)" | grep -v grep

echo ""
echo "5. Últimas 10 líneas del log de monitoreo:"
if [ -f "/root/whatsapp-chatbot/logs/monitor.log" ]; then
    tail -10 /root/whatsapp-chatbot/logs/monitor.log
else
    echo "Log de monitoreo no encontrado"
fi

echo ""
echo "6. Crontab configurado:"
crontab -l | grep auto-monitor
EOF

chmod +x "$CHATBOT_DIR/scripts/check-status.sh"

# 5. Crear script de reinicio manual
cat > "$CHATBOT_DIR/scripts/manual-restart.sh" << EOF
#!/bin/bash

echo "🔄 Reiniciando chatbot manualmente..."

# Detener servicio systemd si está funcionando
systemctl stop whatsapp-chatbot

# Detener PM2
pm2 stop all
pm2 delete all

sleep 5

# Navegar al directorio
cd "$CHATBOT_DIR"

# Iniciar con PM2
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

sleep 5

# Verificar estado
if pm2 list | grep -q "whatsapp-bot.*online"; then
    echo "✓ Chatbot reiniciado correctamente"
else
    echo "✗ Error al reiniciar el chatbot"
    pm2 logs whatsapp-bot
fi
EOF

chmod +x "$CHATBOT_DIR/scripts/manual-restart.sh"

echo ""
echo "🎉 CONFIGURACIÓN COMPLETADA"
echo ""
echo "El chatbot ahora se iniciará automáticamente cuando:"
echo "  ✓ Se reinicie el sistema (systemd)"
echo "  ✓ Se detecten errores (crontab + monitoreo)"
echo "  ✓ Se caiga el proceso (PM2 autorestart)"
echo ""
echo "Scripts disponibles:"
echo "  - Verificar estado: $CHATBOT_DIR/scripts/check-status.sh"
echo "  - Reinicio manual: $CHATBOT_DIR/scripts/manual-restart.sh"
echo "  - Logs: $CHATBOT_DIR/logs/"
echo ""
echo "Para probar el auto-inicio, puedes:"
echo "  1. Reiniciar el sistema: sudo reboot"
echo "  2. Simular error: pm2 stop whatsapp-bot"
echo "  3. Verificar estado: $CHATBOT_DIR/scripts/check-status.sh"
echo ""