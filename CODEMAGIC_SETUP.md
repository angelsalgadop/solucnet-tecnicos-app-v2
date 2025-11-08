# 🚀 Compilar APK con Codemagic (GRATIS)

## ⏱️ Tiempo: 10-15 minutos

---

## 📋 Paso 1: Crear Cuenta en Codemagic

1. Ve a: **https://codemagic.io/signup**
2. Click en **"Sign up with GitHub"**
3. Autoriza a Codemagic para acceder a tu cuenta de GitHub
4. ✅ Cuenta creada (es **GRATIS** - 500 minutos al mes gratis)

---

## 📂 Paso 2: Conectar tu Repositorio

1. En el dashboard de Codemagic, click en **"Add application"**
2. Selecciona **"Connect repository from GitHub"**
3. Busca y selecciona: **`solucnet-tecnicos-app`**
4. Click en **"Finish: Add application"**

---

## ⚙️ Paso 3: Configurar el Build

Codemagic detectará automáticamente que es un proyecto Capacitor/Android.

### Opción A: Usar archivo codemagic.yaml (Recomendado)

El archivo `codemagic.yaml` ya está incluido en el repositorio. Codemagic lo detectará automáticamente.

1. En la configuración del proyecto, selecciona **"Use codemagic.yaml"**
2. Selecciona el workflow: **"android-workflow"**
3. ✅ Listo para compilar

### Opción B: Configuración Manual (Si prefieres)

Si prefieres configurar manualmente:

1. **Project type**: Selecciona **"Capacitor"**
2. **Branch**: `main`
3. **Build triggers**: Deja por defecto
4. **Environment variables**: (ninguna necesaria por ahora)
5. **Build configuration**:
   - Android build format: **APK**
   - Build mode: **Debug**

---

## 🔨 Paso 4: Iniciar la Compilación

1. Click en **"Start new build"**
2. Selecciona branch: **`main`**
3. Click en **"Start build"**
4. ⏳ Espera 5-10 minutos (la primera vez tarda más)

---

## 📥 Paso 5: Descargar tu APK

Cuando la compilación termine:

1. Verás **"Build successful"** ✅
2. En la sección **"Artifacts"**:
   - Click en **`app-debug.apk`**
   - Se descargará a tu computadora
3. 🎉 **¡Tu APK está lista!**

---

## 📱 Paso 6: Instalar en tu Teléfono

### Via Cable USB:
1. Habilita "Depuración USB" en el teléfono
2. Conecta el teléfono a la PC
3. Copia el APK al teléfono
4. Abre el archivo APK desde el teléfono
5. Permite "Fuentes desconocidas"
6. Instala

### Via WhatsApp/Email:
1. Envíate el APK a ti mismo
2. Abre el archivo en el teléfono
3. Permite "Fuentes desconocidas"
4. Instala

---

## 🔄 Compilaciones Futuras

Para compilar nuevamente después de hacer cambios:

1. Haz cambios en tu código local
2. `git add .`
3. `git commit -m "Descripción del cambio"`
4. `git push origin main`
5. Codemagic compilará automáticamente (si configuraste triggers)
6. O manualmente: Click en "Start new build"

---

## 📧 Notificaciones por Email

Codemagic te enviará un email a **angelsalgadop@gmail.com** cuando:
- ✅ La compilación sea exitosa
- ❌ La compilación falle

---

## 💰 Límites de la Cuenta Gratuita

- **500 minutos de build** al mes (gratis)
- Cada compilación toma ~5-10 minutos
- = **~50-100 compilaciones gratis** al mes

Más que suficiente para tu proyecto.

---

## ⚡ Tips

1. **Primera compilación**: Tarda 7-10 minutos (descarga dependencias)
2. **Siguientes compilaciones**: 3-5 minutos (usa caché)
3. **Cache limpio**: Si algo falla, intenta "Clean build"
4. **Logs**: Revisa los logs si algo falla (muy detallados)

---

## 🐛 Si Algo Sale Mal

1. **Build falla**: Revisa los logs en Codemagic
2. **APK no genera**: Verifica que `android/` esté en el repo
3. **Timeout**: Aumenta `max_build_duration` en `codemagic.yaml`
4. **Falta alguna dependencia**: Verifica `package.json`

---

## 📚 Recursos

- **Dashboard**: https://codemagic.io/apps
- **Documentación**: https://docs.codemagic.io/
- **Soporte**: support@codemagic.io

---

## ✅ Ventajas de Codemagic

- ✅ Especializado en apps móviles (Flutter, React Native, Capacitor)
- ✅ Configuración automática para Capacitor
- ✅ Interfaz muy intuitiva
- ✅ Builds rápidos (servidores Mac M1)
- ✅ 500 minutos gratis al mes
- ✅ Notificaciones por email
- ✅ Artifacts descargables por 30 días
- ✅ Logs muy detallados
- ✅ Soporte para firma de APK (release)

---

**¡Listo!** En ~15 minutos tendrás tu APK compilada y lista para distribuir a los técnicos.
