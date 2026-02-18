import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
    console.error('❌ Ошибка: токен не найден ');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'друг';

    bot.sendMessage(chatId, `Привет, ${firstName}! Напиши мне что-нибудь.`);
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId,
        'Я понимаю такие команды:\n' +
        '/start - начать общение\n' +
        '/help - показать эту справку\n' +
        'А еще я могу отвечать на обычные сообщения!'
    );
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.startsWith('/')) {
        return;
    }

    bot.sendMessage(chatId, `Ты написал: "${text}"`);
});

bot.on('polling_error', (error) => {
    console.log('Ошибка polling:', error);
});