import TelegramBot from 'node-telegram-bot-api';
import { chatHistory, userModel, askOpenRouter } from '../services/openrouter.js';
import { markdownToTelegram, splitLongMessage } from '../utils/formatters.js';
import { withRetry } from '../utils/retry.js';
import { FREE_MODELS, SYSTEM_PROMPT, RETRY_CONFIG, DEFAULT_MODEL, ModelKey } from '../config/constants.ts';
import { isAIBreakingMessage, getAIBreakingMessage, isExpenseQuery } from '../utils/validation.js';
import { saveRecord, getLastRecord, formatUserStats } from '../services/storage.js';
import { AIResponseJSON } from '../types/index.js';
import { FinanceRecord } from '../models/FinanceRecord.js';

type TelegramMessage = TelegramBot.Message;

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

export function registerMessageHandler(bot: TelegramBot, openrouter: any): void {
  bot.on('message', async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    if (text.startsWith('/')) {
      return;
    }

    if (!chatHistory.has(chatId)) {
      await bot.sendMessage(chatId, '👋 Привет! Напиши /start чтобы начать общение.');
      return;
    }

    if (isAIBreakingMessage(text)) {
      console.log(`⚠️ Обнаружено потенциально проблемное сообщение от ${chatId}: "${text}"`);

      const friendlyResponse = getAIBreakingMessage(text);
      await bot.sendMessage(chatId, friendlyResponse);

      // Если сообщение содержит только цифры, но это похоже на расходы,
      // даем подсказку как правильно записывать
      if (/^\d+$/.test(text.trim()) && isExpenseQuery(text)) {
        await bot.sendMessage(
          chatId,
          '💡 *Совет:* Чтобы записать расход, напиши сумму и что купил.\n' +
            'Например: `300 обед` или `1500 продукты`',
          { parse_mode: 'Markdown' as const }
        );
      }

      return; // Не отправляем в ИИ
    }

    try {
      // Отправляем "печатает..."
      await bot.sendChatAction(chatId, 'typing');

      const currentModel = userModel.get(chatId) || DEFAULT_MODEL as ModelKey;

      const askFunction = () =>
        askOpenRouter(openrouter, chatId, text, FREE_MODELS, SYSTEM_PROMPT, currentModel);

      const reply = await withRetry(askFunction, chatId, bot, RETRY_CONFIG);

      if (!reply || reply.trim().length === 0) {
        await bot.sendMessage(chatId, '⚠️ Нейросеть вернула пустой ответ. Попробуй еще раз.');
        return;
      }

      let isJsonResponse = false;
      let financeData: AIResponseJSON | null = null;

      try {
        // Пробуем найти JSON в ответе
        const jsonMatch = reply.match(/\{.*\}/s);
        if (jsonMatch) {
          const potentialJson = jsonMatch[0];
          const parsed = JSON.parse(potentialJson);

          // Проверяем, что это наша структура
          if (
            parsed.type &&
            parsed.amount &&
            parsed.description &&
            parsed.category
          ) {
            financeData = parsed as AIResponseJSON;
            isJsonResponse = true;
          }
        }
      } catch (e) {
        // Не JSON, значит обычный текст
        console.log('Обычный текстовый ответ от ИИ');
      }

      // Если это финансовая операция
      if (isJsonResponse && financeData) {
        // Сохраняем запись
        const record: FinanceRecord = saveRecord(chatId, financeData);

        // Формируем красивое подтверждение
        let response = '✅ *Запись добавлена!*\n\n';
        response += record.format();

        // Добавляем статистику
        response += `\n\n${formatUserStats(chatId)}`;

        await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' as const });
        return;
      }

      // Если это обычный текст, форматируем и отправляем как раньше
      const formattedReply = markdownToTelegram(reply);

      if (!formattedReply || formattedReply.trim().length === 0) {
        await bot.sendMessage(
          chatId,
          '⚠️ Проблема с форматированием. Вот оригинальный ответ:\n\n' + reply
        );
        return;
      }

      const chunks = splitLongMessage(formattedReply);
      let sentCount = 0;

      for (const chunk of chunks) {
        if (chunk && chunk.trim().length > 0) {
          await bot.sendMessage(chatId, chunk, { parse_mode: 'HTML' as const });
          sentCount++;
        }
      }

      if (sentCount === 0) {
        await bot.sendMessage(chatId, reply);
      }
    } catch (error) {
      const err = error as ErrorWithStatus;
      console.error('❌ Ошибка:', err);

      let errorMessage = '😵 Извините, сервис ИИ временно недоступен. ';

      if (err.status === 429) {
        errorMessage += 'Слишком много запросов. Попробуйте через минуту.';
      } else if (err.status === 401) {
        errorMessage += 'Проблема с авторизацией.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage += 'Нет соединения с сервером.';
      } else {
        errorMessage += 'Попробуйте еще раз позже.';
      }

      await bot.sendMessage(chatId, errorMessage);
    }
  });
}
