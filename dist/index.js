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
let cooldown = 30 * 60 * 1000; // 30 minutos
let XPFarmed = 0;
// 🔒 Guardar referencias de intervalos
let liveInterval = null;
let messageInterval = null;
async function start(token) {
    if (!token) {
        const OAuthURL = nekiroClient.getAuthorizationUrl(PKCEParams, ["chat:write", "channel:read"]);
        console.log(OAuthURL);
        return;
    }
    // 🚫 Evita múltiples starts
    if (liveInterval || messageInterval) {
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
    // Intervalo para enviar mensaje
    // ============================
    messageInterval = setInterval(async () => {
        if (!isLive) {
            if (XPFarmed === 0) {
                console.log(`Streamer hasn't started streaming yet...`);
            }
            return;
        }
        if (isSendingMessage)
            return;
        try {
            isSendingMessage = true;
            await nekiroClient.chat.postMessage({
                broadcaster_user_id: channelInfo.broadcaster_user_id,
                content: "[emote:37232:PeepoClap]",
                type: "user"
            });
            XPFarmed += 10;
            console.log(`[${new Date().toLocaleTimeString("es-ES")}] Farm - 10 XP | Total: ${XPFarmed} XP`);
        }
        catch (error) {
            console.error(`Error sending message:`, error);
        }
        finally {
            isSendingMessage = false;
        }
    }, cooldown);
}
start();
export { nekiroClient, PKCEParams, start };
//# sourceMappingURL=index.js.map