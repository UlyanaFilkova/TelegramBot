export const FREE_MODELS = {
    'deepseek-chat': 'openrouter/free',

    // быстрые

    // Upstage
    'solar-pro-3': 'upstage/solar-pro-3:free',

    // OpenRouter (автоматически выбирает лучшую бесплатную модель)
    'free-router': 'openrouter/free',

    // медленные

    // DeepSeek
    'deepseek-r1': 'deepseek/deepseek-r1-0528:free',
};

export const DEFAULT_MODEL = "deepseek-chat"

export const SYSTEM_PROMPT = {
    role: 'system',
    content: 'Ты помощник в Telegram. Говори на русском языке. Отвечай как Лебовски из фильма Большой Лебовски. Отвечай кратко и по делу. Твой ответ не должен превышать 1000 символов. Если пользователь спрашивает про расходы или финансы, помогай с учетом трат.'
};

export const ADMIN_ID = 1120721483;

export const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 10000
};