import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { createOpenRouterClient } from './services/openrouter.js';
import { registerCommands } from './handlers/commands.js';
import { registerMessageHandler } from './handlers/messages.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!token || !openrouterKey) {
  console.error('❌ Missing tokens');
  process.exit(1);
}

const openrouter = createOpenRouterClient(openrouterKey);
const bot = new TelegramBot(token);

// Регистрируем обработчики
registerCommands(bot);
registerMessageHandler(bot, openrouter);

// Создаем Express сервер
const app = express();
app.use(express.json());

// === ВАЖНО: Health check endpoint для Render ===
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Корневой endpoint для проверки
app.get('/', (req, res) => {
  res.send('🤖 Bot is running!');
});

// Секретный путь для вебхука
const webhookPath = `/webhook/${token}`;

// Обработчик вебхука
app.post(webhookPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);

  // Даем серверу немного времени на полный запуск
  setTimeout(async () => {
    try {
      // Проверяем наличие URL
      const renderUrl = process.env.RENDER_EXTERNAL_URL;

      if (!renderUrl) {
        console.error('❌ RENDER_EXTERNAL_URL не задан!');
        console.log('📝 Добавь в переменные окружения Render:');
        console.log('   RENDER_EXTERNAL_URL = https://твой-сервис.onrender.com');
        return;
      }

      const webhookUrl = `${renderUrl}${webhookPath}`;
      console.log(`🔗 Устанавливаю вебхук: ${webhookUrl}`);

      const result = await bot.setWebHook(webhookUrl);

      if (result) {
        console.log(`✅ Вебхук успешно установлен: ${webhookUrl}`);

        // Проверяем статус вебхука
        const webhookInfo = await bot.getWebHookInfo();
        console.log('📊 Статус вебхука:', {
          url: webhookInfo.url,
          pending_updates: webhookInfo.pending_update_count,
        });
      } else {
        console.error('❌ Не удалось установить вебхук');
      }
    } catch (error) {
      console.error('❌ Ошибка при установке вебхука:', error.message);

      // Запасной вариант - polling
      console.log('⚠️ Запускаю polling как запасной вариант...');
      bot.startPolling();
      console.log('✅ Бот работает в режиме polling');
    }
  }, 3000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM получен, закрываю сервер...');
  server.close(() => {
    console.log('Сервер закрыт');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT получен, закрываю сервер...');
  server.close(() => {
    console.log('Сервер закрыт');
    process.exit(0);
  });
});