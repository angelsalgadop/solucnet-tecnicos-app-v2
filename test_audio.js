// Prueba para verificar el envío de audio y diagnóstico del problema
const fs = require('fs');
const path = require('path');

console.log('🎵 DIAGNÓSTICO: Envío de Audio menu_explicativo.mp3');
console.log('='.repeat(60));

// Función para verificar el archivo de audio
function verificarArchivoAudio() {
    console.log('\n📁 VERIFICANDO ARCHIVO DE AUDIO...');

    const rutasPosibles = [
        './audio/menu_explicativo.mp3',
        '/opt/whatsapp-chatbot/audio/menu_explicativo.mp3',
        path.join(__dirname, 'audio', 'menu_explicativo.mp3')
    ];

    rutasPosibles.forEach(ruta => {
        const existe = fs.existsSync(ruta);
        console.log(`   • ${ruta}: ${existe ? '✅ EXISTE' : '❌ NO EXISTE'}`);

        if (existe) {
            const stats = fs.statSync(ruta);
            console.log(`     📊 Tamaño: ${stats.size} bytes`);
            console.log(`     📅 Modificado: ${stats.mtime.toLocaleString()}`);
            console.log(`     👤 Permisos: ${stats.mode.toString(8)}`);
        }
    });

    return fs.existsSync('./audio/menu_explicativo.mp3');
}

// Función para simular la lógica de envío de audio
function simularEnvioAudio() {
    console.log('\n🎧 SIMULANDO ENVÍO DE AUDIO...');

    try {
        const rutaAudio = './audio/menu_explicativo.mp3';
        console.log(`   🔍 Buscando audio en: ${rutaAudio}`);

        if (!fs.existsSync(rutaAudio)) {
            console.log('   ❌ Audio no encontrado');
            console.log('   💬 Enviando mensaje de fallback...');
            return false;
        }

        console.log('   ✅ Audio encontrado');
        console.log('   📤 Simulando envío...');

        // Simular MessageMedia
        const { MessageMedia } = require('whatsapp-web.js');
        const media = MessageMedia.fromFilePath(rutaAudio);

        console.log(`   🎵 MessageMedia creado: ${media.mimetype}, ${media.filename}, tamaño: ${media.data.length} bytes`);
        console.log('   📤 Simulando envío exitoso');

        return true;

    } catch (error) {
        console.log(`   ❌ Error simulando envío: ${error.message}`);
        return false;
    }
}

// Función para analizar el problema del filtro de grupos
function analizarProblemaGrupos() {
    console.log('\n🚫 ANALIZANDO PROBLEMA CON FILTROS DE GRUPOS...');

    // El log mostró que se intentó enviar a: 120363419106346181@g.us
    const chatIdProblema = '120363419106346181@g.us';

    console.log(`   📱 Chat problemático: ${chatIdProblema}`);
    console.log(`   🔍 Es grupo: ${chatIdProblema.includes('@g.us') ? 'SÍ' : 'NO'}`);
    console.log(`   🔍 Es estado: ${chatIdProblema.includes('status@broadcast') ? 'SÍ' : 'NO'}`);

    // Simular los filtros que deberían aplicarse
    const filtros = [
        {
            nombre: 'Filtro principal en manejarMensaje',
            codigo: "if (msg.from.includes('status@broadcast') || msg.from.includes('@g.us')) return;",
            deberiaFiltrar: chatIdProblema.includes('status@broadcast') || chatIdProblema.includes('@g.us')
        },
        {
            nombre: 'Filtro de formulario',
            codigo: "if (respuesta.from.includes('status@broadcast') || respuesta.from.includes('@g.us')) return;",
            deberiaFiltrar: chatIdProblema.includes('status@broadcast') || chatIdProblema.includes('@g.us')
        }
    ];

    filtros.forEach(filtro => {
        console.log(`   • ${filtro.nombre}: ${filtro.deberiaFiltrar ? '🚫 DEBERÍA FILTRAR' : '✅ NO FILTRA'}`);
        if (filtro.deberiaFiltrar) {
            console.log(`     📝 Código: ${filtro.codigo}`);
        }
    });

    return filtros.some(f => f.deberiaFiltrar);
}

// Función para verificar el estado actual del bot
function verificarEstadoBot() {
    console.log('\n🤖 VERIFICANDO ESTADO DEL BOT...');

    try {
        const { execSync } = require('child_process');
        const procesos = execSync('ps aux | grep whatsapp', { encoding: 'utf8' });
        const lineas = procesos.split('\n').filter(line => line.includes('node') && !line.includes('grep'));

        console.log(`   📊 Procesos encontrados: ${lineas.length}`);
        lineas.forEach((line, i) => {
            console.log(`     ${i + 1}. ${line.split(/\s+/).slice(10).join(' ')}`);
        });

        return lineas.length > 0;

    } catch (error) {
        console.log(`   ❌ Error verificando procesos: ${error.message}`);
        return false;
    }
}

// Función para crear una solución
function crearSolucion() {
    console.log('\n🔧 CREANDO SOLUCIÓN...');

    const solucion = `// Verificación adicional para envío de audio
// Ejecutar: node verificar_audio.js

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN FINAL DE AUDIO');
console.log('='.repeat(40));

try {
    // Verificar archivo
    const rutaAudio = path.join(__dirname, 'audio', 'menu_explicativo.mp3');
    console.log(\`📁 Buscando: \${rutaAudio}\`);

    if (fs.existsSync(rutaAudio)) {
        console.log('✅ Archivo encontrado');

        // Verificar que se puede leer
        const stats = fs.statSync(rutaAudio);
        console.log(\`📊 Tamaño: \${stats.size} bytes\`);

        // Verificar que no está corrupto (básico)
        const data = fs.readFileSync(rutaAudio);
        console.log(\`📂 Datos leídos: \${data.length} bytes\`);

        if (data.length === stats.size) {
            console.log('✅ Archivo íntegro');
        } else {
            console.log('❌ Archivo corrupto o problema de lectura');
        }

    } else {
        console.log('❌ Archivo NO encontrado');
        console.log('🔍 Directorio actual:', __dirname);
        console.log('📋 Contenido del directorio audio:');
        const audioDir = path.join(__dirname, 'audio');
        if (fs.existsSync(audioDir)) {
            const files = fs.readdirSync(audioDir);
            files.forEach(file => console.log(\`   • \${file}\`));
        } else {
            console.log('   ❌ Directorio audio no existe');
        }
    }

} catch (error) {
    console.log(\`❌ Error: \${error.message}\`);
}

console.log('='.repeat(40));
`;

    try {
        fs.writeFileSync('/opt/whatsapp-chatbot/verificar_audio.js', solucion);
        console.log('✅ Solución creada: verificar_audio.js');
        return true;
    } catch (error) {
        console.log(`❌ Error creando solución: ${error.message}`);
        return false;
    }
}

// Ejecutar diagnóstico
function ejecutarDiagnostico() {
    console.log('🚀 Ejecutando diagnóstico completo del problema de audio...\n');

    const archivoOk = verificarArchivoAudio();
    const envioOk = simularEnvioAudio();
    const filtrosOk = analizarProblemaGrupos();
    const botOk = verificarEstadoBot();
    crearSolucion();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DEL DIAGNÓSTICO:');
    console.log('='.repeat(60));

    if (archivoOk && envioOk && botOk) {
        console.log('🎵 EL AUDIO DEBERÍA FUNCIONAR CORRECTAMENTE');
        console.log('\n🔍 Posibles causas del problema reportado:');
        console.log('   • El usuario no está recibiendo el audio (pero se está enviando)');
        console.log('   • Problema con el filtro de grupos (se intentó enviar a un grupo)');
        console.log('   • El audio se envía pero llega como mensaje de texto fallback');

        if (filtrosOk) {
            console.log('\n🚫 IMPORTANTE: Los filtros de grupos deberían bloquear el envío a grupos');
            console.log('   • Chat problemático: 120363419106346181@g.us');
            console.log('   • Los filtros están configurados para bloquear este chat');
            console.log('   • Verificar por qué se está intentando enviar audio a un grupo');
        }
    } else {
        console.log('❌ HAY PROBLEMAS TÉCNICOS:');
        if (!archivoOk) console.log('   • Archivo de audio no accesible');
        if (!envioOk) console.log('   • Error en la lógica de envío');
        if (!botOk) console.log('   • Bot no está funcionando');
    }

    console.log('\n📋 RECOMENDACIONES:');
    console.log('   1. Ejecutar: node verificar_audio.js');
    console.log('   2. Revisar logs del bot para ver si se envía el audio');
    console.log('   3. Verificar si el problema es con recepción (no envío)');
    console.log('   4. Probar envío de audio a un chat individual (no grupo)');

    console.log('='.repeat(60));
}

// Ejecutar
if (require.main === module) {
    ejecutarDiagnostico();
}

module.exports = {
    ejecutarDiagnostico,
    verificarArchivoAudio,
    simularEnvioAudio,
    analizarProblemaGrupos,
    verificarEstadoBot,
    crearSolucion
};

