const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });

    sock.ev.on('creds.update', saveCreds);
    
    // Command handler logic goes here (as we built previously)
    sock.ev.on('messages.upsert', async m => {
        // ... Handling commands like !menu, !tagall, etc.
    });
}
connectWhatsApp();

