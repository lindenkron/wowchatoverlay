class FFZManager {
    constructor() {
        this.base_url = "https://api.frankerfacez.com/v1";
    };

    async getChannelEmotes(channel_id) {
        if (!channel_id) return [];

        try {
            const resp = await fetch(
                `${this.base_url}/room/id/${channel_id}`
            );

            if (!resp.ok) throw new Error();

            const data = await resp.json();

            return Object.values(data.sets)
                .map((set) =>
                    set.emoticons.map((emote) => ({
                        id: `${emote.id}`,
                        code: emote.name,
                        urls: emote.urls,
                        source: 'ffz',
                        channel_id,
                    }))
                )
                .flat();
        } catch {
            return [];
        };
    };

    async getGlobalEmotes() {
        try {
            const resp = await fetch(
                `${this.base_url}/set/global`
            );

            if (!resp.ok) throw new Error();

            const data = await resp.json();

            return Object.values(data.sets)
                .map((set) =>
                    set.emoticons.map((emote) => ({
                        id: `${emote.id}`,
                        code: emote.name,
                        urls: emote.urls,
                        source: 'ffz',
                        channel_id: null,
                    }))
                )
                .flat();
        } catch {
            return [];
        };
    };

    async getBadges() {
        try {
            const resp = await fetch(
                `${this.base_url}/badges`
            );

            if (!resp.ok) throw new Error();

            return await resp.json();
        } catch {
            return {
                badges: [],
                users: {},
            };
        };
    };
};

export const FFZ = new FFZManager();