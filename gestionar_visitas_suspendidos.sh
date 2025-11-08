#!/bin/bash
# Script de gestión del sistema de visitas automáticas

SCRIPT_PATH="/root/whatsapp-chatbot/montar_visitas_suspendidos.js"
LOG_PATH="/root/whatsapp-chatbot/logs/visitas_automaticas.log"

mostrar_menu() {
    clear
    echo "═══════════════════════════════════════════════════════════════"
    echo "🤖 GESTIÓN DE VISITAS AUTOMÁTICAS - CLIENTES SUSPENDIDOS"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "  1) 🚀 Ejecutar manualmente ahora"
    echo "  2) 📊 Ver últimas visitas creadas"
    echo "  3) 📋 Ver estadísticas"
    echo "  4) 📜 Ver log del día"
    echo "  5) 📜 Ver últimas 50 líneas del log"
    echo "  6) 🗑️  Limpiar logs"
    echo "  7) ⏰ Ver estado del cron job"
    echo "  8) 🔧 Reinstalar cron job"
    echo "  9) ❌ Desinstalar cron job"
    echo "  0) 🚪 Salir"
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo -n "Selecciona una opción: "
}

ejecutar_ahora() {
    echo ""
    echo "🚀 Ejecutando script de visitas automáticas..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    node "$SCRIPT_PATH"
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

ver_ultimas_visitas() {
    echo ""
    echo "📊 ÚLTIMAS 10 VISITAS DE RETIRO CREADAS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    mysql -u debian-sys-maint -p'IOHcXunF7795fMRI' solucnet_auth_system -t -e "
        SELECT
            id as 'ID',
            cliente_nombre as 'Cliente',
            cliente_cedula as 'Cédula',
            LEFT(motivo_visita, 40) as 'Motivo',
            estado as 'Estado',
            DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i') as 'Creada'
        FROM visitas_tecnicas
        WHERE motivo_visita LIKE '%Retiro%'
        ORDER BY id DESC
        LIMIT 10;
    " 2>/dev/null
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

ver_estadisticas() {
    echo ""
    echo "📊 ESTADÍSTICAS DE VISITAS AUTOMÁTICAS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Total de visitas de retiro
    total=$(mysql -u debian-sys-maint -p'IOHcXunF7795fMRI' solucnet_auth_system -Nse "
        SELECT COUNT(*) FROM visitas_tecnicas WHERE motivo_visita LIKE '%Retiro%';
    " 2>/dev/null)

    # Por estado
    programadas=$(mysql -u debian-sys-maint -p'IOHcXunF7795fMRI' solucnet_auth_system -Nse "
        SELECT COUNT(*) FROM visitas_tecnicas WHERE motivo_visita LIKE '%Retiro%' AND estado = 'programada';
    " 2>/dev/null)

    asignadas=$(mysql -u debian-sys-maint -p'IOHcXunF7795fMRI' solucnet_auth_system -Nse "
        SELECT COUNT(*) FROM visitas_tecnicas WHERE motivo_visita LIKE '%Retiro%' AND estado = 'asignada';
    " 2>/dev/null)

    en_progreso=$(mysql -u debian-sys-maint -p'IOHcXunF7795fMRI' solucnet_auth_system -Nse "
        SELECT COUNT(*) FROM visitas_tecnicas WHERE motivo_visita LIKE '%Retiro%' AND estado = 'en_progreso';
    " 2>/dev/null)

    completadas=$(mysql -u debian-sys-maint -p'IOHcXunF7795fMRI' solucnet_auth_system -Nse "
        SELECT COUNT(*) FROM visitas_tecnicas WHERE motivo_visita LIKE '%Retiro%' AND estado = 'completada';
    " 2>/dev/null)

    echo "  📋 Total visitas de retiro: $total"
    echo ""
    echo "  Estado:"
    echo "    • Programadas:   $programadas"
    echo "    • Asignadas:     $asignadas"
    echo "    • En progreso:   $en_progreso"
    echo "    • Completadas:   $completadas"
    echo ""
    echo "  Creadas hoy:"

    mysql -u debian-sys-maint -p'IOHcXunF7795fMRI' solucnet_auth_system -t -e "
        SELECT
            estado as 'Estado',
            COUNT(*) as 'Cantidad'
        FROM visitas_tecnicas
        WHERE motivo_visita LIKE '%Retiro%'
        AND DATE(fecha_creacion) = CURDATE()
        GROUP BY estado;
    " 2>/dev/null

    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

ver_log_dia() {
    echo ""
    echo "📜 LOG DEL DÍA"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ -f "$LOG_PATH" ]; then
        grep "$(date +%Y-%m-%d)" "$LOG_PATH" 2>/dev/null || echo "No hay registros para hoy."
    else
        echo "⚠️  No existe el archivo de log."
    fi
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

ver_ultimas_lineas() {
    echo ""
    echo "📜 ÚLTIMAS 50 LÍNEAS DEL LOG"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ -f "$LOG_PATH" ]; then
        tail -n 50 "$LOG_PATH"
    else
        echo "⚠️  No existe el archivo de log."
    fi
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

limpiar_logs() {
    echo ""
    echo "🗑️  ¿Estás seguro de que deseas limpiar los logs? (s/n): "
    read -r respuesta
    if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
        > "$LOG_PATH"
        echo "✅ Logs limpiados exitosamente."
    else
        echo "❌ Operación cancelada."
    fi
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

ver_estado_cron() {
    echo ""
    echo "⏰ ESTADO DEL CRON JOB"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
        echo "✅ El cron job está ACTIVO"
        echo ""
        echo "Configuración actual:"
        crontab -l 2>/dev/null | grep "$SCRIPT_PATH"
        echo ""
        echo "Próxima ejecución programada: Todos los días a las 6:00 AM"
    else
        echo "❌ El cron job NO está instalado"
        echo ""
        echo "Usa la opción 8 para reinstalarlo."
    fi
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

reinstalar_cron() {
    echo ""
    echo "🔧 Reinstalando cron job..."
    /root/whatsapp-chatbot/instalar_cron_visitas.sh
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

desinstalar_cron() {
    echo ""
    echo "❌ ¿Estás seguro de que deseas desinstalar el cron job? (s/n): "
    read -r respuesta
    if [ "$respuesta" = "s" ] || [ "$respuesta" = "S" ]; then
        crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" | crontab -
        echo "✅ Cron job desinstalado exitosamente."
    else
        echo "❌ Operación cancelada."
    fi
    echo ""
    echo "Presiona ENTER para continuar..."
    read
}

# Bucle principal
while true; do
    mostrar_menu
    read -r opcion

    case $opcion in
        1) ejecutar_ahora ;;
        2) ver_ultimas_visitas ;;
        3) ver_estadisticas ;;
        4) ver_log_dia ;;
        5) ver_ultimas_lineas ;;
        6) limpiar_logs ;;
        7) ver_estado_cron ;;
        8) reinstalar_cron ;;
        9) desinstalar_cron ;;
        0)
            echo ""
            echo "👋 Saliendo..."
            exit 0
            ;;
        *)
            echo ""
            echo "❌ Opción inválida. Presiona ENTER para continuar..."
            read
            ;;
    esac
done
