# 🔐 INSTALAR CERTIFICADO SSL VÁLIDO PARA CLIENTE.SOLUCNET.COM

## ✅ Verificación Actual

```bash
# DNS apunta correctamente:
cliente.solucnet.com → 181.79.84.3

# Servidor respondiendo en HTTPS:3000 ✅

# Certificado ACTUAL (PROBLEMA):
CN = 192.168.99.122 (autofirmado)
Válido hasta: 24 Ago 2026

# Certificado NECESARIO:
CN = cliente.solucnet.com (Let's Encrypt)
```

---

## 📋 PASOS PARA INSTALAR CERTIFICADO SSL VÁLIDO

### 1️⃣ CONECTARSE AL SERVIDOR

```bash
ssh usuario@181.79.84.3
# O la forma que uses para conectarte al servidor
```

---

### 2️⃣ INSTALAR CERTBOT (Let's Encrypt)

```bash
# Actualizar repos
sudo apt update

# Instalar certbot
sudo apt install certbot -y

# Verificar instalación
certbot --version
```

---

### 3️⃣ GENERAR CERTIFICADO SSL PARA EL DOMINIO

**⚠️ IMPORTANTE:** El puerto 80 (HTTP) debe estar libre temporalmente para la verificación.

#### Opción A: Si el puerto 80 está libre

```bash
sudo certbot certonly --standalone -d cliente.solucnet.com
```

#### Opción B: Si tienes un servidor web (Apache/Nginx) en puerto 80

```bash
# Para Apache
sudo certbot certonly --apache -d cliente.solucnet.com

# Para Nginx
sudo certbot certonly --nginx -d cliente.solucnet.com
```

#### Opción C: Verificación manual (si puerto 80 no está disponible)

```bash
sudo certbot certonly --manual -d cliente.solucnet.com --preferred-challenges dns
```

Esto te dará un registro TXT que debes agregar en tu DNS:

```
_acme-challenge.cliente.solucnet.com TXT "valor-que-te-den"
```

---

### 4️⃣ UBICACIÓN DE LOS CERTIFICADOS GENERADOS

Después de ejecutar certbot, los certificados estarán en:

```bash
/etc/letsencrypt/live/cliente.solucnet.com/fullchain.pem
/etc/letsencrypt/live/cliente.solucnet.com/privkey.pem
```

---

### 5️⃣ ACTUALIZAR EL SERVIDOR NODE.JS

Encuentra el archivo del servidor (probablemente `server.js` o `app.js`) y busca la configuración HTTPS:

```javascript
// ANTES (certificado autofirmado):
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('/path/to/selfsigned.key'),
    cert: fs.readFileSync('/path/to/selfsigned.crt')
};

// DESPUÉS (Let's Encrypt):
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/cliente.solucnet.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/cliente.solucnet.com/fullchain.pem')
};

https.createServer(options, app).listen(3000, () => {
    console.log('✅ Servidor HTTPS corriendo en puerto 3000');
});
```

---

### 6️⃣ DAR PERMISOS AL USUARIO DE NODE.JS

Si el servidor Node.js corre con un usuario sin privilegios (no root), dale permiso para leer los certificados:

```bash
# Opción A: Agregar usuario al grupo ssl-cert
sudo usermod -a -G ssl-cert nombre_usuario

# Opción B: Copiar certificados a ubicación accesible
sudo cp /etc/letsencrypt/live/cliente.solucnet.com/fullchain.pem /home/usuario/certs/
sudo cp /etc/letsencrypt/live/cliente.solucnet.com/privkey.pem /home/usuario/certs/
sudo chown usuario:usuario /home/usuario/certs/*.pem
sudo chmod 600 /home/usuario/certs/*.pem
```

---

### 7️⃣ REINICIAR EL SERVIDOR NODE.JS

```bash
# Si usas PM2
pm2 restart nombre-del-proceso

# Si usas systemd
sudo systemctl restart nombre-servicio

# Si corre manualmente
# Ctrl+C para detener
node server.js
```

---

### 8️⃣ VERIFICAR QUE FUNCIONA

Desde tu computadora local:

```bash
# Ver certificado nuevo
echo | openssl s_client -connect cliente.solucnet.com:3000 -servername cliente.solucnet.com 2>/dev/null | openssl x509 -noout -subject -issuer

# Debería mostrar:
# subject=CN = cliente.solucnet.com
# issuer=C = US, O = Let's Encrypt, CN = R3 (o R10, R11)
```

```bash
# Probar desde navegador
curl -I https://cliente.solucnet.com:3000

# Debería responder sin errores de certificado
```

---

### 9️⃣ RENOVACIÓN AUTOMÁTICA

Let's Encrypt expira cada 90 días, pero certbot puede renovar automáticamente:

```bash
# Probar renovación
sudo certbot renew --dry-run

# Si funciona, agregar a crontab para renovación automática
sudo crontab -e

# Agregar esta línea (checa diariamente y renueva si falta menos de 30 días):
0 3 * * * certbot renew --quiet --post-hook "pm2 restart nombre-del-proceso"
```

---

## 🔟 DESPUÉS DE INSTALAR EL CERTIFICADO

1. **Compilar APK nuevo** (el commit `d210624` ya tiene el timeout fix)

2. **Probar en el teléfono:**
   - Con Edge DevTools abierto
   - Hacer login
   - Debería cargar las visitas sin problemas ✅

3. **Verificar en consola:**
   ```
   ✅ [OFFLINE MANAGER] Sistema offline inicializado correctamente
   ✅ Datos actualizados detectados, recargando vista
   ```

---

## ❓ TROUBLESHOOTING

### Error: "Port 80 already in use"

```bash
# Ver qué proceso usa el puerto 80
sudo netstat -tlnp | grep :80

# Si es Apache o Nginx, usar certificación vía plugin (--apache o --nginx)
```

### Error: "Permission denied reading certificate"

```bash
# Verificar permisos
ls -la /etc/letsencrypt/live/cliente.solucnet.com/

# Dar permisos de lectura
sudo chmod 644 /etc/letsencrypt/live/cliente.solucnet.com/fullchain.pem
```

### Error: "DNS validation failed"

```bash
# Verificar que el DNS apunta correctamente
nslookup cliente.solucnet.com

# Debe mostrar: 181.79.84.3
```

---

## 📞 NECESITAS AYUDA?

Si tienes dudas o errores, dime:

1. ¿En qué paso te quedaste?
2. ¿Qué mensaje de error aparece?
3. ¿El servidor Node.js corre con PM2, systemd o manualmente?
4. ¿Dónde está el código del servidor? (ruta del archivo)
