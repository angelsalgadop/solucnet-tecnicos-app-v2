# 🔒 VALIDACIÓN DE SERIAL MEJORADA - Bloqueo por Asignación

## ✅ Cambios Implementados

Se ha mejorado el sistema de validación de seriales para que:

1. **Al escanear/escribir el serial:** Valida inmediatamente en la BD del cliente de la visita
2. **Si está asignado a otro cliente:** BLOQUEA y muestra el nombre del cliente
3. **Al completar la visita:** Crea o actualiza el equipo en almacén con estado "comodato"

## 🎯 Flujo Mejorado

### Paso 1: Captura del Serial (Escaneo o Manual)

El técnico escanea o escribe el serial del modem.

### Paso 2: Validación Inmediata en BD Específica

El sistema:
1. Obtiene la visita actual
2. Identifica la BD del cliente (192.168.99.50, .11 o .2)
3. Busca el serial en la tabla `almacen` de ESA BD específica
4. Verifica si está asignado y a qué cliente

### Paso 3: Decisión Según Estado

#### ❌ Caso 1: Modem Asignado a OTRO Cliente - BLOQUEADO

```
┌─────────────────────────────────────┐
│ ⛔ MODEM YA ASIGNADO A OTRO CLIENTE │
├─────────────────────────────────────┤
│ Cliente actual: Juan Pérez          │
│ Cédula: 1234567890                  │
│ Estado: comodato                    │
├─────────────────────────────────────┤
│ ⚠️ NO PUEDES CONTINUAR              │
│ Contacta con soporte técnico        │
└─────────────────────────────────────┘
[No Disponible] ← Botón deshabilitado
```

**Acciones:**
- ❌ Botón "Guardar y Continuar" DESHABILITADO
- ❌ `window.serialEquipoCapturado = null` (limpiado)
- ❌ No permite cerrar el modal con ese serial
- ✅ Muestra: nombre del cliente, cédula, estado

**El técnico DEBE:**
- Cambiar el serial (botón "Cambiar Serial")
- O contactar soporte para resolver la situación

#### ✅ Caso 2: Modem Asignado al MISMO Cliente - PERMITIDO

```
┌─────────────────────────────────────┐
│ ℹ️ Equipo Ya Asignado a Este Cliente│
├─────────────────────────────────────┤
│ Cliente: Juan Pérez                 │
│ Estado: comodato                    │
│ Se actualizará el registro.         │
└─────────────────────────────────────┘
[Guardar y Continuar] ← Botón habilitado
```

**Acciones:**
- ✅ Permite continuar
- ✅ Al completar visita, actualiza fecha_salida si es necesario

#### ✅ Caso 3: Modem Disponible (No Asignado) - PERMITIDO

```
┌─────────────────────────────────────┐
│ ✅ Serial verificado                │
│ Equipo disponible para asignar.    │
└─────────────────────────────────────┘
[Guardar y Continuar] ← Botón habilitado
```

**Acciones:**
- ✅ Permite continuar
- ✅ Al completar visita, asigna el equipo al cliente

#### ✅ Caso 4: Serial No Existe - PERMITIDO

```
┌─────────────────────────────────────┐
│ ➕ Serial no encontrado             │
│ Se creará un nuevo registro al     │
│ completar la visita.                │
└─────────────────────────────────────┘
[Guardar y Continuar] ← Botón habilitado
```

**Acciones:**
- ✅ Permite continuar
- ✅ Al completar visita, crea nuevo registro en almacén
- ✅ Inserta con: userid, productoid, serial, estado=comodato, costo=180000

### Paso 4: Completar la Visita

Cuando el técnico hace click en "Completar Visita":

1. **Valida que tenga serial capturado** (para visitas de instalación)
2. **Llama a la API:** `/api/asignar-equipo`
3. **Backend ejecuta:**
   - Busca el cliente en la BD correspondiente
   - Verifica si el producto "Onu CData" existe (si no, lo crea)
   - Busca el equipo en `almacen` por serial
   - **Si existe y está disponible:** Actualiza `userid`, `estado=comodato`, `fecha_salida`
   - **Si NO existe:** Crea nuevo registro en `almacen`
   - Actualiza la visita con `serial_equipo_asignado`

## 🔧 Archivos Modificados

### 1. Backend: `/root/whatsapp-chatbot/asignar_equipo_desde_visita.js`

**Función modificada:** `verificarSerialEquipo(serialEquipo, visitaId)`

```javascript
// Ahora acepta visitaId opcional
async function verificarSerialEquipo(serialEquipo, visitaId = null) {
    if (visitaId) {
        // Buscar solo en BD del cliente de la visita
        // 1. Obtener visita y bd_origen
        // 2. Conectar a esa BD específica
        // 3. Buscar serial en almacen
        // 4. Verificar si está asignado
        // 5. Comparar con cliente de la visita

        return {
            success: true,
            existe: true/false,
            estaAsignado: true/false,
            esDelMismoCliente: true/false,
            equipos: [{ ...equipo, bd_origen }]
        };
    }
    // ... comportamiento anterior (buscar en todas las BDs)
}
```

**Nuevos campos en respuesta:**
- `estaAsignado`: true si userid != '000000'
- `esDelMismoCliente`: true si cedula del equipo == cedula de la visita

### 2. Backend: `/root/whatsapp-chatbot/index.js`

**Ruta modificada:** `POST /api/verificar-serial`

```javascript
app.post('/api/verificar-serial', async (req, res) => {
    const { serialEquipo, visitaId } = req.body; // ← Ahora acepta visitaId

    const resultado = await verificarSerialEquipo(serialEquipo, visitaId);

    res.json(resultado);
});
```

### 3. Frontend: `/root/whatsapp-chatbot/public/serial_scanner.js`

**Función modificada:** `verificarSerialEnBD(serial)`

```javascript
async function verificarSerialEnBD(serial) {
    const visitaId = window.visitaIdActual; // ← Obtener visita actual

    const response = await fetch('/api/verificar-serial', {
        method: 'POST',
        headers: { ... },
        body: JSON.stringify({
            serialEquipo: serial,
            visitaId: visitaId  // ← Enviar visitaId
        })
    });

    const data = await response.json();

    // Lógica de decisión según los casos 1-4
    if (data.estaAsignado && !data.esDelMismoCliente) {
        // BLOQUEAR - Mostrar cliente actual
        estadoDiv.innerHTML = `
            <div class="alert alert-danger">
                <h6>⛔ MODEM YA ASIGNADO A OTRO CLIENTE</h6>
                <p>Cliente actual: ${equipo.cliente_nombre}</p>
                <p>Cédula: ${equipo.cliente_cedula}</p>
                <p>⚠️ NO PUEDES CONTINUAR</p>
            </div>
        `;
        btnConfirmar.disabled = true;
        window.serialEquipoCapturado = null;
    }
    // ... otros casos
}
```

**Variables globales:**
- `window.visitaIdActual`: ID de la visita actual
- `window.serialEquipoCapturado`: Serial validado y permitido

### 4. Frontend: `/root/whatsapp-chatbot/public/tecnicos_visitas.html`

**Versión actualizada:** `?v=20251024-SERIAL-009-VALIDATE`

## 📊 Tabla de Decisiones

| Estado del Serial | userid | Mismo Cliente | Acción |
|-------------------|--------|---------------|--------|
| No existe | - | - | ✅ Permitir (crear) |
| Existe | 000000 | - | ✅ Permitir (asignar) |
| Existe | != 000000 | ✅ Sí | ✅ Permitir (actualizar) |
| Existe | != 000000 | ❌ No | ❌ **BLOQUEAR** |

## 🧪 Cómo Probar

### Prueba 1: Serial Nuevo (No Existe)

1. Escanear/escribir serial: `TEST-NEW-001`
2. **Resultado esperado:**
   ```
   ➕ Serial no encontrado
   Se creará un nuevo registro al completar la visita.
   [Guardar y Continuar] ← Habilitado
   ```
3. Completar visita → Crea en almacén

### Prueba 2: Serial Disponible (Existe, No Asignado)

1. Crear serial en almacén con userid='000000'
2. Escanear/escribir ese serial
3. **Resultado esperado:**
   ```
   ✅ Serial verificado
   Equipo disponible para asignar.
   [Guardar y Continuar] ← Habilitado
   ```
4. Completar visita → Asigna al cliente

### Prueba 3: Serial Asignado al Mismo Cliente

1. Crear serial en almacén asignado al cliente de la visita
2. Escanear/escribir ese serial
3. **Resultado esperado:**
   ```
   ℹ️ Equipo Ya Asignado a Este Cliente
   Cliente: [Nombre del Cliente]
   Estado: comodato
   [Guardar y Continuar] ← Habilitado
   ```
4. Completar visita → Actualiza fecha_salida

### Prueba 4: Serial Asignado a OTRO Cliente ⭐

1. Crear serial en almacén asignado a OTRO cliente
2. Escanear/escribir ese serial
3. **Resultado esperado:**
   ```
   ⛔ MODEM YA ASIGNADO A OTRO CLIENTE
   Cliente actual: Juan Pérez
   Cédula: 1234567890
   Estado: comodato
   ⚠️ NO PUEDES CONTINUAR
   [No Disponible] ← Deshabilitado
   ```
4. NO puede completar visita con ese serial
5. Debe usar "Cambiar Serial" y probar con otro

## 🔍 Logs para Debug

### Backend

```bash
🔍 [VERIFICAR SERIAL] Verificando serial TEST123 para visita 456
✅ [VERIFICAR SERIAL] Visita encontrada: Cliente Juan Pérez, BD: 192.168.99.50
🔍 [VERIFICAR SERIAL] Equipo encontrado: {
  id: 123,
  estado: 'comodato',
  asignado_a: 'María López',
  es_del_mismo_cliente: false
}
```

### Frontend

```javascript
🔍 [VERIFICAR SERIAL] Enviando: serial=TEST123, visitaId=456
🔍 [VERIFICAR SERIAL] Resultado: {
  success: true,
  existe: true,
  estaAsignado: true,
  esDelMismoCliente: false,
  equipos: [{
    cliente_nombre: 'María López',
    cliente_cedula: '9876543210',
    estado: 'comodato'
  }]
}
```

## 📱 Interfaz Usuario

### Modal de Validación BLOQUEADA

```
┌────────────────────────────────────────┐
│ 📦 Capturar Serial del Equipo          │
├────────────────────────────────────────┤
│ ✅ Serial Capturado                    │
│                                        │
│ TEST123                                │
│                                        │
│ [↻ Cambiar Serial]                     │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ ⛔ MODEM YA ASIGNADO A OTRO CLI  │   │
│ │ ───────────────────────────────  │   │
│ │ Cliente actual: María López     │   │
│ │ Cédula: 9876543210              │   │
│ │ Estado: comodato                │   │
│ │ ───────────────────────────────  │   │
│ │ ⚠️ NO PUEDES CONTINUAR          │   │
│ │ Contacta con soporte técnico    │   │
│ └──────────────────────────────────┘   │
│                                        │
│ [Cancelar]  [No Disponible] ← Gris    │
└────────────────────────────────────────┘
```

### Modal de Validación PERMITIDA

```
┌────────────────────────────────────────┐
│ 📦 Capturar Serial del Equipo          │
├────────────────────────────────────────┤
│ ✅ Serial Capturado                    │
│                                        │
│ TEST456                                │
│                                        │
│ [↻ Cambiar Serial]                     │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ ✅ Serial verificado             │   │
│ │ Equipo disponible para asignar. │   │
│ └──────────────────────────────────┘   │
│                                        │
│ [Cancelar]  [Guardar y Continuar] ← Azul│
└────────────────────────────────────────┘
```

## 🚀 Ventajas de Este Enfoque

1. **Validación Temprana:** Detecta problemas ANTES de completar la visita
2. **Información Clara:** Muestra exactamente quién tiene el modem
3. **Bloqueo Efectivo:** No permite continuar con modems asignados
4. **BD Específica:** Solo busca en la BD del cliente de la visita
5. **Manejo de Estados:** Considera disponible, mismo cliente, otro cliente
6. **UX Mejorada:** Feedback visual inmediato y claro

## ⚠️ Importante

- El serial se valida al escanearlo/escribirlo
- El equipo se CREA/ACTUALIZA al completar la visita
- Si está asignado a otro cliente, NO permite continuar
- El técnico debe cambiar el serial o contactar soporte

---

**Fecha:** 2025-10-24
**Versión:** 20251024-SERIAL-009-VALIDATE
**Estado:** ✅ Implementado y listo para probar
