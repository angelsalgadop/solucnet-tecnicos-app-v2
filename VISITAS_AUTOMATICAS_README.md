# 🤖 Sistema Automático de Visitas para Clientes Suspendidos

## 📋 Descripción

Este sistema automatizado identifica clientes suspendidos por más de 1 mes (30 días) y crea automáticamente visitas técnicas para retiro de equipo en el sistema de gestión de visitas.

## ✨ Características

- ✅ **Detección Automática**: Identifica clientes suspendidos hace más de 30 días
- ✅ **Prevención de Duplicados**: Verifica que no existan visitas de retiro ya creadas
- ✅ **Multi-Base de Datos**: Consulta 3 bases de datos simultáneamente:
  - 192.168.99.50 (BD Principal)
  - 192.168.99.11 (BD Secundaria)
  - 192.168.99.2 (BD Terciaria)
- ✅ **Observaciones Automáticas**: Genera notas detalladas con:
  - Días de morosidad
  - Meses calculados
  - Deuda total
  - Número de facturas pendientes
  - Primera factura vencida
  - Base de datos de origen
- ✅ **Ejecución Programada**: Cron job diario a las 6:00 AM
- ✅ **Logs Detallados**: Registro completo de todas las operaciones

## 📁 Archivos del Sistema

```
/root/whatsapp-chatbot/
├── montar_visitas_suspendidos.js       # Script principal
├── instalar_cron_visitas.sh            # Instalador de cron job
├── gestionar_visitas_suspendidos.sh    # Interfaz de gestión
└── logs/
    └── visitas_automaticas.log         # Registro de ejecuciones
```

## 🚀 Uso

### Ejecución Manual

Para ejecutar el script manualmente:

```bash
node /root/whatsapp-chatbot/montar_visitas_suspendidos.js
```

### Interfaz de Gestión

Para acceder a la interfaz de gestión interactiva:

```bash
/root/whatsapp-chatbot/gestionar_visitas_suspendidos.sh
```

La interfaz ofrece las siguientes opciones:

1. 🚀 **Ejecutar manualmente ahora** - Ejecuta el script inmediatamente
2. 📊 **Ver últimas visitas creadas** - Muestra las 10 visitas más recientes
3. 📋 **Ver estadísticas** - Estadísticas de visitas por estado
4. 📜 **Ver log del día** - Muestra registros del día actual
5. 📜 **Ver últimas 50 líneas del log** - Tail del archivo de log
6. 🗑️ **Limpiar logs** - Limpia el archivo de registro
7. ⏰ **Ver estado del cron job** - Verifica si el cron está activo
8. 🔧 **Reinstalar cron job** - Reinstala la tarea programada
9. ❌ **Desinstalar cron job** - Elimina la tarea programada

### Instalación del Cron Job

Para instalar o reinstalar el cron job:

```bash
/root/whatsapp-chatbot/instalar_cron_visitas.sh
```

Esto configurará la ejecución automática todos los días a las 6:00 AM.

## 🔍 Criterios de Selección

El sistema selecciona clientes que cumplan TODOS estos criterios:

1. **Estado**: `suspendido`
2. **Facturas pendientes**: Con estado `No pagado` o `vencida`
3. **Días de morosidad**: >= 30 días desde la primera factura vencida
4. **Sin visita previa**: No existe una visita de retiro en estado `programada`, `asignada` o `en_progreso`

## 📊 Información Generada

Para cada visita creada, el sistema incluye:

### Datos del Cliente
- ID del cliente
- Nombre completo
- Cédula
- Teléfono
- Móvil
- Dirección
- Coordenadas GPS (si están disponibles)
- Usuario PPP
- Mikrotik asignado

### Datos de la Visita
- **Motivo**: "Retiro de equipo - Morosidad X meses"
- **Estado**: `programada` (sin asignar técnico)
- **Observaciones**: Detalle automático generado por el bot con:
  - Fecha y hora de generación
  - Días y meses de morosidad
  - Deuda total formateada
  - Cantidad de facturas pendientes
  - Fecha de la primera factura vencida
  - Base de datos de origen
  - Acción requerida

## 🔄 Prevención de Duplicados

El sistema verifica automáticamente si un cliente ya tiene una visita de retiro pendiente. Esto evita:

- ❌ Crear múltiples visitas para el mismo cliente
- ❌ Sobrecargar al personal técnico con registros duplicados
- ❌ Confusión en la gestión de visitas

La verificación busca visitas con:
- Misma cédula del cliente
- Motivo que contenga "retiro"
- Estado: `programada`, `asignada` o `en_progreso`

## 📈 Ejemplo de Salida

```
═══════════════════════════════════════════════════════════════
🤖 SISTEMA AUTOMÁTICO DE VISITAS PARA RETIRO
═══════════════════════════════════════════════════════════════

🔍 Buscando clientes suspendidos desde antes del 2025-09-09...

✅ BD Principal (50): 5 clientes suspendidos encontrados
✅ BD Secundaria (11): 8 clientes suspendidos encontrados
✅ BD Terciaria (2): 3 clientes suspendidos encontrados

📊 Total de clientes suspendidos: 16

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PROCESANDO CLIENTES...

✅ VISITA CREADA: FERNANDO JOSE LOPEZ HERNANDEZ
   ├─ ID Visita: 169
   ├─ Cédula: 1007722627
   ├─ Días moroso: 526
   ├─ Deuda: $65.000
   └─ BD Origen: BD Secundaria (11)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESUMEN DE EJECUCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total de clientes analizados:    16
   ✅ Visitas creadas:               16
   ⏭️  Ya existían (duplicadas):      0
   ❌ Errores:                        0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🛠️ Consultas SQL Útiles

### Ver visitas de retiro creadas hoy
```sql
SELECT id, cliente_nombre, cliente_cedula, motivo_visita, estado
FROM visitas_tecnicas
WHERE motivo_visita LIKE '%Retiro%'
  AND DATE(fecha_creacion) = CURDATE()
ORDER BY id DESC;
```

### Ver todas las visitas de retiro pendientes
```sql
SELECT id, cliente_nombre, cliente_cedula, dias_moroso, estado
FROM visitas_tecnicas
WHERE motivo_visita LIKE '%Retiro%'
  AND estado IN ('programada', 'asignada', 'en_progreso')
ORDER BY fecha_creacion DESC;
```

### Estadísticas por estado
```sql
SELECT estado, COUNT(*) as cantidad
FROM visitas_tecnicas
WHERE motivo_visita LIKE '%Retiro%'
GROUP BY estado;
```

## 🔐 Seguridad

- Las credenciales de base de datos están codificadas en el script
- El acceso al sistema requiere permisos root
- Los logs se almacenan en ubicación protegida
- El cron job se ejecuta con privilegios del usuario root

## 📝 Logs

Los logs se guardan en:
```
/root/whatsapp-chatbot/logs/visitas_automaticas.log
```

Cada ejecución registra:
- Fecha y hora
- Clientes analizados
- Visitas creadas
- Duplicados detectados
- Errores encontrados

## 🆘 Solución de Problemas

### El cron job no se ejecuta

1. Verificar que el cron job está instalado:
   ```bash
   crontab -l | grep montar_visitas_suspendidos
   ```

2. Reinstalar el cron job:
   ```bash
   /root/whatsapp-chatbot/instalar_cron_visitas.sh
   ```

### No se crean visitas

1. Verificar conectividad a las bases de datos
2. Revisar el log para errores:
   ```bash
   tail -f /root/whatsapp-chatbot/logs/visitas_automaticas.log
   ```
3. Ejecutar manualmente para ver errores en tiempo real:
   ```bash
   node /root/whatsapp-chatbot/montar_visitas_suspendidos.js
   ```

### Visitas duplicadas

El sistema previene duplicados automáticamente. Si aparecen duplicados:
1. Verificar la lógica de `verificarVisitaExistente()`
2. Comprobar que las cédulas coinciden exactamente

## 📞 Soporte

Para reportar problemas o sugerencias:
- Revisar los logs del sistema
- Ejecutar manualmente para debugging
- Verificar conectividad a las bases de datos

## 🔄 Actualizaciones Futuras

Posibles mejoras:
- [ ] Notificaciones por correo electrónico
- [ ] Panel web de administración
- [ ] Priorización por antigüedad de deuda
- [ ] Integración con sistema de mensajería WhatsApp
- [ ] Reportes semanales automáticos
- [ ] Asignación automática de técnicos por zona

---

**Creado**: 2025-10-09
**Versión**: 1.0
**Autor**: Sistema Automatizado Bot
