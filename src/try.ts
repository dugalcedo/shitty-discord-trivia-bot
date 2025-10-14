import { BOT_TOKEN } from "./env.js";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // when the bot joins or leaves a server
        GatewayIntentBits.GuildMessages, // when a message is sent in a server
        GatewayIntentBits.MessageContent, // lets the bot read messages? must be enabled in discordDev?
    ]
})

client.once('clientReady', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`)
})

client.login(BOT_TOKEN)