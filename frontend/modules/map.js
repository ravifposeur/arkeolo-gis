import { openSidePanel, closeSidePanel } from './panel.js';

// Layer Group untuk menampung semua marker situs agar bisa dihapus/refresh saat filter
let markersLayer = L.layerGroup();

/**
 * Menginisialisasi peta Leaflet dan menampilkannya di div #map.
 * @returns {L.Map}
 */
export function initMap() {
    const map = L.map('map', {
        zoomControl: false // Kita sembunyikan zoom default biar bisa dipindah
    }).setView([-7.7956, 110.3695], 10); // Default Jogja

    // Basemap Carto Positron (Tampilan Bersih/Clean)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Pindahkan zoom control ke kanan bawah agar tidak tertutup panel kiri
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // PENTING: Tambahkan layer group ke peta satu kali di awal
    markersLayer.addTo(map);

    return map;
}

/**
 * Setup event listener untuk klik di peta kosong
 * @param {L.Map} map - Objek peta Leaflet
 * @param {Function} onMapClickCallback
 */
export function setupMapClickEvent(map, onMapClickCallback) {
    map.on('click', (e) => {
        // 1. Jalankan callback untuk mode "Tambah Data" (jika aktif)
        if (onMapClickCallback) {
            onMapClickCallback(e.latlng);
        }

        // 2. Tutup side panel setiap kali peta diklik (di area kosong)
        closeSidePanel();
    });
}

/**
 * Menambahkan marker situs ke peta.
 * Fungsi ini sekarang otomatis MENGHAPUS marker lama sebelum nambah yang baru.
 * Ini penting untuk fitur Filter.
 * @param {L.Map} map - Objek peta Leaflet
 * @param {Array} situsArray - Daftar data situs dari API
 */

export function addSitusMarkers(map, situsArray) {
    // 1. Bersihkan marker lama dari layer group
    markersLayer.clearLayers();

    // 2. Tambah marker baru
    situsArray.forEach(situs => {
        if (situs.latitude && situs.longitude) {
            
            const marker = L.marker([situs.latitude, situs.longitude]);

            // --- FITUR BARU: TOOLTIP SAAT HOVER ---
            // direction: 'top' agar muncul di atas peniti
            // offset: [0, -30] agar tidak menumpuk pas di ujung peniti
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

            // Event Klik (Tetap Buka Panel)
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                map.flyTo([situs.latitude, situs.longitude], 14, { animate: true, duration: 1.5 });
                openSidePanel(situs);
            });

            // PENTING: Masukkan ke layer group, BUKAN langsung ke map
            markersLayer.addLayer(marker);
        }
    });
}