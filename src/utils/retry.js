export async function withRetry(fn, chatId, bot, config) {
    const { maxRetries, baseDelay } = config;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Попытка ${attempt}/${maxRetries} для пользователя ${chatId}`);

            const result = await fn();

            if (!result || result.trim().length === 0) {
                console.log(`⚠️ Попытка ${attempt} вернула пустой ответ`);

                // Если это последняя попытка, выбрасываем специальную ошибку
                if (attempt === maxRetries) {
                    throw new Error('Empty response from AI after all retries');
                }

                // Иначе продолжаем цикл (повторяем попытку)
                const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), config.maxDelay);
                console.log(`⏳ Пустой ответ, ждем ${delay}мс перед попыткой ${attempt + 1}...`);

                if (attempt === 1 && bot) {
                    try {
                        await bot.sendMessage(chatId,
                            '⚠️ ИИ вернул пустой ответ. Пробую снова через несколько секунд...'
                        );
                    } catch (notifyError) {}
                }

                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Переходим к следующей попытке
            }


            return result;

        } catch (error) {
            lastError = error;

            const shouldRetry =
                error.status === 429 || // Too Many Requests
                error.status === 500 || // Internal Server Error
                error.status === 502 || // Bad Gateway
                error.status === 503 || // Service Unavailable
                error.status === 504 || // Gateway Timeout
                error.code === 'ECONNRESET' || // Connection reset
                error.code === 'ETIMEDOUT' || // Timeout
                error.message?.includes('timeout') ||
                error.message?.includes('rate limit') ||
                error.message?.includes('overloaded');

            if (!shouldRetry || attempt === maxRetries) {
                console.log(`❌ Попытка ${attempt} не удалась, повтор не требуется или достигнут лимит`);
                break;
            }

            // Экспоненциальная задержка
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), config.maxDelay);
            console.log(`⏳ Ждем ${delay}мс перед попыткой ${attempt + 1}...`);

            if (attempt === 1 && bot && !error.message?.includes('Empty response')) {
                try {
                    await bot.sendMessage(chatId,
                        '⏳ ИИ временно перегружен. Пробую снова через несколько секунд...'
                    );
                } catch (notifyError) {}
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}