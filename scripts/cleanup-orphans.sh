#!/bin/bash

# Script para limpiar procesos huérfanos de Node.js antes de iniciar el bot
# Este script mata cualquier proceso de node que esté ejecutando index.js
# excepto los procesos de PM2

echo "🧹 Iniciando limpieza de procesos huérfanos..."

# Obtener el PID del proceso PM2 actual (si existe)
PM2_PID=$(pm2 jlist | grep -A 20 "solucnet-bot" | grep '"pid"' | awk '{print $2}' | tr -d ',')

# Buscar todos los procesos node que ejecutan index.js (pero NO los de PM2 con la ruta completa)
ORPHAN_PIDS=$(ps aux | grep "node.*index.js" | grep -v "node /root/whatsapp-chatbot/index.js" | grep -v grep | awk '{print $2}')

if [ -z "$ORPHAN_PIDS" ]; then
  echo "✅ No se encontraron procesos huérfanos"
else
  echo "⚠️  Procesos huérfanos encontrados:"
  ps aux | grep "node.*index.js" | grep -v "node /root/whatsapp-chatbot/index.js" | grep -v grep

  for PID in $ORPHAN_PIDS; do
    # Verificar que el PID no sea el del PM2 actual
    if [ "$PID" != "$PM2_PID" ]; then
      echo "🔪 Matando proceso huérfano: $PID"
      kill -9 $PID 2>/dev/null
    fi
  done
  echo "✅ Procesos huérfanos eliminados"
fi

# Limpiar archivos de bloqueo de Chrome/Puppeteer
LOCK_FILE="/root/whatsapp-chatbot/.wwebjs_auth/session-whatsapp-bot-session/SingletonLock"
if [ -f "$LOCK_FILE" ]; then
  echo "🔓 Eliminando archivo de bloqueo: $LOCK_FILE"
  rm -f "$LOCK_FILE"
fi

# Verificar si el puerto 3000 está libre
PORT_IN_USE=$(lsof -i :3000 -t 2>/dev/null)
if [ ! -z "$PORT_IN_USE" ]; then
  echo "⚠️  Puerto 3000 en uso por proceso: $PORT_IN_USE"
  # Si no es el proceso de PM2, matarlo
  if [ "$PORT_IN_USE" != "$PM2_PID" ]; then
    echo "🔪 Matando proceso en puerto 3000: $PORT_IN_USE"
    kill -9 $PORT_IN_USE 2>/dev/null
  fi
fi

echo "✨ Limpieza completada"
exit 0
