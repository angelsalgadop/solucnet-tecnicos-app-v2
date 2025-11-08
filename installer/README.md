# SOLUCNET - Panel de Control WhatsApp con Autenticación

Panel de control completo para WhatsApp con sistema de autenticación de usuarios, roles (admin/soporte), gestión de números omitidos para el chatbot, e integración completa con base de datos MySQL.

## 🚀 Características

### 🔐 Sistema de Autenticación
- **Login seguro** con validación de credenciales
- **Sistema de sesiones** con expiración automática (24 horas)
- **Dos tipos de usuarios**: Administrador y Soporte
- **Botones dinámicos** según el rol del usuario
- **Middleware de autenticación** en endpoints críticos

### 📱 Panel de Control
- **Interfaz moderna** y responsiva
- **Gestión de chats** en tiempo real
- **Envío de mensajes y archivos**
- **Indicador de estado** de conexión WhatsApp
- **Información del usuario** y controles de sesión

### 🚫 Sistema de Números Omitidos
- **Gestión completa** de números que el chatbot debe omitir
- **Interface intuitiva** para agregar/eliminar números
- **Historial de cambios** con información del usuario que realizó la acción
- **Validación automática** en el procesamiento de mensajes

### 🤖 Bot de WhatsApp (Funcionalidades Originales)
- **Bot automatizado** con `whatsapp-web.js`
- **Base de datos MySQL** conectada a múltiples servidores
- **API REST** para envío de mensajes
- **Sistema de soporte** integrado
- **Manejo de estados** de usuarios
- **Logs detallados** de todas las interacciones
- **Horarios de atención** configurables
- **Mensajes de bienvenida** aleatorios
- **Sistema de errores** consecutivos con audio explicativo

## 📋 Requisitos

- Node.js 18+
- MySQL/MariaDB
- Acceso a internet para WhatsApp Web

## 👥 Usuarios y Roles

### Usuarios por Defecto

#### 👑 Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Permisos**: Acceso completo a todas las funciones del sistema

#### 👤 Soporte
- **Usuario**: `soporte`
- **Contraseña**: `soporte123`
- **Permisos**: Acceso básico + gestión de números omitidos

### Funcionalidades por Rol

#### 👤 Usuario Soporte
- ✅ Acceso al panel de control de WhatsApp
- ✅ Gestión de chats y mensajes
- ✅ Gestión de números omitidos
- ✅ Envío de archivos y mensajes
- ❌ Acceso a funciones administrativas avanzadas

#### 👑 Usuario Administrador
- ✅ **Todas las funciones de Soporte**
- ✅ Acceso al botón "Panel Admin"
- ✅ Configuraciones avanzadas del sistema
- ✅ Gestión completa de usuarios (extensible)
- ✅ Funciones administrativas avanzadas

### 🔒 Seguridad del Sistema
- **Hash de contraseñas** con algoritmo SHA-256 + salt personalizado
- **Sesiones seguras** con expiración automática (24 horas)
- **Middleware de autenticación** en endpoints críticos
- **Validación de roles** para acceso a funciones específicas
- **Protección contra accesos no autorizados**

## 🛠️ Instalación

1. **Clonar/descargar el proyecto**
```bash
cd /root/v2
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar base de datos del sistema de autenticación**
```bash
# Ejecutar el script de configuración automática
./setup_auth_system.sh

# O crear manualmente la base de datos
mysql -u root -p < init_auth_system.sql
```

4. **Configurar variables de entorno (Opcional)**
```bash
# Variables para la base de datos del sistema de autenticación
export DB_SYSTEM_HOST=localhost
export DB_SYSTEM_USER=root
export DB_SYSTEM_PASSWORD=tu_password
export DB_SYSTEM_DATABASE=solucnet_auth_system
```

5. **Iniciar el servidor**
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start

# Con PM2
npm run pm2
```

## 🚀 Uso del Sistema

### 1. Acceso al Panel
1. **Iniciar el servidor:**
   ```bash
   npm start
   # O para desarrollo: npm run dev
   ```

2. **Abrir navegador** y acceder a `http://localhost:3000`

3. **Iniciar sesión** con las credenciales correspondientes:
   - **Admin**: usuario `admin` / contraseña `admin123`
   - **Soporte**: usuario `soporte` / contraseña `soporte123`

4. **El sistema mostrará la interfaz** según el rol del usuario

### 2. Gestión de Números Omitidos
1. Hacer clic en el botón **"Números Omitidos"** (visible para todos)
2. **Agregar número**:
   - Ingresar el número (ej: 573001234567)
   - Agregar motivo (opcional)
   - Hacer clic en "Agregar"
3. **Eliminar número**:
   - Hacer clic en el botón 🗑️ junto al número
   - Confirmar la eliminación

### 3. Funciones Administrativas
- Solo visible para usuarios con rol "admin"
- Botón **"Panel Admin"** en la esquina superior derecha
- Funcionalidad extensible para futuras características

### 4. Funcionamiento del Chatbot
- El sistema verifica automáticamente los números omitidos
- Los números en la lista serán ignorados por el chatbot
- Los cambios se aplican en tiempo real

### 5. Gestión de Sesiones
- Las sesiones expiran automáticamente después de 24 horas
- Botón **"Salir"** para cerrar sesión manualmente
- El sistema guarda la sesión en el navegador (localStorage)

### Desarrollo y Producción
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start

# Con PM2
npm run pm2

# Probar conexión a BD
npm test
```

## 🗄️ Estructura de Base de Datos

### Base de Datos Principal (Mikrowisp6)
- **Propósito**: Datos de clientes y facturación
- **Servidores**: Múltiples servidores MySQL distribuidos
- **Uso**: Consultas de clientes, facturas, soporte técnico

### Base de Datos del Sistema (solucnet_auth_system)
- **Propósito**: Autenticación, usuarios y configuración del sistema
- **Estructura**:
  - `usuarios_sistema`: Usuarios y roles del sistema
  - `numeros_omitidos`: Números que el chatbot debe omitir
  - `sesiones`: Sesiones activas de usuarios
  - `logs_sistema`: Logs de auditoría del sistema

## 📁 Estructura del Proyecto

```
/root/v2/
├── index.js                    # Servidor principal
├── db.js                       # Conexiones a MySQL
├── init_auth_system.sql        # Script SQL para inicializar BD del sistema
├── setup_auth_system.sh        # Script de configuración automática
├── public/
│   └── index.html              # Interfaz web con autenticación
├── audio/                      # Archivos de audio del bot
├── imagenes/                   # Imágenes del bot
├── uploads/                    # Archivos subidos por usuarios
├── package.json                # Dependencias
├── mensajes.log               # Logs del sistema
└── README.md                   # Documentación
```

## 🔧 Configuración

### Base de Datos
El bot se conecta a múltiples servidores MySQL configurados en `db.js`:

```javascript
const basesDatos = [
    { host: '192.168.99.50', user: 'root', password: '***', database: 'Mikrowisp6' },
    { host: '192.168.99.11', user: 'root', password: '***', database: 'Mikrowisp6' },
    // ... más servidores
];
```

### Horarios de Atención
- **Días laborales**: Lunes a Sábado
- **Horario**: 8:00 AM - 7:00 PM
- **Fuera de horario**: Mensaje automático de fuera de servicio

## 📱 Funcionalidades del Bot

### Menú Principal
1. **Usuarios registrados** - Reporte de daño, pagos e intermitencias
2. **Nuevo servicio** - Adquirir servicio para nuevos usuarios
3. **Reactivación** - Reactivar servicio suspendido o retirado
4. **Cliente activo** - Problema con reconocimiento de cédula
5. **Volver al menú** - Regresar al menú principal

### Comandos Especiales
- `#` - Volver al menú principal
- `##` - Hablar con asesor humano
- `*` - Cancelar operación actual

### Sistema de Errores
- Después de 3 errores consecutivos, envía audio explicativo
- Reinicia contador de errores después del audio
- Logs detallados de todas las interacciones

## 🔌 API Endpoints

### 🔐 Autenticación
```http
POST /api/login                    # Iniciar sesión
GET  /api/session                  # Verificar sesión activa
POST /api/logout                   # Cerrar sesión
```

### 🚫 Números Omitidos
```http
GET    /api/omitted-numbers        # Obtener lista de números omitidos
POST   /api/omitted-numbers        # Agregar número omitido
DELETE /api/omitted-numbers/:id    # Eliminar número omitido
```

### 📱 WhatsApp (Requieren autenticación)
```http
GET  /api/enviar?numero=1234567890&mensaje=Hola  # Enviar mensaje
POST /api/send-message                          # Enviar mensaje a chat específico
POST /api/send-files                            # Enviar archivos
GET  /api/chats                                 # Obtener lista de chats
POST /api/chats/:id/toggle-mode                 # Cambiar modo del chat
POST /api/chats/:id/end                         # Finalizar chat
GET  /api/stats                                 # Estadísticas del sistema
```

### 📊 Estadísticas y Monitoreo
```http
GET /api/stats                                 # Estadísticas generales
GET /api/qr                                    # Obtener QR de WhatsApp
POST /api/qr/refresh                           # Regenerar QR
```

## 📊 Monitoreo

### Logs
- Todos los mensajes se registran en `mensajes.log`
- Timestamps automáticos
- Estados de conexión y errores

### Estadísticas en Tiempo Real
- Usuarios activos
- Estado de WhatsApp
- Timestamp de última actualización

## 🔒 Seguridad

- Limpieza automática de sesiones inactivas
- Manejo de señales del sistema (SIGINT, SIGTERM)
- Limpieza de procesos Puppeteer al iniciar

## 🐛 Solución de Problemas

### WhatsApp no se conecta
1. Verificar conexión a internet
2. Revisar logs de error
3. Eliminar sesión anterior si es necesario

### Error de base de datos
1. Verificar credenciales en `db.js`
2. Comprobar conectividad a servidores MySQL
3. Ejecutar `npm test` para probar conexiones

### Bot no responde
1. Verificar que el proceso esté ejecutándose
2. Revisar logs en `mensajes.log`
3. Comprobar estado con `/api/stats`

## 📝 Notas

- Las sesiones de WhatsApp se guardan automáticamente
- El bot maneja múltiples usuarios simultáneamente
- Limpieza automática de memoria cada 2 horas
- Compatible con WhatsApp Web y WhatsApp Business

## 🤝 Contribución

Para contribuir al proyecto:
1. Fork el repositorio
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crear un Pull Request

## ✅ Estado del Sistema

### 🔐 Autenticación y Usuarios
- ✅ **Sistema de login** completamente funcional
- ✅ **Dos roles implementados**: Admin y Soporte
- ✅ **Sesiones seguras** con expiración automática
- ✅ **Base de datos dedicada** para usuarios y configuración

### 🚫 Números Omitidos
- ✅ **Gestión completa** desde interfaz web
- ✅ **API REST** para CRUD de números
- ✅ **Validación automática** en el chatbot
- ✅ **Historial de cambios** con tracking de usuarios

### 📱 Panel de Control
- ✅ **Interfaz moderna** y responsiva
- ✅ **Botones dinámicos** según rol de usuario
- ✅ **Integración completa** con chatbot WhatsApp
- ✅ **Sistema de notificaciones** y feedback

### 🔧 Estado de Implementación
- ✅ **Base de datos**: `solucnet_auth_system` creada y configurada
- ✅ **Usuarios**: Admin y Soporte creados por defecto
- ✅ **API Endpoints**: Todas las rutas funcionando
- ✅ **Interfaz**: Login, panel principal y gestión de números
- ✅ **Seguridad**: Autenticación, middleware y validación de roles

## 🔧 Solución de Problemas

### Error: "Cannot POST /api/login"
1. **Verificar** que el servidor esté ejecutándose: `ps aux | grep node`
2. **Reiniciar** el servidor: `node index.js`
3. **Verificar** la base de datos: `./setup_auth_system.sh`

### Error: "Access denied for user"
1. **Ejecutar** el script de configuración: `./setup_auth_system.sh`
2. **Verificar** las credenciales en `db.js`
3. **Reiniciar** el servidor después de la configuración

### Error: Base de datos no existe
```bash
mysql -u root -p -e "CREATE DATABASE solucnet_auth_system;"
./setup_auth_system.sh
```

## 📄 Licencia

Este proyecto es privado para SOLUCNET.

---

**🎉 Sistema Completamente Funcional - SOLUCNET v2.0**
