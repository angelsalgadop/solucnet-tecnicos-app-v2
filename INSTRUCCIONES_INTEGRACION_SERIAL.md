# 📦 Instrucciones de Integración - Sistema de Asignación de Seriales

Este documento describe cómo integrar la funcionalidad de captura y asignación automática de seriales de equipos en el sistema de visitas técnicas.

## 📋 Resumen de Funcionalidades

1. **Visitas con Motivo "Instalación"**: Campo obligatorio para escanear o escribir el serial del modem
2. **Visitas con Otros Motivos**: Checkbox "¿Cambiaste el equipo?" que permite capturar serial de cambio
3. **Asignación Automática**: Al completar la visita, el equipo se asigna automáticamente al cliente en comodato por $180,000
4. **Consulta en 3 Bases de Datos**: El sistema busca al cliente en las 3 BD configuradas (.50, .11, .2)
5. **Admin Panel**: Opción para asignar seriales desde visitas sin asignar (pendiente de implementar)

## 📁 Archivos Creados

### 1. `/root/whatsapp-chatbot/asignar_equipo_desde_visita.js`
**Funciones principales:**
- `asignarEquipoDesdeVisita(visitaId, serialEquipo, costoEquipo)`: Asigna equipo al cliente
- `verificarSerialEquipo(serialEquipo)`: Verifica si un serial ya existe en las BD

### 2. `/root/whatsapp-chatbot/public/serial_scanner.js`
**Funciones principales:**
- `abrirModalSerialEquipo(visitaId, motivoVisita)`: Abre modal para capturar serial
- `iniciarEscanerCodigo()`: Inicia cámara para escanear (funcionalidad básica)
- `mostrarInputManual()`: Permite escribir serial manualmente
- `verificarSerialEnBD(serial)`: Verifica serial antes de asignar
- `asignarEquipoAlCompletar(visitaId, serialEquipo)`: Llamada API para asignar

### 3. `/root/whatsapp-chatbot/integracion_serial_visitas.js`
Contiene las modificaciones necesarias para `tecnicos_visitas.js`

## 🔧 Pasos de Integración

### PASO 1: Verificar que las rutas API están activas

El archivo `index.js` ya ha sido modificado con:
- ✅ Import de `asignar_equipo_desde_visita.js` (línea ~73)
- ✅ Ruta POST `/api/asignar-equipo` (línea ~8091)
- ✅ Ruta POST `/api/verificar-serial` (línea ~8129)

**Verificar:** Reiniciar el servidor con `pm2 restart solucnet-bot`

### PASO 2: Agregar script a tecnicos_visitas.html

**Ubicación:** `/root/whatsapp-chatbot/public/tecnicos_visitas.html`

**Antes de la línea:** `<script src="/tecnicos_visitas.js?v=20251023-NAP-008-CONSECUTIVO"></script>`

**Agregar:**
```html
<!-- Script para escaneo de seriales -->
<script src="/serial_scanner.js?v=20251024-SERIAL-001"></script>
```

### PASO 3: Modificar tecnicos_visitas.js

**Ubicación:** `/root/whatsapp-chatbot/public/tecnicos_visitas.js`

#### 3.1. Reemplazar la función `completarVisita` (línea ~407)

Buscar la función actual:
```javascript
function completarVisita(visitaId) {
    // Código actual...
}
```

Reemplazarla con la versión completa del archivo `integracion_serial_visitas.js` (comentarios marcados con `// MODIFICACIÓN 1`)

**Cambios clave:**
- Detecta si `esInstalacion` y muestra botón de capturar serial
- Para otros motivos, muestra checkbox "¿Cambiaste el equipo?"
- Guarda la información en `window.serialEquipoCapturado`

#### 3.2. Agregar función `toggleCambioEquipo` (al final del archivo)

```javascript
function toggleCambioEquipo() {
    const checkbox = document.getElementById('checkboxCambioEquipo');
    const seccion = document.getElementById('seccionCambioEquipo');

    if (checkbox && checkbox.checked) {
        seccion.classList.remove('d-none');
    } else {
        seccion.classList.add('d-none');
        window.serialEquipoCapturado = null;
        const infoDiv = document.getElementById('serialCapturadoInfo');
        if (infoDiv) {
            infoDiv.innerHTML = '';
        }
    }
}

window.toggleCambioEquipo = toggleCambioEquipo;
```

#### 3.3. Modificar función `guardarReporteVisita` (línea ~713)

**A. Agregar validación de serial ANTES de validación de fotos:**

```javascript
// NUEVA VALIDACIÓN: Serial obligatorio para instalaciones
const motivoVisita = visita.motivo_visita ? visita.motivo_visita.toLowerCase() : '';
const esInstalacion = motivoVisita.includes('instalación') || motivoVisita.includes('instalacion');

if (esInstalacion && !window.serialEquipoCapturado) {
    mostrarAlerta('❌ ERROR: Debes capturar el serial del equipo antes de completar la instalación. Presiona el botón "Capturar Serial del Equipo".', 'danger');
    return;
}

// Validación para cambio de equipo
const checkboxCambioEquipo = document.getElementById('checkboxCambioEquipo');
if (checkboxCambioEquipo && checkboxCambioEquipo.checked && !window.serialEquipoCapturado) {
    mostrarAlerta('❌ ERROR: Marcaste que cambiaste el equipo, pero no capturaste el serial del nuevo equipo.', 'danger');
    return;
}
```

**B. Agregar asignación de equipo DESPUÉS de guardar reporte exitosamente:**

Buscar la sección donde se cierra el modal tras éxito (línea ~792):
```javascript
if (resultado.success) {
    mostrarAlerta('Reporte guardado exitosamente', 'success');

    // Remover la visita de la lista local
    visitasAsignadas = visitasAsignadas.filter(v => v.id != formData.visita_id);
    mostrarVisitasAsignadas();

    // ** AGREGAR AQUÍ **
    // Asignar equipo si se capturó serial
    if (window.serialEquipoCapturado) {
        console.log(`📦 [GUARDAR REPORTE] Asignando equipo con serial: ${window.serialEquipoCapturado}`);

        const resultadoAsignacion = await asignarEquipoAlCompletar(visitaId, window.serialEquipoCapturado);

        if (resultadoAsignacion.success) {
            console.log(`✅ [GUARDAR REPORTE] Equipo asignado exitosamente: ${resultadoAsignacion.message}`);
        } else {
            console.error(`⚠️ [GUARDAR REPORTE] Error asignando equipo: ${resultadoAsignacion.message}`);
            mostrarAlerta(`⚠️ Visita completada, pero hubo un error asignando el equipo: ${resultadoAsignacion.message}`, 'warning');
        }

        // Limpiar serial capturado
        window.serialEquipoCapturado = null;
    }
    // ** FIN DE AGREGADO **

    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('modalCompletarVisita')).hide();
```

### PASO 4: Reiniciar el servidor

```bash
pm2 restart solucnet-bot
pm2 logs solucnet-bot --lines 50
```

## 🧪 Pruebas

### Test 1: Instalación con Serial

1. Crear una visita con motivo "Instalación"
2. Asignarla a un técnico
3. Iniciar sesión como técnico en `/tecnicos_visitas.html`
4. Hacer clic en "Completar" en la visita
5. **Verificar:** Debe aparecer botón "Capturar Serial del Equipo"
6. Hacer clic y escribir serial manualmente (ej: TEST123456)
7. Completar la visita con fotos y coordenadas GPS
8. **Verificar:** Al guardar, debe asignar el equipo automáticamente

**Consulta SQL para verificar:**
```sql
-- En BD externa (192.168.99.50)
SELECT a.id, a.userid, a.serial_producto, a.estado, a.costo, u.nombre
FROM almacen a
LEFT JOIN usuarios u ON a.userid = u.id
WHERE a.serial_producto = 'TEST123456';
```

### Test 2: Cambio de Equipo

1. Crear una visita con motivo diferente a instalación (ej: "Soporte Técnico")
2. Asignarla a un técnico
3. Completar la visita
4. **Verificar:** Debe aparecer checkbox "¿Cambiaste el equipo?"
5. Marcar el checkbox
6. **Verificar:** Debe aparecer botón para capturar serial
7. Capturar serial y completar visita
8. **Verificar:** Equipo debe asignarse automáticamente

## 📊 Flujo de Asignación

```
1. Técnico completa visita con serial capturado
   ↓
2. Sistema busca cliente por cédula en 3 BD (.50, .11, .2)
   ↓
3. Verifica si serial ya existe en almacén
   ↓
   a) Si existe y está disponible → Actualiza userid y estado
   b) Si no existe → Crea nuevo registro en almacén
   ↓
4. Asigna como:
   - Estado: "comodato"
   - Costo: 180,000
   - Fecha: Fecha actual
   ↓
5. Actualiza visita con serial asignado
   ↓
6. Confirma éxito al técnico
```

## 🔍 Monitoreo y Logs

Para ver logs de asignación:
```bash
# Ver logs en tiempo real
pm2 logs solucnet-bot | grep "ASIGNAR EQUIPO"

# Ver logs específicos de seriales
pm2 logs solucnet-bot | grep -E "SERIAL|ASIGNAR"
```

## ⚠️ Consideraciones Importantes

1. **Validación de Serial:**
   - El sistema verifica si el serial ya existe antes de asignar
   - Si ya está asignado a otro cliente, muestra advertencia pero permite continuar

2. **Base de Datos:**
   - El sistema busca en las 3 BD configuradas
   - Usa la BD de origen de la visita para la asignación

3. **Producto "Onu CData":**
   - Si no existe en la BD, se crea automáticamente
   - Costo por defecto: 180,000

4. **Errores No Fatales:**
   - Si falla la asignación del equipo, la visita se marca como completada igual
   - Se muestra advertencia al técnico pero no se bloquea el proceso

## 📝 TODO: Funcionalidad Pendiente

### Admin Panel - Asignar Serial desde Visitas Sin Asignar

**Ubicación:** `/root/whatsapp-chatbot/admin_visitas.html`

**Funcionalidad:**
- En visitas sin asignar, agregar botón "Tomar Serial"
- Solo mostrar si motivo != "Instalación"
- Abrir mismo modal de captura de serial
- Actualizar BD con serial antes de asignar técnico

**Implementación sugerida:**
1. Modificar tabla de visitas sin asignar
2. Agregar columna "Serial" con botón condicional
3. Usar mismo componente `serial_scanner.js`
4. API endpoint adicional para actualizar serial en visita sin completarla

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs: `pm2 logs solucnet-bot`
2. Verificar permisos de BD: Usuario debe tener permisos INSERT/UPDATE en tabla `almacen`
3. Verificar conectividad a BD externas (.50, .11, .2)

---

**Fecha de creación:** 2025-10-24
**Versión:** 1.0
**Autor:** Claude AI Assistant
