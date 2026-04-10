let sidebar = null;
let btn = null;

/**
 * Инициализация UI
 */
export function initUI() {
    sidebar = document.getElementById('sidebar');

    const layersBtn = document.getElementById('layersBtn');

    if (!sidebar || !layersBtn) return;

    // по умолчанию закрыт
    sidebar.classList.add('collapsed');

    layersBtn.onclick = toggleSidebar;
}

/**
 * Переключение сайдбара
 */
export function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}