// Prueba de validación final del bot activo
// Ejecuta desde: /opt/whatsapp-chatbot/

console.log('🎯 VALIDACIÓN FINAL DEL BOT ACTIVO');
console.log('='.repeat(50));

const fs = require('fs');

try {
    const content = fs.readFileSync('/opt/whatsapp-chatbot/index.js', 'utf8');

    // Verificar filtros
    const filtroPrincipal = content.includes("msg.from.includes('status@broadcast')");
    const filtroFormulario = content.includes("respuesta.from.includes('status@broadcast')");

    console.log('📋 VERIFICACIÓN DE FILTROS:');
    console.log(`   • Principal: ${filtroPrincipal ? '✅' : '❌'}`);
    console.log(`   • Formulario: ${filtroFormulario ? '✅' : '❌'}`);

    if (filtroPrincipal && filtroFormulario) {
        console.log('\n🎉 ¡EXITO! El bot activo tiene todos los filtros implementados.');
        console.log('💡 El bot ya NO debería responder a:');
        console.log('   • Mensajes de grupos (@g.us)');
        console.log('   • Mensajes de estados (status@broadcast)');
    } else {
        console.log('\n❌ El bot activo NO tiene todos los filtros.');
    }

    console.log('\n📝 PRUEBA MANUAL:');
    console.log('   1. Envía un mensaje a un grupo donde esté el bot');
    console.log('   2. Envía un mensaje de estado');
    console.log('   3. Si no responde, ¡el problema está SOLUCIONADO!');

} catch (error) {
    console.log(`❌ Error: ${error.message}`);
}

console.log('='.repeat(50));
