export const FREE_MODELS = {
    // DeepSeek (самые популярные)
    'deepseek-r1': 'deepseek/deepseek-r1:free',           // R1 reasoning model
    'deepseek-v3': 'deepseek/deepseek-r1-0528:free', // V3 chat model
    'deepseek-chat': 'upstage/solar-pro-3:free',

    // Meta Llama
    'llama-3.3': 'meta-llama/llama-3.3-70b-instruct:free',    // 70B модель
    'llama-3.1': 'meta-llama/llama-3.1-8b-instruct:free',

    // Google
    'gemma-2': 'google/gemma-2-9b-it:free',
    'gemma-3': 'google/gemma-3-4b-it:free',               // Новая Gemma 3

    // Microsoft
    'phi-3': 'microsoft/phi-3-mini-128k-instruct:free',

    // Mistral
    'mistral': 'mistralai/mistral-7b-instruct:free',

    // Qwen
    'qwen-2': 'qwen/qwen2-7b-instruct:free',
    'qwen-3': 'qwen/qwen3-4b:free',                       // Qwen 3

    // NVIDIA
    'nemotron': 'nvidia/nemotron-nano-8b-v1:free',

    // Специальная модель OpenRouter (автоматически выбирает лучшую бесплатную)
    'free-router': 'openrouter/free'                       // Рекомендую!
};

export const SYSTEM_PROMPT = {
    role: 'system',
    content: 'Ты дружелюбный помощник в Telegram. Отвечай кратко и по делу. Твой ответ не должен превышать 1000 символов. Если пользователь спрашивает про расходы или финансы, помогай с учетом трат.'
};

export const ADMIN_ID = 1120721483;

export const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 10000
};