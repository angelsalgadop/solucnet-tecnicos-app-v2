-- Tabla para almacenar el historial de mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensaje_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'ID único del mensaje de WhatsApp',
    numero_telefono VARCHAR(20) NOT NULL COMMENT 'Número de teléfono del contacto',
    nombre_contacto VARCHAR(255) DEFAULT NULL COMMENT 'Nombre del contacto',
    tipo_mensaje ENUM('text', 'image', 'video', 'audio', 'document', 'sticker', 'ptt', 'location', 'vcard', 'call_log') NOT NULL DEFAULT 'text',
    contenido_texto TEXT DEFAULT NULL COMMENT 'Contenido del mensaje de texto',
    media_url VARCHAR(500) DEFAULT NULL COMMENT 'URL del archivo multimedia',
    media_mimetype VARCHAR(100) DEFAULT NULL COMMENT 'Tipo MIME del archivo',
    media_filename VARCHAR(255) DEFAULT NULL COMMENT 'Nombre del archivo',
    media_size INT DEFAULT NULL COMMENT 'Tamaño del archivo en bytes',
    es_enviado BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'True si fue enviado por nosotros, False si fue recibido',
    timestamp BIGINT NOT NULL COMMENT 'Timestamp del mensaje en milisegundos',
    fecha_mensaje DATETIME NOT NULL COMMENT 'Fecha y hora del mensaje',
    leido BOOLEAN DEFAULT FALSE COMMENT 'Si el mensaje fue leído',
    from_me BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Si el mensaje es de nosotros',
    quote_mensaje_id VARCHAR(255) DEFAULT NULL COMMENT 'ID del mensaje citado (reply)',
    metadata JSON DEFAULT NULL COMMENT 'Metadatos adicionales del mensaje',
    sincronizado BOOLEAN DEFAULT TRUE COMMENT 'Si el mensaje ya fue sincronizado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_numero_telefono (numero_telefono),
    INDEX idx_fecha_mensaje (fecha_mensaje),
    INDEX idx_timestamp (timestamp),
    INDEX idx_tipo_mensaje (tipo_mensaje)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para tracking de sincronización de contactos
CREATE TABLE IF NOT EXISTS chat_sync_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_telefono VARCHAR(20) UNIQUE NOT NULL,
    nombre_contacto VARCHAR(255) DEFAULT NULL,
    ultimo_mensaje_id VARCHAR(255) DEFAULT NULL,
    ultimo_timestamp BIGINT DEFAULT NULL,
    total_mensajes INT DEFAULT 0,
    sincronizado_completo BOOLEAN DEFAULT FALSE,
    fecha_ultima_sincronizacion DATETIME DEFAULT NULL,
    en_proceso BOOLEAN DEFAULT FALSE,
    error_sincronizacion TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_numero_telefono (numero_telefono),
    INDEX idx_sincronizado (sincronizado_completo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
