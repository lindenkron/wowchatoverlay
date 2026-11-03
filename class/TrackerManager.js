import { parameters } from './ParametersManager.js';

class TrackerManager {
    constructor() {
        this.followers = [];
        this.chatters = {};
        this.members = []; // Ordered by when they joined
        this.minutes = 30; // Message expires counting
        this.message_count = 10; // Messages required to be true
        this.message_expire = this.minutes * 60 * 1000;
    };

    init() {
        // This gets init after parameters is fetched in ParametersManager
        this.minutes = parameters.get('group_duration') || 30;
        this.message_count = parameters.get('group_quantity') || 10;
    };

    addMessage(username) {
        const now = Date.now();
        username = username.toLowerCase();

        let list = this.chatters[username];
        if (!list) list = this.chatters[username] = [];

        list.push(now);
        this.#updateParty(now);
    };

    getUserStatus(username) {
        this.#updateParty();

        username = username.toLowerCase();

        const is_member = this.members.includes(username);
        if (!is_member) return '';

        const is_leader = this.members[0] === username;
        const is_raid = this.members.length > 5;

        if (is_raid) return is_leader ? 'raidleader' : 'raid';
        return is_leader ? 'partyleader' : 'party';
    };

    #updateParty(now = Date.now()) {
        for (const [username, messages] of Object.entries(this.chatters)) {
            while (messages.length && now - messages[0] > this.message_expire) {
                messages.shift();
            };

            const index = this.members.indexOf(username);
            const qualified = messages.length >= this.message_count;

            if (qualified && index === -1) {
                this.members.push(username);
            } else if (!qualified && index !== -1) {
                this.members.splice(index, 1);
            };
        };
    };
};

export const tracker = new TrackerManager();