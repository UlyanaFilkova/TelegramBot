import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Создаем пул соединений с базой данных
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true, // Neon требует SSL
  },
});

// Проверка подключения при запуске
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Подключение к Neon установлено');

    // Проверяем версию PostgreSQL для красоты
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);

    client.release();
  } catch (error) {
    console.error('❌ Ошибка подключения к Neon:', error);
    throw error;
  }
}

export async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id BIGINT NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_transactions_chat_id ON transactions(chat_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
    `);

    console.log('✅ Таблицы созданы или уже существуют');
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
    throw error;
  } finally {
    client.release();
  }
}