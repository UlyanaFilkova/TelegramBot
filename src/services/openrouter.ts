import OpenAI from 'openai';
import { DEFAULT_MODEL, ModelKey, PromptMessage, ModelMap } from '../config/constants.js';

export type ChatHistory = Map<number, PromptMessage[]>;
export const chatHistory: ChatHistory = new Map();

export type UserModel = Map<number, ModelKey>;
export const userModel: UserModel = new Map();

export function createOpenRouterClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}

export async function askOpenRouter(
  openrouter: OpenAI,
  chatId: number,
  userMessage: string,
  FREE_MODELS: ModelMap,
  SYSTEM_PROMPT: PromptMessage,
  modelKey: ModelKey
): Promise<string> {
  try {
    let history = chatHistory.get(chatId) || [];

    history.push({ role: 'user', content: userMessage });

    // Ограничиваем историю последними 20 сообщениями
    if (history.length > 20) {
      history = history.slice(-20);
    }

    const model = userModel.get(chatId) || modelKey;
    const modelId = FREE_MODELS[model] || FREE_MODELS[DEFAULT_MODEL];

    console.log(`🤔 Запрос к ${modelId} от пользователя ${chatId}`);

    const messages = [SYSTEM_PROMPT, ...history];

    const response = await openrouter.chat.completions.create({
      model: modelId,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;

    if (!reply) {
      throw new Error('Пустой ответ от OpenRouter');
    }

    history.push({ role: 'assistant', content: reply });
    chatHistory.set(chatId, history);

    return reply;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Ошибка OpenRouter:', err);
    throw err;
  }
}

export async function diagnoseOpenRouterKey(openrouterKey: string): Promise<void>  {
  console.log('🔍 Диагностика ключа OpenRouter...');

  // Проверка 1: Формат ключа
  console.log('Формат ключа:', {
    startsWithSkOr: openrouterKey.startsWith('sk-or-v1-'),
    length: openrouterKey.length,
    preview: openrouterKey.substring(0, 10) + '...',
  });

  // Проверка 2: Прямой запрос к API ключа
  try {
    const keyCheck = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
      },
    });

    if (keyCheck.ok) {
      const data = await keyCheck.json();
      console.log('✅ Ключ валиден! Данные:', data);
    } else {
      console.log('❌ Ключ не валиден. Статус:', keyCheck.status);
      const error = await keyCheck.text();
      console.log('Ошибка:', error);
    }
  } catch (error) {
    const err = error as Error;
    console.log('❌ Ошибка при проверке ключа:', err.message);
  }

  // Проверка 3: Тестовый запрос к модели
  try {
    const testRequest = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });

    if (testRequest.ok) {
      console.log('✅ Тестовый запрос к модели успешен!');
    } else {
      console.log('❌ Тестовый запрос к модели не удался. Статус:', testRequest.status);
      const error = await testRequest.json();
      console.log('Ошибка:', error);
    }
  } catch (error) {
    const err = error as Error;
    console.log('❌ Ошибка при тестовом запросе:', err.message);
  }
}
