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

// Регистрируем обработчики (они будут вызываться при получении обновлений)
registerCommands(bot);
registerMessageHandler(bot, openrouter);

// Создаем Express сервер
const app = express();
app.use(express.json());

// Секретный путь для вебхука (для безопасности)
const webhookPath = `/webhook/${token}`;

// Обработчик вебхука
app.post(webhookPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Запускаем сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Устанавливаем вебхук
  const webhookUrl = `https://${process.env.RENDER_EXTERNAL_URL}${webhookPath}`;
  await bot.setWebHook(webhookUrl);
  console.log(`✅ Webhook set to: ${webhookUrl}`);
});