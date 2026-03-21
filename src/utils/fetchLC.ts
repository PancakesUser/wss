import WebSocket from "ws";
import type { ISenderUser } from "../Interfaces/ISenderUser";
import { sendWebHookMSG } from "./sendWebhookMSG";


const webSocketURL: string = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false"
const chatroomId: number = 6255205;
const channel: string = `chatrooms.${chatroomId}.v2`
let usersTryingToRedeem: Array<string> = [];


function connect(): void {
    const webSocket = new WebSocket(webSocketURL);
    webSocket.on("open", () => {
        console.log(`Kick-Websocket has been openned ✅ - Listening chatroom: ${chatroomId}`);
        
        webSocket.send(JSON.stringify({
            data: {channel: channel},
            event: "pusher:subscribe",
        }));
        
    });



webSocket.on("message", async (data: WebSocket.RawData): Promise<void> => {
    const message = JSON.parse(data.toString());
    if(message.event === "pusher:ping") {
        webSocket.send(JSON.stringify({event: "pusher:pong"}));
    }
});


webSocket.on("message", async (data: WebSocket.RawData, isBinary: boolean): Promise<void> => {
    try {
        const message = JSON.parse(data.toString());
        if (message.event === "App\\Events\\ChatMessageEvent") {
            const parseMessage: ISenderUser = JSON.parse(message.data);

            const content = parseMessage.content.toLowerCase();

            // usuario intenta canjear
            if (content === "!shop buy 5usddd") {
                const userTryingToRedeem = parseMessage.sender.username;
                console.log(`Shop buy triggered by: ${userTryingToRedeem}`);
                console.log("Verifying if it's valid...");
                usersTryingToRedeem.push(userTryingToRedeem);
            }

            // respuesta del bot
            if (parseMessage.sender.username === "BotRix") {
                usersTryingToRedeem.forEach((user) => {
                    const username = user.toLowerCase();

                    if (content.includes(username) && content.includes("cooldown")) {
                        console.log(`5 USD redeem has failed for: ${user}`);
                        sendWebHookMSG(`${user} has failed trying to redeem 5 USD!`);
                        usersTryingToRedeem.splice(usersTryingToRedeem.indexOf(user), 1);
                    } else if (content.includes(username) && (content.includes("gracias") || content.includes("canje"))) {
                        const now = new Date();
                        const formatted = now.toLocaleString("es-CR", {
                            year: "numeric",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            fractionalSecondDigits: 3,
                            hour12: true
                        });
                        sendWebHookMSG(`5 USD have been redeemed by: ${user}\nAt time: ${formatted}`);
                        usersTryingToRedeem.splice(usersTryingToRedeem.indexOf(user), 1);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error parsing message:", error);
    }
});


webSocket.on("close", async (webSocket: WebSocket, code: number, reason: string): Promise<void> => {
    console.log("Websocket has been closed:" + "code: "+code+" reason:"+reason);
    setTimeout(() => {
        console.log("Reconnecting..");
        connect();
    }, 3000);
});

webSocket.on("error", async (webSocket: WebSocket, error: unknown) => {
    console.error("Something went wrong watching the live chat: ", error);
    webSocket.close();
});

}

connect();