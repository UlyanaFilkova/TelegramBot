import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const token = process.env.BOT_TOKEN;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!token) {
    console.error('❌ Ошибка: токен не найден ');
    process.exit(1);
}

if (!openrouterKey) {
    console.error('❌ Ошибка: AI key не найден');
    process.exit(1);
}

const openrouter = new OpenAI({
    apiKey: openrouterKey,
    baseURL: 'https://openrouter.ai/api/v1'
});

// Хранилище истории диалогов (чтобы ИИ помнил контекст)
const chatHistory = new Map();

// Актуальные бесплатные модели OpenRouter на февраль 2026 [citation:3]
const FREE_MODELS = {
    // DeepSeek (самые популярные)
    'deepseek-r1': 'deepseek/deepseek-r1:free',           // R1 reasoning model
    'deepseek-v3': 'deepseek/deepseek-r1-0528:free', // V3 chat model
    'deepseek-chat': 'stepfun/step-3.5-flash:free',

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

// Текущая модель для каждого пользователя (можно менять)
const userModel = new Map();

// Системный промпт — объясняем ИИ его роль
const SYSTEM_PROMPT = {
    role: 'system',
    content: 'Ты дружелюбный помощник в Telegram. Отвечай кратко и по делу. Твой ответ не должен превышать 1000 символов. Если пользователь спрашивает про расходы или финансы, помогай с учетом трат.'
};

async function askOpenRouter(chatId, userMessage, modelKey = 'deepseek-v3') {
    try {
        // Получаем историю чата или создаем новую
        let history = chatHistory.get(chatId) || [];

        // Добавляем сообщение пользователя в историю
        history.push({ role: 'user', content: userMessage });

        // Ограничиваем историю последними 10 сообщениями (чтобы не перегружать)
        if (history.length > 10) {
            history = history.slice(-10);
        }

        // Получаем выбранную пользователем модель или используем дефолтную
        const model = userModel.get(chatId) || modelKey;
        const modelId = FREE_MODELS[model] || FREE_MODELS['deepseek-chat'];

        console.log(`🤔 Запрос к ${modelId} от пользователя ${chatId}`);

        // Формируем запрос
        const messages = [
            SYSTEM_PROMPT,
            ...history
        ];

        // Отправляем запрос к OpenRouter
        const response = await openrouter.chat.completions.create({
            model: modelId,
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        // Получаем ответ
        const reply = response.choices[0].message.content;

        // Добавляем ответ в историю
        history.push({ role: 'assistant', content: reply });
        chatHistory.set(chatId, history);

        // Логируем использование (сколько токенов потрачено)
        if (response.usage) {
            console.log(`📊 Токены: ${response.usage.total_tokens} (вход: ${response.usage.prompt_tokens}, выход: ${response.usage.completion_tokens})`);
        }

        return reply;

    } catch (error) {
        console.error('❌ Ошибка OpenRouter:', error);

        // Понятные сообщения об ошибках для пользователя
        if (error.status === 401) {
            return '❌ Ошибка авторизации.';
        }
        if (error.status === 429) {
            return '⏳ Слишком много запросов или закончились токены. Попробуйте позже.';
        }
        if (error.code === 'ECONNREFUSED') {
            return '🌐 Нет соединения. Проверьте интернет.';
        }
        return '😵 Извините, у меня ошибка с ИИ. Попробуйте еще раз позже.';
    }
}

/**
 * Форматирование списка моделей
 */
function formatModelsList() {
    let text = '🎯 *Доступные бесплатные модели:*\n\n';
    let i = 1;
    for (const [key, name] of Object.entries(FREE_MODELS)) {
        text += `${i}. ${key} — \`${name}\`\n`;
        i++;
    }
    text += '\nИспользуй `/model название` чтобы выбрать модель.\n';
    text += 'Например: `/model deepseek-r1`';
    return text;
}

// Функция для конвертации Markdown в Telegram HTML
function markdownToTelegram(text) {
    if (!text) return text;

    // Экранируем специальные символы HTML
    let converted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Жирный текст: **текст** или __текст__ -> <b>текст</b>
    converted = converted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    converted = converted.replace(/__(.*?)__/g, '<b>$1</b>');

    // Курсив: *текст* или _текст_ -> <i>текст</i>
    // Но нужно быть осторожным, чтобы не задеть экранированные символы
    converted = converted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
    converted = converted.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<i>$1</i>');

    // Моноширинный код: `текст` -> <code>текст</code>
    converted = converted.replace(/`(.*?)`/g, '<code>$1</code>');

    // Блок кода: ```текст``` -> <pre>текст</pre>
    converted = converted.replace(/```(.*?)```/gs, '<pre>$1</pre>');

    // Заголовки: # текст -> <b>текст</b> (в Telegram нет заголовков)
    converted = converted.replace(/^# (.*?)$/gm, '<b>$1</b>');
    converted = converted.replace(/^## (.*?)$/gm, '<b>$1</b>');
    converted = converted.replace(/^### (.*?)$/gm, '<b>$1</b>');

    // Списки: - текст или * текст
    converted = converted.replace(/^[-*] (.*?)$/gm, '• $1');

    // Ссылки: [текст](ссылка) -> <a href="ссылка">текст</a>
    converted = converted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    return converted;
}

const bot = new TelegramBot(token, { polling: true });

// Команда /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'друг';

    // Инициализируем историю для нового пользователя
    if (!chatHistory.has(chatId)) {
        chatHistory.set(chatId, []);
    }

    // Устанавливаем модель по умолчанию
    if (!userModel.has(chatId)) {
        userModel.set(chatId, 'deepseek-chat');
    }

    const currentModel = userModel.get(chatId);

    await bot.sendMessage(chatId,
        `👋 Привет, ${firstName}!\n\n` +
        `Я бот с искусственным интеллектом на базе OpenRouter.\n` +
        `Текущая модель: *${currentModel}*\n\n` +
        `📝 *Команды:*\n` +
        `/model — посмотреть доступные модели\n` +
        `/model [название] — выбрать модель\n` +
        `/clear — очистить историю диалога\n` +
        `/help — помощь\n\n` +
        `Просто напиши мне что-нибудь, и я отвечу!`,
        { parse_mode: 'Markdown' }
    );
});

// Команда /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId,
        '📖 *Доступные команды:*\n\n' +
        '/start — начать общение\n' +
        '/model — список доступных моделей\n' +
        '/model [название] — выбрать модель (например: /model deepseek-r1)\n' +
        '/clear — забыть историю разговора\n' +
        '/help — показать эту справку\n\n' +
        '🤖 *О боте:*\n' +
        'Использует OpenRouter для доступа к бесплатным AI моделям.\n' +
        'Поддерживает DeepSeek, Llama, Gemma, Mistral и другие.',
        { parse_mode: 'Markdown' }
    );
});

// Команда /model — показать доступные модели
bot.onText(/\/model$/, async (msg) => {
    const chatId = msg.chat.id;
    const currentModel = userModel.get(chatId) || 'deepseek-chat';

    let text = formatModelsList();
    text += `\n\n✨ *Текущая модель:* ${currentModel}`;

    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// Команда /model [название] — выбрать модель
bot.onText(/\/model (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const modelKey = match[1].trim().toLowerCase();

    // Проверяем, есть ли такая модель
    if (FREE_MODELS[modelKey]) {
        userModel.set(chatId, modelKey);
        await bot.sendMessage(chatId,
            `✅ Модель изменена на *${modelKey}*\n\n` +
            `Теперь я буду использовать: \`${FREE_MODELS[modelKey]}\``,
            { parse_mode: 'Markdown' }
        );
    } else {
        // Показываем похожие модели или список
        const availableModels = Object.keys(FREE_MODELS).join(', ');
        await bot.sendMessage(chatId,
            `❌ Модель "${modelKey}" не найдена.\n\n` +
            `Доступные модели: ${availableModels}\n\n` +
            `Используй /model чтобы увидеть полный список.`
        );
    }
});

bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;
    chatHistory.delete(chatId);
    bot.sendMessage(chatId, '🧹 История диалога очищена! Начинаем с чистого листа.');
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Простая проверка: только ты можешь смотреть статистику
    // Замени на свой Telegram ID
    const YOUR_TELEGRAM_ID = 123456789;

    if (userId === YOUR_TELEGRAM_ID) {
        const stats = {
            totalUsers: chatHistory.size,
            activeModels: Object.fromEntries(userModel),
        };

        bot.sendMessage(chatId,
            `📊 *Статистика бота:*\n\n` +
            `👥 Пользователей в памяти: ${stats.totalUsers}\n` +
            `🎯 Модели: ${JSON.stringify(stats.activeModels, null, 2)}`,
            { parse_mode: 'Markdown' }
        );
    } else {
        bot.sendMessage(chatId, '❌ У тебя нет доступа к этой команде.');
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Игнорируем пустые сообщения
    if (!text) return;

    // Игнорируем команды (они начинаются с /)
    if (text.startsWith('/')) {
        return;
    }

    // Проверяем, есть ли пользователь в системе
    if (!chatHistory.has(chatId)) {
        // Если нет — отправляем приветствие и предлагаем начать
        await bot.sendMessage(chatId,
            '👋 Привет! Напиши /start чтобы начать общение.'
        );
        return;
    }

    try {
        // Отправляем "печатает..." чтобы пользователь знал, что бот думает
        await bot.sendChatAction(chatId, 'typing');

        // Получаем текущую модель пользователя
        const currentModel = userModel.get(chatId) || 'deepseek-chat';

        // Получаем ответ от OpenRouter
        const reply = await askOpenRouter(chatId, text, currentModel);

        // Конвертируем Markdown в Telegram HTML
        const formattedReply = markdownToTelegram(reply);

        // Отправляем с HTML-разметкой
        if (formattedReply.length > 4096) {
            // Разбиваем ответ, если он слишком длинный
            const chunks = formattedReply.match(/[\s\S]{1,4096}/g) || [];
            for (const chunk of chunks) {
                await bot.sendMessage(chatId, chunk, { parse_mode: 'HTML' });
            }
        } else {
            await bot.sendMessage(chatId, formattedReply, { parse_mode: 'HTML' });
        }
    } catch (error) {
        console.error('❌ Ошибка в обработчике:', error);
        await bot.sendMessage(chatId,
            '😵 Произошла внутренняя ошибка. Попробуй еще раз или напиши /start'
        );
    }
});

bot.on('polling_error', (error) => {
    console.log('Ошибка polling:', error);
});

// Обработка graceful shutdown
process.once('SIGINT', () => {
    console.log('\n👋 Бот остановлен (SIGINT)');
    bot.stopPolling();
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('\n👋 Бот остановлен (SIGTERM)');
    bot.stopPolling();
    process.exit(0);
});
