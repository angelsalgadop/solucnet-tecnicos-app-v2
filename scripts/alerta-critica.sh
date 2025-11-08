#!/bin/bash
# Script que registra alertas críticas en un log especial

ALERT_LOG="/root/whatsapp-chatbot/logs/alertas-criticas.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Crear log si no existe
touch "$ALERT_LOG"

# Función para registrar alerta
registrar_alerta() {
    local tipo="$1"
    local mensaje="$2"
    local cpu="$3"
    local mem="$4"

    echo "[$TIMESTAMP] 🚨 ALERTA CRÍTICA: $tipo" >> "$ALERT_LOG"
    echo "  Mensaje: $mensaje" >> "$ALERT_LOG"
    echo "  CPU: ${cpu}% | Memoria: ${mem}%" >> "$ALERT_LOG"
    echo "  PID: $(pm2 jlist | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | head -1)" >> "$ALERT_LOG"
    echo "  Acción: Reinicio automático activado" >> "$ALERT_LOG"
    echo "  ─────────────────────────────────────" >> "$ALERT_LOG"
}

# Obtener datos actuales
PID=$(pm2 jlist | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ -z "$PID" ] || [ "$PID" = "0" ]; then
    registrar_alerta "PROCESO_CAIDO" "El proceso solucnet-bot no está corriendo" "N/A" "N/A"
    exit 1
fi

CPU=$(ps -p "$PID" -o %cpu --no-headers 2>/dev/null | awk '{printf "%.0f", $1}')
MEM=$(ps -p "$PID" -o %mem --no-headers 2>/dev/null | awk '{printf "%.0f", $1}')

# Verificar umbrales
if [ "$CPU" -ge 95 ]; then
    registrar_alerta "CPU_CRITICA" "CPU excesiva detectada" "$CPU" "$MEM"
elif [ "$CPU" -ge 85 ]; then
    registrar_alerta "CPU_ALTA" "CPU alta sostenida" "$CPU" "$MEM"
fi

if [ "$MEM" -ge 80 ]; then
    registrar_alerta "MEMORIA_ALTA" "Memoria alta detectada" "$CPU" "$MEM"
fi

# Mantener solo las últimas 100 alertas
if [ -f "$ALERT_LOG" ]; then
    LINES=$(wc -l < "$ALERT_LOG")
    if [ "$LINES" -gt 600 ]; then
        tail -600 "$ALERT_LOG" > "${ALERT_LOG}.tmp"
        mv "${ALERT_LOG}.tmp" "$ALERT_LOG"
    fi
fi

exit 0
