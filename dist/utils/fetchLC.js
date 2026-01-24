import WebSocket from "ws";
import { kickBotWrote, updateKUWState, updateKBWState, kickUserWrote } from "./chatState.js";
const webSocket = new WebSocket("wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false");
const chatroomId = 6255205;
const channel = `chatrooms.${chatroomId}.v2`;
webSocket.on("open", () => {
    console.log(`Kick-Websocket has been openned ✅ - Listening chatroom: ${chatroomId}`);
    webSocket.send(JSON.stringify({
        data: { channel: channel },
        event: "pusher:subscribe",
    }));
});
webSocket.on("message", async (data, isBinary) => {
    const message = JSON.parse(data.toString());
    if (message.event === "App\\Events\\ChatMessageEvent") {
        const parseMessage = JSON.parse(message.data);
        if (parseMessage.sender.username.toLocaleLowerCase() === process.env.kick_user) {
            if (parseMessage.content.trim().toLocaleLowerCase() !== "[emote:37232:PeepoClap]".toLocaleLowerCase().trim() && !kickUserWrote) {
                console.log(`[Script Owner Has Send a Message: Waiting 1 minute since now...]`);
                updateKUWState(true);
            }
        }
    }
});
webSocket.on("close", async (webSocket, code, reason) => {
    console.log("Websocket has been closed:" + "code: " + code + " reason:" + reason);
});
webSocket.on("error", async (webSocket, error) => {
    console.error("Something went wrong watching the live chat: ", error);
});
//# sourceMappingURL=fetchLC.js.map