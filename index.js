
import MessageParser from './class/MessageParser.js';
import { twitch } from './class/OAuth.js';
import { tracker } from './class/TrackerManager.js';
import { emote } from './class/EmotesManager.js';
import { badge } from './class/BadgeManager.js';
import { parameters } from './class/ParametersManager.js';
import './assets/tmi.min.js';

const authed = await twitch.init();
$('#login').css('display', authed ? 'none' : 'flex');
$('#logout').css('display', authed ? 'flex' : 'none');

$('#login').on('click', () => {
    twitch.login();
});
$('#logout').on('click', () => {
    twitch.logout();
});
let paused = false;
$('#pause').on('click', () => {
    paused = !paused;
});

// Store options from url parameters
parameters.load(window.location.href);
tracker.init();

let chat;
if(authed) {
    const channel = parameters.get('channel') ?? twitch.channel;
    const user = await twitch.getUser(channel);
    const broadcaster_id = user.data[0].id;

    const options = {
        options: {
            debug: false, // Console messages
            skipUpdatingEmotesets : true, // Stops error messages to deprecated kraken api
        },
        channels: [channel]
    };
    // Fetch and cache channnel emotes
    emote.load(broadcaster_id);
    badge.load(broadcaster_id);

    // Setup TMI
    chat = new tmi.Client(options);
    chat.connect().catch(err => console.track('error', err));

    chat.once('connected', function() {
        console.log(`Tmi.js 'connected'.`)
        ChatOnMessage(broadcaster_id);
    });
} else {
    if(chat) chat.disconnect();
};

async function ChatOnMessage(broadcaster_id) {
    chat.on('message', async (channel, tags, message, self) => {
        if(paused) return;
        // Exclude all messages by known bots
        const is_bot = tags.badges?.['bot-badge'];
        if(is_bot) return;

        // Exclude custom bot usernames.
        const bots = (parameters.get('bots') || '')
            .toLowerCase()
            .split(',')
            .map(bot => bot.trim())
            .filter(Boolean);
        if (bots.includes(tags.username.toLowerCase())) return;


        // Exclude all messages by exclude parameter (&exclude=mybot,theirbot)
        const exclude = (parameters.get('exclude') || '').split(',').map(s => s.trim()).filter(Boolean);
        if(exclude.includes(tags.username)) return;
        
        tracker.addMessage(tags.username);
        const parser = new MessageParser(broadcaster_id, tags);
        const parsed_message = await parser.parse(message, tags);
        
        const chat = $('.chat');
        const scrolled_down = chat[0].scrollHeight - chat[0].scrollTop - chat[0].clientHeight < 50;
        chat.append(parsed_message);

        // Keep max mesage elements in UI
        const max_messages = 50;
        const messages = chat.find('.message');
        if (messages.length > max_messages) messages.slice(0, messages.length -max_messages).remove();
        
        if (scrolled_down) chat.scrollTop(chat[0].scrollHeight);
    });
};

// Show hide the Twitch login/logout button depending if a user is actually hovering it.
$('.chat').on('mouseover', function() {
    $('.container').css('opacity', 1);
});

$('.chat, .container').on('mouseleave', function(e) {
    if ($(e.relatedTarget).closest('.chat, .container').length) return;
    $('.container').css('opacity', 0);
});