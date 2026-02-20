export const FREE_MODELS = {
    // 'default-chat': 'openrouter/free',

    // быстрые

    // upstage
    'solar-pro-3': 'upstage/solar-pro-3:free',

    // arcee-ai
    'arcee-ai-large': 'arcee-ai/trinity-large-preview:free',
    'arcee-ai-mini': 'arcee-ai/trinity-mini:free',

    // stepfun
    'stepfun': 'stepfun/step-3.5-flash:free',

    // z-ai
    'z-ai': 'z-ai/glm-4.5-air:free',

    // nvidia
    'nvidia-nano': 'nvidia/nemotron-nano-12b-v2-vl:free',
    'nvidia-3-nano': 'nvidia/nemotron-3-nano-30b-a3b:free',

    // qwen
    'qwen-30b': 'qwen/qwen3-vl-30b-a3b-thinking',
    'qwen-235b': 'qwen/qwen3-vl-235b-a22b-thinking',
    'qwen-235b-2507': 'qwen/qwen3-235b-a22b-thinking-2507',

    // OpenRouter (автоматически выбирает лучшую бесплатную модель)
    'free-router': 'openrouter/free',

    // медленные

    // DeepSeek
    'deepseek-r1': 'deepseek/deepseek-r1-0528:free',
};

export const DEFAULT_MODEL = "nvidia-3-nano"//"default-chat"

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