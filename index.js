const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const moment = require("moment");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");

ffmpeg.setFfmpegPath(ffmpegPath);

// ================= CONFIG =================
const OWNER = "923XXXXXXXXX@s.whatsapp.net";
const TG_TOKEN = "YOUR_TELEGRAM_TOKEN";
const TG_ADMIN = "YOUR_TELEGRAM_ID";

const tg = new TelegramBot(TG_TOKEN, { polling: true });

let antiLink = {};
let warnCount = {};
let cooldown = {};

// ================= SAFE SETTINGS =================
const COOLDOWN_TIME = 3000; // 3 sec per command per user

function isSpam(user) {
    const now = Date.now();
    if (!cooldown[user]) cooldown[user] = 0;

    if (now - cooldown[user] < COOLDOWN_TIME) {
        return true;
    }

    cooldown[user] = now;
    return false;
}

// ================= ANIME DP =================
async function getAnime() {
    const r = await axios.get("https://api.waifu.pics/sfw/avatar");
    return r.data.url;
}

// ================= TELEGRAM CONTROL =================
tg.onText(/\/start/, (m) => {
    tg.sendMessage(m.chat.id, "🤖 Bali Safe Bot System Active");
});

tg.onText(/\/status/, (m) => {
    tg.sendMessage(m.chat.id, "🟢 WhatsApp Bot Running Safe Mode");
});

tg.onText(/\/restart/, (m) => {
    if (m.chat.id != TG_ADMIN) return;
    tg.sendMessage(m.chat.id, "♻️ Restarting...");
    process.exit();
});

// ================= WHATSAPP =================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    // ===== CONNECTION =====
    sock.ev.on("connection.update", async (u) => {
        if (u.connection === "open") {
            console.log("🔥 SAFE BOT ONLINE");

            await sock.updateProfileName("Bali Gil Safe Bot");
            await sock.updateProfileStatus("🛡 Safe Mode Active");

            try {
                const img = await getAnime();
                const buffer = await axios.get(img, { responseType: "arraybuffer" });
                await sock.updateProfilePicture(sock.user.id, Buffer.from(buffer.data));
            } catch {}
        }
    });

    // ================= MESSAGES =================
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith("@g.us");

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        const sender = msg.key.participant || from;

        // ================= ANTI SPAM =================
        if (isSpam(sender)) return;

        // ================= SAFE ANTI LINK =================
        if (isGroup && antiLink[from]) {
            if (text.match(/(https?:\/\/|chat\.whatsapp\.com)/gi)) {
                try {
                    const meta = await sock.groupMetadata(from);
                    const admins = meta.participants.filter(p => p.admin).map(p => p.id);

                    if (!admins.includes(sender)) {
                        warnCount[sender] = (warnCount[sender] || 0) + 1;

                        await sock.sendMessage(from, {
                            text: `⚠️ Warning ${warnCount[sender]}/3`
                        });

                        await sock.sendMessage(from, { delete: msg.key });

                        // only kick after 3 warnings
                        if (warnCount[sender] >= 3) {
                            await sock.groupParticipantsUpdate(from, [sender], "remove");
                        }
                    }
                } catch {}
            }
        }

        // ================= COMMANDS =================
        if (!text.startsWith("!")) return;

        const args = text.slice(1).split(" ");
        const cmd = args.shift().toLowerCase();

        // ===== MENU =====
        if (cmd === "menu") {
            return sock.sendMessage(from, {
                text: `🔥 SAFE BALI BOT

!time !calc !quote !joke
!antilink on/off
!mp3 <yt link>
!once <text>`
            });
        }

        // ===== ANTI LINK =====
        if (cmd === "antilink") {
            const meta = await sock.groupMetadata(from);
            const admins = meta.participants.filter(p => p.admin).map(p => p.id);

            if (!admins.includes(sender)) return;

            if (args[0] === "on") antiLink[from] = true;
            if (args[0] === "off") antiLink[from] = false;
        }

        // ===== TIME =====
        if (cmd === "time") {
            return sock.sendMessage(from, {
                text: moment().format("HH:mm:ss")
            });
        }

        // ===== CALC =====
        if (cmd === "calc") {
            return sock.sendMessage(from, {
                text: String(eval(args.join(" ")))
            });
        }

        // ===== QUOTE =====
        if (cmd === "quote") {
            const r = await axios.get("https://api.quotable.io/random");
            return sock.sendMessage(from, { text: r.data.content });
        }

        // ===== JOKE =====
        if (cmd === "joke") {
            const r = await axios.get("https://official-joke-api.appspot.com/random_joke");
            return sock.sendMessage(from, {
                text: `${r.data.setup}\n${r.data.punchline}`
            });
        }

        // ===== VIEW ONCE =====
        if (cmd === "once") {
            return sock.sendMessage(from, {
                viewOnceMessage: {
                    message: { conversation: args.join(" ") }
                }
            });
        }

        // ===== MP3 (SAFE RATE LIMITED) =====
        if (cmd === "mp3") {
            if (!ytdl.validateURL(args[0])) return;

            await sock.sendMessage(from, { text: "⏳ Processing..." });

            const info = await ytdl.getInfo(args[0]);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
            const file = `./${title}.mp3`;

            const stream = ytdl(args[0], { quality: "highestaudio" });

            ffmpeg(stream)
                .audioBitrate(128)
                .save(file)
                .on("end", async () => {
                    await sock.sendMessage(from, {
                        audio: fs.readFileSync(file),
                        mimetype: "audio/mpeg"
                    });

                    fs.unlinkSync(file);
                });
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

startBot();
