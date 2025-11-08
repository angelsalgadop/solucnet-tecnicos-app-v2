// Verificación adicional para envío de audio
// Ejecutar: node verificar_audio.js

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN FINAL DE AUDIO');
console.log('='.repeat(40));

try {
    // Verificar archivo
    const rutaAudio = path.join(__dirname, 'audio', 'menu_explicativo.mp3');
    console.log(`📁 Buscando: ${rutaAudio}`);

    if (fs.existsSync(rutaAudio)) {
        console.log('✅ Archivo encontrado');

        // Verificar que se puede leer
        const stats = fs.statSync(rutaAudio);
        console.log(`📊 Tamaño: ${stats.size} bytes`);

        // Verificar que no está corrupto (básico)
        const data = fs.readFileSync(rutaAudio);
        console.log(`📂 Datos leídos: ${data.length} bytes`);

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
            files.forEach(file => console.log(`   • ${file}`));
        } else {
            console.log('   ❌ Directorio audio no existe');
        }
    }

} catch (error) {
    console.log(`❌ Error: ${error.message}`);
}

console.log('='.repeat(40));
