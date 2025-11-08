#!/usr/bin/env python3
"""
Script para construir la nueva interfaz de WhatsApp Web
Combina CSS moderno + HTML estructurado + JavaScript original
"""

import re

print("🚀 Iniciando construcción de la nueva interfaz...")

# Leer el archivo original completo
print("📖 Leyendo archivo original...")
with open('/root/whatsapp-chatbot/public/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    original_content = f.read()

# Extraer el JavaScript (desde <script> hasta </script> o desde donde comienza el JS)
print("🔍 Extrayendo JavaScript original...")
js_match = re.search(r'<script[^>]*>(.*?)</script>', original_content, re.DOTALL)
if not js_match:
    # Si no hay tag script, buscar donde comienza el JavaScript inline
    # Generalmente después del último </div> del body
    lines = original_content.split('\n')
    js_start_line = 0
    for i, line in enumerate(lines):
        if '<script>' in line or 'let currentChatId' in line or 'let chats = new Map()' in line:
            js_start_line = i
            break

    if js_start_line > 0:
        javascript_code = '\n'.join(lines[js_start_line:])
        # Limpiar tags de script si existen
        javascript_code = javascript_code.replace('<script>', '').replace('</script>', '')
        javascript_code = javascript_code.replace('</body>', '').replace('</html>', '')
    else:
        print("⚠️  No se encontró JavaScript, usando líneas 2703+")
        javascript_code = '\n'.join(lines[2702:])  # línea 2703 en índice 2702
else:
    javascript_code = js_match.group(1)

print(f"✅ JavaScript extraído ({len(javascript_code)} caracteres)")

# Leer la nueva plantilla base que creamos
print("📖 Leyendo plantilla nueva...")
with open('/root/whatsapp-chatbot/public/index_new.html', 'r', encoding='utf-8') as f:
    new_template = f.read()

# Ahora construir el HTML completo del BODY con el diseño de WhatsApp Web
body_html = '''
    <!-- LOGIN SCREEN -->
    <div class="login-container" id="login-container">
        <div class="login-card">
            <div class="login-header">
                <i class="fab fa-whatsapp"></i>
                <h1>SOLUCNET</h1>
                <p>Panel de Control WhatsApp Business</p>
            </div>

            <form class="login-form" id="login-form">
                <div id="login-error"></div>

                <div class="form-group">
                    <label for="username">USUARIO</label>
                    <div class="input-wrapper">
                        <i class="fas fa-user"></i>
                        <input type="text" id="username" name="username" required autocomplete="username" placeholder="Ingresa tu usuario">
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">CONTRASEÑA</label>
                    <div class="input-wrapper">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Ingresa tu contraseña">
                    </div>
                </div>

                <button type="submit" id="login-btn">
                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                </button>
            </form>

            <div class="login-info">
                <h4>👤 Usuarios de prueba:</h4>
                <ul>
                    <li><i class="fas fa-check"></i> <strong>admin</strong> / admin123 (Administrador)</li>
                    <li><i class="fas fa-check"></i> <strong>soporte</strong> / soporte123 (Soporte)</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- MAIN APPLICATION -->
    <div id="main-container">
        <div class="whatsapp-wrapper">

            <!-- SIDEBAR -->
            <div class="sidebar" id="sidebar">
                <!-- Sidebar Header -->
                <div class="sidebar-header">
                    <div class="sidebar-header-left">
                        <div class="user-avatar" title="Usuario actual">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-info">
                            <div class="user-name" id="current-user-name">SOLUCNET</div>
                            <div class="connection-status">
                                <span class="status-indicator disconnected" id="connection-status"></span>
                                <span id="status-text">Desconectado</span>
                            </div>
                        </div>
                    </div>
                    <div class="sidebar-header-actions">
                        <div id="session-counter" title="Tiempo restante de sesión - Clic para extender">
                            <i class="fas fa-clock"></i>
                            <span id="session-time">15:00</span>
                        </div>
                        <button class="header-icon-btn" id="admin-visits-btn" title="Gestión de Visitas">
                            <i class="fas fa-users-cog"></i>
                        </button>
                        <button class="header-icon-btn" id="scan-qr-btn" title="Escanear código QR">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button class="header-icon-btn" id="logout-btn" title="Cerrar sesión">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Panel Buttons -->
                <div class="panel-buttons">
                    <button class="panel-btn btn-health" onclick="showHealthDashboard()" title="Dashboard de Salud">
                        <i class="fas fa-heartbeat"></i>
                        <span>Salud</span>
                    </button>
                    <button class="panel-btn btn-omitted" onclick="showOmittedModal()" title="Números Omitidos">
                        <i class="fas fa-ban"></i>
                        <span>Omitidos</span>
                    </button>
                    <button class="panel-btn btn-logs" onclick="showLogsAPIModal()" title="Logs de API">
                        <i class="fas fa-list"></i>
                        <span>Logs</span>
                    </button>
                    <button class="panel-btn btn-admin" onclick="showUsersAdminModal()" title="Administrar Usuarios">
                        <i class="fas fa-users-cog"></i>
                        <span>Usuarios</span>
                    </button>
                    <button class="panel-btn btn-clear" onclick="clearAllChats()" title="Limpiar Chats">
                        <i class="fas fa-broom"></i>
                        <span>Limpiar</span>
                    </button>
                </div>

                <!-- Chat Filters -->
                <div class="chat-filters">
                    <button class="filter-btn active" data-filter="all">
                        <i class="fas fa-comments"></i> Todos
                    </button>
                    <button class="filter-btn" data-filter="bot">
                        <i class="fas fa-robot"></i> Bot
                    </button>
                    <button class="filter-btn" data-filter="human">
                        <i class="fas fa-user"></i> Humano
                    </button>
                </div>

                <!-- Chat List -->
                <div id="chat-list">
                    <!-- Chats will be loaded here dynamically -->
                </div>

                <!-- New Chat Button -->
                <button class="new-chat-btn" onclick="showNewChatModal()" title="Nuevo Chat">
                    <i class="fas fa-comment-medical"></i>
                </button>
            </div>

            <!-- MAIN CHAT AREA -->
            <div class="main-area">
                <!-- Empty State -->
                <div id="empty-state">
                    <i class="fab fa-whatsapp"></i>
                    <h2>WhatsApp Business Panel</h2>
                    <p>Selecciona un chat del panel lateral para comenzar a conversar.<br>
                    Puedes cambiar entre modo Bot (automático) y Humano (manual) en cualquier momento.</p>
                </div>

                <!-- Chat Area -->
                <div id="chat-area">
                    <!-- Chat Header -->
                    <div class="chat-header-main">
                        <div class="chat-header-left">
                            <button id="back-to-sidebar-btn" onclick="showSidebarFromChat()" title="Volver">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <div class="chat-header-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="chat-header-info">
                                <div id="current-chat-name">Cliente</div>
                                <div id="current-chat-subtitle">Selecciona un chat</div>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <button class="chat-action-btn" id="refresh-messages-btn" title="Refrescar mensajes">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button class="chat-action-btn" id="toggle-mode-btn" title="Cambiar modo">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                            <button class="chat-action-btn" id="end-chat-btn" title="Finalizar chat">
                                <i class="fas fa-times-circle"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div id="messages-area">
                        <!-- Messages will be loaded here -->
                    </div>

                    <!-- Message Input Area -->
                    <div class="message-input-area">
                        <!-- File Preview Area -->
                        <div class="file-preview-area" id="file-preview-area">
                            <div id="file-preview-list">
                                <!-- File previews will appear here -->
                            </div>
                            <button class="file-preview-remove" id="clear-files-btn" onclick="clearFiles()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- Input Container -->
                        <div class="message-input-container">
                            <button class="input-action-btn" id="attach-btn" title="Adjuntar archivo">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <input type="file" id="file-input" style="display: none;" multiple
                                   accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar">
                            <textarea id="message-input" placeholder="Escribe un mensaje" rows="1"></textarea>
                            <button class="input-action-btn" id="audio-btn" title="Grabar audio">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button id="send-btn" title="Enviar mensaje">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- MODALS -->
    <!-- Los modales se mantienen del original con sus IDs intactos -->
'''

# Leer los modales del archivo original
print("📖 Extrayendo modales originales...")
modals_match = re.search(r'<!-- Modal para Dashboard.*?<!-- Área de notificaciones -->', original_content, re.DOTALL)
if modals_match:
    modals_html = modals_match.group(0)
else:
    # Intentar con otro patrón
    modals_match = re.search(r'<div class="omitted-modal.*?<div id="notifications">', original_content, re.DOTALL)
    if modals_match:
        modals_html = modals_match.group(0)
    else:
        print("⚠️  Usando modales del temp file")
        with open('/root/whatsapp-chatbot/public/body.html.temp', 'r', encoding='utf-8', errors='ignore') as f:
            temp_content = f.read()
        modals_match = re.search(r'<!-- Modal.*', temp_content, re.DOTALL)
        if modals_match:
            modals_html = modals_match.group(0)
        else:
            modals_html = ""

body_html += modals_html + '\n    <!-- Área de notificaciones -->\n    <div id="notifications"></div>\n'

# Construir el archivo final
print("🔨 Construyendo archivo final...")
final_html = new_template + body_html + '''
    <script>
''' + javascript_code + '''
    </script>
</body>
</html>
'''

# Escribir el archivo final
print("💾 Escribiendo archivo final...")
with open('/root/whatsapp-chatbot/public/index.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print("✅ ¡Interfaz completada exitosamente!")
print("📁 Archivo guardado en: /root/whatsapp-chatbot/public/index.html")
print("🔄 El respaldo está en: /root/whatsapp-chatbot/public/index.html.backup")
