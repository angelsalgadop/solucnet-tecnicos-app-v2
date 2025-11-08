/**
 * ARCHIVO DE INTEGRACIÓN - AGREGAR AL FINAL DE tecnicos_visitas.js
 *
 * Este archivo contiene las modificaciones necesarias para integrar
 * la funcionalidad de captura de seriales en las visitas técnicas
 */

// ============================================================
// MODIFICACIÓN 1: Agregar botón de serial en completarVisita
// ============================================================
// Reemplazar la función completarVisita existente con esta versión mejorada:

/*
function completarVisita(visitaId) {
    // Pausar actualización automática mientras se completa la visita
    detenerActualizacionAutomatica();

    const visita = visitasAsignadas.find(v => v.id == visitaId);
    if (!visita) return;

    // Resetear coordenadas capturadas
    coordenadasCapturadas = null;

    // Resetear serial capturado
    window.serialEquipoCapturado = null;

    // Determinar si se requieren coordenadas GPS según el motivo de visita
    const seccionCoordenadas = document.getElementById('seccionCoordenadas');
    const motivoVisita = visita.motivo_visita ? visita.motivo_visita.toLowerCase() : '';
    const requiereGPS = motivoVisita.includes('traslado') || motivoVisita.includes('instalación') || motivoVisita.includes('instalacion');

    // Determinar si es instalación (requiere captura de serial)
    const esInstalacion = motivoVisita.includes('instalación') || motivoVisita.includes('instalacion');

    console.log('🔍 Debug motivo visita:', {
        motivoOriginal: visita.motivo_visita,
        motivoLower: motivoVisita,
        requiereGPS: requiereGPS,
        esInstalacion: esInstalacion
    });

    if (requiereGPS) {
        // Mostrar sección de coordenadas solo para traslado e instalación
        seccionCoordenadas.classList.remove('d-none');
        console.log('✅ Mostrando sección de coordenadas GPS');
        // Resetear estado de coordenadas
        document.getElementById('estadoCoordenadas').classList.add('d-none');
        document.getElementById('btnTomarCoordenadas').disabled = false;
    } else {
        // Ocultar sección de coordenadas para otros motivos
        seccionCoordenadas.classList.add('d-none');
        console.log('❌ Ocultando sección de coordenadas GPS');
    }

    // Llenar información del cliente
    let clienteInfo = `
        <p><strong>Nombre:</strong> ${visita.cliente_nombre}</p>
        <p><strong>Cédula:</strong> ${visita.cliente_cedula}</p>
        <p><strong>Teléfono:</strong> ${visita.cliente_telefono || 'No disponible'}</p>
        <p><strong>Fecha programada:</strong> ${new Date(visita.fecha_programada).toLocaleDateString()}</p>
        <p><strong>Motivo:</strong> ${visita.motivo_visita}</p>
    `;

    // ** NUEVA FUNCIONALIDAD: Agregar sección de serial si es instalación **
    if (esInstalacion) {
        clienteInfo += `
            <hr>
            <div class="alert alert-primary">
                <h6><i class="fas fa-barcode"></i> Serial del Equipo (OBLIGATORIO)</h6>
                <p class="mb-2">Debes capturar el serial del modem/equipo para esta instalación.</p>
                <button type="button" class="btn btn-primary btn-sm" onclick="abrirModalSerialEquipo(${visitaId}, '${visita.motivo_visita}')">
                    <i class="fas fa-barcode"></i> Capturar Serial del Equipo
                </button>
                <div id="serialCapturadoInfo" class="mt-2"></div>
            </div>
        `;
    } else {
        // ** NUEVA FUNCIONALIDAD: Checkbox para cambio de equipo en otras visitas **
        clienteInfo += `
            <hr>
            <div class="card border-primary">
                <div class="card-body">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="checkboxCambioEquipo" onchange="toggleCambioEquipo()">
                        <label class="form-check-label" for="checkboxCambioEquipo">
                            <strong>¿Cambiaste el equipo?</strong>
                        </label>
                    </div>
                    <div id="seccionCambioEquipo" class="d-none mt-3">
                        <div class="alert alert-warning">
                            <p class="mb-2"><i class="fas fa-exclamation-triangle"></i> Indica el serial del nuevo equipo instalado.</p>
                            <button type="button" class="btn btn-warning btn-sm" onclick="abrirModalSerialEquipo(${visitaId}, '${visita.motivo_visita}')">
                                <i class="fas fa-barcode"></i> Capturar Serial del Nuevo Equipo
                            </button>
                            <div id="serialCapturadoInfo" class="mt-2"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Agregar información de equipos si está disponible
    if (visita.serial_equipo_asignado || visita.localidad || visita.usuario_ppp || (visita.todos_los_equipos && visita.todos_los_equipos.length > 0)) {
        clienteInfo += `<hr><h6><i class="fas fa-microchip"></i> Información de Equipos Actuales</h6>`;

        if (visita.localidad) {
            clienteInfo += `<p><strong><i class="fas fa-map-marker-alt"></i> Localidad:</strong> ${visita.localidad}</p>`;
        }

        if (visita.usuario_ppp) {
            clienteInfo += `<p><strong><i class="fas fa-user"></i> Usuario PPP:</strong> ${visita.usuario_ppp}</p>`;
        }

        // Mostrar todos los equipos si están disponibles
        if (visita.todos_los_equipos && visita.todos_los_equipos.length > 0) {
            clienteInfo += `
                <div class="border-start border-warning border-4 ps-3 mb-3 bg-warning-subtle rounded p-3">
                    <p class="mb-3"><strong><i class="fas fa-microchip text-warning"></i> EQUIPOS ASIGNADOS AL CLIENTE:</strong></p>
            `;

            visita.todos_los_equipos.forEach((equipo, index) => {
                clienteInfo += `
                    <div class="mb-3 p-2 bg-white rounded border ${index < visita.todos_los_equipos.length - 1 ? 'mb-3' : ''}">
                        <div class="row g-2">
                            <div class="col-md-4">
                                <p class="mb-1"><strong>Tipo:</strong><br><span class="text-dark">${equipo.tipo}</span></p>
                            </div>
                            <div class="col-md-5">
                                <p class="mb-1"><strong>Serial:</strong><br><span class="text-primary fw-bold font-monospace">${equipo.serial}</span></p>
                            </div>
                            <div class="col-md-3">
                                <p class="mb-1"><strong>Estado:</strong><br><span class="badge bg-info fs-6">${equipo.estado}</span></p>
                            </div>
                        </div>
                    </div>
                `;
            });

            clienteInfo += `
                    <div class="text-center mt-2">
                        <small class="text-muted"><i class="fas fa-info-circle"></i> Total: ${visita.todos_los_equipos.length} equipos registrados</small>
                    </div>
                </div>
            `;
        } else if (visita.serial_equipo_asignado) {
            // Fallback para un solo equipo
            clienteInfo += `
                <div class="border-start border-warning border-4 ps-3 mb-3 bg-warning-subtle rounded p-3">
                    <p class="mb-2"><strong><i class="fas fa-microchip text-warning"></i> EQUIPO ASIGNADO:</strong></p>
                    <div class="p-2 bg-white rounded border">
                        <div class="row g-2">
                            <div class="col-md-4">
                                <p class="mb-1"><strong>Tipo:</strong><br><span class="text-dark">${visita.equipo_tipo || 'No especificado'}</span></p>
                            </div>
                            <div class="col-md-5">
                                <p class="mb-1"><strong>Serial:</strong><br><span class="text-primary fw-bold font-monospace">${visita.serial_equipo_asignado}</span></p>
                            </div>
                            <div class="col-md-3">
                                <p class="mb-1"><strong>Estado:</strong><br><span class="badge bg-info fs-6">${visita.equipo_estado || 'comodato'}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    document.getElementById('datosCliente').innerHTML = clienteInfo;

    document.getElementById('visitaId').value = visitaId;
    document.getElementById('tecnicoId').value = tecnicoActual ? tecnicoActual.id : '';

    // Limpiar formulario
    document.getElementById('formCompletarVisita').reset();
    document.getElementById('previsualizacionFotos').innerHTML = '';
    fotosSeleccionadas = [];

    // Limpiar inputs de fotos
    document.getElementById('fotosReporte').value = '';
    document.getElementById('fotosCamara').value = '';
    document.getElementById('fotosGaleria').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalCompletarVisita'));
    modal.show();

    // Reanudar actualización automática cuando se cierre el modal
    document.getElementById('modalCompletarVisita').addEventListener('hidden.bs.modal', function() {
        iniciarActualizacionAutomatica();
    }, { once: true });
}
*/

// ============================================================
// MODIFICACIÓN 2: Nueva función para toggle de cambio de equipo
// ============================================================

function toggleCambioEquipo() {
    const checkbox = document.getElementById('checkboxCambioEquipo');
    const seccion = document.getElementById('seccionCambioEquipo');

    if (checkbox && checkbox.checked) {
        seccion.classList.remove('d-none');
    } else {
        seccion.classList.add('d-none');
        // Limpiar serial si se desmarca
        window.serialEquipoCapturado = null;
        const infoDiv = document.getElementById('serialCapturadoInfo');
        if (infoDiv) {
            infoDiv.innerHTML = '';
        }
    }
}

// Agregar función global
window.toggleCambioEquipo = toggleCambioEquipo;

// ============================================================
// MODIFICACIÓN 3: Modificar guardarReporteVisita para asignar equipo
// ============================================================

// Agregar ANTES de la validación de fotos en guardarReporteVisita:

/*
// NUEVA VALIDACIÓN: Serial obligatorio para instalaciones
const motivoVisita = visita.motivo_visita ? visita.motivo_visita.toLowerCase() : '';
const esInstalacion = motivoVisita.includes('instalación') || motivoVisita.includes('instalacion');

if (esInstalacion && !window.serialEquipoCapturado) {
    mostrarAlerta('❌ ERROR: Debes capturar el serial del equipo antes de completar la instalación. Presiona el botón "Capturar Serial del Equipo".', 'danger');
    return;
}

// Validación para cambio de equipo
const checkboxCambioEquipo = document.getElementById('checkboxCambioEquipo');
if (checkboxCambioEquipo && checkboxCambioEquipo.checked && !window.serialEquipoCapturado) {
    mostrarAlerta('❌ ERROR: Marcaste que cambiaste el equipo, pero no capturaste el serial del nuevo equipo.', 'danger');
    return;
}
*/

// Agregar DESPUÉS de guardar el reporte exitosamente:

/*
// Asignar equipo si se capturó serial
if (window.serialEquipoCapturado) {
    console.log(`📦 [GUARDAR REPORTE] Asignando equipo con serial: ${window.serialEquipoCapturado}`);

    const resultadoAsignacion = await asignarEquipoAlCompletar(visitaId, window.serialEquipoCapturado);

    if (resultadoAsignacion.success) {
        console.log(`✅ [GUARDAR REPORTE] Equipo asignado exitosamente: ${resultadoAsignacion.message}`);
    } else {
        console.error(`⚠️ [GUARDAR REPORTE] Error asignando equipo: ${resultadoAsignacion.message}`);
        // No fallar la visita si hay error asignando equipo, solo avisar
        mostrarAlerta(`⚠️ Visita completada, pero hubo un error asignando el equipo: ${resultadoAsignacion.message}`, 'warning');
    }

    // Limpiar serial capturado
    window.serialEquipoCapturado = null;
}
*/

console.log('✅ [INTEGRACION SERIAL] Archivo de integración cargado');
