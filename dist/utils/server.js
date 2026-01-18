import express, {} from "express";
import { nekiroClient, PKCEParams, start } from "../index.js";
const app = express();
// App Configuration.
var port = process.env.PORT || 3000;
let isFarming = false;
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.get("/callback", async (req, res) => {
    if (!req.query.code)
        return res.status(401).send({ message: "Code not found!" });
    try {
        const token = await nekiroClient.exchangeCodeForToken({ code: req.query.code, codeVerifier: PKCEParams.codeVerifier });
        nekiroClient.setToken(token);
        if (!isFarming) {
            start(token);
            isFarming = true;
        }
        return res.status(200).send({ message: "Authorized ✅" });
    }
    catch (error) {
        return res.status(500).send({ message: "Internal Server Error" });
    }
});
try {
    app.listen(port);
}
catch (error) {
    console.error(`Something went wrong: `, error);
}
finally {
    console.log(`Server has started: `, port);
}
//# sourceMappingURL=server.js.map