# 📡 DATOS DE LA API CON TOKEN ETERNO

## 🚀 TOKEN API ETERNO (NUNCA EXPIRA)

### 🔑 TU TOKEN ETERNO:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhcGlfc3lzdGVtX3Blcm1hbmVudCIsInVzZXJuYW1lIjoiYXBpIiwibm9
tYnJlIjoiVXN1YXJpbyBBUEkgRXRlcm5vIiwicm9sIjoiYXBpIiwiaWF0IjoxNzU2MDA5NjAxLCJwZXJtYW5lbnQiOnRydWUsImRlc2NyaXB
0aW9uIjoiVG9rZW4gQVBJIHBlcm1hbmVudGUgcXVlIG51bmNhIGV4cGlyYSJ9.GwPj0htCGiBX62R3GBd_uJNhqwfP3UW4MrOkJAoMcaY
```

### 🔐 CLAVE SECRETA (para regenerar):
```
solucnet_api_eternal_token_2024_permanent_key
```

---

## 🌐 URL DE LA API

**Base URL:**
```
https://192.168.99.122:3000
```

---

## 📤 ENDPOINTS PARA ENVIAR MENSAJES

### 1. Endpoint GET `/api/enviar`
```http
GET /api/enviar?numero={destinatario}&mensaje={mensaje}
Authorization: Bearer TU_TOKEN_ETERNAL_AQUI
```

**Ejemplo completo:**
```bash
curl -X GET "https://192.168.99.122:3000/api/enviar?numero=573001234567&mensaje=Hola%20mundo" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhcGlfc3lzdGVtX3Blcm1hbmVudCIsInVzZXJuYW1lIjoiYXBpIiwibm9
tYnJlIjoiVXN1YXJpbyBBUEkgRXRlcm5vIiwicm9sIjoiYXBpIiwiaWF0IjoxNzU2MDA5NjAxLCJwZXJtYW5lbnQiOnRydWUsImRlc2NyaXB
0aW9uIjoiVG9rZW4gQVBJIHBlcm1hbmVudGUgcXVlIG51bmNhIGV4cGlyYSJ9.GwPj0htCGiBX62R3GBd_uJNhqwfP3UW4MrOkJAoMcaY"
```

### 2. Endpoint POST `/api/send-message`
```http
POST /api/send-message
Authorization: Bearer TU_TOKEN_ETERNAL_AQUI
Content-Type: application/json

{
  "chatId": "573001234567@c.us",
  "message": "Hola mundo"
}
```

**Ejemplo completo:**
```bash
curl -X POST "https://192.168.99.122:3000/api/send-message" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhcGlfc3lzdGVtX3Blcm1hbmVudCIsInVzZXJuYW1lIjoiYXBpIiwibm9
tYnJlIjoiVXN1YXJpbyBBUEkgRXRlcm5vIiwicm9sIjoiYXBpIiwiaWF0IjoxNzU2MDA5NjAxLCJwZXJtYW5lbnQiOnRydWUsImRlc2NyaXB
0aW9uIjoiVG9rZW4gQVBJIHBlcm1hbmVudGUgcXVlIG51bmNhIGV4cGlyYSJ9.GwPj0htCGiBX62R3GBd_uJNhqwfP3UW4MrOkJAoMcaY" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "573001234567@c.us",
    "message": "Hola mundo"
  }'
```

---

## 🔧 CONFIGURACIÓN DE NÚMEROS

### Formatos de números soportados:
- `3001234567` → `573001234567@c.us`
- `573001234567` → `573001234567@c.us`
- `+573001234567` → `573001234567@c.us`

### Formato Chat ID:
- Para usar en `/api/send-message`: `{numero}@c.us`
- Ejemplo: `573001234567@c.us`

---

## 📋 RESPUESTAS DE LA API

### ✅ Respuesta exitosa:
```json
{
  "status": "Mensaje enviado",
  "numeroOriginal": "3001234567",
  "numeroNormalizado": "573001234567",
  "mensaje": "Hola mundo"
}
```

### ❌ Respuestas de error:
```json
// Sin token
{
  "success": false,
  "message": "Token requerido"
}

// Token inválido
{
  "success": false,
  "message": "Token inválido o expirado"
}

// WhatsApp no listo
{
  "success": false,
  "message": "WhatsApp no está conectado"
}

// Error enviando mensaje
{
  "error": "Error enviando mensaje"
}
```

---

## ⚡ EJEMPLOS PRÁCTICOS

### Python con requests:
```python
import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhcGlfc3lzdGVtX3Blcm1hbmVudCIsInVzZXJuYW1lIjoiYXBpIiwibm9
tYnJlIjoiVXN1YXJpbyBBUEkgRXRlcm5vIiwicm9sIjoiYXBpIiwiaWF0IjoxNzU2MDA5NjAxLCJwZXJtYW5lbnQiOnRydWUsImRlc2NyaXB
0aW9uIjoiVG9rZW4gQVBJIHBlcm1hbmVudGUgcXVlIG51bmNhIGV4cGlyYSJ9.GwPj0htCGiBX62R3GBd_uJNhqwfP3UW4MrOkJAoMcaY"

headers = {
    'Authorization': f'Bearer {token}'
}

# Enviar mensaje
response = requests.get(
    'https://192.168.99.122:3000/api/enviar',
    params={
        'numero': '573001234567',
        'mensaje': 'Hola desde Python!'
    },
    headers=headers
)

print(response.json())
```

### JavaScript/Node.js:
```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhcGlfc3lzdGVtX3Blcm1hbmVudCIsInVzZXJuYW1lIjoiYXBpIiwibm9
tYnJlIjoiVXN1YXJpbyBBUEkgRXRlcm5vIiwicm9sIjoiYXBpIiwiaWF0IjoxNzU2MDA5NjAxLCJwZXJtYW5lbnQiOnRydWUsImRlc2NyaXB
0aW9uIjoiVG9rZW4gQVBJIHBlcm1hbmVudGUgcXVlIG51bmNhIGV4cGlyYSJ9.GwPj0htCGiBX62R3GBd_uJNhqwfP3UW4MrOkJAoMcaY";

fetch('https://192.168.99.122:3000/api/enviar?numero=573001234567&mensaje=Hola%20desde%20JS', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### PHP:
```php
<?php
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhcGlfc3lzdGVtX3Blcm1hbmVudCIsInVzZXJuYW1lIjoiYXBpIiwibm9
tYnJlIjoiVXN1YXJpbyBBUEkgRXRlcm5vIiwicm9sIjoiYXBpIiwiaWF0IjoxNzU2MDA5NjAxLCJwZXJtYW5lbnQiOnRydWUsImRlc2NyaXB
0aW9uIjoiVG9rZW4gQVBJIHBlcm1hbmVudGUgcXVlIG51bmNhIGV4cGlyYSJ9.GwPj0htCGiBX62R3GBd_uJNhqwfP3UW4MrOkJAoMcaY";

$headers = [
    'Authorization: Bearer ' . $token
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://192.168.99.122:3000/api/enviar?numero=573001234567&mensaje=Hola%20desde%20PHP');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
curl_close($ch);

echo $result;
```

---

## 🔒 SEGURIDAD

- **El token es permanente** - Nunca expira
- **Guarda el token en un lugar seguro**
- **No lo compartas** con personas no autorizadas
- **Si necesitas cambiarlo**, usa la clave secreta para generar uno nuevo

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error 401: Token requerido
- Verifica que estés enviando el header `Authorization: Bearer {token}`

### Error 401: Token inválido o expirado
- Este token nunca expira, verifica que esté copiado correctamente

### Error 503: WhatsApp no está conectado
- El servidor de WhatsApp no está listo, intenta más tarde

### Error 500: Error enviando mensaje
- Revisa el formato del número de teléfono
- Verifica que WhatsApp esté conectado en el servidor

---

## 📞 CONTACTO

Si tienes problemas con la API, revisa:
1. Que el servidor esté ejecutándose
2. Que WhatsApp esté conectado
3. Que el token esté copiado correctamente
4. Que el formato del número sea correcto

---

**¡Tu token API eterno está listo para usar! 🚀**

