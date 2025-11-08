const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/all-chats',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log(`Total chats: ${result.totalChats}`);

            const chatBuscado = result.chats.find(c => c.id.includes('3135648878'));

            if (chatBuscado) {
                console.log('✅ Chat encontrado en el endpoint:');
                console.log(JSON.stringify(chatBuscado, null, 2));
            } else {
                console.log('❌ Chat NO encontrado en el endpoint');
                console.log('\nChats disponibles:');
                result.chats.forEach(c => {
                    console.log(`- ${c.name} (${c.id})`);
                });
            }
        } catch (error) {
            console.error('Error parsing:', error.message);
            console.log('Raw data:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error en petición:', error.message);
});

req.end();
