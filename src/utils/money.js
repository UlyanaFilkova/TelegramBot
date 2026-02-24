/**
 * Округлить до 2 знаков (банковское округление)
 */
export function roundMoney(amount) {
    return Math.round(amount * 100) / 100;
}

/**
 * Отформатировать сумму для отображения
 */
export function formatMoney(amount, showSign = false) {
    const rounded = roundMoney(amount);

    if (showSign) {
        const sign = rounded >= 0 ? '+' : '-';
        return `${sign}${Math.abs(rounded).toFixed(2)} ₽`;
    }

    return `${rounded.toFixed(2)} ₽`;
}

/**
 * Суммирует массив чисел с округлением
 */
export function sumMoney(numbers) {
    const total = numbers.reduce((sum, num) => sum + num, 0);
    return roundMoney(total);
}