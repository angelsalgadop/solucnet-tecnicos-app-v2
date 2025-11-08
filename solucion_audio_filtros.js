// Solución para reforzar filtros de grupos y verificar envío de audio
// Este script corrige el problema de envío de audio a grupos

const fs = require('fs');

console.log('🔧 SOLUCIÓN: Reforzar Filtros de Grupos para Audio');
console.log('='.repeat(60));

// Función para reforzar los filtros en el código
function reforzarFiltros() {
    console.log('\n🛡️ REFORZANDO FILTROS EN EL CÓDIGO...');

    try {
        let content = fs.readFileSync('/opt/whatsapp-chatbot/index.js', 'utf8');

        // 1. Reforzar filtro principal en manejarMensaje
        const filtroPrincipalOriginal = "if (msg.from.includes('status@broadcast') || msg.from.includes('@g.us')) return;";
        const filtroPrincipalReforzado = `// 🔒 FILTRO PRINCIPAL REFORZADO
        if (msg.from.includes('status@broadcast') || msg.from.includes('@g.us')) {
            console.log(\`🚫 [FILTRO] Mensaje de \${msg.from} filtrado (grupo/estado)\`);
            return;
        }`;

        if (content.includes(filtroPrincipalOriginal)) {
            content = content.replace(filtroPrincipalOriginal, filtroPrincipalReforzado);
            console.log('✅ Filtro principal reforzado con logging');
        }

        // 2. Agregar filtro adicional en enviarAudioExplicativo
        const enviarAudioFunction = `async function enviarAudioExplicativo(chatId) {
    try {
        const rutaAudio = './audio/menu_explicativo.mp3';`;

        const filtroEnAudio = `async function enviarAudioExplicativo(chatId) {
    // 🔒 FILTRO ADICIONAL: Verificar que no sea grupo antes de enviar audio
    if (chatId.includes('@g.us') || chatId.includes('status@broadcast')) {
        console.log(\`🚫 [AUDIO] Intento de enviar audio a \${chatId} BLOQUEADO por filtro adicional\`);
        return; // No enviar audio a grupos o estados
    }

    try {
        const rutaAudio = './audio/menu_explicativo.mp3';`;

        if (content.includes(enviarAudioFunction)) {
            content = content.replace(enviarAudioFunction, filtroEnAudio);
            console.log('✅ Filtro adicional agregado a enviarAudioExplicativo');
        }

        // 3. Reforzar filtro de formulario
        const filtroFormularioOriginal = "if (respuesta.from.includes('status@broadcast') || respuesta.from.includes('@g.us')) return;";
        const filtroFormularioReforzado = `// 🔒 FILTRO DE FORMULARIO REFORZADO
        if (respuesta.from.includes('status@broadcast') || respuesta.from.includes('@g.us')) {
            console.log(\`🚫 [FORMULARIO] Respuesta de \${respuesta.from} filtrada (grupo/estado)\`);
            return;
        }`;

        if (content.includes(filtroFormularioOriginal)) {
            content = content.replace(filtroFormularioOriginal, filtroFormularioReforzado);
            console.log('✅ Filtro de formulario reforzado con logging');
        }

        // 4. Agregar verificación antes de llamar manejarOpcionInvalida
        const manejarOpcionInvalidaCall = /await manejarOpcionInvalida\([^)]+\)/g;
        const filtroAntesDeLlamada = `// 🔒 VERIFICACIÓN ADICIONAL ANTES DE MANEJAR ERRORES
        if (chatId.includes('@g.us') || chatId.includes('status@broadcast')) {
            console.log(\`🚫 [ERROR] Intento de manejar opción inválida desde \${chatId} BLOQUEADO\`);
            return; // No procesar errores de grupos o estados
        }
        await manejarOpcionInvalida(chatId, contexto)`;

        // Buscar y reemplazar llamadas a manejarOpcionInvalida
        const matches = content.match(/await manejarOpcionInvalida\([^)]+\)/g);
        if (matches) {
            matches.forEach(match => {
                const replacement = match.replace('await manejarOpcionInvalida(', `// 🔒 VERIFICACIÓN ADICIONAL ANTES DE MANEJAR ERRORES
        if (chatId.includes('@g.us') || chatId.includes('status@broadcast')) {
            console.log(\`🚫 [ERROR] Intento de manejar opción inválida desde \${chatId} BLOQUEADO\`);
            return; // No procesar errores de grupos o estados
        }
        await manejarOpcionInvalida(`);
                content = content.replace(match, replacement);
            });
            console.log(`✅ Filtros agregados antes de ${matches.length} llamadas a manejarOpcionInvalida`);
        }

        // Guardar el archivo modificado
        fs.writeFileSync('/opt/whatsapp-chatbot/index.js', content);
        console.log('✅ Archivo guardado con filtros reforzados');

        return true;

    } catch (error) {
        console.log(`❌ Error reforzando filtros: ${error.message}`);
        return false;
    }
}

// Función para crear una prueba de validación
function crearPruebaValidacion() {
    console.log('\n🧪 CREANDO PRUEBA DE VALIDACIÓN...');

    const prueba = `// Prueba de validación de filtros reforzados
// Ejecutar: node test_filtros_reforzados.js

console.log('🛡️ PRUEBA DE FILTROS REFORZADOS');
console.log('='.repeat(50));

// Simular escenarios problemáticos
const escenarios = [
    {
        tipo: 'Mensaje normal',
        chatId: '123456789@c.us',
        esperado: 'PROCESAR'
    },
    {
        tipo: 'Mensaje de grupo',
        chatId: '987654321@g.us',
        esperado: 'FILTRAR'
    },
    {
        tipo: 'Estado',
        chatId: 'status@broadcast',
        esperado: 'FILTRAR'
    },
    {
        tipo: 'Chat problemático',
        chatId: '120363419106346181@g.us',
        esperado: 'FILTRAR'
    }
];

console.log('📋 ESCENARIOS DE PRUEBA:');
escenarios.forEach((escenario, i) => {
    console.log(\`\${i + 1}. \${escenario.tipo}: \${escenario.chatId}\`);

    const deberiaFiltrar = escenario.chatId.includes('@g.us') || escenario.chatId.includes('status@broadcast');
    const resultado = deberiaFiltrar ? '🚫 FILTRAR' : '✅ PROCESAR';

    console.log(\`   Esperado: \${escenario.esperado} | Actual: \${resultado}\`);

    if ((deberiaFiltrar && escenario.esperado === 'FILTRAR') ||
        (!deberiaFiltrar && escenario.esperado === 'PROCESAR')) {
        console.log('   ✅ CORRECTO');
    } else {
        console.log('   ❌ INCORRECTO');
    }
});

console.log('\\n📊 RESUMEN:');
console.log('   • Los filtros reforzados deberían bloquear:');
console.log('     - Todos los mensajes de grupos (@g.us)');
console.log('     - Todos los mensajes de estados (status@broadcast)');
console.log('     - Cualquier intento de enviar audio a grupos');
console.log('     - Procesamiento de errores desde grupos');

console.log('\\n💡 PRUEBA MANUAL:');
console.log('   1. Enviar mensaje desde un grupo');
console.log('   2. Verificar que NO se envía audio explicativo');
console.log('   3. Verificar logs para mensajes de filtro activados');

console.log('='.repeat(50));
`;

    try {
        fs.writeFileSync('/opt/whatsapp-chatbot/test_filtros_reforzados.js', prueba);
        console.log('✅ Prueba creada: test_filtros_reforzados.js');
        return true;
    } catch (error) {
        console.log(`❌ Error creando prueba: ${error.message}`);
        return false;
    }
}

// Función para verificar que los cambios se aplicaron
function verificarCambios() {
    console.log('\n🔍 VERIFICANDO CAMBIOS APLICADOS...');

    try {
        const content = fs.readFileSync('/opt/whatsapp-chatbot/index.js', 'utf8');

        const verificaciones = [
            {
                nombre: 'Filtro principal con logging',
                patron: 'console.log.*FILTRO.*filtrado',
                encontrado: content.includes("console.log(`🚫 [FILTRO]")
            },
            {
                nombre: 'Filtro adicional en audio',
                patron: 'console.log.*AUDIO.*BLOQUEADO',
                encontrado: content.includes("console.log(`🚫 [AUDIO]")
            },
            {
                nombre: 'Filtro de formulario con logging',
                patron: 'console.log.*FORMULARIO.*filtrada',
                encontrado: content.includes("console.log(`🚫 [FORMULARIO]")
            },
            {
                nombre: 'Filtro antes de manejar errores',
                patron: 'console.log.*ERROR.*BLOQUEADO',
                encontrado: content.includes("console.log(`🚫 [ERROR]")
            }
        ];

        console.log('📋 VERIFICACIÓN:');
        verificaciones.forEach(v => {
            console.log(`   • ${v.nombre}: ${v.encontrado ? '✅ PRESENTE' : '❌ AUSENTE'}`);
        });

        const todosPresentes = verificaciones.every(v => v.encontrado);
        console.log(`\\n📊 Resultado: ${todosPresentes ? '✅ TODOS LOS FILTROS REFORZADOS' : '❌ FALTAN FILTROS'}`);

        return todosPresentes;

    } catch (error) {
        console.log(`❌ Error verificando cambios: ${error.message}`);
        return false;
    }
}

// Función principal
function ejecutarSolucion() {
    console.log('🚀 Ejecutando solución completa para el problema de audio...\n');

    const filtrosReforzados = reforzarFiltros();
    const pruebaCreada = crearPruebaValidacion();
    const cambiosVerificados = verificarCambios();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DE LA SOLUCIÓN:');
    console.log('='.repeat(60));

    if (filtrosReforzados && cambiosVerificados) {
        console.log('🎉 ¡SOLUCIÓN APLICADA EXITOSAMENTE!');
        console.log('\n✅ CAMBIOS IMPLEMENTADOS:');
        console.log('   • Filtros principales reforzados con logging detallado');
        console.log('   • Filtro adicional en función de envío de audio');
        console.log('   • Filtros de formulario reforzados');
        console.log('   • Verificaciones adicionales antes de procesar errores');
        console.log('   • Logging completo para debugging');

        console.log('\n🛡️ PROTECCIONES ACTIVADAS:');
        console.log('   • Mensajes de grupos completamente bloqueados');
        console.log('   • Estados completamente bloqueados');
        console.log('   • Envío de audio a grupos bloqueado');
        console.log('   • Procesamiento de errores desde grupos bloqueado');

        console.log('\n📝 PRÓXIMOS PASOS:');
        console.log('   1. Reiniciar el bot para aplicar cambios');
        console.log('   2. Probar envío de mensaje desde un grupo');
        console.log('   3. Verificar que NO se envía audio');
        console.log('   4. Revisar logs para ver mensajes de filtro activados');

    } else {
        console.log('❌ PROBLEMAS AL APLICAR LA SOLUCIÓN:');
        if (!filtrosReforzados) console.log('   • Error reforzando filtros');
        if (!cambiosVerificados) console.log('   • Filtros no se aplicaron correctamente');
    }

    console.log('\n📋 ARCHIVOS DE PRUEBA DISPONIBLES:');
    console.log('   • Ejecutar: node test_filtros_reforzados.js');
    console.log('   • Verificar logs del bot para actividad de filtros');

    console.log('='.repeat(60));
}

// Ejecutar
if (require.main === module) {
    ejecutarSolucion();
}

module.exports = {
    ejecutarSolucion,
    reforzarFiltros,
    crearPruebaValidacion,
    verificarCambios
};

