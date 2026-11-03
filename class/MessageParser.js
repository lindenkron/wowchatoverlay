import { emote } from './EmotesManager.js';
import { badge } from './BadgeManager.js';
import { tracker } from './TrackerManager.js';
import { parameters } from './ParametersManager.js';

export default class MessageParser {
    constructor(channel_id, tags) {
        this.tags = tags;

        this.channel_id = channel_id;
        this.message_id = tags.id; // UUID
        this.badges = tags.badges;

        this.broadcaster = !!tags.badges?.broadcaster;
        this.moderator = tags.mod;
        this.subscriber = tags.subscriber;
        this.regular = tags['returning-chatter'];
        this.first_message = tags['first-msg'];
        this.partner = tags['badges']?.partner;
        this.vip = tags['vip'];

        this.display_name = tags['display-name'];
        this.username = tags['username'];
    };

    async parse(message, tags) {
        const parsed = this.parseString(message);
        const group_type = tracker.getUserStatus(this.username);
        let type = this.getChatType(message); // This is skipped 

        // Don't add whisper or yell if a person is guild, raid or party.
        if (this.moderator || this.subscriber || group_type) type = '';

        return (
            `<span class="message ${this.getClassType(group_type)} ${type}">` +
                this.renderChatChannel(group_type) +
                this.renderUsername() +
                `${type}<span class="colon">:</span>` +
                parsed +
            `</span>`
        );
    };

    parseString(message) {
        message = this.replaceTwitchEmotes(message);

        return message
            .split(/\s+/)
            .map(word => {
                // TWITCH PLACEHOLDER
                if (word.startsWith(`${this.message_id}:`)) {
                    const [, emote_id] = word.split(':');

                    return this.renderEmote({
                        url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote_id}/default/dark/1.0`,
                        aspect: 1
                    });
                };

                // EXTERNAL EMOTES
                const e = emote.get(this.channel_id, word);
                if (e) {
                    emote.extend(e); // Add aspect ratio
                    return this.renderEmote(e);
                };

                // TAGGED USER
                if (/^@\w+$/.test(word)) {
                    return `<span class="tagged">${this.escape(word)}</span>`;
                };

                return `<span class="text">${this.escape(word)}</span>`;
            })
            .join(' ');
    };

    replaceTwitchEmotes(message) {
        if (!this.tags.emotes) return message;

        // Parse twitch passed tag emotes
        const replacements = [];
        for (const [id, ranges] of Object.entries(this.tags.emotes)) {
            for (const range of ranges) {
                const [start, end] = range.split('-').map(Number);

                replacements.push({
                    start,
                    end,
                    id
                });
            };
        };

        replacements.sort((a, b) => b.start - a.start);

        for (const r of replacements) {
            message =
                message.slice(0, r.start) +
                `${this.message_id}:${r.id}` +
                message.slice(r.end + 1);
        };

        return message;
    };

    escape(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    renderEmote(emote) {
        const aspect = emote.aspect ?? 1 ;
        return `<span class="image" alt="" style="width:${aspect * 24}px">
                    <span class="emote" style="background-image:url('${emote.url}'); aspect-ratio:${aspect};"></span>
                </span>`;
    };

    renderChatChannel(type) {
        let channel = '';
        // Must be list order of least importance first to overwrite the higher status you have
        if (type === 'party') channel = '[Party]';
        if (type === 'partyleader') channel = '[Party Leader]';
        if (type === 'raid') channel = '[Raid]';
        if (type === 'raidleader') channel = '[Raid Leader]';
        if (this.subscriber) channel = '[Guild]';
        if (this.moderator) channel = '[Officer]';
        if (this.broadcaster) channel = '[Guild Leader]';

        const render = channel ? `<span>${channel}</span>` : '';
        return render;
    };

    getChatType(message) {
        switch (true) {
            case message.length > 16 &&
                message === message.toUpperCase() &&
                /[A-Z]/.test(message):
                return 'yells';

            case (this.partner || this.vip) &&
                parameters.get('whispers') !== 'false':
                return 'whispers';

            default:
                return '';
        };
    };

    renderUsername() {
        const first_message = this.first_message ? '<img class="first_badge" src="./assets/1st.png"></img>' : '';

        const badges = this.renderBadges();
        const name = this.escape(this.display_name);

        const content = [badges, name].filter(Boolean).join('');

        const colored =
            (this.broadcaster || this.moderator || this.subscriber) &&
            parameters.get('name_color');

        const username = colored
            ? `[<span style="${this.tags.color ? `color:${this.tags.color}` : ''}">${content}</span>]`
            : `[${content}]`;

        return `<span class="name">${first_message}${username}</span>`;
    };

    // Loop through badges and add them.
    renderBadges() {
        const mode = parameters.get('badges');

        if (!mode || mode === 'false') return '';

        // Get badges based on parameter type
        const badges = this.getVisibleBadges(mode);

        return badges
            .map(([type, version]) => this.renderBadge(type, version))
            .filter(Boolean)
            .join('');
    };

    getVisibleBadges(mode) {
        return Object.entries(this.badges || {}).filter(([type]) => {
            switch (mode) {
                case 'subscriber':
                    return type === 'sub';
                case 'important_sub':
                    return ['subscriber', 'moderator', 'vip'].includes(type);

                case 'all_sub':
                    return this.subscriber;

                case 'all':
                    return true;

                default:
                    return false;
            }
        });
    };

    // Renders badge
    renderBadge(type, version) {
        const b = badge.get(this.channel_id, type, version);

        if (!b) return '';
        return `<img class="badge" src="${b.image_url_1x}" alt="${type}">`;
    };

    getClassType(group_type) {
        if (this.broadcaster) return 'broadcaster';
        if (this.moderator) return 'moderator';
        if (this.subscriber) return 'subscriber';
        if (this.vip || this.partner) return 'whisper';
        if (this.first_message) return 'first_time';
        if (group_type === 'party') return 'party';
        if (group_type === 'partyleader') return 'partyleader';
        if (group_type === 'raid') return 'raid';
        if (group_type === 'raidleader') return 'raidleader';

        return 'viewer';
    };
};