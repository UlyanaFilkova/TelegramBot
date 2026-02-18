import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error('❌ Ошибка: токен не найден ');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
