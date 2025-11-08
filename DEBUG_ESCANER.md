# 🔍 DEBUG - Escáner de Códigos de Barras

## 🐛 Problema Persistente

El escáner muestra la cámara pero sigue sin detectar códigos de barras.

## ✅ Mejoras Aplicadas en v007

1. **Hints de ZXing configurados**
   - TRY_HARDER activado (análisis más profundo)
   - Múltiples formatos: CODE_128, CODE_39, EAN-13, EAN-8, UPC-A, UPC-E, QR, ITF

2. **Velocidad aumentada**
   - 50ms = 20 FPS (antes era 100ms = 10 FPS)
   - Más intentos por segundo = mayor probabilidad

3. **Logging mejorado**
   - Logs cada 10 intentos en consola
   - Muestra dimensiones del canvas

4. **Espera para video ready**
   - 500ms adicionales para que el video se estabilice
   - Canvas se ajusta después de que video tiene dimensiones

## 🧪 Cómo Diagnosticar el Problema

### Paso 1: Limpiar Caché COMPLETAMENTE

**En Android Chrome:**
1. Menú (3 puntos) → Configuración
2. Privacidad y seguridad → Borrar datos de navegación
3. Seleccionar "Imágenes y archivos en caché"
4. Borrar datos
5. **O usar pestaña de incógnito**

**En iOS Safari:**
1. Ajustes → Safari
2. Borrar historial y datos de sitios web
3. **O usar pestaña privada**

### Paso 2: Abrir Consola del Navegador

**En Android Chrome:**
1. Conecta el móvil al PC con USB
2. En PC: Chrome → `chrome://inspect`
3. Encuentra tu dispositivo y click "inspect"
4. Ve a la pestaña "Console"

**En iOS Safari:**
1. En iPhone: Ajustes → Safari → Avanzado → Activar "Inspector web"
2. En Mac: Safari → Desarrollador → [Tu iPhone] → [Tu página]

### Paso 3: Logs Esperados

Al abrir el escáner deberías ver:

```
📷 [ESCÁNER] Iniciando cámara para escanear código...
✅ [ESCÁNER] Cámara iniciada
📦 [ESCÁNER] Cargando librería ZXing...
✅ [ESCÁNER] Librería ZXing cargada
📹 [ESCÁNER] Video listo, iniciando detección...
📐 [ESCÁNER] Canvas ajustado: 1280x720
🔄 [ESCÁNER] Iniciando loop de escaneo frame-by-frame...
🔍 [ESCÁNER] Intentos: 10, Canvas: 1280x720
🔍 [ESCÁNER] Intentos: 20, Canvas: 1280x720
🔍 [ESCÁNER] Intentos: 30, Canvas: 1280x720
...
✅ [ESCÁNER] Código detectado: ABC123XYZ456
```

### Paso 4: Verificar Dimensiones del Canvas

**❌ PROBLEMA:** Si ves `Canvas: 0x0` o `Canvas: 640x480` (default)
- El video no tiene dimensiones reales
- Posible problema con permisos de cámara

**✅ CORRECTO:** Si ves `Canvas: 1280x720` o similar
- El video está funcionando correctamente

### Paso 5: Tipos de Códigos de Barras Soportados

Prueba con estos tipos comunes:

| Formato | Ejemplo | Común en |
|---------|---------|----------|
| CODE_128 | ✅ Más común | Equipos, modems, productos industriales |
| CODE_39 | ✅ Alfanumérico | Inventarios, logística |
| EAN-13 | ✅ 13 dígitos | Productos comerciales |
| EAN-8 | ✅ 8 dígitos | Productos pequeños |
| UPC-A | ✅ 12 dígitos | Productos USA |
| QR Code | ✅ 2D | URLs, información compleja |

**¿Qué tipo de código estás usando?**
- Si no sabes, intenta con un código de barras de un producto común (EAN-13)
- Descarga app "Barcode Scanner" para verificar que el código es legible

## 🔧 Soluciones Alternativas

### Opción 1: Usar Input Manual

Si el escáner no funciona, siempre puedes:
1. Click en "Escribir Serial"
2. Escribe el serial manualmente
3. Funciona 100% del tiempo

### Opción 2: Prueba con Diferentes Códigos

**Test 1: Código QR**
1. Genera un QR code en: https://www.qr-code-generator.com/
2. Escribe "TEST123"
3. Imprime o muestra en otra pantalla
4. Prueba escanearlo

**Test 2: Código EAN-13**
1. Usa cualquier producto con código de barras
2. Ejemplo: Caja de leche, libro, etc.
3. Debe detectarlo casi instantáneamente

**Test 3: Código CODE-128**
1. Genera uno en: https://barcode.tec-it.com/en/Code128
2. Escribe "MODEM123"
3. Descarga imagen
4. Prueba escanearlo

### Opción 3: Verificar Configuración del Móvil

**Permisos de Cámara:**
```
Android: Ajustes → Apps → Chrome → Permisos → Cámara → Permitir
iOS: Ajustes → Safari → Cámara → Permitir
```

**Modo de Ahorro de Energía:**
- Desactivar temporalmente (puede limitar rendimiento de cámara)

**Actualizar Navegador:**
- Chrome/Safari a la última versión

## 📊 Comparación de Librerías

Si ZXing sigue sin funcionar, podríamos cambiar a:

| Librería | Pros | Contras |
|----------|------|---------|
| **ZXing** (actual) | Soporta muchos formatos | A veces lento en móviles |
| **QuaggaJS** | Optimizado para móviles | Solo códigos 1D |
| **Html5-QRCode** | Muy rápido con QR | Solo QR codes |
| **Dynamsoft** | Muy potente | De pago |

## 🚨 Preguntas para Diagnosticar

Para ayudarte mejor, necesito saber:

1. **¿Qué ves en la consola del navegador?**
   - ¿Aparecen los logs de "Intentos: X"?
   - ¿Qué dimensiones tiene el canvas?

2. **¿Qué tipo de código de barras estás usando?**
   - ¿Es un código del modem?
   - ¿Puedes leerlo manualmente (sin la app)?
   - ¿Es CODE-128, EAN-13, u otro?

3. **¿Has probado con otros códigos de barras?**
   - Ejemplo: código de un producto comercial
   - ¿Funciona con esos?

4. **¿Qué navegador y dispositivo usas?**
   - Chrome/Safari/Firefox?
   - Android/iOS?
   - ¿Versión del navegador?

5. **Condiciones de iluminación:**
   - ¿Luz natural o artificial?
   - ¿Interior o exterior?
   - ¿Hay sombras sobre el código?

6. **Distancia y posición:**
   - ¿A qué distancia estás? (debería ser 10-15cm)
   - ¿El código está completamente visible en pantalla?
   - ¿Está el móvil estable o te mueves?

## 💡 Prueba Rápida: Código QR

Escanea este código QR de prueba:

```
█████████████████████████████
██ ▄▄▄▄▄ █▀█ █▄▄▀▄█ ▄▄▄▄▄ ██
██ █   █ █▀▀▀█ ▀▄ █ █   █ ██
██ █▄▄▄█ █▀ █▀▀█▄▀█ █▄▄▄█ ██
██▄▄▄▄▄▄▄█▄▀ ▀▄▀ █▄▄▄▄▄▄▄██
██▄ ▄█ ▄▄ ▄██▄█▄▀▄▄▄▀▄  ▄▀██
██  ▄▄█▄▄▄  █▄▀█  ▄▄▀▄▄▀▀▄██
██▄██▄ ▄▄ █▀▀ ▀▄▀▄▄▀ ██ ▀███
██ ▄▄▄▄▄ █▄█  █▀  ▄█▄▄▄▀▄ ██
██ █   █ █  ▀█▄██▄ █  ▀▀▄ ██
██ █▄▄▄█ █ █▀  ▀▀▄▀▀▀  █▄███
██▄▄▄▄▄▄▄█▄██▄▄▄█▄▄▄██▄█████
█████████████████████████████
```

Si este QR funciona → El escáner está bien, el problema es el código específico
Si este QR NO funciona → Hay un problema con la cámara o el escáner

## 🔄 Próximo Paso

Basándome en tu respuesta a las preguntas de arriba, puedo:

1. **Si el problema es ZXing:** Cambiar a QuaggaJS
2. **Si el problema es el código específico:** Ajustar formatos soportados
3. **Si el problema es la cámara:** Revisar permisos y configuración
4. **Si nada funciona:** Mejorar la opción manual de entrada

---

**Versión actual:** 20251024-SERIAL-007-HINTS
**Cambios:** Hints TRY_HARDER, 20 FPS, logging mejorado
**Estado:** 🔍 En diagnóstico
