import { getMap } from './map.js';
import { selected, highlight, unhighlight } from './selection.js';

export const layers = {};

/**
 * Загрузка слоя (с кешированием)
 */
export async function loadLayer(path) {
    if (layers[path]) return layers[path];

    const res = await fetch('/data' + path);
    const data = await res.json();

    const layer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => createMarker(feature, latlng, data),
        onEachFeature: (feature, layerEl) =>
            attachFeatureEvents(feature, layerEl, path)
    });

    layer._filePath = path;

    layers[path] = layer;
    return layer;
}

/**
 * Включение / выключение слоя
 */
export async function toggleLayer(path, checked) {
    const map = getMap();
    const layer = await loadLayer(path);

    if (checked) {
        layer.addTo(map);
    } else {
        map.removeLayer(layer);
    }
}

/**
 * Создание маркера (круг + иконка)
 */
export function createMarker(feature, latlng, data) {
    const style = data.style || {};

    const size = (style.radius || 6) * 2;
    const color = style.color || '#3b82f6';
    const iconName = style.icon;

    if (iconName) {
        const html = `
            <div style="
                width:${size}px;
                height:${size}px;
                background:${color};
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                overflow:hidden;
            ">
                <img src="/icons/${iconName}" style="
                    width:${size * 0.6}px;
                    height:${size * 0.6}px;
                    object-fit:contain;
                    filter: brightness(0) invert(1);
                    pointer-events:none;
                ">
            </div>
        `;

        return L.marker(latlng, {
            icon: L.divIcon({
                html,
                className: 'custom-marker', // 🔥 важно
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            })
        });
    }

    return L.circleMarker(latlng, {
        radius: style.radius || 6,
        color: color
    });
}

/**
 * Навешивание событий на фичу
 */
export function attachFeatureEvents(feature, layer, path) {
    layer.feature = feature;
    layer._filePath = path;

    const popupContent = buildPopupContent(feature.properties);

    // 🔥 bind один раз
    layer.bindPopup(popupContent);

    layer.on('click', (e) => {
        const ev = e.originalEvent;

        // 🎯 Ctrl → только selection
        if (ev.ctrlKey) {
            L.DomEvent.stop(e);

            const id = feature.id;

            if (selected.has(id)) {
                unhighlight(layer);
                selected.delete(id);
            } else {
                highlight(layer);
                selected.set(id, { layer, id, path });
            }

            return;
        }

        // 🔥 обычный клик → открыть popup
        layer.openPopup();
    });
}

/**
 * Формирование HTML попапа
 */
export function buildPopupContent(p) {
    return `
        <div>
            <b>${p.name || ''}</b><br>
            ${p.subcategory ? `<b>Подрубрика:</b> ${p.subcategory}<br>` : ''}
            ${p.rating ? `<b>Рейтинг:</b> ${p.rating}<br>` : ''}
            ${p.site ? `<b>Сайт:</b> <a href="${p.site}" target="_blank">${p.site}</a><br>` : ''}
            ${p.hours ? `<b>Время работы:</b> ${p.hours}` : ''}
        </div>
    `;
}

/**
 * Полная перезагрузка слоя (после изменения стиля)
 */
export async function refreshLayer(path) {
    const map = getMap();

    if (layers[path]) {
        map.removeLayer(layers[path]);
        delete layers[path];
    }

    const layer = await loadLayer(path);
    layer.addTo(map);
}