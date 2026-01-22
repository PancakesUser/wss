import "dotenv/config";
import "./Utils/server.js";
import { client, type Channel, type OAuthToken } from "@nekiro/kick-api";
import { fetchUserLVL } from "./Utils/fetchUser.js";
import type { BotrixUserType } from "./Types/BTXUserT.js";
import { sendWebHookMSG } from "./Utils/sendWebhookMSG.js";
import { isAxiosError } from "axios";
import type { IChannel } from "./Types/ChannelT.js";

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

    const channelInfo: IChannel = await nekiroClient.channels.getChannel(process.env.kick_channel as string);

    try{ 
        setInterval(async () => {
            try{
                const updateChannelInfo: any = await nekiroClient.channels.getChannel(channel);
                if(!updateChannelInfo) {
                    throw new Error(`Requested Channel hasn't been found!`);
                }
                isLive = updateChannelInfo.stream.is_live;
            }catch(error: unknown) {
                console.error(`[Something went wrong trying to fetch channel LIVE status]`, error);
            }
        }, 59*1000);

        setInterval(async () => {
            if(!isLive) {
                if(XPFarmed === 0) return console.log(`Streamer hasn't started streaming yet...`);
            }
            if(isSendingMessage) return;


            // if(!hasReachedRequiredLVL) {
            //     setTimeout(async () => {
            //         await fetchUserLVL()
            //         .then((results) => {
            //             if(results.status !== 200) console.log(`Couldn't fetch Kick-User data: `);
            //             results.data.map((e: BotrixUserType) => {
            //                 if(e.level >= 42) {
            //                     hasReachedRequiredLVL = true;
            //                 }else{
            //                     console.log(`Hasn't reached required lvl!`);
            //                 }
            //             });
            //         })
            //         .catch((error) => {
            //             if(isAxiosError(error)) {
            //                 switch (error.code) {
            //                     case "ENOTFOUND":
            //                         console.log(`DNS Couldn't solve botrix.live`);
            //                         break;
            //                     case "ECONNABORTED":
            //                         console.log("[NET] Connection has been aborted");
            //                         break;
            //                     default:
            //                         console.log("AXIOS ERROR", error);
            //                         break;
            //                 }
            //             }
            //         });
            //     }, 5*60*1000);
            // }else{
            //     if(!isReachedMSGSent) {
            //         sendWebHookMSG(`${process.env.kick_user} @everyone ! You've reached level 42 go claim!`);
            //         isReachedMSGSent = true;
            //     }
            // }

            try{
                isSendingMessage = true;
                // await nekiroClient.chat.postMessage({
                //     broadcaster_user_id: channelInfo.broadcaster_user_id as number,
                //     content: "[emote:37232:PeepoClap]",
                //     type: "user"
                // });
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