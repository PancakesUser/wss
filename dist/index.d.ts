import "dotenv/config";
import "./utils/server.js";
import "./utils/fetchLC.js";
import { type OAuthToken } from "@nekiro/kick-api";
declare const nekiroClient: import("@nekiro/kick-api").Client;
declare const PKCEParams: import("@nekiro/kick-api").OAuthAuthorizationParams;
declare function start(token?: OAuthToken): Promise<void>;
export { nekiroClient, PKCEParams, start };
//# sourceMappingURL=index.d.ts.map