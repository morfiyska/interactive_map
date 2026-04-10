import { refreshLayer } from './layers.js';
import { updateSidebarPreview } from './sidebar.js';

let currentPath = null;
let selectedIcon = null;
let iconsCache = [];

/**
 * Инициализация редактора стилей
 */
export function initStyleEditor() {
    document.getElementById('styleModal').classList.add('hidden');
    document.getElementById('saveStyle').onclick = saveStyle;
    document.getElementById('cancelStyle').onclick = closeStyleEditor;
    document.getElementById('closeStyle').onclick = closeStyleEditor;
    const modal = document.getElementById('styleModal');
    modal.onclick = (e) => {
        if (e.target === modal) closeStyleEditor();
    };
}

/**
 * Открытие редактора
 */
export async function openStyleEditor(path) {
    currentPath = path;

    const res = await fetch('/data' + path);
    const data = await res.json();

    await loadIcons();

    const colorInput = document.getElementById('styleColor');
    const radiusInput = document.getElementById('styleRadius');
    const iconGrid = document.getElementById('iconGrid');
    const preview = document.getElementById('previewCircle');
    const iconEl = document.getElementById('previewIcon');
    const modal = document.getElementById('styleModal');

    // значения
    colorInput.value = data.style?.color || '#3b82f6';
    radiusInput.value = data.style?.radius || 6;
    selectedIcon = data.style?.icon || null;

    // 🔥 заполнение иконок
    iconGrid.innerHTML = '';

    iconsCache.forEach(icon => {
        const item = document.createElement('div');
        item.className = 'icon-item';

        const img = document.createElement('img');
        img.src = '/icons/' + icon;

        item.appendChild(img);

        if (icon === selectedIcon) {
            item.classList.add('selected');
        }

        item.onclick = () => {
            selectedIcon = icon;

            document.querySelectorAll('.icon-item')
                .forEach(i => i.classList.remove('selected'));

            item.classList.add('selected');

            updatePreview();
        };

        iconGrid.appendChild(item);
    });

    /**
     * Обновление предпросмотра
     */
    function updatePreview() {
        const r = Number(radiusInput.value);

        preview.style.width = r * 2 + 'px';
        preview.style.height = r * 2 + 'px';
        preview.style.background = colorInput.value;

        if (selectedIcon) {
            iconEl.src = '/icons/' + selectedIcon;
            iconEl.style.display = 'block';
        } else {
            iconEl.style.display = 'none';
        }
    }

    colorInput.oninput = updatePreview;
    radiusInput.oninput = updatePreview;

    updatePreview();

    modal.classList.remove('hidden');
}

/**
 * Загрузка списка иконок (кэшируется)
 */
export async function loadIcons() {
    if (iconsCache.length) return iconsCache;

    const res = await fetch('/icons');
    iconsCache = await res.json();

    return iconsCache;
}

/**
 * Сохранение стиля
 */
export async function saveStyle() {
    const color = document.getElementById('styleColor').value;
    const radius = Number(document.getElementById('styleRadius').value);

    const newStyle = {
        color,
        radius,
        icon: selectedIcon
    };

    await fetch('/set_style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            path: currentPath,
            style: newStyle
        })
    });

    // 🔄 обновляем слой
    await refreshLayer(currentPath);

    // 🔄 обновляем превью в сайдбаре
    updateSidebarPreview(currentPath, newStyle);

    closeStyleEditor();
}

/**
 * Закрытие модалки
 */
export function closeStyleEditor() {
    document.getElementById('styleModal').classList.add('hidden');
}