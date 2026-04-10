// selection.js

import { getMap } from './map.js';

export const selected = new Map();

let isSelecting = false;
let startLatLng = null;
let selectionBox = null;

/**
 * Инициализация выделения
 */
export function initSelection() {
    const map = getMap();

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    map.on('click', onMapClickClear);
    document.addEventListener('keydown', onKeyDown);
}
function onMapClickClear(e) {
    const ev = e.originalEvent;

    // если Ctrl зажат → не сбрасываем
    if (ev.ctrlKey) return;

    // если сейчас рисуем выделение → не сбрасываем
    if (isSelecting) return;

    clearSelection();
}
/**
 * Начало выделения
 */
function onMouseDown(e) {
    const ev = e.originalEvent;

    if (!ev.ctrlKey) return;
    if (ev.button !== 0) return; // ✅ только ЛКМ

    isSelecting = true;
    startLatLng = e.latlng;

    const map = getMap();

    // ❗ отключаем перетаскивание карты
    map.dragging.disable();

    selectionBox = L.rectangle([startLatLng, startLatLng], {
        color: 'blue',
        weight: 1,
        fillOpacity: 0.1
    }).addTo(map);
}

/**
 * Обновление рамки
 */
function onMouseMove(e) {
    if (!isSelecting) return;

    const bounds = L.latLngBounds(startLatLng, e.latlng);
    selectionBox.setBounds(bounds);
}

/**
 * Завершение выделения
 */
function onMouseUp() {
    if (!isSelecting) return;

    isSelecting = false;

    const map = getMap();

    // 🔥 возвращаем перетаскивание карты
    map.dragging.enable();

    const bounds = selectionBox.getBounds();

    selectPointsInBounds(bounds);

    map.removeLayer(selectionBox);
}
/**
 * Выделение точек в области
 */
export function selectPointsInBounds(bounds) {
    const map = getMap();

    map.eachLayer(layerGroup => {
        if (!layerGroup.eachLayer) return;

        layerGroup.eachLayer(layer => {
            if (!layer.getLatLng) return;

            const latlng = layer.getLatLng();

            if (bounds.contains(latlng)) {
                const id = layer.feature?.id;

                if (!id || selected.has(id)) return;

                highlight(layer);

                selected.set(id, {
                    layer,
                    id,
                    path: layer._filePath
                });
            }
        });
    });
}

/**
 * Подсветка точки
 */
export function highlight(layer) {
    const el = layer.getElement();
    if (!el) return;

    el.classList.add('selected-marker');
}

/**
 * Убрать подсветку
 */
export function unhighlight(layer) {
    const el = layer.getElement();
    if (!el) return;

    el.classList.remove('selected-marker');
}
export function clearSelection() {
    selected.forEach(item => {
        unhighlight(item.layer);
    });

    selected.clear();
}
/**
 * Обработка клавиш
 */
function onKeyDown(e) {
    if (e.key === 'Delete') {
        deleteSelected();
    }
}

/**
 * Удаление выбранных точек
 */
export async function deleteSelected() {
    const items = Array.from(selected.values());

    if (!items.length) return;

    if (!confirm(`Удалить ${items.length} точек?`)) return;

    await fetch('/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items.map(i => ({
            path: i.path,
            id: i.id
        })))
    });

    const map = getMap();

    items.forEach(i => {
        map.removeLayer(i.layer);
    });

    selected.clear();
}