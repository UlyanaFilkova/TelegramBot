import { FinanceRecord } from '../models/FinanceRecord.js';
import { roundMoney, formatMoney } from '../utils/money.js';
import { AIResponseJSON, UserStats, CategoryStats } from '../types/index.js';

type RecordsMap = Map<number, FinanceRecord[]>;

const records: RecordsMap = new Map();

/**
 * Сохранить новую запись
 */
export function saveRecord(chatId: number, data: AIResponseJSON): FinanceRecord {
  let userRecords = records.get(chatId);

  if (!userRecords) {
    userRecords = [];
    records.set(chatId, userRecords);
  }

  const record = new FinanceRecord(chatId, data);
  userRecords.push(record);

  // Сортируем по дате (новые сверху)
  userRecords.sort((a, b) => b.date.getTime() - a.date.getTime());

  return record;
}

/**
 * Получить все записи пользователя
 */
export function getUserRecords(chatId: number): FinanceRecord[] {
  return records.get(chatId) || [];
}

/**
 * Получить последнюю запись пользователя
 */
export function getLastRecord(chatId: number): FinanceRecord | null {
  const userRecords = records.get(chatId);
  if (!userRecords || userRecords.length === 0) {
    return null;
  }
  return userRecords[0];
}

/**
 * Получить статистику пользователя
 */
export function getUserStats(chatId: number): UserStats {
  const userRecords = getUserRecords(chatId);

  const stats: UserStats = {
    total: userRecords.length,
    income: 0,
    expense: 0,
    balance: 0,
    byCategory: {},
  } as UserStats;

  userRecords.forEach((record) => {
    if (record.type === 'income') {
      stats.income = roundMoney(stats.income + record.amount);

      const incomeCat = stats.byCategory.income;
      if (!incomeCat[record.category]) {
        incomeCat[record.category] = 0;
      }
      incomeCat[record.category] = roundMoney(incomeCat[record.category] + record.amount);

    } else {
      stats.expense = roundMoney(stats.expense + record.amount);

      const expenseCat = stats.byCategory.expense;
      if (!expenseCat[record.category]) {
        expenseCat[record.category] = 0;
      }
      expenseCat[record.category] = roundMoney(expenseCat[record.category] + record.amount);
    }
  });

  stats.balance = roundMoney(stats.income - stats.expense);

  return stats;
}

/**
 * Форматировать статистику для вывода
 */
export function formatUserStats(chatId: number): string {
  const stats = getUserStats(chatId);

  if (stats.total === 0) {
    return '📊 У тебя пока нет записей. Напиши, например: `300 обед`';
  }

  let result = '📊 *Твоя статистика*\n\n';
  result += `💰 Доходы: ${formatMoney(stats.income, true)}\n`;
  result += `💸 Расходы: ${formatMoney(-stats.expense, true)}\n`;

  result += `✅ Баланс: ${stats.balance >= 0 ? '+' : '-'}${Math.abs(stats.balance)}\n\n`;

  // ✅ Собираем все категории для отображения
  const allCategories: CategoryStats = {};

  // Добавляем доходы
  Object.entries(stats.byCategory.income).forEach(([category, amount]) => {
    allCategories[category] = (allCategories[category] || 0) + amount;
  });

  // Добавляем расходы (с минусом)
  Object.entries(stats.byCategory.expense).forEach(([category, amount]) => {
    allCategories[category] = (allCategories[category] || 0) - amount;
  });

  if (Object.keys(allCategories).length > 0) {
    result += '📈 *По категориям:*\n';

    // ✅ Преобразуем в массив для сортировки
    const categoryEntries = Object.entries(allCategories) as [string, number][];

    categoryEntries
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, amount]) => {
        result += `  ${category}: ${formatMoney(amount, true)}\n`;
      });
  }

  const lastRecords = getUserRecords(chatId).slice(0, 3);
  if (lastRecords.length > 0) {
    result += '\n🕒 *Последние записи:*\n';
    lastRecords.forEach((record) => {
      result += `  ${record.formatShort()}\n`;
    });
  }


  return result;
}

export function getTodayRecords(chatId: number): FinanceRecord[] {
  const userRecords = getUserRecords(chatId);
  const today = new Date();

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  return userRecords.filter(record => {
    return record.date >= todayStart && record.date < todayEnd;
  });
}

/**
 * Получить записи за указанную дату
 */
export function getRecordsByDate(chatId: number, dateStr: string): FinanceRecord[] {
  const userRecords = getUserRecords(chatId);

  const [day, month, year] = dateStr.split('-').map(Number);

  const dateStart = new Date(year, month - 1, day);
  const dateEnd = new Date(year, month - 1, day + 1);

  return userRecords.filter(record => {
    return record.date >= dateStart && record.date < dateEnd;
  });
}

/**
 * Удалить запись по ID
 */
export function deleteRecord(chatId: number, recordId: string): boolean {
  const userRecords = records.get(chatId);
  if (!userRecords) return false;

  const index = userRecords.findIndex(r => r.id === recordId);
  if (index === -1) return false;

  userRecords.splice(index, 1);
  return true;
}

/**
 * Получить статистику за период
 */
export function getStatsForPeriod(chatId: number, days: number): UserStats {
  const userRecords = getUserRecords(chatId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const periodRecords = userRecords.filter(record => record.date >= cutoffDate);

  const stats: UserStats = {
    total: periodRecords.length,
    income: 0,
    expense: 0,
    balance: 0,
    byCategory: {},
  } as UserStats;

  periodRecords.forEach((record) => {
    if (record.type === 'income') {
      stats.income = roundMoney(stats.income + record.amount);

      const incomeCat = stats.byCategory.income;
      if (!incomeCat[record.category]) {
        incomeCat[record.category] = 0;
      }
      incomeCat[record.category] = roundMoney(incomeCat[record.category] + record.amount);

    } else {
      stats.expense = roundMoney(stats.expense + record.amount);

      const expenseCat = stats.byCategory.expense;
      if (!expenseCat[record.category]) {
        expenseCat[record.category] = 0;
      }
      expenseCat[record.category] = roundMoney(expenseCat[record.category] + record.amount);
    }
  });

  stats.balance = roundMoney(stats.income - stats.expense);
  return stats;
}