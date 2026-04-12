import "dotenv/config";
import axios from "axios";
export async function sendWebHookMSG(message) {
    try {
        axios({
            method: "POST",
            url: `${process.env.discord_webhook}`,
            data: { content: message }
        });
    }
    catch (error) {
        console.error(`Something went wrong sending the webhook message: `, error);
    }
}
//# sourceMappingURL=sendWebhookMSG.js.map