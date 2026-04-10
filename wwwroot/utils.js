// utils.js

/**
 * Очистка имени файла
 */
export function cleanName(name) {
    if (!name) return '';

    return name.replace(/\.geojson$/i, '');
}

/**
 * Безопасное получение значения
 */
export function safe(value, fallback = '') {
    return value !== undefined && value !== null ? value : fallback;
}

/**
 * Проверка числа
 */
export function toNumber(value, fallback = 0) {
    const n = Number(value);
    return isNaN(n) ? fallback : n;
}

/**
 * Ограничение значения (clamp)
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}