"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.getQuestionOrNew = exports.getQuestionMaybe = exports.registerNewQuestion = void 0;
const ai_js_1 = __importDefault(require("./ai.js"));
const TRIVIA_CACHE_OBJECT_LIFETIME = 1000 * 60 * 5;
const triviaCache = new Map();
const registerNewQuestion = (id, topicOverride) => {
    if (triviaCache.has(id)) {
        const obj = triviaCache.get(id);
        clearTimeout(obj?.suicide);
        triviaCache.delete(id);
    }
    const obj = {
        authorId: id,
        createdAt: Date.now(),
        suicide: setTimeout(() => {
            triviaCache.delete(id);
        }, TRIVIA_CACHE_OBJECT_LIFETIME),
        tc: new ai_js_1.default({ topicOverride })
    };
    triviaCache.set(id, obj);
    return obj;
};
exports.registerNewQuestion = registerNewQuestion;
const getQuestionMaybe = (id) => {
    const obj = triviaCache.get(id);
    if (obj) {
        clearTimeout(obj.suicide);
        obj.suicide = setTimeout(() => {
            triviaCache.delete(id);
        }, TRIVIA_CACHE_OBJECT_LIFETIME);
    }
    return obj;
};
exports.getQuestionMaybe = getQuestionMaybe;
const getQuestionOrNew = (id, topicOverride) => {
    const obj = (0, exports.getQuestionMaybe)(id);
    if (obj)
        return obj;
    return (0, exports.registerNewQuestion)(id, topicOverride);
};
exports.getQuestionOrNew = getQuestionOrNew;
const deleteQuestion = (id) => {
    const obj = triviaCache.get(id);
    if (obj) {
        clearTimeout(obj.suicide);
    }
    triviaCache.delete(id);
};
exports.deleteQuestion = deleteQuestion;
