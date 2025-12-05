import { openSidePanel, closeSidePanel } from './panel.js';

let markersLayer = L.layerGroup();

/**
 * @returns {L.Map}
 */
export function initMap() {
    const map = L.map('map', {
        zoomControl: false 
    }).setView([-7.7956, 110.3695], 10); // Default Jogja

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    markersLayer.addTo(map);

    return map;
}

/**
 * @param {L.Map} map - Objek peta Leaflet
 * @param {Function} onMapClickCallback
 */
export function setupMapClickEvent(map, onMapClickCallback) {
    map.on('click', (e) => {
        if (onMapClickCallback) {
            onMapClickCallback(e.latlng);
        }

        closeSidePanel();
    });
}

/**
 * Menambahkan marker situs ke peta.
 * @param {L.Map} map - Objek peta Leaflet
 * @param {Array} situsArray - Daftar data situs dari API
 */

export function addSitusMarkers(map, situsArray) {
    markersLayer.clearLayers();

    situsArray.forEach(situs => {
        if (situs.latitude && situs.longitude) {
            
            const marker = L.marker([situs.latitude, situs.longitude]);

            marker.bindTooltip(`
                <div style="text-align: center;">
                    <b>${situs.nama_situs}</b><br>
                    <span style="font-size:11px; color:#666">${situs.jenis_situs}</span>
                </div>
            `, {
                direction: 'top',
                offset: [0, -35], 
                className: 'custom-tooltip', // Kita styling nanti di CSS
                opacity: 1
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                map.flyTo([situs.latitude, situs.longitude], 14, { animate: true, duration: 1.5 });
                openSidePanel(situs);
            });

            markersLayer.addLayer(marker);
        }
    });
}