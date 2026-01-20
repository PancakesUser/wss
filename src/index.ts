import "dotenv/config";
import "./utils/server.js";
import { client, type OAuthToken } from "@nekiro/kick-api";
import { fetchUserLVL } from "./utils/fetchUser.js";
import type { BotrixUserType } from "./types/BTXUserT.js";
import { sendWebHookMSG } from "./utils/sendWebhookMSG.js";

if(!process.env.clientId || !process.env.clientSecret || !process.env.kick_user || !process.env.kick_channel) {
    throw new Error(`Missing environment variables!`);
}

const nekiroClient = new client({
    clientId: process.env.clientId as string,
    clientSecret: process.env.clientSecret as string,
    redirectUri: "http://localhost:3000/callback",
    debug: false
});
const PKCEParams = nekiroClient.generatePKCEParams();

// Bot Configuration.
const channel = process.env.kick_channel as string;
let isLive: boolean;
let hasReachedRequiredLVL: boolean = false;
let isReachedMSGSent: boolean = false;
let isSendingMessage: boolean = false;
let cooldown: number = 59*1000;
var XPFarmed: number = 0;

async function start(token?: OAuthToken): Promise<void> {
    if(!token) {
        const OAuthURL: string = nekiroClient.getAuthorizationUrl(PKCEParams, ["chat:write", "channel:read"]);
        console.log(OAuthURL);
        return;
    }

    try{
        const channelInfo: any = await nekiroClient.channels.getChannel(channel);

        if(!channelInfo) {
            throw new Error(`Requested Channel hasn't been found!`);
        }

        setInterval(() => {
            isLive = channelInfo.stream.is_live;
            console.log(`Streamer's Live 🎦: ${isLive}`);
        }, 59*1000);

        setInterval(async () => {
            if(!isLive) {
                if(XPFarmed === 0) return console.log(`Streamer hasn't started streaming yet...`);
            }
            if(isSendingMessage) return;


            if(!hasReachedRequiredLVL) {
                await fetchUserLVL()
                .then((results) => {
                    if(results.status !== 200) console.log(`Couldn't fetch Kick-User data: `);
                    results.data.map((e: BotrixUserType) => {
                        if(e.level >= 42) {
                            hasReachedRequiredLVL = true;
                        }else{
                            console.log(`Hasn't reached required lvl!`);
                        }
                    });
                });
            }else{
                if(!isReachedMSGSent) {
                    sendWebHookMSG(`${process.env.kick_user} @everyone ! You've reached level 42 go claim!`);
                    isReachedMSGSent = true;
                }
            }

            try{
                isSendingMessage = true;
                await nekiroClient.chat.postMessage({
                    broadcaster_user_id: channelInfo.broadcaster_user_id,
                    content: "[emote:37232:PeepoClap]",
                    type: "user"
                });
            }catch(error: unknown) {
                console.error(`Something went wrong trying to send the message: `, error);
            }finally{
                isSendingMessage = false;
                XPFarmed += 10;
                console.log(`[${new Date().toLocaleTimeString("es-ES")}] Farm - 10 XP. | Current farmed: ${XPFarmed} XP`);
            }
        }, cooldown);

    }catch(error: unknown) {
        console.error(`Something went wrong starting the bot: `, error);
    }

}


start();


export {
    nekiroClient,
    PKCEParams,
    start
}