import { FinanceRecord } from '../models/FinanceRecord.ts';
import { roundMoney, sumMoney, formatMoney } from '../utils/money.js';

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
        // Суммируем с округлением
        if (record.type === 'income') {
            stats.income = roundMoney(stats.income + record.amount);
        } else {
            stats.expense = roundMoney(stats.expense + record.amount);
        }

        // Статистика по категориям
        if (!stats.byCategory[record.category]) {
            stats.byCategory[record.category] = 0;
        }
        stats.byCategory[record.category] = roundMoney(
            stats.byCategory[record.category] + record.amount
        );
    });

    stats.balance = roundMoney(stats.income - stats.expense);

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
    result += `💰 Доходы: ${formatMoney(stats.income, true)}\n`;
    result += `💸 Расходы: ${formatMoney(-stats.expense, true)}\n`;

    result += `✅ Баланс: ${stats.balance >= 0 ? '+' : '-'}${Math.abs(stats.balance)}\n\n`;

    if (Object.keys(stats.byCategory).length > 0) {
        result += '📈 *По категориям:*\n';
        Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, amount]) => {
                result += `  ${category}: ${formatMoney(amount, true)}\n`;
            });
    }

    const lastRecords = getUserRecords(chatId).slice(0, 3);
    if (lastRecords.length > 0) {
        result += '\n🕒 *Последние записи:*\n';
        lastRecords.forEach(record => {
            result += `  ${record.formatShort()}\n`;
        });
    }

    return result;
}