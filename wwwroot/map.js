let map = null;

/**
 * Инициализация карты
 */
export function initMap() {
    map = L.map('map', {
        zoomControl: false
    }).setView([53.5, 108.0], 6);
    map.attributionControl.setPrefix(
        ''
    );
    // зум в правом нижнем углу
    //L.control.zoom({
    //    position: 'bottomright'
    //}).addTo(map);

    // тайлы
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

}

/**
 * Получить экземпляр карты
 */
export function getMap() {
    return map;
}

/**
 * Геолокация пользователя
 */
function initGeolocation() {
    map.locate({ setView: true, maxZoom: 14 });

    map.on('locationfound', (e) => {
        L.marker(e.latlng)
            .addTo(map)
            .bindPopup("Вы здесь");
    });

    map.on('locationerror', () => {
        console.warn('Геолокация недоступна');
    });
}