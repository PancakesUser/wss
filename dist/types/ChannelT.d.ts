import type { Channel } from "@nekiro/kick-api";
export interface IChannel extends Channel {
    [x: string]: any;
    broadcaster_user_id?: number | undefined;
}
//# sourceMappingURL=ChannelT.d.ts.map