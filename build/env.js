"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEMINI_API_KEY = exports.BOT_TOKEN = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.BOT_TOKEN)
    throw new Error("Mising envvar: BOT_TOKEN");
if (!process.env.GEMINI_API_KEY)
    throw new Error("Mising envvar: GEMINI_API_KEY");
exports.BOT_TOKEN = process.env.BOT_TOKEN || "";
exports.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
