import { roundMoney } from '../utils/money.ts';
import { TransactionType, AIResponseJSON } from '../types/index.ts';

export class FinanceRecord {
  public readonly id: string;
  public readonly chatId: number;
  public readonly type: TransactionType;
  public readonly amount: number;
  public readonly description: string;
  public readonly category: string;
  public readonly createdAt: Date;
  public date: Date;

  constructor(chatId: number, data: AIResponseJSON) {
    this.id = this.generateId();
    this.chatId = chatId;
    this.type = data.type;
    this.amount = roundMoney(Number(data.amount));
    this.description = data.description;
    this.category = data.category;
    this.createdAt = new Date();

    this.setDateTime(data.date, data.time);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 11)}`;
  }

  private setDateTime(dateStr?: string, timeStr?: string): void {
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
    } else {
      const now = new Date();
      this.date.setHours(now.getHours(), now.getMinutes(), 0, 0);
    }
  }

  public format(): string {
    const sign = this.type === 'income' ? '+' : '-';
    const emoji = this.type === 'income' ? '💰' : '💸';
    const typeText = this.type === 'income' ? 'Доход' : 'Расход';

    const day = String(this.date.getDate()).padStart(2, '0');
    const month = String(this.date.getMonth() + 1).padStart(2, '0');
    const year = this.date.getFullYear();

    let dateTimeStr = `${day}-${month}-${year}`;

    const hours = String(this.date.getHours()).padStart(2, '0');
    const minutes = String(this.date.getMinutes()).padStart(2, '0');
    dateTimeStr += ` в ${hours}:${minutes}`;

    return (
      `${emoji} *${this.category}* (${typeText})\n` +
      `   ${sign}${this.amount} ₽ — ${this.description}\n` +
      `   📅 ${dateTimeStr}`
    );
  }

  public formatShort(): string {
    const sign = this.type === 'income' ? '+' : '-';
    const dateStr = this.formatDateShort();
    return `${sign}${this.amount.toFixed(2)} ₽ • ${this.category} • ${dateStr}`;
  }

  public formatDateShort(): string {
    const day = String(this.date.getDate()).padStart(2, '0');
    const month = String(this.date.getMonth() + 1).padStart(2, '0');
    const year = this.date.getFullYear();

    const hours = String(this.date.getHours()).padStart(2, '0');
    const minutes = String(this.date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
}
