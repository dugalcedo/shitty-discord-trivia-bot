"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_js_1 = require("./env.js");
const discord_js_1 = require("discord.js");
const triviaCache_js_1 = require("./triviaCache.js");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds, // when the bot joins or leaves a server
        discord_js_1.GatewayIntentBits.GuildMessages, // when a message is sent in a server
        discord_js_1.GatewayIntentBits.MessageContent, // lets the bot read messages? must be enabled in discordDev?
    ]
});
async function hitMeChegger(id, topicOverride) {
    const obj = (0, triviaCache_js_1.getQuestionOrNew)(id, topicOverride);
    if (!obj)
        throw new Error("INTERNAL ERROR: Failed to get question.");
    const q = await obj.tc.getQuestion();
    return q;
}
client.on('messageCreate', async (message) => {
    if (message.author.bot)
        return;
    const authorId = message.author.id;
    const [prompt, args] = message.content.split('|');
    const sanitized = prompt.trim().toLowerCase().replaceAll(/\s+/gm, ' ');
    const topicOverride = (args || "").trim().toLowerCase().replaceAll(/\s+/gm, ' ') || undefined;
    if (sanitized === '!ping') {
        return message.reply("Thanks for the ping, m8! Wahey!");
    }
    if (['!hitmechegger', '!hitme', '!hitmecheggers', '!wahey'].includes(sanitized)) {
        try {
            const txt = await hitMeChegger(authorId, topicOverride);
            return message.reply(txt);
        }
        catch (error) {
            console.log(error);
            return message.reply(error?.message || "INTERNAL ERROR: Unknown error.");
        }
    }
    // then maybe they have asked a question?
    const existing = (0, triviaCache_js_1.getQuestionMaybe)(authorId);
    if (existing) {
        if (existing.tc.state === 'reactingToAnswer')
            return;
        try {
            const a = await existing.tc.getAnswerReaction(message.content);
            return message.reply(a);
        }
        catch (error) {
            console.log(error);
            return message.reply(error?.message || "INTERNAL ERROR: Unknown error.");
        }
        finally {
            (0, triviaCache_js_1.deleteQuestion)(authorId);
        }
    }
});
// When ready
client.once('clientReady', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
});
client.login(env_js_1.BOT_TOKEN);
