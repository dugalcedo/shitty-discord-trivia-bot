export class BotCache<T extends Record<string, any>> {
    #cache = new Map<string, T | undefined>()
    #timeouts = new Map<string, ReturnType<typeof setTimeout>>()
    #lifetime: number

    constructor(lifetimeInMinutes: number) {
        if (!Number.isInteger(lifetimeInMinutes) || lifetimeInMinutes < 1) {
            throw new BotCacheError("Invalid lifetimeInMinutes. Must be integer of 1 or greater.")
        }

        this.#lifetime = lifetimeInMinutes * 60000;
    }

    resetTimeout(key: string) {
        const timeout = this.#timeouts.get(key)
        if (!timeout) return;
        clearTimeout(timeout);
        this.#timeouts.delete(key)
        this.#timeouts.set(key, setTimeout(() => {
            this.delete(key)
        }, this.#lifetime))
    }

    get(key: string) {
        const item = this.#cache.get(key)
        if (!item) return item;
        this.resetTimeout(key)
        return item;
    }

    // Boolean represents success or error
    update(key: string, cb: (x: T) => void): boolean {
        const item = this.get(key)
        if (!item) return false;
        cb(item)
        return true
    }

    set(key: string, value: T) {
        const existing = this.#cache.get(key)
        if (existing) throw new BotCacheError(`There is already something cached at the key "${key}"`)

        this.#cache.set(key, value)
        this.#timeouts.set(key, setTimeout(() => {
            this.delete(key)
        }, this.#lifetime))
    }

    delete(key: string) {
        clearTimeout(this.#timeouts.get(key))
        this.#timeouts.delete(key)
        this.#cache.delete(key)
    }

    forceCreate(key: string, value: T) {
        const existing = this.#cache.get(key)

        if (existing) {
            this.delete(key)
        }

        this.set(key, value)
    }
}


class BotCacheError extends Error {
    name = "Bot Cache Error"
}

