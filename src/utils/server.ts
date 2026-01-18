import express, {type Express, type Request, type Response} from "express";
import { nekiroClient, PKCEParams, start } from "../index.js";
import type { OAuthToken } from "@nekiro/kick-api";

const app: Express = express();

// App Configuration.
var port: number | string = process.env.PORT || 3000;
let isFarming: boolean = false;

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get("/callback", async (req: Request, res: Response): Promise<Response | void> => {
    if(!req.query.code) return res.status(401).send({message: "Code not found!"});

    try{
        const token: OAuthToken = await nekiroClient.exchangeCodeForToken({code: req.query.code as string, codeVerifier: PKCEParams.codeVerifier});
        nekiroClient.setToken(token);
        if(!isFarming) {
            start(token);
            isFarming = true;
        }
        return res.status(200).send({message: "Authorized ✅"});
    }catch(error: unknown) {
        return res.status(500).send({message: "Internal Server Error"});
    }

});


try{
    app.listen(port);
}catch(error: unknown) {
    console.error(`Something went wrong: `, error);
}finally{
    console.log(`Server has started: `, port);
}