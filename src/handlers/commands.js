import { chatHistory, userModel } from '../services/openrouter.js';
import { formatModelsList } from '../utils/formatters.js';
import { FREE_MODELS, ADMIN_ID } from '../config/constants.js';

export function registerCommands(bot) {

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

    bot.onText(/\/model$/, async (msg) => {
        const chatId = msg.chat.id;
        const currentModel = userModel.get(chatId) || 'deepseek-chat';

        let text = formatModelsList(FREE_MODELS);
        text += `\n\n✨ *Текущая модель:* ${currentModel}`;

        await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/model (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const modelKey = match[1].trim().toLowerCase();

        if (FREE_MODELS[modelKey]) {
            userModel.set(chatId, modelKey);
            await bot.sendMessage(chatId,
                `✅ Модель изменена на *${modelKey}*\n\n` +
                `Теперь я буду использовать: \`${FREE_MODELS[modelKey]}\``,
                { parse_mode: 'Markdown' }
            );
        } else {
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

        if (userId === ADMIN_ID) {
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

    bot.onText(/\/test/, (msg) => {
        const chatId = msg.chat.id;

        bot.sendMessage(chatId,
            '🧪 *Тестовые сообщения:*\n\n' +
            'Попробуй отправить:\n' +
            '• `12345` (только цифры)\n' +
            '• `!@#$%` (спецсимволы)\n' +
            '• `а` (один символ)\n' +
            '• `300` (цифра - расход)\n' +
            '• `кофе 300` (корректный расход)',
            { parse_mode: 'Markdown' }
        );
    });
}