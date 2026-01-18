import express, {type Express, type Request, type Response} from "express";
import session from "express-session";
import { nekiroClient, PKCEParams, startBot } from "./index.ts";
import type { OAuthToken } from "@nekiro/kick-api";

const app: Express = express();
var port: string | undefined = process.env.PORT;

// Express-App Configuration.
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(session({
    secret: "keyboardcat",
    cookie: {
        secure: false,
        maxAge: 1000*60*60*24,
        httpOnly: true
    },
    resave: true,
    saveUninitialized: false
}));


app.get("/token", async (req: Request, res: Response): Promise<Response | void> => {
    if(!req.session || !req.session.kickAuth) return res.status(401).send({message: "No session found!"});
    try{
        return res.status(200).send({message: "Authorized! ✅", token: req.session.kickAuth});
    }catch(error: unknown) {
        console.error(`Something went wrong retrieving Token:`, error);
        return res.status(500).send({message: "Internal Server Error"});
    }
});


app.get("/callback", async (req: Request, res: Response): Promise<Response | void> => {

    if(!req.query.code) {
        return res.status(404).send({message: "Missing Credentials: OAuth Code"});
    }
    
    try{
        if(!PKCEParams) return console.log("PKCEParams hasn't been generated correctly!");

        const token: OAuthToken = await nekiroClient.exchangeCodeForToken({code: req.query.code as string, codeVerifier: PKCEParams.codeVerifier});
        if(!token) return res.status(400).send({message: `Invalid Token has been generated!`});
        // Save Kick-OAuth-Token.
        req.session.kickAuth = token;
        startBot(token);
        return res.status(200).send({message: `Authorized ✅`, token: token});
    }catch(error: unknown) {
        console.error(`Error handling callback: ${error}`);
    }

});



try{
    app.listen(port);
}catch(error: unknown) {
    console.error(`Something went wrong trying to start the Server: `, error);
}finally{
    console.log(`Server has been started: ✅`)
}