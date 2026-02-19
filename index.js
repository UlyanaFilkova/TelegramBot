import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { createOpenRouterClient, diagnoseOpenRouterKey } from './src/services/openrouter.js';
import { registerCommands } from './src/handlers/commands.js';
import { registerMessageHandler } from './src/handlers/messages.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!token) {
    console.error('❌ Ошибка: токен не найден ');
    process.exit(1);
}

if (!openrouterKey) {
    console.error('❌ Ошибка: AI key не найден');
    process.exit(1);
}

// Создаем клиент OpenRouter
const openrouter = createOpenRouterClient(openrouterKey);

// Опционально: диагностика ключа (раскомментируй если нужно)
// await diagnoseOpenRouterKey(openrouterKey);

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

// Регистрируем все обработчики
registerCommands(bot);
registerMessageHandler(bot, openrouter);

// Обработка ошибок polling
bot.on('polling_error', (error) => {
    console.log('Ошибка polling:', error);
});

// Обработка graceful shutdown
process.once('SIGINT', () => {
    console.log('\n👋 Бот остановлен (SIGINT)');
    bot.stopPolling();
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('\n👋 Бот остановлен (SIGTERM)');
    bot.stopPolling();
    process.exit(0);
});

console.log('🤖 Бот успешно запущен!');