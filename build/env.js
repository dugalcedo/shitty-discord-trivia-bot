"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RIDDLER_TOKEN = exports.GEMINI_API_KEY = exports.BOT_TOKEN = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.BOT_TOKEN)
    throw new Error("Mising envvar: BOT_TOKEN");
if (!process.env.GEMINI_API_KEY)
    throw new Error("Mising envvar: GEMINI_API_KEY");
if (!process.env.RIDDLER_TOKEN)
    throw new Error("Mising envvar: RIDDLER_TOKEN");
exports.BOT_TOKEN = process.env.BOT_TOKEN || "";
exports.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
exports.RIDDLER_TOKEN = process.env.RIDDLER_TOKEN || "";
