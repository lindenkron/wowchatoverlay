class BetterTTVManager {
    constructor() {
        this.base_url = "https://api.betterttv.net/3";
    };

    async getChannelEmotes(channel_id) {
        if (!channel_id) return [];

        try {
            const resp = await fetch(
                `${this.base_url}/cached/users/twitch/${channel_id}`
            );

            if (!resp.ok) throw new Error();

            const data = await resp.json();

            return [
                ...data.channelEmotes,
                ...data.sharedEmotes,
            ].map((x) => ({
                id: x.id,
                code: x.code,
                source: 'bttv',
                channel_id,
            }));
        } catch {
            return [];
        };
    };

    async getGlobalEmotes() {
        try {
            const resp = await fetch(
                `${this.base_url}/cached/emotes/global`
            );

            if (!resp.ok) throw new Error();

            const data = await resp.json();

            return data.map((x) => ({
                id: x.id,
                code: x.code,
                source: 'bttv',
                channel_id: null,
            }));
        } catch {
            return [];
        };
    };

    async getBadges() {
        try {
            const resp = await fetch(
                `${this.base_url}/cached/badges/twitch`
            );

            if (!resp.ok) throw new Error();

            return await resp.json();
        } catch {
            return [];
        };
    };
};

export const BTTV = new BetterTTVManager();