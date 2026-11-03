import { BTTV } from './BTTV.js';
import { FFZ } from './FFZ.js';
import { SevenTV } from './7TV.js';
// import { TTV } from './TTV.js';

class EmotesManager {
    constructor() {
        this.cache = new Map();
        this.image_size_cache = new Map();
    };

    resolveUrl(emote) {
        switch (emote.source) {
            case 'twitch':
                return `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`;

            case '7tv':
                return `https://cdn.7tv.app/emote/${emote.id}/1x.webp`;

            case 'bttv':
                return `https://cdn.betterttv.net/emote/${emote.id}/1x`;

            case 'ffz':
                return emote.urls?.['1'] || emote.urls?.['2'] || '';
        };

        return '';
    };

    getImageSize(url) {
        if (this.image_size_cache.has(url)) {
            return Promise.resolve(this.image_size_cache.get(url));
        };

        return new Promise(resolve => {
            const img = new Image();

            img.onload = () => {
                const size = {
                    w: img.naturalWidth,
                    h: img.naturalHeight
                };

                this.image_size_cache.set(url, size);
                resolve(size);
            };

            img.src = url;
        });
    };

    async load(channel_id) {
        if (this.cache.has(channel_id)) return;

        // const [twitch, seventv, bttv, ffz, ttv_global, seventv_global, bttv_global, ffz_global] = await Promise.all([
        const [seventv, bttv, ffz, seventv_global, bttv_global, ffz_global] = await Promise.all([
            // Emote Supplier Channel Emotes
            // TTV.getChannelEmotes(channel_id),
            SevenTV.getChannelEmotes(channel_id),
            BTTV.getChannelEmotes(channel_id),
            FFZ.getChannelEmotes(channel_id),
            
            // Emote Supplier Global Emotes
            // TTV.getGlobalEmotes(),
            SevenTV.getGlobalEmotes(),
            BTTV.getGlobalEmotes(),
            FFZ.getGlobalEmotes(),
        ]);

        const all = [...seventv, ...bttv, ...ffz, ...seventv_global, ...bttv_global, ...ffz_global];

        const map = new Map();
        for (const e of all) {
            map.set(e.code, {
                ...e,
                url: this.resolveUrl(e),
                aspect: null
            });
        };

        // Pre-fetch all aspect ratios in background
        const aspectPromises = all.map(async e => {
            const emoteData = map.get(e.code);
            if (emoteData) {
                const size = await this.getImageSize(emoteData.url);
                emoteData.aspect = size.w / size.h;
            };
        });
        
        // Don't await - let it run in background
        Promise.all(aspectPromises).catch(() => {});

        this.cache.set(channel_id, map);
    };

    async extend(emote) {
        if (emote.aspect) return emote;

        const size = await this.getImageSize(emote.url);
        emote.aspect = size.w / size.h;

        return emote;
    };

    get(channel_id, code) {
        return this.cache.get(channel_id)?.get(code);
    };
};

export const emote = new EmotesManager();