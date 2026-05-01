const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const bot = new TelegramBot('8663287371:AAEU0_YNUyURYlElR5o95EW6V1viJ3tjtfc', { polling: true });

const ownerId = 8663287371; // Your Telegram ID

bot.onText(/\/deploy/, (msg) => {
    if (msg.from.id !== ownerId) return;
    
    bot.sendMessage(msg.chat.id, "🚀 Starting ITACHI-UCHIA Deployment...");
    
    // Command to start the WhatsApp bot using PM2
    exec('pm2 start index.js -- bali-gil bot', (err, stdout, stderr) => {
        if (err) return bot.sendMessage(msg.chat.id, `❌ Error: ${err.message}`);
        bot.sendMessage(msg.chat.id, "✅ WhatsApp Bot is now Online!");
    });
});

bot.onText(/\/status/, (msg) => {
    exec('pm2 jlist', (err, stdout) => {
        const data = JSON.parse(stdout);
        const itachi = data.find(p => p.name === 'bali-gil bot');
        bot.sendMessage(msg.chat.id, `Status: ${itachi ? itachi.pm2_env.status : 'Offline'}`);
    });
});
