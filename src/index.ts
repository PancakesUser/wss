import "dotenv/config";
import "./utils/server.ts";
import "./utils/fetchLC.ts";
import { client, type OAuthToken } from "@nekiro/kick-api";
import type { IChannel } from "./types/ChannelT.ts";
import { getCooldown } from "./utils/fetchLC.ts";

if (
  !process.env.discord_webhook ||
  !process.env.clientId ||
  !process.env.clientSecret ||
  !process.env.kick_user ||
  !process.env.kick_channel
) {
  throw new Error(`Missing environment variables!`);
}

const nekiroClient = new client({
  clientId: process.env.clientId as string,
  clientSecret: process.env.clientSecret as string,
  redirectUri: "http://localhost:3000/callback",
  debug: false
});

const PKCEParams = nekiroClient.generatePKCEParams();

// ============================
// Bot Configuration
// ============================

const channel = process.env.kick_channel as string;

let isLive: boolean = false;
let isSendingMessage: boolean = false;
let cooldown: number = 5*1000;

let XPFarmed: number = 0;
let messagesSent: number = 0;

let liveInterval: NodeJS.Timeout | null = null;

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

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// ============================
// Error Handler
// ============================

async function handleError(error: any) {
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

async function messageLoop(channelInfo: IChannel) {
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

    const message =
      emotes[Math.floor(Math.random() * emotes.length)] as string;

    await nekiroClient.chat.postMessage({
      broadcaster_user_id: channelInfo.broadcaster_user_id as number,
      content: message,
      type: "user"
    });

    // Reset errores en éxito
    consecutive403 = 0;

    XPFarmed += 10;
    messagesSent++;

    console.log(
      `[${new Date().toLocaleTimeString("es-ES")}] +10 XP | Total: ${XPFarmed} XP | Msg: ${messagesSent} | Cooldown: ${cooldown}`
    );

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

  } catch (error: any) {
    await handleError(error);
  } finally {
    isSendingMessage = false;
  }

  const jitter = Math.floor(Math.random() * 2000) - 1000;
  const nextDelay = cooldown + jitter;

  setTimeout(() => messageLoop(channelInfo), nextDelay);
}

// ============================
// Start Bot
// ============================

async function start(token?: OAuthToken): Promise<void> {
  if (!token) {
    const OAuthURL: string = nekiroClient.getAuthorizationUrl(
      PKCEParams,
      ["chat:write", "channel:read"]
    );
    console.log(OAuthURL);
    return;
  }

  if (liveInterval) {
    console.log("Bot already started. Skipping...");
    return;
  }

  const channelInfo: IChannel = await nekiroClient.channels.getChannel(channel);

  isLive = channelInfo.stream?.is_live ?? false;
  lastLiveState = isLive;

  console.log("Bot started successfully.");
  console.log("Is live:", isLive);

  // ============================
  // LIVE CHECK (cada 1 min)
  // ============================

  liveInterval = setInterval(async () => {
    try {
      const updateChannelInfo: any =
        await nekiroClient.channels.getChannel(channel);

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

    } catch (error: unknown) {
      console.error(`[Error fetching LIVE status]`, error);
    }

  }, 60 * 1000);

  messageLoop(channelInfo);
}

start();

export {
  nekiroClient,
  PKCEParams,
  start
};