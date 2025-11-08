#!/bin/bash

###############################################################################
# Script de Backup Automático - Base de Datos solucnet_auth_system
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
FECHA=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/solucnet_auth_system_${FECHA}.sql"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔐 BACKUP DE BASE DE DATOS - solucnet_auth_system${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Mostrar información
echo -e "${YELLOW}📊 Información del backup:${NC}"
echo -e "   Base de datos: ${GREEN}${DB_NAME}${NC}"
echo -e "   Servidor: ${GREEN}${DB_HOST}${NC}"
echo -e "   Fecha: ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "   Archivo: ${GREEN}$(basename $BACKUP_FILE)${NC}"
echo ""

# Verificar que la base de datos existe
echo -e "${YELLOW}🔍 Verificando base de datos...${NC}"
if ! mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -e "USE $DB_NAME" 2>/dev/null; then
    echo -e "${RED}❌ Error: La base de datos $DB_NAME no existe${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Base de datos encontrada${NC}"
echo ""

# Mostrar tablas que se van a respaldar
echo -e "${YELLOW}📋 Tablas a respaldar:${NC}"
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | while read table; do
    ROWS=$(mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "SELECT COUNT(*) FROM $table" 2>/dev/null | tail -n 1)
    echo -e "   ${GREEN}✓${NC} $table (${ROWS} registros)"
done
echo ""

# Realizar el backup
echo -e "${YELLOW}💾 Creando backup...${NC}"
mysqldump -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --complete-insert \
    --databases "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null

# Verificar que el backup se creó correctamente
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup creado exitosamente${NC}"
    echo -e "   Tamaño: ${GREEN}${BACKUP_SIZE}${NC}"
    echo ""

    # Comprimir el backup
    echo -e "${YELLOW}🗜️  Comprimiendo backup...${NC}"
    gzip "$BACKUP_FILE"

    if [ -f "$BACKUP_COMPRESSED" ]; then
        COMPRESSED_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
        echo -e "${GREEN}✅ Backup comprimido exitosamente${NC}"
        echo -e "   Tamaño comprimido: ${GREEN}${COMPRESSED_SIZE}${NC}"
        echo -e "   Archivo: ${GREEN}${BACKUP_COMPRESSED}${NC}"
    fi
else
    echo -e "${RED}❌ Error al crear el backup${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📁 Backups anteriores:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n 5 | while read line; do
    echo "   $line"
done

# Limpiar backups antiguos (mantener los últimos 10)
echo ""
echo -e "${YELLOW}🗑️  Limpiando backups antiguos (manteniendo los últimos 10)...${NC}"
cd "$BACKUP_DIR"
ls -t solucnet_auth_system_*.sql.gz 2>/dev/null | tail -n +11 | while read old_backup; do
    rm -f "$old_backup"
    echo -e "   ${RED}✗${NC} Eliminado: $old_backup"
done

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ BACKUP COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Ubicación del backup:${NC}"
echo -e "   ${GREEN}${BACKUP_COMPRESSED}${NC}"
echo ""
echo -e "${BLUE}💡 Para restaurar este backup, ejecuta:${NC}"
echo -e "   ${YELLOW}/root/whatsapp-chatbot/restaurar_solucnet.sh $(basename $BACKUP_COMPRESSED)${NC}"
echo ""
