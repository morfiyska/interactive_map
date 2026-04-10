import { toggleLayer } from './layers.js';
import { cleanName } from './utils.js';
import { openStyleEditor } from './styleEditor.js';
const checkboxTree = new Map();
const parentMap = new Map();

/**
 * Инициализация сайдбара
 */
export function initSidebar() {
    fetch('/tree')
        .then(res => res.json())
        .then(data => {
            const sidebar = document.getElementById('sidebarContent');
            sidebar.innerHTML = '';

            data.forEach(node => createNode(node, sidebar));
        });
}

/**
 * Создание узла дерева
 */
export function createNode(node, container, parentObj = null) {
    const div = document.createElement('div');
    container.appendChild(div);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    const nodeObj = {
        node,
        checkbox,
        children: []
    };

    checkboxTree.set(node, nodeObj);

    if (parentObj) {
        parentMap.set(node, parentObj);
        parentObj.children.push(nodeObj);
    }

    // 📁 ПАПКА
    if (node.type === 'folder') {
        div.className = 'folder';

        const left = document.createElement('div');
        left.className = 'folder-left';

        const toggle = document.createElement('span');
        toggle.textContent = '▼';
        toggle.style.cursor = 'pointer';

        const label = document.createTextNode(' ' + cleanName(node.name));

        left.appendChild(checkbox);
        left.appendChild(label);

        div.appendChild(left);
        div.appendChild(toggle);

        const sub = document.createElement('div');
        sub.style.marginLeft = '15px';
        container.appendChild(sub);

        let open = false;
        sub.style.display = 'none';
        toggle.textContent = '▶';

        toggle.onclick = () => {
            open = !open;
            sub.style.display = open ? 'block' : 'none';
            toggle.textContent = open ? '▼' : '▶';
        };

        checkbox.onchange = () => {
            toggleFolder(node, checkbox.checked);
            setChildrenState(nodeObj, checkbox.checked);
            updateUpwards(node);
        };

        node.children.forEach(child => {
            createNode(child, sub, nodeObj);
        });
    }

    // 📄 ФАЙЛ
    if (node.type === 'file') {
        div.className = 'file';

        const left = document.createElement('div');
        left.className = 'file-left';

        const label = document.createTextNode(' ' + cleanName(node.name));

        // 🎯 превью (круг + иконка)
        const preview = document.createElement('div');
        preview.className = 'layer-preview';
        preview.dataset.path = node.path;

        const icon = document.createElement('img');
        icon.className = 'layer-icon';

        preview.appendChild(icon);

        left.appendChild(checkbox);
        left.appendChild(label);

        div.appendChild(left);
        div.appendChild(preview);

        // загрузка стиля
        updatePreview(preview, node.path);

        checkbox.onchange = () => {
            toggleLayer(node.path, checkbox.checked);
            updateUpwards(node);
        };

        preview.onclick = () => {
            openStyleEditor(node.path);
        };
    }

    return nodeObj;
}

/**
 * Обновление превью слоя
 */
export async function updatePreview(preview, path) {
    try {
        const res = await fetch('/data' + path);
        const data = await res.json();

        const style = data.style || {};
        const iconEl = preview.querySelector('.layer-icon');

        const size = (style.radius || 6) * 2;

        preview.style.width = size + 'px';
        preview.style.height = size + 'px';
        preview.style.background = style.color || 'blue';

        if (style.icon) {
            iconEl.src = '/icons/' + style.icon;
            iconEl.style.display = 'block';
        } else {
            iconEl.style.display = 'none';
        }

    } catch (e) {
        console.warn('Не удалось загрузить стиль', path);
    }
}

/**
 * Обновить превью после изменения стиля
 */
export function updateSidebarPreview(path, style) {
    const previews = document.querySelectorAll('.layer-preview');

    previews.forEach(p => {
        if (p.dataset.path === path) {
            const icon = p.querySelector('.layer-icon');

            const size = (style.radius || 6) * 2;

            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.background = style.color;

            if (style.icon) {
                icon.src = '/icons/' + style.icon;
                icon.style.display = 'block';
            } else {
                icon.style.display = 'none';
            }
        }
    });
}

/**
 * Включение/выключение всей папки
 */
export function toggleFolder(node, checked) {
    function traverse(n) {
        if (n.type === 'file') {
            toggleLayer(n.path, checked);
        } else {
            n.children.forEach(traverse);
        }
    }
    traverse(node);
}

/**
 * Обновление вверх по дереву (checked / indeterminate)
 */
export function updateUpwards(node) {
    let current = node;

    while (parentMap.has(current)) {
        const parent = parentMap.get(current);
        updateParentState(parent);
        current = parent.node;
    }
}

/**
 * Обновление состояния родителя
 */
export function updateParentState(nodeObj) {
    if (!nodeObj.children.length) return;

    let allChecked = true;
    let anyChecked = false;

    nodeObj.children.forEach(child => {
        const cb = child.checkbox;

        if (cb.checked || cb.indeterminate) {
            anyChecked = true;
        }

        if (!cb.checked) {
            allChecked = false;
        }
    });

    if (allChecked) {
        nodeObj.checkbox.checked = true;
        nodeObj.checkbox.indeterminate = false;
    } else if (anyChecked) {
        nodeObj.checkbox.checked = false;
        nodeObj.checkbox.indeterminate = true;
    } else {
        nodeObj.checkbox.checked = false;
        nodeObj.checkbox.indeterminate = false;
    }
}

/**
 * Установить состояние всем детям
 */
export function setChildrenState(nodeObj, checked) {
    nodeObj.children.forEach(child => {
        child.checkbox.checked = checked;
        child.checkbox.indeterminate = false;

        if (child.children.length) {
            setChildrenState(child, checked);
        }
    });
}