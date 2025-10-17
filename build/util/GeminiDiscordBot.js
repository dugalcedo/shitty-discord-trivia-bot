"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const env_js_1 = require("../env.js");
const discord_js_1 = require("discord.js");
class GeminiDiscordBot {
    init;
    ai;
    client;
    chatMap = new Map();
    constructor(init) {
        if (init.chatLifetimeInMinutes < 1 || init.chatLifetimeInMinutes > 10) {
            throw new Error("chatLifetimeInMinutes must be between 1 and 10.");
        }
        if (init.maxReplies < 1 || init.maxReplies > 10) {
            throw new Error("maxReplies must be between 1 and 10.");
        }
        this.init = init;
        this.ai = new genai_1.GoogleGenAI({
            apiKey: env_js_1.GEMINI_API_KEY
        });
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent
            ]
        });
    }
    async chat(authorId, message) {
        const existingChatObj = this.chatMap.get(authorId);
        const ctx = {
            message,
            authorId,
            ai: this.ai,
            bot: this,
            client: this.client
        };
        // NO EXISTING CHAT
        if (!existingChatObj) {
            // Create a new chat
            const chat = this.ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: this.init.sysInstructionCallback(ctx)
                }
            });
            // store in chatMap
            const chatObj = {
                chat,
                thinking: false,
                suicide: setTimeout(() => {
                    this.chatMap.delete(authorId);
                }, this.init.chatLifetimeInMinutes * 60000),
                replyCount: 1
            };
            this.chatMap.set(authorId, chatObj);
            // get response
            const res = await chat.sendMessage({ message });
            if (!res.text)
                return {
                    error: "No text",
                    ctx
                };
            return {
                text: res.text,
                ctx
            };
        } // END of NO EXISTING CHAT
        // EXISTING CHAT
        // reset suicide
        clearTimeout(existingChatObj.suicide);
        existingChatObj.suicide = setTimeout(() => {
            this.chatMap.delete(authorId);
        }, this.init.chatLifetimeInMinutes * 60000);
        // get response
        // get response
        const res = await existingChatObj.chat.sendMessage({ message });
        // update reply count
        existingChatObj.replyCount++;
        // check reply count
        if (existingChatObj.replyCount > this.init.maxReplies) {
            clearTimeout(existingChatObj.suicide);
            this.chatMap.delete(authorId);
        }
        if (!res.text)
            return {
                error: "No text",
                ctx
            };
        return {
            text: res.text,
            ctx
        };
    }
}
exports.default = GeminiDiscordBot;
