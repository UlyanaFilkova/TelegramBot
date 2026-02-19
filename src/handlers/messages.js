import { chatHistory, userModel, askOpenRouter } from '../services/openrouter.js';
import { markdownToTelegram, splitLongMessage } from '../utils/formatters.js';
import { withRetry } from '../utils/retry.js';
import { FREE_MODELS, SYSTEM_PROMPT, RETRY_CONFIG } from '../config/constants.js';
import { isAIBreakingMessage, getAIBreakingMessage, isExpenseQuery } from '../utils/validation.js';

/**
 * Регистрация обработчика сообщений
 */
export function registerMessageHandler(bot, openrouter) {

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

        if (isAIBreakingMessage(text)) {
            console.log(`⚠️ Обнаружено потенциально проблемное сообщение от ${chatId}: "${text}"`);

            const friendlyResponse = getAIBreakingMessage(text);
            await bot.sendMessage(chatId, friendlyResponse);

            // Если сообщение содержит только цифры, но это похоже на расходы,
            // даем подсказку как правильно записывать
            if (/^\d+$/.test(text.trim()) && isExpenseQuery(text)) {
                await bot.sendMessage(chatId,
                    '💡 *Совет:* Чтобы записать расход, напиши сумму и что купил.\n' +
                    'Например: `300 обед` или `1500 продукты`',
                    { parse_mode: 'Markdown' }
                );
            }

            return; // Не отправляем в ИИ
        }

        try {
            // Отправляем "печатает..." чтобы пользователь знал, что бот думает
            await bot.sendChatAction(chatId, 'typing');

            // Получаем текущую модель пользователя
            const currentModel = userModel.get(chatId) || 'deepseek-chat';

            // Создаем функцию для запроса к OpenRouter
            const askFunction = () => askOpenRouter(
                openrouter,
                chatId,
                text,
                FREE_MODELS,
                SYSTEM_PROMPT,
                currentModel
            );

            // Получаем ответ с повторными попытками
            const reply = await withRetry(askFunction, chatId, bot, RETRY_CONFIG);

            // Проверка на пустой ответ
            if (!reply || reply.trim().length === 0) {
                await bot.sendMessage(chatId, '⚠️ Нейросеть вернула пустой ответ. Попробуй еще раз.');
                return;
            }

            // Конвертируем Markdown в Telegram HTML
            const formattedReply = markdownToTelegram(reply);

            if (!formattedReply || formattedReply.trim().length === 0) {
                await bot.sendMessage(chatId, '⚠️ Проблема с форматированием. Вот оригинальный ответ:\n\n' + reply);
                return;
            }

            // Разбиваем на части и отправляем
            const chunks = splitLongMessage(formattedReply);
            let sentCount = 0;

            for (const chunk of chunks) {
                if (chunk && chunk.trim().length > 0) {
                    await bot.sendMessage(chatId, chunk, { parse_mode: 'HTML' });
                    sentCount++;
                }
            }

            if (sentCount === 0) {
                await bot.sendMessage(chatId, reply);
            }

        } catch (error) {
            console.error('❌ Ошибка:', error);

            // Отправляем пользователю понятное сообщение
            let errorMessage = '😵 Извините, сервис ИИ временно недоступен. ';

            if (error.status === 429) {
                errorMessage += 'Слишком много запросов. Попробуйте через минуту.';
            } else if (error.status === 401) {
                errorMessage += 'Проблема с авторизацией.';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage += 'Нет соединения с сервером.';
            } else {
                errorMessage += 'Попробуйте еще раз позже.';
            }

            await bot.sendMessage(chatId, errorMessage);
        }
    });
}