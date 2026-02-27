import TelegramBot from 'node-telegram-bot-api';
import { RetryConfig } from '../config/constants.js';
import { ErrorWithDetails } from '../types/index.js';

type AsyncFunction<T = string> = () => Promise<T>;

export async function withRetry<T = string>(
  fn: AsyncFunction<T>,
  chatId: number,
  bot: TelegramBot | null,
  config: RetryConfig
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = config;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Попытка ${attempt}/${maxRetries} для пользователя ${chatId}`);

      const result = await fn();

      if (typeof result === 'string' && (!result || result.trim().length === 0)) {
        console.log(`⚠️ Попытка ${attempt} вернула пустой ответ`);

        // Если это последняя попытка, выбрасываем специальную ошибку
        if (attempt === maxRetries) {
          throw new Error('Empty response from AI after all retries');
        }

        // Иначе продолжаем цикл (повторяем попытку)
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        console.log(`⏳ Пустой ответ, ждем ${delay}мс перед попыткой ${attempt + 1}...`);

        if (attempt === 1 && bot) {
          try {
            await bot.sendMessage(
              chatId,
              '⚠️ ИИ вернул пустой ответ. Пробую снова через несколько секунд...'
            );
          } catch (notifyError) {}
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Переходим к следующей попытке
      }

      return result;
    } catch (error) {
      const err = error as ErrorWithDetails;
      lastError = err;

      const shouldRetry =
        err.status === 429 || // Too Many Requests
        err.status === 500 || // Internal Server Error
        err.status === 502 || // Bad Gateway
        err.status === 503 || // Service Unavailable
        err.status === 504 || // Gateway Timeout
        err.code === 'ECONNRESET' || // Connection reset
        err.code === 'ETIMEDOUT' || // Timeout
        err.message?.includes('timeout') ||
        err.message?.includes('rate limit') ||
        err.message?.includes('overloaded') ||
        err.message?.includes('Empty response');

      if (!shouldRetry || attempt === maxRetries) {
        console.log(`❌ Попытка ${attempt} не удалась, повтор не требуется или достигнут лимит`);
        break;
      }

      // Экспоненциальная задержка
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`⏳ Ждем ${delay}мс перед попыткой ${attempt + 1}...`);

      if (attempt === 1 && bot && !err.message?.includes('Empty response')) {
        try {
          await bot.sendMessage(
            chatId,
            '⏳ ИИ временно перегружен. Пробую снова через несколько секунд...'
          );
        } catch (notifyError) {}
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
