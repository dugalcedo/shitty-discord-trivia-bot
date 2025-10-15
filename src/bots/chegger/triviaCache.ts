import TriviaAiChat from "./ai.js";

type DiscordAuthorId = string;
type TriviaQuestion = string;

const TRIVIA_CACHE_OBJECT_LIFETIME = 1000*60*5;

type TriviaCacheObject = {
    authorId: string
    createdAt: number
    suicide: ReturnType<typeof setTimeout>
    tc: TriviaAiChat
    questionSent?: boolean
    answerSent?: boolean
}

const triviaCache = new Map<DiscordAuthorId, TriviaCacheObject>()

export const registerNewQuestion = (id: DiscordAuthorId, topicOverride?: string) => {
    if (triviaCache.has(id)) {
        const obj = triviaCache.get(id)
        clearTimeout(obj?.suicide)
        triviaCache.delete(id)
    }

    const obj: TriviaCacheObject = {
        authorId: id,
        createdAt: Date.now(),
        suicide: setTimeout(() => {
            triviaCache.delete(id)
        }, TRIVIA_CACHE_OBJECT_LIFETIME),
        tc: new TriviaAiChat({topicOverride})
    }

    triviaCache.set(id, obj)

    return obj
}

export const getQuestionMaybe = (id: DiscordAuthorId) => {
    const obj = triviaCache.get(id)

    if (obj) {
        clearTimeout(obj.suicide)
        obj.suicide = setTimeout(() => {
            triviaCache.delete(id)
        }, TRIVIA_CACHE_OBJECT_LIFETIME);
    }

    return obj
}

export const getQuestionOrNew = (id: DiscordAuthorId, topicOverride?: string) => {
    const obj = getQuestionMaybe(id)
    if (obj) return obj;
    return registerNewQuestion(id, topicOverride)
}

export const deleteQuestion = (id: DiscordAuthorId) => {
    const obj = triviaCache.get(id)
    if (obj) {
        clearTimeout(obj.suicide)
    }
    triviaCache.delete(id)
}

