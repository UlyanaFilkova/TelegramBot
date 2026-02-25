import { roundMoney, formatMoney } from '../utils/money.js';

export class FinanceRecord {
    constructor(chatId, data) {
        this.id = this.generateId();
        this.chatId = chatId;
        this.type = data.type;
        this.amount = roundMoney(parseFloat(data.amount));
        this.description = data.description;
        this.category = data.category;
        this.createdAt = new Date();

        this.setDateTime(data.date, data.time);
    }

    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    setDateTime(dateStr, timeStr) {
        if (dateStr) {
            // Парсим дату из формата ДД-ММ-ГГГГ
            const [day, month, year] = dateStr.split('-').map(Number);
            this.date = new Date(year, month - 1, day);
        } else {
            this.date = new Date();
        }

        if (timeStr) {
            // Парсим время из формата ЧЧ:ММ
            const [hours, minutes] = timeStr.split(':').map(Number);
            this.date.setHours(hours, minutes, 0, 0);
            this.hasTime = true;
        } else {
            this.hasTime = false;
        }
    }

    format() {
        const sign = this.type === 'income' ? '+' : '-';
        const emoji = this.type === 'income' ? '💰' : '💸';
        const typeText = this.type === 'income' ? 'Доход' : 'Расход';

        const day = String(this.date.getDate()).padStart(2, '0');
        const month = String(this.date.getMonth() + 1).padStart(2, '0');
        const year = this.date.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        let dateTimeStr = dateStr;
        if (this.hasTime) {
            const hours = String(this.date.getHours()).padStart(2, '0');
            const minutes = String(this.date.getMinutes()).padStart(2, '0');
            dateTimeStr += ` в ${hours}:${minutes}`;
        }

        return (
            `${emoji} *${this.category}* (${typeText})\n` +
            `   ${sign}${this.amount} ₽ — ${this.description}\n` +
            `   📅 ${dateTimeStr}`
        );
    }

    formatShort() {
        const sign = this.type === 'income' ? '+' : '-';
        const dateStr = this.formatDateShort();
        return `${sign}${this.amount.toFixed(2)} ₽ • ${this.category} • ${dateStr}`;
    }

    formatDateShort() {
        const day = String(this.date.getDate()).padStart(2, '0');
        const month = String(this.date.getMonth() + 1).padStart(2, '0');
        const year = this.date.getFullYear();

        if (this.hasTime) {
            const hours = String(this.date.getHours()).padStart(2, '0');
            const minutes = String(this.date.getMinutes()).padStart(2, '0');
            return `${day}-${month}-${year} ${hours}:${minutes}`;
        }

        return `${day}-${month}-${year}`;
    }

    debug() {
        return {
            id: this.id,
            chatId: this.chatId,
            type: this.type,
            amount: this.amount,
            description: this.description,
            category: this.category,
            date: this.date.toISOString(),
            hasTime: this.hasTime
        };
    }
}