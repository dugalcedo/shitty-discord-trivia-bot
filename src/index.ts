import { BOT_TOKEN } from "./env.js";
import { Client, GatewayIntentBits, type OmitPartialGroupDMChannel, type Message } from "discord.js";
import { getQuestionOrNew, getQuestionMaybe, deleteQuestion } from "./triviaCache.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // when the bot joins or leaves a server
        GatewayIntentBits.GuildMessages, // when a message is sent in a server
        GatewayIntentBits.MessageContent, // lets the bot read messages? must be enabled in discordDev?
    ]
})

async function hitMeChegger(id: string): Promise<string> {
    const obj = getQuestionOrNew(id)
    if (!obj) throw new Error("INTERNAL ERROR: Failed to get question.")
    const q = await obj.tc.getQuestion()
    return q
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const authorId = message.author.id

    const sanitized = message.content.trim().toLowerCase().replaceAll(/\s+/gm, ' ');

    if (sanitized === '!ping') {
        return message.reply("Thanks for the ping, m8! Wahey!")
    }

    if (['!hitmechegger', '!hitme', '!hitmecheggers', '!wahey'].includes(sanitized)) {
        try {
            const txt = await hitMeChegger(authorId)
            return message.reply(txt)
        } catch (error) {
            console.log(error)
            return message.reply((error as any)?.message || "INTERNAL ERROR: Unknown error.")
        }
    }

    // then maybe they have asked a question?
    const existing = getQuestionMaybe(authorId)
    
    if (existing) {
        if (existing.tc.state === 'reactingToAnswer') return;

        try {
            const a = await existing.tc.getAnswerReaction(message.content)
            return message.reply(a)
        } catch (error) {
            console.log(error)
            return message.reply((error as any)?.message || "INTERNAL ERROR: Unknown error.")
        } finally {
            deleteQuestion(authorId)
        }
    }
})

// When ready
client.once('clientReady', (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`)
})

client.login(BOT_TOKEN)

