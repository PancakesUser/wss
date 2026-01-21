import type { Channel } from "@nekiro/kick-api";

export interface IChannel extends Channel {
    broadcaster_user_id?: number | undefined
}
