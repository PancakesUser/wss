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
let cooldown = 5 * 1000;
let XPFarmed = 0;
let messagesSent = 0;
let liveInterval = null;
// ============================
// Error / State Control
// ============================
let consecutive403 = 0;
let hadCooldown = false;
let botEnabled = true;
let lastLiveState = false;
// ============================
// Session control
// ============================
let sessionStart = Date.now();
// ============================
// Emotes
// ============================
const emotes = [
    "[emote:4941811:streameruniversitariowow]",
    "[emote:37232:PeepoClap]",
    "[emote:4937800:streameruniversitarioOk]",
    "[emote:4937667:streameruniversitariohype]"
];
// ============================
// Utils
// ============================
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
// ============================
// Error Handler
// ============================
async function handleError(error) {
    const status = error?.status;
    console.error(`Error (${status}):`, error?.message || error);
    // ============================
    // 403 - Forbidden
    // ============================
    if (status === 403) {
        consecutive403++;
        console.log(`403 count: ${consecutive403}`);
        // Si ya hubo cooldown y vuelve a fallar → pausar envío
        if (hadCooldown) {
            console.log("403 after cooldown. Disabling message sending.");
            botEnabled = false;
            return;
        }
        // 10 errores → cooldown
        if (consecutive403 >= 10) {
            console.log("10 consecutive 403. Cooling down 15 minutes...");
            hadCooldown = true;
            consecutive403 = 0;
            await sleep(15 * 60 * 1000);
            console.log("Cooldown finished. Retrying...");
            return;
        }
        return;
    }
    // ============================
    // 429 - Rate limit
    // ============================
    if (status === 429) {
        console.log("Rate limit detected. Cooling down 15 minutes...");
        await sleep(15 * 60 * 1000);
        return;
    }
    // ============================
    // 401 - Unauthorized
    // ============================
    if (status === 401) {
        console.log("401 Unauthorized: Token expired.");
        await sleep(10 * 60 * 1000);
        return;
    }
    // ============================
    // Otros errores
    // ============================
    console.log("Unknown error. Backing off 5s...");
    await sleep(5000);
}
// ============================
// Message Loop
// ============================
async function messageLoop(channelInfo) {
    if (!isLive) {
        console.log("Stream offline, waiting...");
        setTimeout(() => messageLoop(channelInfo), cooldown);
        return;
    }
    if (!botEnabled) {
        console.log("Bot paused (403 protection). Waiting for stream reset...");
        setTimeout(() => messageLoop(channelInfo), cooldown);
        return;
    }
    if (isSendingMessage) {
        setTimeout(() => messageLoop(channelInfo), cooldown);
        return;
    }
    try {
        isSendingMessage = true;
        const message = emotes[Math.floor(Math.random() * emotes.length)];
        await nekiroClient.chat.postMessage({
            broadcaster_user_id: channelInfo.broadcaster_user_id,
            content: message,
            type: "user"
        });
        // Reset errores en éxito
        consecutive403 = 0;
        XPFarmed += 10;
        messagesSent++;
        console.log(`[${new Date().toLocaleTimeString("es-ES")}] +10 XP | Total: ${XPFarmed} XP | Msg: ${messagesSent}`);
        // Break aleatorio
        if (Math.random() < 0.002) {
            console.log("Long break (5 min)...");
            await sleep(5 * 60 * 1000);
        }
        // Break cada 12h
        const now = Date.now();
        const elapsed = now - sessionStart;
        if (elapsed >= 12 * 60 * 60 * 1000) {
            console.log("Session break (30 min)...");
            await sleep(30 * 60 * 1000);
            sessionStart = Date.now();
        }
    }
    catch (error) {
        await handleError(error);
    }
    finally {
        isSendingMessage = false;
    }
    const jitter = Math.floor(Math.random() * 2000) - 1000;
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
    isLive = channelInfo.stream?.is_live ?? false;
    lastLiveState = isLive;
    console.log("Bot started successfully.");
    console.log("Is live:", isLive);
    // ============================
    // LIVE CHECK (cada 1 min)
    // ============================
    liveInterval = setInterval(async () => {
        try {
            const updateChannelInfo = await nekiroClient.channels.getChannel(channel);
            if (!updateChannelInfo) {
                throw new Error(`Requested Channel hasn't been found!`);
            }
            const currentLive = updateChannelInfo.stream?.is_live ?? false;
            // 🔥 Detectar reinicio del stream
            if (!lastLiveState && currentLive) {
                console.log("Stream restarted. Resetting bot state...");
                botEnabled = true;
                consecutive403 = 0;
                hadCooldown = false;
            }
            lastLiveState = currentLive;
            isLive = currentLive;
            console.log("Live status updated:", isLive);
        }
        catch (error) {
            console.error(`[Error fetching LIVE status]`, error);
        }
    }, 60 * 1000);
    messageLoop(channelInfo);
}
start();
export { nekiroClient, PKCEParams, start };
//# sourceMappingURL=index.js.map