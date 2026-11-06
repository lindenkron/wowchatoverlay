## URL Parameters

The following parameters can be appended to the application URL using query strings.

| Parameter | Description | Values | Default |
|---|---|---|---|
| `channel` | Twitch channel to connect to | `channel_name` | Authenticated channel |
| `badges` | Show Twitch badges | `all` `sub` `important_sub` `all_sub` |  `false` |
| `group_duration` | Duration a sentence counts in minutes | `integer 1-100` |  `30` |
| `group_quantity` | Sentences needed to join | `integer 1-100` |  `10` |
| `name_color` | Show Twitch name colors | `true false` | `false` |
| `whispers` | Hide whisper type (Prime/VIP) | `true false` | `false` |
| `bots` | Bots to hide (already auto hides tagged bots) | `fossabot,nightbot` |

### Example

Append parameters using `?` for the first parameter and `&` for subsequent parameters:

`https://lindenkron.github.io/wowchatoverlay/?channel=lindenkron&name_color=true&badges=important_sub`

- **Step 1:** Add browser source to OBS.
- **Step 2:** Add your link, and set height/width (do not stretch the source by dragging corners).
- **Step 3:** Interact with the Browser Source, hover over the middle and press login. Authorize the app.