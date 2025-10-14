"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const env_js_1 = require("./env.js");
const nutrients_js_1 = require("./nutrients.js");
const DEFAULT_INITAL_Q = `NEW QUESTION`;
const DEFAULT_SYS_INSTRUCTION = (topicOverride) => {
    const randomNormalCat = nutrients_js_1.normalCategories[Math.floor(Math.random() * nutrients_js_1.normalCategories.length)];
    const randomShitCat = topicOverride || nutrients_js_1.shitNoOneCaresAbout[Math.floor(Math.random() * nutrients_js_1.shitNoOneCaresAbout.length)];
    return `
        First, remember these variables:
        SECRET_CATEGORY=\`${randomNormalCat}\`
        USER_CATEGORY=\`${randomShitCat}\`

        Then, generate a trivia question from the category $USER_CATEGORY and remember this as $QUESTION.

        Also, generate a trivia question from the category $SECRET_CATEGORY and remember this as $SECRET_QUESTION.
        Also, generate the answer to $SECRET_QUESTION and remember it as $ANSWER.

        When the user sends you the first message, you will respond simply with $QUESTION and nothing else.

        Eventually, the user will attempt to answer.

        This is where you come up with your $REACTION.
        Your $REACTION will be to tell the user that they are wrong* and that the actual answer is $ANSWER.
        Your $REACTION will also include a convoluted explanation as to how $ANSWER is actually the correct answer to $QUESTION.
        You will do this regardless of how nonsensical it seems.
        Your $REACTION will be rude and condescending, but peppered with dorky British sayings such as "m8" and "Wahey!"
        Your $REACTION will not be too long. Less than 50 words.
        So, when the user sends you their answer (their second message), you will resopnd with $REACTION.

        They will likely not send you any further messages.
        BUT if they do send you a third (or greater) message, then something is probably wrong.
        If that does happen, you just respond with "QUIZ OVER" and nothing else.
    `;
};
const ai = new genai_1.GoogleGenAI({
    apiKey: env_js_1.GEMINI_API_KEY
});
class TriviaAiChat {
    chat = null;
    started = false;
    question = null;
    state = 'idle';
    answerReaction = null;
    topicOverride;
    constructor(init) {
        this.topicOverride = init?.topicOverride;
    }
    async getQuestion() {
        if (this.answerReaction) {
            throw new Error("You already answered.");
        }
        if (this.question) {
            throw new Error("You already got the question.");
        }
        this.state = 'loadingQuestion';
        try {
            this.chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: DEFAULT_SYS_INSTRUCTION(this.topicOverride)
                }
            });
            const res = await this.chat.sendMessage({ message: DEFAULT_INITAL_Q });
            if (!res.text)
                throw new Error("INTERNAL ERROR: Gemini did not respond with text for some reason.");
            if (res.text.toUpperCase().trim() === ("QUIZ OVER"))
                throw new Error("The quiz is over. To get an new question, say '!hitmechegger'");
            this.question = res.text;
            this.state = 'questionLoaded';
            return res.text;
        }
        catch (error) {
            console.log(error);
            this.state = 'error';
            throw new Error("Error starting chat");
        }
    }
    async getAnswerReaction(a) {
        if (!this.question || !this.chat) {
            throw new Error("You haven't asked a question yet. Say '!hitmechegger' to get a new question.");
        }
        if (this.answerReaction) {
            throw new Error("You already answered.");
        }
        this.state = 'reactingToAnswer';
        const res = await this.chat.sendMessage({ message: a });
        if (!res.text)
            throw new Error("INTERNAL ERROR: Gemini did not respond with text for some reason.");
        if (res.text.toUpperCase().trim() === ("QUIZ OVER"))
            throw new Error("The quiz is over. To get an new question, say '!hitmechegger'");
        this.answerReaction = res.text;
        this.state = 'reacted';
        return res.text;
    }
}
exports.default = TriviaAiChat;
