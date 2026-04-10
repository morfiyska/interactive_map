// app.js

import { initMap } from './map.js';
import { initSidebar } from './sidebar.js';
import { initStyleEditor} from './styleEditor.js';
import { initSelection } from './selection.js';
import { initUI } from './ui.js';
import { initImportUI } from './import.js';
import { initIconsUpload } from './iconsUpload.js';
/**
 * Инициализация всего приложения
 */
function initApp() {
    initMap();
    initSidebar();
    initStyleEditor();
    initSelection();
    initUI();
    initImportUI();
    initIconsUpload();
}

initApp();