import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error('❌ Ошибка: BOT_TOKEN не найден в .env файле');
    console.error('📝 Создай файл .env и добавь туда BOT_TOKEN=твой_токен');
    process.exit(1); // Завершаем программу с ошибкой
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот запущен и готов к работе!');