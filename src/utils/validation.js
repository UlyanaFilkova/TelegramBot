/**
 * Проверка, является ли сообщение "сломанным" для ИИ
 * @param {string} text - текст сообщения
 * @returns {boolean} - true если сообщение может сломать ИИ
 */
export function isAIBreakingMessage(text) {
    if (!text) return true;

    const trimmed = text.trim();

    // Слишком короткие сообщения
    if (trimmed.length < 2) return true;

    // Только цифры
    if (/^\d+$/.test(trimmed)) return true;

    // Только спецсимволы
    if (/^[^\w\s]+$/.test(trimmed)) return true;

    // Только цифры и спецсимволы
    if (/^[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(trimmed)) return true;

    // Слишком много повторяющихся символов
    if (/(.)\1{10,}/.test(trimmed)) return true;

    return false;
}

/**
 * Получить дружелюбное сообщение для "сломанного" ввода
 * @param {string} text - исходное сообщение
 * @returns {string} - ответ пользователю
 */
export function getAIBreakingMessage(text) {
    const trimmed = text.trim();

    if (/^\d+$/.test(trimmed)) {
        const responses = [
            '🔢 Я получил только цифры. Может, расскажешь, что они значат?',
            '📊 Это какая-то статистика? Напиши словами, что ты имеешь в виду.',
            '🧮 Если это сумма расходов, напиши, например: "300 рублей на обед"',
            '💰 Я понимаю цифры в контексте. Например: "500 такси" или "1500 продукты"'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    if (/^[^\w\s]+$/.test(trimmed)) {
        return '❓ Я не понимаю набор символов. Напиши, пожалуйста, словами.';
    }

    if (trimmed.length < 2) {
        return '🤔 Слишком короткое сообщение. Напиши что-нибудь подлиннее.';
    }

    return '🤨 Я не могу обработать такое сообщение. Попробуй написать обычным текстом.';
}

/**
 * Проверка, содержит ли сообщение запрос о расходах
 * @param {string} text - текст сообщения
 * @returns {boolean} - true если это запрос о расходах
 */
export function isExpenseQuery(text) {
    if (!text) return false;

    const expenseKeywords = [
        'потратил', 'потратила', 'расход', 'купил', 'купила',
        'сколько', 'денег', 'руб', '₽', '$', 'евро', 'копил',
        'бюджет', 'трата', 'стоило', 'обошлось', 'чек'
    ];

    const lowerText = text.toLowerCase();
    return expenseKeywords.some(keyword => lowerText.includes(keyword));
}