export type TransactionType = 'income' | 'expense';

export interface FinanceData {
  type: TransactionType;
  amount: number | string;
  description: string;
  category: string;
  date?: string;
  time?: string;
}

export interface FinanceRecordData {
  id: string;
  chatId: number;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: Date;
  createdAt: Date;
}

export interface AIResponseJSON {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date?: string;
  time?: string;
}

export interface CategoryStats {
  [category: string]: number;
}

export interface UserStats {
  total: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: {
    income: CategoryStats;
    expense: CategoryStats;
  };
}

export interface StorageData {
  [chatId: number]: FinanceRecordData[];
}
