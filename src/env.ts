import dotenv from 'dotenv'
dotenv.config()

if (!process.env.BOT_TOKEN) throw new Error("Mising envvar: BOT_TOKEN");
if (!process.env.GEMINI_API_KEY) throw new Error("Mising envvar: GEMINI_API_KEY");

export const BOT_TOKEN = process.env.BOT_TOKEN || "";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";