import "express-session";

declare module "express-session" {
    interface SessionData {
        kickAuth? : {
            accessToken: string,
            refreshToken?: string,
            expiresAt: number
        }
    }
}