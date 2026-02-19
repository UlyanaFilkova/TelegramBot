/**
 * Форматирование списка моделей
 */
export function formatModelsList(FREE_MODELS) {
    let text = '🎯 *Доступные бесплатные модели:*\n\n';
    let i = 1;
    for (const [key, name] of Object.entries(FREE_MODELS)) {
        text += `${i}. ${key} — \`${name}\`\n`;
        i++;
    }
    text += '\nИспользуй `/model название` чтобы выбрать модель.\n';
    text += 'Например: `/model deepseek-r1`';
    return text;
}

/**
 * Функция для конвертации Markdown в Telegram HTML
 */
export function markdownToTelegram(text) {
    if (!text) return text;

    // Экранируем специальные символы HTML
    let converted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Жирный текст: **текст** или __текст__ -> <b>текст</b>
    converted = converted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    converted = converted.replace(/__(.*?)__/g, '<b>$1</b>');

    // Курсив: *текст* или _текст_ -> <i>текст</i>
    converted = converted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
    converted = converted.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<i>$1</i>');

    // Моноширинный код: `текст` -> <code>текст</code>
    converted = converted.replace(/`(.*?)`/g, '<code>$1</code>');

    // Блок кода: ```текст``` -> <pre>текст</pre>
    converted = converted.replace(/```(.*?)```/gs, '<pre>$1</pre>');

    // Заголовки: # текст -> <b>текст</b> (в Telegram нет заголовков)
    converted = converted.replace(/^# (.*?)$/gm, '<b>$1</b>');
    converted = converted.replace(/^## (.*?)$/gm, '<b>$1</b>');
    converted = converted.replace(/^### (.*?)$/gm, '<b>$1</b>');

    // Списки: - текст или * текст
    converted = converted.replace(/^[-*] (.*?)$/gm, '• $1');

    // Ссылки: [текст](ссылка) -> <a href="ссылка">текст</a>
    converted = converted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    return converted;
}

/**
 * Разбить длинное сообщение на части для Telegram
 */
export function splitLongMessage(text, maxLength = 4096) {
    if (text.length <= maxLength) return [text];
    return text.match(/[\s\S]{1,4096}/g) || [];
}