import "dotenv/config";
import "./utils/server.ts";
import { client, type OAuthToken } from "@nekiro/kick-api";

if(!process.env.clientId || !process.env.clientSecret) {
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
            if(isLive && !channelInfo.stream.is_live) {
                console.log(`Stream has ended 🎦⏹️`);
                console.log(`The stream has ended... You've farmed: ${XPFarmed}`);
            }
            console.log(`Streamer's Live 🎦: ${isLive}`);
        }, 59*1000);

        setInterval(async () => {
            if(!isLive) {
                if(XPFarmed === 0) return console.log(`Streamer hasn't started streaming yet...`);
            }

            if(isSendingMessage) return;

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