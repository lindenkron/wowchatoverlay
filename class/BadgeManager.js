import { twitch } from './OAuth.js';

class BadgeManager {
    constructor() {
        this.cache = new Map();
    };

    async load(broadcaster_id) {
        if (this.cache.has(broadcaster_id)) return;

        const [channelData, globalData] = await Promise.all([
            twitch.getBadges(broadcaster_id),
            twitch.getGlobalBadges()
        ]);

        const badges = {};

        for (const set of [...globalData.data, ...channelData.data]) {
            badges[set.set_id] = {};

            for (const version of set.versions) {
                badges[set.set_id][version.id] = version;
            };
        };

        this.cache.set(broadcaster_id, badges);
    };

    get(broadcaster_id, set, version) {
        return this.cache
            .get(broadcaster_id)
            ?.[set]
            ?.[version];
    };
};

export const badge = new BadgeManager();