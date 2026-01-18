import "dotenv/config";
import {client, type Client, type OAuthToken} from "@nekiro/kick-api";
import { askForToken } from "./utils/askForToken.ts";
import "./server.ts";

if(!process.env.clientId || !process.env.clientSecret) {
    throw new Error("Missing parameters on environment variables.");
}


const nekiroClient: Client = new client({
    clientId: process.env.clientId as string,
    clientSecret: process.env.clientSecret as string,
    redirectUri: "http://localhost:3000/callback",
    debug: false
});
const PKCEParams = nekiroClient.generatePKCEParams();


async function startBot(token?: OAuthToken): Promise<void> {
    // If there' isn't a token set.
    if(!token) {
        const oauthURL: string = nekiroClient.getAuthorizationUrl(PKCEParams, ["chat:write", "channel:read"]);
        console.log(oauthURL);
        return;
    }

    let xpFarmed: number = 0;
    let is_channel_live: boolean;
    let farm: boolean;
    let isSending: boolean = false;

    try{
        const channel: any = await nekiroClient.channels.getChannel(process.env.kick_channel as string);

        // While channel isn't on live. Pause the farm.
        is_channel_live = channel.stream.is_live;

        setInterval(() => {
            // While stream is active. Farm Else Stop or wait.
            farm = channel.stream.is_live;
        }, 15 * 60 * 1000);


        setInterval(async () => {
            // Verify if script can farm. Else return
            if(farm) {
                try{                    
                    if(isSending) return;
                    isSending = true;
                    await nekiroClient.chat.postMessage({
                        broadcaster_user_id: channel.broadcaster_user_id as number,
                        content: "[emote:37232:PeepoClap]",
                        type: "user"
                    })
                    .then((message) => {
                        if(message.is_sent) {
                            console.log(`[${new  Date().toLocaleTimeString("es-ES")}] Message Succesfully Send +10 XP.`);
                            xpFarmed += 10;
                            console.log(`Total XP Farmed: [${xpFarmed}]`);
                        }
                    });
                }catch(error: unknown) {
                    console.error(`Something went wrong sending messages to ${process.env.kick_channel}: ${error}`);
                }finally{
                    isSending = false;
                }
            }else return;
        }, 59*1000);

    }catch(error: unknown) {
        console.error(`Something went wrong trying to start the AutoFarm Bot: `, error);
    }

}

startBot();

export {
    startBot,
    nekiroClient,
    PKCEParams
}
