import dotenv from 'dotenv'
dotenv.config()

import { BotCache } from './BotCache.js'
import { Client, GatewayIntentBits, Message, OmitPartialGroupDMChannel } from 'discord.js'
import { Chat, GoogleGenAI } from '@google/genai'

type ShittyBotInit = {
    env: {
        botToken: string,
        geminiToken: string
    }
    maxReplies: number
    chatLifetimeInMinutes: number
    generateSystemInstruction: (init: SystemInstructionInit) => string
}

type ChatItem = {
    userMessageCount: number
    chat: Chat
    ai: GoogleGenAI
}

type SystemInstructionInit = {
    prompt: string
}

type MessageCallback = (authorId: string, message: OmitPartialGroupDMChannel<Message<boolean>>, args: string[]) => void | Promise<void>;

type Router = {
    head: string
    callback: MessageCallback
}


export class ShittyBot {
    #botToken: string
    #geminiToken: string
    #botCache: BotCache<ChatItem>
    #discordClient: Client
    #ai: GoogleGenAI
    #generateSystemInstruction: (init: SystemInstructionInit) => string
    #router: Record<string, Router> = {}
    #maxReplies: number

    constructor(init: ShittyBotInit) {
        // TOKENS
        if (!process.env[init.env.botToken]) {
            throw new Error(`Missing env-var: ${init.env.botToken}`)
        }
        if (!process.env[init.env.geminiToken]) {
            throw new Error(`Missing env-var: ${init.env.geminiToken}`)
        }
        this.#botToken = process.env[init.env.botToken]||"";
        this.#geminiToken = process.env[init.env.geminiToken]||"";

        this.#botCache = new BotCache(init.chatLifetimeInMinutes)

        // Client
        this.#discordClient = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        })

        // AI
        this.#ai = new GoogleGenAI({ apiKey: this.#geminiToken })

        // sysInst init
        this.#generateSystemInstruction = init.generateSystemInstruction

        // other
        this.#maxReplies = init.maxReplies
    }

    getChatItem(authorId: string) {
        const item = this.#botCache.get(authorId)
        if (item) item.userMessageCount++;
        if (item && item.userMessageCount > this.#maxReplies) {
            console.log("Max replies reached")
            this.#botCache.delete(authorId)
            return
        }
        return item
    }

    forceCreateChatItem(authorId: string, prompt: string) {
        const existing = this.getChatItem(authorId) 
        if (existing) this.#botCache.delete(authorId);

        const chat = this.#ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: this.#generateSystemInstruction({
                    prompt
                })
            }
        })

        const item = {
            chat,
            ai: this.#ai,
            userMessageCount: 1
        }

        this.#botCache.forceCreate(authorId, item)

        return item
    }

    onMessage(head: string, cb: MessageCallback) {
        this.#router[head] = {
            head,
            callback: async (authorId, message, args) => {
                await cb(authorId, message, args)
            }
        }
    }

    onAnyMessage(cb: MessageCallback) {
        this.#discordClient.on('messageCreate', async message => {
            await cb(message.author.id, message, [])
        })
    }

    start() {
        this.#discordClient.on('messageCreate', async message => {
            const [head, ...args] = message.content.trim().split('|')
            const router = this.#router[head]
            if (router) {
                await router.callback(message.author.id, message, args)
                return
            }
        })

        this.#discordClient.once('clientReady', (rc) => {
            console.log(`Logged in as ${rc.user.tag}`)
        })

        this.#discordClient.login(this.#botToken)
    }
}
