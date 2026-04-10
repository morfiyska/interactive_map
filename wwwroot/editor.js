import { onMapClick, addMapClass, removeMapClass } from './map.js';
import { refreshLayer } from './layers.js';
import { updateActiveLayerUI } from './sidebar.js';

let activeLayer = null;
let addMode = false;

/**
 * Инициализация редактора
 */
export function initEditor() {
    initAddPointButton();
    initMapClickHandler();
}

/**
 * Установить активный слой
 */
export function setActiveLayer(path) {
    activeLayer = path;
    updateActiveLayerUI(path);
}

/**
 * Получить активный слой
 */
export function getActiveLayer() {
    return activeLayer;
}

/**
 * Включить режим добавления точки
 */
export function enablePointAddMode() {
    if (!activeLayer) {
        alert('Сначала выберите слой');
        return;
    }

    addMode = true;
    addMapClass('add-mode'); // ✅ через map.js
}

/**
 * Выключить режим добавления точки
 */
export function disablePointAddMode() {
    addMode = false;
    removeMapClass('add-mode'); // ✅ через map.js
}

/**
 * Кнопка "добавить точку"
 */
function initAddPointButton() {
    const btn = document.createElement('button');
    btn.id = 'addPointBtn';
    btn.textContent = '📍';

    btn.onclick = () => {
        if (addMode) {
            disablePointAddMode();
        } else {
            enablePointAddMode();
        }
    };

    document.body.appendChild(btn);
}

/**
 * Подписка на клик карты
 */
function initMapClickHandler() {
    onMapClick(async (e) => {
        if (!addMode) return;
        if (!activeLayer) return;

        await handleMapClick(e.latlng);
    });
}

/**
 * Клик по карте → добавление точки
 */
async function handleMapClick(latlng) {
    const name = prompt('Название точки:');
    if (!name) return;

    await addPointToLayer(activeLayer, latlng, name);

    disablePointAddMode();
}

/**
 * Добавление точки в слой
 */
export async function addPointToLayer(path, latlng, name) {
    const payload = {
        path,
        lat: latlng.lat,
        lon: latlng.lng,
        name
    };

    await fetch('/add_point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // 🔄 обновляем слой
    await refreshLayer(path);
}