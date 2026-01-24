import "dotenv/config";
import "./Utils/server.js";
import "./Utils/fetchLC.js";
import { client } from "@nekiro/kick-api";
import { kickBotWrote, kickUserWrote, updateKBWState, updateKUWState } from "./Utils/chatState.js";
if (!process.env.clientId || !process.env.clientSecret || !process.env.kick_user || !process.env.kick_channel) {
    throw new Error(`Missing environment variables!`);
}
const nekiroClient = new client({
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    redirectUri: "http://localhost:3000/callback",
    debug: false
});
const PKCEParams = nekiroClient.generatePKCEParams();
// Bot Configuration.
const channel = process.env.kick_channel;
let isLive;
let isSendingMessage = false;
let cooldown = 59 * 1000;
var XPFarmed = 0;
async function start(token) {
    if (!token) {
        const OAuthURL = nekiroClient.getAuthorizationUrl(PKCEParams, ["chat:write", "channel:read"]);
        console.log(OAuthURL);
        return;
    }
    const channelInfo = await nekiroClient.channels.getChannel(process.env.kick_channel);
    try {
        setInterval(async () => {
            try {
                const updateChannelInfo = await nekiroClient.channels.getChannel(channel);
                if (!updateChannelInfo) {
                    throw new Error(`Requested Channel hasn't been found!`);
                }
                isLive = updateChannelInfo.stream.is_live;
            }
            catch (error) {
                console.error(`[Something went wrong trying to fetch channel LIVE status]`, error);
            }
        }, 15 * 1000);
        setInterval(async () => {
            if (!isLive) {
                if (XPFarmed === 0)
                    return console.log(`Streamer hasn't started streaming yet...`);
            }
            console.log(`Kick User Wrote: ${kickUserWrote} | Kick Bot Wrote: ${kickBotWrote}`);
            if (isSendingMessage)
                return;
            if (kickUserWrote) {
                console.log(`The owner wrote before the script.. waiting 1 minute..`);
                updateKUWState(false);
                return;
            }
            try {
                isSendingMessage = true;
                await nekiroClient.chat.postMessage({
                    broadcaster_user_id: channelInfo.broadcaster_user_id,
                    content: "[emote:37232:PeepoClap]",
                    type: "user"
                });
            }
            catch (error) {
                console.error(`Something went wrong trying to send the message: `, error);
            }
            finally {
                isSendingMessage = false;
                XPFarmed += 10;
                console.log(`[${new Date().toLocaleTimeString("es-ES")}] Farm - 10 XP. | Current farmed: ${XPFarmed} XP`);
            }
        }, cooldown);
    }
    catch (error) {
        console.error(`Something went wrong starting the bot: `, error);
    }
}
start();
export { nekiroClient, PKCEParams, start };
//# sourceMappingURL=index.js.map