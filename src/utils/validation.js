export function isAIBreakingMessage(text) {
    if (!text) return true;

    const trimmed = text.trim();

    // Слишком короткие сообщения (меньше 2 символов)
    if (trimmed.length < 2) return true;

    // Только цифры (включая пробелы между цифрами)
    if (/^[\d\s]+$/.test(trimmed)) return true;

    // Только спецсимволы (без букв и цифр)
    // ИСПРАВЛЕНО: теперь проверяем, что в строке вообще нет букв
    if (!/[а-яёa-z]/i.test(trimmed) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmed)) {
        return true;
    }

    // Только цифры и спецсимволы (без букв)
    if (!/[а-яёa-z]/i.test(trimmed) && /[\d\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(trimmed)) {
        return true;
    }

    // Слишком много повторяющихся символов (более 10 подряд)
    if (/(.)\1{10,}/.test(trimmed)) return true;

    return false;
}

export function getAIBreakingMessage(text) {
    const trimmed = text.trim();

    // Только цифры
    if (/^[\d\s]+$/.test(trimmed)) {
        const responses = [
            '🔢 Я получил только цифры. Может, расскажешь, что они значат?',
            '📊 Это какая-то статистика? Напиши словами, что ты имеешь в виду.',
            '🧮 Если это сумма расходов, напиши, например: "300 рублей на обед"',
            '💰 Я понимаю цифры в контексте. Например: "500 такси" или "1500 продукты"'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Только спецсимволы (без букв)
    if (!/[а-яёa-z]/i.test(trimmed) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmed)) {
        return '❓ Я не понимаю набор символов. Напиши, пожалуйста, словами.';
    }

    // Слишком короткое сообщение
    if (trimmed.length < 2) {
        return '🤔 Слишком короткое сообщение. Напиши что-нибудь подлиннее.';
    }

    return '🤨 Я не могу обработать такое сообщение. Попробуй написать обычным текстом.';
}

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