#!/bin/bash

###############################################################################
# Script de Restauración - Base de Datos solucnet_auth_system
###############################################################################

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración de la base de datos
DB_USER="debian-sys-maint"
DB_PASS="IOHcXunF7795fMRI"
DB_NAME="solucnet_auth_system"
DB_HOST="localhost"

# Directorio de backups
BACKUP_DIR="/root/whatsapp-chatbot/backups"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔄 RESTAURACIÓN DE BASE DE DATOS - solucnet_auth_system${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar si se proporcionó un archivo
if [ -z "$1" ]; then
    echo -e "${YELLOW}📁 Backups disponibles:${NC}"
    echo ""

    # Listar backups disponibles
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/*.sql.gz 2>/dev/null)" ]; then
        echo -e "${RED}❌ No hay backups disponibles en $BACKUP_DIR${NC}"
        exit 1
    fi

    ls -lht "$BACKUP_DIR"/*.sql.gz | head -n 10 | nl | while read num line; do
        filename=$(echo "$line" | awk '{print $NF}')
        size=$(echo "$line" | awk '{print $5}')
        date=$(echo "$line" | awk '{print $6, $7, $8}')
        echo -e "   ${GREEN}[$num]${NC} $(basename $filename) - ${size} - ${date}"
    done

    echo ""
    echo -e "${YELLOW}💡 Uso:${NC}"
    echo -e "   ${BLUE}$0 <nombre_archivo.sql.gz>${NC}"
    echo ""
    echo -e "${YELLOW}Ejemplo:${NC}"
    echo -e "   ${BLUE}$0 solucnet_auth_system_20251018_120000.sql.gz${NC}"
    exit 0
fi

# Archivo a restaurar
BACKUP_FILE="$1"

# Si no se proporcionó la ruta completa, asumir que está en BACKUP_DIR
if [ ! -f "$BACKUP_FILE" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${1}"
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: El archivo $BACKUP_FILE no existe${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Información de la restauración:${NC}"
echo -e "   Archivo: ${GREEN}$(basename $BACKUP_FILE)${NC}"
echo -e "   Tamaño: ${GREEN}$(du -h "$BACKUP_FILE" | cut -f1)${NC}"
echo -e "   Fecha del archivo: ${GREEN}$(date -r "$BACKUP_FILE" '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "   Base de datos destino: ${GREEN}${DB_NAME}${NC}"
echo ""

# Advertencia
echo -e "${RED}⚠️  ADVERTENCIA:${NC}"
echo -e "${YELLOW}   Esta operación SOBRESCRIBIRÁ todos los datos actuales de la base de datos${NC}"
echo -e "${YELLOW}   ${DB_NAME} con los datos del backup.${NC}"
echo ""
echo -e "${YELLOW}   Se recomienda crear un backup de seguridad antes de continuar.${NC}"
echo ""

# Confirmación
read -p "¿Deseas continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    echo -e "${YELLOW}❌ Operación cancelada${NC}"
    exit 0
fi

echo ""

# Crear backup de seguridad de la base de datos actual
echo -e "${YELLOW}🔐 Creando backup de seguridad de la base de datos actual...${NC}"
SAFETY_BACKUP="${BACKUP_DIR}/SAFETY_BACKUP_$(date +%Y%m%d_%H%M%S).sql.gz"
mysqldump -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --databases "$DB_NAME" 2>/dev/null | gzip > "$SAFETY_BACKUP"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup de seguridad creado: $(basename $SAFETY_BACKUP)${NC}"
else
    echo -e "${RED}❌ Error al crear backup de seguridad${NC}"
    exit 1
fi

echo ""

# Descomprimir el backup
echo -e "${YELLOW}📦 Descomprimiendo backup...${NC}"
TEMP_SQL="/tmp/restore_temp_$(date +%s).sql"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"
else
    cp "$BACKUP_FILE" "$TEMP_SQL"
fi

if [ ! -f "$TEMP_SQL" ]; then
    echo -e "${RED}❌ Error al descomprimir el archivo${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivo descomprimido${NC}"
echo ""

# Restaurar el backup
echo -e "${YELLOW}🔄 Restaurando base de datos...${NC}"
echo -e "${YELLOW}   Esto puede tomar varios minutos dependiendo del tamaño...${NC}"
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" < "$TEMP_SQL" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de datos restaurada exitosamente${NC}"

    # Verificar tablas
    echo ""
    echo -e "${YELLOW}📋 Verificando tablas restauradas:${NC}"
    mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | while read table; do
        ROWS=$(mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "SELECT COUNT(*) FROM $table" 2>/dev/null | tail -n 1)
        echo -e "   ${GREEN}✓${NC} $table (${ROWS} registros)"
    done
else
    echo -e "${RED}❌ Error al restaurar la base de datos${NC}"
    echo ""
    echo -e "${YELLOW}💡 Puedes restaurar el backup de seguridad ejecutando:${NC}"
    echo -e "   ${BLUE}$0 $(basename $SAFETY_BACKUP)${NC}"
    rm -f "$TEMP_SQL"
    exit 1
fi

# Limpiar archivo temporal
rm -f "$TEMP_SQL"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ RESTAURACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Backup de seguridad guardado en:${NC}"
echo -e "   ${GREEN}${SAFETY_BACKUP}${NC}"
echo ""
