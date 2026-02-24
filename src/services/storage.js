import { FinanceRecord } from '../models/FinanceRecord.js';

const records = new Map();

/**
 * Сохранить новую запись
 */
export function saveRecord(chatId, data) {
    if (!records.has(chatId)) {
        records.set(chatId, []);
    }

    const record = new FinanceRecord(chatId, data);
    const userRecords = records.get(chatId);
    userRecords.push(record);

    // Сортируем по дате (новые сверху)
    userRecords.sort((a, b) => b.date - a.date);

    console.log(`✅ Запись сохранена для пользователя ${chatId}:`, record.debug());

    return record;
}

/**
 * Получить все записи пользователя
 */
export function getUserRecords(chatId) {
    return records.get(chatId) || [];
}

/**
 * Получить последнюю запись пользователя
 */
export function getLastRecord(chatId) {
    const userRecords = records.get(chatId);
    if (!userRecords || userRecords.length === 0) {
        return null;
    }
    return userRecords[0];
}

/**
 * Получить статистику пользователя
 */
export function getUserStats(chatId) {
    const userRecords = getUserRecords(chatId);

    const stats = {
        total: userRecords.length,
        income: 0,
        expense: 0,
        byCategory: {}
    };

    userRecords.forEach(record => {
        if (record.type === 'income') {
            stats.income += record.amount;
        } else {
            stats.expense += record.amount;
        }

        // Статистика по категориям
        if (!stats.byCategory[record.category]) {
            stats.byCategory[record.category] = 0;
        }
        stats.byCategory[record.category] += record.amount;
    });

    stats.balance = stats.income - stats.expense;

    return stats;
}

/**
 * Форматировать статистику для вывода
 */
export function formatUserStats(chatId) {
    const stats = getUserStats(chatId);

    if (stats.total === 0) {
        return '📊 У тебя пока нет записей. Напиши, например: `300 обед`';
    }

    let result = '📊 *Твоя статистика*\n\n';
    result += `💰 Доходы: +${stats.income} ₽\n`;
    result += `💸 Расходы: -${stats.expense} ₽\n`;

    const balanceEmoji = stats.balance >= 0 ? '✅' : '⚠️';
    result += `${balanceEmoji} Баланс: ${stats.balance >= 0 ? '+' : '-'}${Math.abs(stats.balance)} ₽\n\n`;

    if (Object.keys(stats.byCategory).length > 0) {
        result += '📈 *По категориям:*\n';
        Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, amount]) => {
                const sign = amount > 0 ? '+' : '-';
                result += `  ${category}: ${sign}${Math.abs(amount)} ₽\n`;
            });
    }

    return result;
}

// Для отладки (можно удалить позже)
export function debugStorage() {
    console.log('📦 Текущее состояние хранилища:');
    records.forEach((userRecords, chatId) => {
        console.log(`Пользователь ${chatId}: ${userRecords.length} записей`);
    });
}