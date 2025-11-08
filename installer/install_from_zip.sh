#!/bin/bash

# ===========================================
# INSTALADOR DESDE ZIP - SOLUCNET BOT
# Instalación rápida desde paquete comprimido
# ===========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "instalador_root_completo_final.sh" ]; then
    print_error "No se encuentra el script de instalación principal"
    echo "Asegúrese de estar en el directorio correcto"
    exit 1
fi

# Verificar permisos de root
if [[ $EUID -ne 0 ]]; then
    print_error "Este script debe ejecutarse como root"
    echo
    echo "Uso correcto:"
    echo "  sudo ./install_from_zip.sh"
    echo
    exit 1
fi

print_step "Iniciando instalación desde ZIP..."

# Ejecutar el instalador principal
./instalador_root_completo_final.sh

print_message "Instalación desde ZIP completada exitosamente"
