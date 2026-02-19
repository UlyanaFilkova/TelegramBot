/**
 * Функция с повторными попытками при ошибках OpenRouter
 * @param {Function} fn - асинхронная функция для повторения
 * @param {number} chatId - ID чата для уведомлений
 * @param {Object} bot - экземпляр бота для отправки уведомлений
 * @param {Object} config - конфигурация повторных попыток
 * @returns {Promise<any>} - результат выполнения функции
 */
export async function withRetry(fn, chatId, bot, config) {
    const { maxRetries, baseDelay } = config;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Попытка ${attempt}/${maxRetries} для пользователя ${chatId}`);

            // Пробуем выполнить функцию
            const result = await fn();

            // Если успешно — возвращаем результат
            return result;

        } catch (error) {
            lastError = error;

            // Определяем, стоит ли повторять попытку
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

            // Отправляем уведомление пользователю
            if (attempt === 1 && bot) {
                try {
                    await bot.sendMessage(chatId,
                        '⏳ ИИ временно перегружен. Пробую снова через несколько секунд...'
                    );
                } catch (notifyError) {
                    // Игнорируем ошибки уведомления
                }
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Если все попытки исчерпаны, выбрасываем последнюю ошибку
    throw lastError;
}