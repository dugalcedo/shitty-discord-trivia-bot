"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_js_1 = require("./env.js");
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds, // when the bot joins or leaves a server
        discord_js_1.GatewayIntentBits.GuildMessages, // when a message is sent in a server
        discord_js_1.GatewayIntentBits.MessageContent, // lets the bot read messages? must be enabled in discordDev?
    ]
});
client.once('clientReady', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
});
client.login(env_js_1.BOT_TOKEN);
