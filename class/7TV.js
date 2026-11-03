class SevenTVManager {
    constructor() {
        this.base_url = 'https://7tv.io/v3';
    };

    async getChannelEmotes(channel_id) {
        if (!channel_id) return [];

        try {
            const resp = await fetch(
                `${this.base_url}/users/twitch/${channel_id}`
            );

            if (!resp.ok) throw new Error();

            const data = await resp.json();

            return data.emote_set.emotes.map((x) => ({
                id: x.id,
                code: x.name,
                source: '7tv',
                isZeroWidth: ((x.flags || 0) & 256) !== 0,
                channel_id,
            }));
        } catch {
            return [];
        };
    };

    async getGlobalEmotes() {
        try {
            const resp = await fetch(
                `${this.base_url}/emote-sets/global`
            );

            if (!resp.ok) throw new Error();

            const data = await resp.json();

            return data.emotes.map((x) => ({
                id: x.id,
                code: x.name,
                source: '7tv',
                isZeroWidth: ((x.flags || 0) & 256) !== 0,
                channel_id: null,
            }));
        } catch {
            return [];
        };
    };
};

export const SevenTV = new SevenTVManager();
