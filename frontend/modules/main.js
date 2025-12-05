import { initMap, addSitusMarkers, setupMapClickEvent } from './map.js';
import { getVerifiedSitus, getAllTokoh } from './api.js'; // Import getAllTokoh
import { setupUI } from './ui.js';

let allSitusData = [];

document.addEventListener('DOMContentLoaded', async () => {
    const map = initMap();
    
    const uiCallbacks = setupUI(map); 
    setupMapClickEvent(map, uiCallbacks.onMapClick);

    try {
        console.log("Memuat data...");
        
    
        const [situsRes, tokohRes] = await Promise.allSettled([
            getVerifiedSitus(),
            getAllTokoh()
        ]);

        allSitusData = situsRes.status === 'fulfilled' ? situsRes.value : [];
        const tokohList = tokohRes.status === 'fulfilled' ? tokohRes.value : [];

        console.log(`Data dimuat: ${allSitusData.length} situs.`);
        
        addSitusMarkers(map, allSitusData); 
        
        setupSearchAndFilter(map, tokohList);
        
    } catch (err) {
        console.error("Gagal load:", err);
    }
});

function setupSearchAndFilter(map, tokohList) {
    const searchInput = document.getElementById('search-input');
    const btnFilter = document.getElementById('btn-filter-toggle');
    const filterPanel = document.getElementById('filter-panel');
    const btnCloseFilter = document.getElementById('close-filter');
    const btnApply = document.getElementById('btn-apply-filter');
    const btnReset = document.getElementById('btn-reset-filter');
    const selectTokoh = document.getElementById('filter-tokoh');

    if (tokohList && selectTokoh) {
        tokohList.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.nama_tokoh; // Kita filter berdasarkan string nama
            opt.textContent = t.nama_tokoh;
            selectTokoh.appendChild(opt);
        });
    }

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filteredData = allSitusData.filter(situs => {
            const nama = situs.nama_situs?.toLowerCase() || '';
            const desa = situs.nama_desa_kelurahan?.toLowerCase() || '';
            const kerajaan = situs.nama_kerajaan?.toLowerCase() || '';
            const tokoh = situs.tokoh_terkait?.toLowerCase() || ''; // Cek kolom baru dari backend

            return nama.includes(keyword) || desa.includes(keyword) || kerajaan.includes(keyword) || tokoh.includes(keyword);
        });
        addSitusMarkers(map, filteredData);
    });

    if (btnFilter && filterPanel) {
        btnFilter.addEventListener('click', () => filterPanel.classList.toggle('hidden'));
        btnCloseFilter.addEventListener('click', () => filterPanel.classList.add('hidden'));
    }

    if (btnApply) {
        btnApply.addEventListener('click', () => {
            // Ambil Jenis
            const checkedBoxes = document.querySelectorAll('#filter-jenis-container input:checked');
            const selectedTypes = Array.from(checkedBoxes).map(cb => cb.value);
            
            // Ambil Tokoh
            const selectedTokoh = selectTokoh.value; // Nama tokoh atau string kosong

            console.log("Filter:", selectedTypes, selectedTokoh);

            const filteredData = allSitusData.filter(situs => {
                // Cek Jenis
                const matchType = situs.jenis_situs && selectedTypes.some(type => situs.jenis_situs.includes(type));
                
                // Cek Tokoh (Jika ada yang dipilih)
                let matchTokoh = true;
                if (selectedTokoh) {
                    // Cek apakah string 'tokoh_terkait' mengandung nama yang dipilih
                    matchTokoh = situs.tokoh_terkait && situs.tokoh_terkait.includes(selectedTokoh);
                }

                return matchType && matchTokoh;
            });

            addSitusMarkers(map, filteredData);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            document.querySelectorAll('#filter-jenis-container input').forEach(cb => cb.checked = true);
            searchInput.value = '';
            if(selectTokoh) selectTokoh.value = ""; // Reset dropdown tokoh
            
            addSitusMarkers(map, allSitusData);
        });
    }
}