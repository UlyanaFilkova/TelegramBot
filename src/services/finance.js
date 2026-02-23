export const financeRecords = new Map();

export const lastRecord = new Map();

export class FinanceRecord {
    constructor(chatId, amount, description, type, category, customDate = null, customTime = null) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 5);
        this.chatId = chatId;
        this.amount = Math.abs(amount);
        this.originalAmount = type === 'income' ? amount : -amount;
        this.description = description;
        this.type = type;
        this.category = category;

        if (customDate) {
            const [day, month, year] = customDate.split('-').map(Number);
            this.date = new Date(year, month - 1, day, 12, 0, 0);
        } else {
            this.date = new Date();
        }

        if (customTime) {
            const [hours, minutes] = customTime.split(':').map(Number);
            this.date.setHours(hours, minutes, 0, 0);
        }

        this.timestamp = this.date.toISOString();

        const day = String(this.date.getDate()).padStart(2, '0');
        const month = String(this.date.getMonth() + 1).padStart(2, '0');
        const year = this.date.getFullYear();
        this.dateStr = `${day}-${month}-${year}`;

        this.timeStr = this.date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    format() {
        const sign = this.type === 'income' ? '+' : '-';
        const emoji = this.type === 'income' ? '💰' : '💸';
        const typeText = this.type === 'income' ? 'Доход' : 'Расход';

        let result = `${emoji} *${this.category}* (${typeText})\n`;
        result += `   ${sign}${this.amount} ₽ — ${this.description}\n`;
        result += `   📅 ${this.dateStr}`;

        if (this.timeStr !== '12:00' && this.date.getHours() !== 12) {
            result += ` в ${this.timeStr}`;
        }

        return result;
    }

    formatShort() {
        const sign = this.type === 'income' ? '+' : '-';
        const time = this.timeStr !== '12:00' ? ` ${this.timeStr}` : '';
        return `${sign}${this.amount} ₽ • ${this.category} • ${this.dateStr}${time}`;
    }

    update(updates) {
        if (updates.amount !== undefined) {
            this.amount = Math.abs(updates.amount);
            this.originalAmount = this.type === 'income' ? updates.amount : -updates.amount;
        }
        if (updates.description !== undefined) {
            this.description = updates.description;
        }
        if (updates.type !== undefined) {
            this.type = updates.type;
            this.originalAmount = this.type === 'income' ? this.amount : -this.amount;
        }
        if (updates.category !== undefined) {
            this.category = updates.category;
        }
        if (updates.date !== undefined) {
            const [day, month, year] = updates.date.split('-').map(Number);
            this.date = new Date(year, month - 1, day, this.date.getHours(), this.date.getMinutes());

            const newDay = String(this.date.getDate()).padStart(2, '0');
            const newMonth = String(this.date.getMonth() + 1).padStart(2, '0');
            const newYear = this.date.getFullYear();
            this.dateStr = `${newDay}-${newMonth}-${newYear}`;
        }
        if (updates.time !== undefined) {
            const [hours, minutes] = updates.time.split(':').map(Number);
            this.date.setHours(hours, minutes);
            this.timeStr = this.date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        this.timestamp = this.date.toISOString();
        return this;
    }
}

export function addFinanceRecord(chatId, amount, description, type, category, date = null, time = null) {
    if (!financeRecords.has(chatId)) {
        financeRecords.set(chatId, []);
    }

    const record = new FinanceRecord(chatId, amount, description, type, category, date, time);
    const records = financeRecords.get(chatId);
    records.push(record);

    lastRecord.set(chatId, record);

    records.sort((a, b) => b.date - a.date);

    console.log(`✅ Запись добавлена для пользователя ${chatId}:`, {
        id: record.id,
        amount: record.amount,
        description: record.description,
        type: record.type,
        category: record.category,
        date: record.dateStr,
        time: record.timeStr
    });

    return record;
}

export function updateLastRecord(chatId, updates) {
    const record = lastRecord.get(chatId);
    if (!record) {
        return { success: false, message: 'У тебя пока нет записей для редактирования' };
    }

    record.update(updates);

    const records = financeRecords.get(chatId) || [];
    const index = records.findIndex(r => r.id === record.id);
    if (index !== -1) {
        records[index] = record;
    }

    console.log(`✏️ Запись обновлена для пользователя ${chatId}:`, {
        id: record.id,
        updates: updates
    });

    return { success: true, record };
}

export function getLastRecord(chatId) {
    return lastRecord.get(chatId);
}