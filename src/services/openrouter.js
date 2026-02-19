import OpenAI from 'openai';

// Хранилище истории диалогов
export const chatHistory = new Map();

// Текущая модель для каждого пользователя
export const userModel = new Map();

/**
 * Создание клиента OpenRouter
 */
export function createOpenRouterClient(apiKey) {
    return new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://openrouter.ai/api/v1'
    });
}

/**
 * Запрос к OpenRouter API
 */
export async function askOpenRouter(
    openrouter,
    chatId,
    userMessage,
    FREE_MODELS,
    SYSTEM_PROMPT,
    modelKey = 'deepseek-v3'
) {
    try {
        // Получаем историю чата или создаем новую
        let history = chatHistory.get(chatId) || [];

        // Добавляем сообщение пользователя в историю
        history.push({ role: 'user', content: userMessage });

        // Ограничиваем историю последними 10 сообщениями
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

        // Логируем использование
        if (response.usage) {
            console.log(`📊 Токены: ${response.usage.total_tokens} (вход: ${response.usage.prompt_tokens}, выход: ${response.usage.completion_tokens})`);
        }

        return reply;

    } catch (error) {
        console.error('❌ Ошибка OpenRouter:', error);
        throw error; // Пробрасываем ошибку для обработки в withRetry
    }
}

/**
 * Диагностика ключа OpenRouter
 */
export async function diagnoseOpenRouterKey(openrouterKey) {
    console.log('🔍 Диагностика ключа OpenRouter...');

    // Проверка 1: Формат ключа
    console.log('Формат ключа:', {
        startsWithSkOr: openrouterKey.startsWith('sk-or-v1-'),
        length: openrouterKey.length,
        preview: openrouterKey.substring(0, 10) + '...'
    });

    // Проверка 2: Прямой запрос к API ключа
    try {
        const keyCheck = await fetch('https://openrouter.ai/api/v1/auth/key', {
            headers: {
                'Authorization': `Bearer ${openrouterKey}`
            }
        });

        if (keyCheck.ok) {
            const data = await keyCheck.json();
            console.log('✅ Ключ валиден! Данные:', data);
        } else {
            console.log('❌ Ключ не валиден. Статус:', keyCheck.status);
            const error = await keyCheck.text();
            console.log('Ошибка:', error);
        }
    } catch (error) {
        console.log('❌ Ошибка при проверке ключа:', error.message);
    }

    // Проверка 3: Тестовый запрос к модели
    try {
        const testRequest = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openrouterKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-r1:free',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 5
            })
        });

        if (testRequest.ok) {
            console.log('✅ Тестовый запрос к модели успешен!');
        } else {
            console.log('❌ Тестовый запрос к модели не удался. Статус:', testRequest.status);
            const error = await testRequest.json();
            console.log('Ошибка:', error);
        }
    } catch (error) {
        console.log('❌ Ошибка при тестовом запросе:', error.message);
    }
}