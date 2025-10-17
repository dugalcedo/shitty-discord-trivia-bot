import { Chat, GoogleGenAI } from "@google/genai"
import { GEMINI_API_KEY } from "../env.js";
import { Client, GatewayIntentBits } from "discord.js";

type GeminiDiscordBotContext = {
    ai: GoogleGenAI
    bot: GeminiDiscordBot
    client: Client
    message: string
    authorId: AuthorId
}

type GeminiDiscordBotInit = {
    name: string
    botKey: string
    sysInstructionCallback: (ctx: GeminiDiscordBotContext) => string
    chatLifetimeInMinutes: number
    maxReplies: number
}

type AuthorId = string;
type ChatObj = {
    chat: Chat
    suicide: ReturnType<typeof setTimeout>
    thinking: boolean
    replyCount: number
}

type BotResponse = {
    error?: string
    text?: string
    ctx: GeminiDiscordBotContext
}

export default class GeminiDiscordBot {
    init: GeminiDiscordBotInit
    ai: GoogleGenAI
    client: Client

    chatMap = new Map<AuthorId, ChatObj | undefined>()
    
    constructor(init: GeminiDiscordBotInit) {
        if (init.chatLifetimeInMinutes < 1 || init.chatLifetimeInMinutes > 10) {
            throw new Error("chatLifetimeInMinutes must be between 1 and 10.")
        }

        if (init.maxReplies < 1 || init.maxReplies > 10) {
            throw new Error("maxReplies must be between 1 and 10.")
        }

        this.init = init
        this.ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY
        })

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        })
    }

    async chat(authorId: AuthorId, message: string): Promise<BotResponse> {
        const existingChatObj = this.chatMap.get(authorId)
        const ctx = {
            message,
            authorId,
            ai: this.ai,
            bot: this,
            client: this.client
        }

        // NO EXISTING CHAT
        if (!existingChatObj) {
            // Create a new chat
            const chat = this.ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: this.init.sysInstructionCallback(ctx)
                }
            })

            // store in chatMap
            const chatObj = {
                chat,
                thinking: false,
                suicide: setTimeout(() => {
                    this.chatMap.delete(authorId)
                }, this.init.chatLifetimeInMinutes*60000),
                replyCount: 1
            }
            this.chatMap.set(authorId, chatObj)

            // get response
            const res = await chat.sendMessage({message})

            if (!res.text) return {
                error: "No text",
                ctx
            }

            return {
                text: res.text,
                ctx
            }
        } // END of NO EXISTING CHAT

        // EXISTING CHAT
        // reset suicide
        clearTimeout(existingChatObj.suicide)
        existingChatObj.suicide = setTimeout(() => {
            this.chatMap.delete(authorId)
        }, this.init.chatLifetimeInMinutes*60000);


        // get response
        // get response
        const res = await existingChatObj.chat.sendMessage({message})

        // update reply count
        existingChatObj.replyCount++;

        // check reply count
        if (existingChatObj.replyCount > this.init.maxReplies) {
            clearTimeout(existingChatObj.suicide)
            this.chatMap.delete(authorId)
        }

        if (!res.text) return {
            error: "No text",
            ctx
        }

        return {
            text: res.text,
            ctx
        }
    }
}