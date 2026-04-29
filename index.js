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

const TG_TOKEN = "8663287371:AAEU0_YNUyURYlElR5o95EW6V1viJ3tjtfc";
const TG_ADMIN = "8663287371";

const tg = new TelegramBot(TG_TOKEN, { polling: true });

let antiLink = {};
let warn = {};
let cooldown = {};
tg.onText(/\/start/, (msg) => {
    tg.sendMessage(msg.chat.id, "🤖 Bali Gil Bot Control Panel Active");
});

tg.onText(/\/status/, (msg) => {
    tg.sendMessage(msg.chat.id, "🟢 WhatsApp Bot Running");
});

tg.onText(/\/restart/, (msg) => {
    if (msg.chat.id != ADMIN) return;

    tg.sendMessage(msg.chat.id, "♻️ Restarting bot...");
    process.exit();
});
// ================= SAFE SYSTEM =================
function isSpam(user) {
    const now = Date.now();
    if (!cooldown[user]) cooldown[user] = 0;
    if (now - cooldown[user] < 2500) return true;
    cooldown[user] = now;
    return false;
}

// ================= ANIME DP =================
async function anime() {
    const r = await axios.get("https://api.waifu.pics/sfw/avatar");
    return r.data.url;
}

// ================= TELEGRAM CONTROL =================
const TelegramBot = require("node-telegram-bot-api");

const tg = new TelegramBot(8663287371:AAEU0_YNUyURYlElR5o95EW6V1viJ3tjtfc, { polling: true });

const ADMIN = "8663287371";
tg.onText(/\/start/, (msg) => {
    tg.sendMessage(msg.chat.id, "🤖 Bali System Active");
});

tg.onText(/\/status/, (msg) => {
    tg.sendMessage(msg.chat.id, "🟢 WhatsApp Bot Running");
});

tg.onText(/\/restart/, (msg) => {
    if (msg.chat.id != TG_ADMIN) return;
    tg.sendMessage(msg.chat.id, "♻️ Restarting...");
    process.exit();
});

// ================= BOT =================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    // ===== CONNECTION =====
    sock.ev.on("connection.update", async (u) => {
        if (u.connection === "open") {
            console.log("🔥 BOT ONLINE");

            await sock.updateProfileName("Bali Gil Bot");
            await sock.updateProfileStatus("🤖 Premium System Active");

            try {
                const img = await anime();
                const buffer = await axios.get(img, { responseType: "arraybuffer" });

                await sock.updateProfilePicture(sock.user.id, Buffer.from(buffer.data));
            } catch {}
        }
    });

    // ================= WELCOME + GOODBYE =================
    sock.ev.on("group-participants.update", async (u) => {
        const { id, participants, action } = u;

        for (let user of participants) {
            const name = user.split("@")[0];

            if (action === "add") {
                await sock.sendMessage(id, {
                    text: `🌸 Welcome @${name} to Bali Gil Group 🤖`,
                    mentions: [user]
                });
            }

            if (action === "remove") {
                await sock.sendMessage(id, {
                    text: `🌙 Goodbye @${name} 💔`,
                    mentions: [user]
                });
            }
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

        if (isSpam(sender)) return;

        // ================= ANTI LINK =================
        if (isGroup && antiLink[from]) {
            if (text.match(/(https?:\/\/|chat\.whatsapp\.com)/gi)) {
                try {
                    const meta = await sock.groupMetadata(from);
                    const admins = meta.participants.filter(p => p.admin).map(p => p.id);

                    if (!admins.includes(sender)) {
                        warn[sender] = (warn[sender] || 0) + 1;

                        await sock.sendMessage(from, {
                            text: `⚠️ Warning ${warn[sender]}/3`
                        });

                        await sock.sendMessage(from, { delete: msg.key });

                        if (warn[sender] >= 3) {
                            await sock.groupParticipantsUpdate(from, [sender], "remove");
                        }
                    }
                } catch {}
            }
        }

        if (!text.startsWith("!")) return;

        const args = text.slice(1).split(" ");
        const cmd = args.shift().toLowerCase();

        // ================= MENU =================
        if (cmd === "menu") {
            return sock.sendMessage(from, {
                text: `🔥 BALI SYSTEM

!time !calc !quote !joke
!antilink on/off
!mp3 <yt link>
!once <text>`
            });
        }

        // ================= ANTI LINK =================
        if (cmd === "antilink") {
            const meta = await sock.groupMetadata(from);
            const admins = meta.participants.filter(p => p.admin).map(p => p.id);

            if (!admins.includes(sender)) return;

            if (args[0] === "on") antiLink[from] = true;
            if (args[0] === "off") antiLink[from] = false;
        }

        // ================= TIME =================
        if (cmd === "time") {
            return sock.sendMessage(from, {
                text: moment().format("HH:mm:ss")
            });
        }

        // ================= CALC =================
        if (cmd === "calc") {
            return sock.sendMessage(from, {
                text: String(eval(args.join(" ")))
            });
        }

        // ================= QUOTE =================
        if (cmd === "quote") {
            const r = await axios.get("https://api.quotable.io/random");
            return sock.sendMessage(from, { text: r.data.content });
        }

        // ================= JOKE =================
        if (cmd === "joke") {
            const r = await axios.get("https://official-joke-api.appspot.com/random_joke");
            return sock.sendMessage(from, {
                text: `${r.data.setup}\n${r.data.punchline}`
            });
        }

        // ================= VIEW ONCE =================
        if (cmd === "once") {
            return sock.sendMessage(from, {
                viewOnceMessage: {
                    message: { conversation: args.join(" ") }
                }
            });
        }

        // ================= MP3 =================
        if (cmd === "mp3") {
            const url = args[0];
            if (!ytdl.validateURL(url)) return;

            await sock.sendMessage(from, { text: "⏳ Downloading..." });

            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
            const file = `./${title}.mp3`;

            const stream = ytdl(url, { quality: "highestaudio" });

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
