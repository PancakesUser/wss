import "dotenv/config";
import "./utils/server.js";
import "./utils/fetchLC.js";
import { client } from "@nekiro/kick-api";
if (!process.env.clientId ||
    !process.env.clientSecret ||
    !process.env.kick_user ||
    !process.env.kick_channel) {
    throw new Error(`Missing environment variables!`);
}
const nekiroClient = new client({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    redirectUri: "http://localhost:3000/callback",
    debug: false
});
const PKCEParams = nekiroClient.generatePKCEParams();
// ============================
// Bot Configuration
// ============================
const channel = process.env.kick_channel;
let isLive = false;
let isSendingMessage = false;
let cooldown = 5 * 1000; // 5 segundos
let XPFarmed = 0;
let liveInterval = null;
// Variantes del mismo emote
const emoteVariants = [
    "[emote:37232:PeepoClap]",
    "[emote:37232:PeepoClap] ",
    " [emote:37232:PeepoClap]",
    "[emote:37232:PeepoClap]  ",
    "  [emote:37232:PeepoClap]"
];
// ============================
// Message Loop
// ============================
async function messageLoop(channelInfo) {
    // if (!isLive) {
    //   setTimeout(() => messageLoop(channelInfo), cooldown);
    //   return;
    // }
    if (isSendingMessage) {
        setTimeout(() => messageLoop(channelInfo), cooldown);
        return;
    }
    try {
        isSendingMessage = true;
        const message = emoteVariants[Math.floor(Math.random() * emoteVariants.length)];
        await nekiroClient.chat.postMessage({
            broadcaster_user_id: channelInfo.broadcaster_user_id,
            content: message,
            type: "user"
        });
        XPFarmed += 10;
        console.log(`[${new Date().toLocaleTimeString("es-ES")}] Farm - 10 XP | Total: ${XPFarmed} XP`);
    }
    catch (error) {
        if (error?.status === 429) {
            console.log("Rate limit detected. Pausing 15 minutes...");
            await new Promise(r => setTimeout(r, 15 * 60 * 1000));
        }
        console.error(`Error sending message:`, error);
    }
    finally {
        isSendingMessage = false;
    }
    // Micro-variación de tiempo (≈5 s)
    const jitter = Math.floor(Math.random() * 300) - 150;
    const nextDelay = cooldown + jitter;
    setTimeout(() => messageLoop(channelInfo), nextDelay);
}
// ============================
// Start Bot
// ============================
async function start(token) {
    if (!token) {
        const OAuthURL = nekiroClient.getAuthorizationUrl(PKCEParams, ["chat:write", "channel:read"]);
        console.log(OAuthURL);
        return;
    }
    if (liveInterval) {
        console.log("Bot already started. Skipping...");
        return;
    }
    const channelInfo = await nekiroClient.channels.getChannel(channel);
    console.log("Bot started successfully.");
    // ============================
    // Intervalo para verificar LIVE
    // ============================
    liveInterval = setInterval(async () => {
        try {
            const updateChannelInfo = await nekiroClient.channels.getChannel(channel);
            if (!updateChannelInfo) {
                throw new Error(`Requested Channel hasn't been found!`);
            }
            isLive = updateChannelInfo.stream?.is_live ?? false;
        }
        catch (error) {
            console.error(`[Error fetching LIVE status]`, error);
        }
    }, 5 * 60 * 1000);
    // ============================
    // Iniciar loop de mensajes
    // ============================
    messageLoop(channelInfo);
}
start();
export { nekiroClient, PKCEParams, start };
//# sourceMappingURL=index.js.map