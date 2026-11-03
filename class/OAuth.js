import { parameters } from './ParametersManager.js';

class TwitchAuth {
    constructor() {
        this.client_id = 'r4ps7sz3ulpfg03o7tzni1p6vrifwv';
        this.redirect_uri = 'https://lindenkron.github.io/wowchatoverlay/';
        this.scopes = ['user:read:email'];
        this.channel = null;
        this.channel_storage_key = 'wowchatoverlay:channel';
        this.token = null;
        this.oauth_storage_key = 'wowchatoverlay:oauth';
        this.parameters_storage_key = 'wowchatoverlay:parameters';
    };

    async init() {
        const token_from_url = this.parseToken();
        if (!token_from_url) this.loadToken();

        const stored_token = this.loadToken();
        if (!this.token) this.token = stored_token;
        
        const valid = await this.validate();
        if (!valid) this.clearToken();

        return valid;
    };

    login() {
        sessionStorage.setItem(this.parameters_storage_key, window.location.search);
        const url =
            `https://id.twitch.tv/oauth2/authorize` +
            `?client_id=${this.client_id}` +
            `&redirect_uri=${encodeURIComponent(this.redirect_uri)}` +
            `&response_type=token` +
            `&scope=${encodeURIComponent(this.scopes.join(' '))}`;

        window.location.href = url;
    };

    async logout() {
        if (!this.token) return;

        await fetch('https://id.twitch.tv/oauth2/revoke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: this.client_id,
                token: this.token
            })
        });

        this.clearToken();

        // Reload
        window.location.reload();
    };

    
    async validate() {
        this.loadToken();
        if (!this.token) return false;

        const response = await fetch(
            'https://id.twitch.tv/oauth2/validate',
            {
                headers: {
                    'Authorization': `OAuth ${this.token}`
                }
            }
        );

        if (!response.ok) {
            this.clearToken();
            return false;
        };

        // Store users channel on oauth 
        const data = await response.json();
        this.channel = data.login;
        localStorage.setItem(this.channel_storage_key, this.channel);

        return true;
    };

    parseToken() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');

        // Restore original parameters that the user attempted to visit before being redirected to oauth twitch
        const query = sessionStorage.getItem(this.parameters_storage_key);
        if (query) {
            this.saveToken(token);

            // cleanup
            history.replaceState(
                {},
                document.title,
                window.location.pathname + query
            );

            parameters.load(window.location.href);
            sessionStorage.removeItem(this.parameters_storage_key);
        };

        return token;
    };
    

    async getUser(user) {
        if (!this.token) return null;

        const response = await fetch(
            `https://api.twitch.tv/helix/users${user ? `?login=${user}` : ''}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Client-Id': this.client_id
                }
            }
        );

        return response.json();
    };

    async getFollowers(broadcaster_id) {
        if (!this.token) return null;
        if (!broadcaster_id) return null;

        const response = await fetch(
            `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcaster_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Client-Id': this.client_id
                }
            }
        );

        return response.json();
    };

    async getBadges(broadcaster_id) {
        if (!this.token) return null;
        if (!broadcaster_id) return null;

        const response = await fetch(
            `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcaster_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Client-Id': this.client_id
                }
            }
        );

        return response.json();
    };

    async getGlobalBadges() {
        if (!this.token) return null;

        const response = await fetch(
            'https://api.twitch.tv/helix/chat/badges/global',
            {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Client-Id': this.client_id
                }
            }
        );

        return response.json();
    };

    saveToken(token) {
        this.token = token;
        localStorage.setItem(this.oauth_storage_key, token);
    };

    loadToken() {
        this.token = localStorage.getItem(this.oauth_storage_key);
        return this.token;
    };

    clearToken() {
        this.token = null;
        localStorage.removeItem(this.oauth_storage_key);
    };
};

export const twitch = new TwitchAuth();