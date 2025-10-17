"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShittyBot = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BotCache_js_1 = require("./BotCache.js");
const discord_js_1 = require("discord.js");
const genai_1 = require("@google/genai");
class ShittyBot {
    #botToken;
    #geminiToken;
    #botCache;
    #discordClient;
    #ai;
    #generateSystemInstruction;
    #router = {};
    #maxReplies;
    constructor(init) {
        // TOKENS
        if (!process.env[init.env.botToken]) {
            throw new Error(`Missing env-var: ${init.env.botToken}`);
        }
        if (!process.env[init.env.geminiToken]) {
            throw new Error(`Missing env-var: ${init.env.geminiToken}`);
        }
        this.#botToken = process.env[init.env.botToken] || "";
        this.#geminiToken = process.env[init.env.geminiToken] || "";
        this.#botCache = new BotCache_js_1.BotCache(init.chatLifetimeInMinutes);
        // Client
        this.#discordClient = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent
            ]
        });
        // AI
        this.#ai = new genai_1.GoogleGenAI({ apiKey: this.#geminiToken });
        // sysInst init
        this.#generateSystemInstruction = init.generateSystemInstruction;
        // other
        this.#maxReplies = init.maxReplies;
    }
    getChatItem(authorId) {
        const item = this.#botCache.get(authorId);
        if (item)
            item.userMessageCount++;
        if (item && item.userMessageCount > this.#maxReplies) {
            console.log("Max replies reached");
            this.#botCache.delete(authorId);
            return;
        }
        return item;
    }
    forceCreateChatItem(authorId, prompt) {
        const existing = this.getChatItem(authorId);
        if (existing)
            this.#botCache.delete(authorId);
        const chat = this.#ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: this.#generateSystemInstruction({
                    prompt
                })
            }
        });
        const item = {
            chat,
            ai: this.#ai,
            userMessageCount: 1
        };
        this.#botCache.forceCreate(authorId, item);
        return item;
    }
    onMessage(head, cb) {
        this.#router[head] = {
            head,
            callback: async (authorId, message, args) => {
                await cb(authorId, message, args);
            }
        };
    }
    onAnyMessage(cb) {
        this.#discordClient.on('messageCreate', async (message) => {
            await cb(message.author.id, message, []);
        });
    }
    start() {
        this.#discordClient.on('messageCreate', async (message) => {
            const [head, ...args] = message.content.trim().split('|');
            const router = this.#router[head];
            if (router) {
                await router.callback(message.author.id, message, args);
                return;
            }
        });
        this.#discordClient.once('clientReady', (rc) => {
            console.log(`Logged in as ${rc.user.tag}`);
        });
        this.#discordClient.login(this.#botToken);
    }
}
exports.ShittyBot = ShittyBot;
