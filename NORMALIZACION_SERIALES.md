# 🔧 NORMALIZACIÓN AUTOMÁTICA DE SERIALES

## 📋 Problema Identificado

Algunos modems tienen seriales con formato compuesto:
```
E447B3-ZTEGCC3881E5
```

Donde:
- **Prefijo:** `E447B3` (identificador del lote o fabricante)
- **Guion:** `-` (separador)
- **Serial real:** `ZTEGCC3881E5` ← **Este es el que se debe guardar**

## ✅ Solución Implementada

Se ha agregado una función `normalizarSerial()` que:

1. **Detecta si el serial tiene guion (-)**
2. **Extrae solo la parte después del guion**
3. **Convierte a mayúsculas**
4. **Elimina espacios en blanco**

### Función de Normalización

```javascript
/**
 * Normaliza el serial del equipo
 * Si contiene guion (-), toma solo la parte después del guion
 * Ejemplo: "E447B3-ZTEGCC3881E5" -> "ZTEGCC3881E5"
 */
function normalizarSerial(serial) {
    if (!serial) return '';

    // Trim y convertir a mayúsculas
    serial = serial.trim().toUpperCase();

    // Si contiene guion, tomar solo la parte después del último guion
    if (serial.includes('-')) {
        const partes = serial.split('-');
        serial = partes[partes.length - 1].trim();
        console.log(`🔧 [NORMALIZAR] Serial con guion detectado, tomando parte final: ${serial}`);
    }

    return serial;
}
```

## 📊 Casos de Uso

| Serial Escaneado/Escrito | Serial Normalizado | Observación |
|--------------------------|-------------------|-------------|
| `E447B3-ZTEGCC3881E5` | `ZTEGCC3881E5` | Elimina prefijo |
| `ABC-DEF-GHI123` | `GHI123` | Toma última parte |
| `ZTEGCC3881E5` | `ZTEGCC3881E5` | Sin guion, no cambia |
| `  ztegcc3881e5  ` | `ZTEGCC3881E5` | Trim + Mayúsculas |
| `abc123-xyz456` | `XYZ456` | Normaliza correctamente |

## 🎯 Dónde se Aplica

La normalización se aplica en **DOS** momentos:

### 1. Al Escanear con QuaggaJS

Cuando QuaggaJS detecta el código de barras:

```javascript
Quagga.onDetected(function(result) {
    const codigo = result.codeResult.code;

    // ...después de 3 detecciones confirmadas...

    // Normalizar el serial
    const serial = normalizarSerial(codigo);
    console.log(`✅ [ESCÁNER] Código confirmado (raw): ${codigo}`);
    console.log(`✅ [ESCÁNER] Serial normalizado: ${serial}`);

    // Continuar con el serial normalizado
    verificarSerialEnBD(serial);
});
```

### 2. Al Escribir Manualmente

Cuando el técnico escribe el serial:

```javascript
async function confirmarSerialEquipo() {
    const serialRaw = document.getElementById('serialManual')?.value?.trim();

    // Normalizar el serial
    const serialNormalizado = normalizarSerial(serialRaw);

    console.log(`✅ [SERIAL] Serial capturado (raw): ${serialRaw}`);
    console.log(`✅ [SERIAL] Serial normalizado: ${serialNormalizado}`);

    // Continuar con el serial normalizado
    verificarSerialEnBD(serialNormalizado);
}
```

## 🧪 Cómo Probar

### Prueba 1: Escanear Serial con Guion

1. **Escanear código de barras:** `E447B3-ZTEGCC3881E5`
2. **Resultado esperado:**
   ```
   Logs en consola:
   ✅ [ESCÁNER] Código confirmado (raw): E447B3-ZTEGCC3881E5
   🔧 [NORMALIZAR] Serial con guion detectado, tomando parte final: ZTEGCC3881E5
   ✅ [ESCÁNER] Serial normalizado: ZTEGCC3881E5
   ```
3. **Serial mostrado:** `ZTEGCC3881E5`
4. **Serial guardado en BD:** `ZTEGCC3881E5`

### Prueba 2: Escribir Serial con Guion Manualmente

1. **Escribir en input:** `e447b3-ztegcc3881e5`
2. **Resultado esperado:**
   ```
   Logs en consola:
   ✅ [SERIAL] Serial capturado (raw): e447b3-ztegcc3881e5
   🔧 [NORMALIZAR] Serial con guion detectado, tomando parte final: ZTEGCC3881E5
   ✅ [SERIAL] Serial normalizado: ZTEGCC3881E5
   ```
3. **Serial mostrado:** `ZTEGCC3881E5`
4. **Serial guardado en BD:** `ZTEGCC3881E5`

### Prueba 3: Serial Sin Guion

1. **Escanear/Escribir:** `ZTEGCC3881E5`
2. **Resultado esperado:**
   ```
   ✅ [ESCÁNER] Serial normalizado: ZTEGCC3881E5
   ```
3. **Serial mostrado:** `ZTEGCC3881E5`
4. **No hay cambios** (ya está normalizado)

### Prueba 4: Serial con Múltiples Guiones

1. **Escanear/Escribir:** `ABC-DEF-GHI-123456`
2. **Resultado esperado:**
   ```
   🔧 [NORMALIZAR] Serial con guion detectado, tomando parte final: 123456
   ✅ [SERIAL] Serial normalizado: 123456
   ```
3. **Serial mostrado:** `123456`
4. **Toma solo la última parte**

## 📱 Interfaz de Usuario

### Antes (Sin Normalización)

```
┌────────────────────────────┐
│ ✅ Serial Capturado        │
│ E447B3-ZTEGCC3881E5        │ ← Se guardaba completo
└────────────────────────────┘
```

### Después (Con Normalización)

```
┌────────────────────────────┐
│ ✅ Serial Capturado        │
│ ZTEGCC3881E5               │ ← Solo la parte importante
└────────────────────────────┘

Logs en consola:
🔧 [NORMALIZAR] Serial con guion detectado, tomando parte final
```

## 🔍 Logs para Verificar

Abre **F12 → Consola** y deberías ver:

### Al Escanear Serial con Guion

```javascript
📷 [ESCÁNER] Iniciando cámara para escanear código de barras...
✅ [ESCÁNER] QuaggaJS cargado correctamente
🎬 [ESCÁNER] QuaggaJS iniciado, escaneando...
🔍 [ESCÁNER] Detectado: E447B3-ZTEGCC3881E5 (code_128)
🔍 [ESCÁNER] Detectado: E447B3-ZTEGCC3881E5 (code_128)
🔍 [ESCÁNER] Detectado: E447B3-ZTEGCC3881E5 (code_128)
✅ [ESCÁNER] Código confirmado (raw): E447B3-ZTEGCC3881E5
🔧 [NORMALIZAR] Serial con guion detectado, tomando parte final: ZTEGCC3881E5
✅ [ESCÁNER] Serial normalizado: ZTEGCC3881E5
🔍 [VERIFICAR SERIAL] Enviando: serial=ZTEGCC3881E5, visitaId=123
```

### Al Escribir Serial Manualmente

```javascript
✅ [SERIAL] Serial capturado (raw): E447B3-ZTEGCC3881E5
🔧 [NORMALIZAR] Serial con guion detectado, tomando parte final: ZTEGCC3881E5
✅ [SERIAL] Serial normalizado: ZTEGCC3881E5
🔍 [VERIFICAR SERIAL] Enviando: serial=ZTEGCC3881E5, visitaId=123
```

## 🗄️ Base de Datos

### Tabla: `almacen`

El serial normalizado se guarda en:

```sql
INSERT INTO almacen (
    serial_producto,
    ...
) VALUES (
    'ZTEGCC3881E5',  -- ← Serial normalizado (sin prefijo)
    ...
);
```

### Búsquedas Consistentes

Ahora todas las búsquedas serán consistentes:

```sql
-- Búsqueda del serial normalizado
SELECT * FROM almacen
WHERE serial_producto = 'ZTEGCC3881E5';

-- Siempre encuentra el equipo, sin importar cómo fue escaneado
```

## 📊 Ventajas

1. **Consistencia:** Todos los seriales se guardan en el mismo formato
2. **Búsquedas:** Más fácil encontrar equipos en la BD
3. **Evita duplicados:** `E447B3-ZTEGCC3881E5` y `ZTEGCC3881E5` se tratan como el mismo equipo
4. **Transparente:** El usuario solo ve el serial limpio
5. **Logs claros:** Muestra tanto el raw como el normalizado

## ⚙️ Configuración

La normalización está activa por defecto y **NO requiere configuración**.

Si en el futuro se necesita cambiar el comportamiento:

```javascript
// Archivo: serial_scanner.js

function normalizarSerial(serial) {
    // ... código actual ...

    // Para cambiar el separador, modificar aquí:
    if (serial.includes('-')) {  // ← Cambiar '-' por otro carácter
        // ...
    }

    return serial;
}
```

## 📝 Notas Importantes

1. **Siempre toma la última parte:** Si hay múltiples guiones, toma lo que está después del último
2. **No modifica seriales sin guion:** Si no tiene `-`, solo convierte a mayúsculas
3. **Trim automático:** Elimina espacios al inicio y final
4. **Logs visibles:** Siempre muestra en consola cuando normaliza

## 🚀 Próximas Mejoras (Opcionales)

Si se necesita más control:

1. **Validar formato:** Verificar que la parte final tenga formato esperado
2. **Múltiples patrones:** Soportar otros formatos (ej: `PREFIX_SERIAL`, `PREFIX:SERIAL`)
3. **Configuración por BD:** Diferentes reglas según la BD (.50, .11, .2)
4. **Historial:** Guardar tanto raw como normalizado para trazabilidad

---

**Fecha:** 2025-10-24
**Versión:** 20251024-SERIAL-010-NORMALIZE
**Estado:** ✅ Implementado y activo
**Aplica a:** Escaneo QuaggaJS y entrada manual
