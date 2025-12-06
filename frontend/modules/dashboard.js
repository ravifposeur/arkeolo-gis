// File: proyek_arkeologi_frontend/modules/dashboard.js

import { 
    getPendingSitus, approveSitus, rejectSitus, 
    postKerajaan, postArkeolog, postTokoh, postGelarTokoh, 
    getKerajaan, getArkeolog, postPenelitian,
    postKota, postKecamatan, postDesa,
    getPendingObjek, approveObjek, rejectObjek,
    getDesa, getKecamatan, getKota
} from './api.js';
import { isLoggedIn } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek Login
    if (!isLoggedIn()) {
        alert("Anda harus login dulu!");
        window.location.href = 'map.html';
        return;
    }
    
    const allowedRoles = ['admin', 'verifikator'];
    
    if (!allowedRoles.includes(role)) {
        alert("Akses ditolak!");
        window.location.href = 'map.html';
        return;
    }   


    // 2. Load Data Verifikasi (Default)
    loadVerifSitus();

    // 3. Setup Navigasi Tab
    setupNavigation();

    // 4. Setup Form Submit (Master Data)
    setupForms();
});

// --- 1. LOGIKA VERIFIKASI (CORE) ---
async function loadVerifSitus() {
    const container = document.getElementById('pending-list-situs');
    try {
        // AMBIL DATA PARALEL: Situs Pending & List Arkeolog (untuk dropdown link manual)
        const [data, listArkeolog] = await Promise.all([
            getPendingSitus(),
            getArkeolog()
        ]);
        
        if (data.length === 0) {
            container.innerHTML = '<p class="empty-state">🎉 Tidak ada data yang perlu diverifikasi.</p>';
            return;
        }

        container.innerHTML = ''; 
        
        // Siapkan Opsi Dropdown Arkeolog untuk fitur link manual
        const arkeologOptions = '<option value="">-- Pilih Peneliti (Opsional) --</option>' + 
            listArkeolog.map(a => `<option value="${a.arkeolog_id}">${a.nama_lengkap}</option>`).join('');

        data.forEach(situs => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // --- LOGIKA BADGE PERINGATAN ---
            
            // 1. Cek Kerajaan
            let kerajaanBadge = '';
            if (situs.nama_kerajaan) {
                if (situs.status_kerajaan === 'pending') {
                    // Jika kerajaan baru dibuat user -> KUNING (Perlu dicek)
                    kerajaanBadge = `<span style="background:#fff7ed; color:#c2410c; padding:2px 6px; border-radius:4px; font-size:10px; border:1px solid #fdba74; font-weight:bold; margin-left:5px;">⚠️ DATA BARU</span>`;
                } else {
                    // Jika kerajaan sudah verified (dari master) -> HIJAU (Aman)
                    kerajaanBadge = `<span style="color:#10b981; font-size:12px; margin-left:5px;">✓ Terverifikasi</span>`;
                }
            }

            // 2. Cek Peneliti
            let infoPenelitiHTML = '<span style="color:#9ca3af; font-style:italic; font-size:13px;">Tidak ada data peneliti.</span>';
            
            if (situs.info_peneliti) {
                // String dari backend formatnya: "Nama Peneliti (status), Nama Lain (status)"
                // Kita ubah stylingnya berdasarkan status
                const penelitiArray = situs.info_peneliti.split(', ');
                
                const formattedPeneliti = penelitiArray.map(p => {
                    if (p.includes('(pending)')) {
                        // Highlight merah/oranye untuk peneliti baru
                        return `<span style="color:#c2410c; font-weight:600; background:#fff7ed; padding:2px 4px; border-radius:4px;">⚠️ ${p}</span>`;
                    } else {
                        // Warna biasa untuk peneliti lama
                        return `<span style="color:#374151;">${p}</span>`;
                    }
                }).join('<br>'); // Pisahkan dengan baris baru biar rapi

                infoPenelitiHTML = formattedPeneliti;
            }

            // --- RENDER HTML KARTU ---
            card.innerHTML = `
                <div class="card-header">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <h3 style="margin:0;">${situs.nama_situs}</h3>
                        <span class="badge badge-gray">${situs.jenis_situs}</span>
                    </div>
                    <span style="font-size:12px; color:#6b7280;">ID: #${situs.situs_id}</span>
                </div>
                
                <div class="data-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                    <div class="data-item">
                        <label style="display:block; font-size:11px; color:#6b7280; font-weight:bold; text-transform:uppercase;">Lokasi</label>
                        <p style="margin:0; font-size:14px;">${situs.nama_desa_kelurahan}, ${situs.nama_kecamatan}, ${situs.nama_kota_kabupaten}</p>
                        <p style="margin:0; font-size:12px; color:#6b7280;">${situs.jalan_dusun}</p>
                    </div>
                    <div class="data-item">
                        <label style="display:block; font-size:11px; color:#6b7280; font-weight:bold; text-transform:uppercase;">Pelapor</label>
                        <p style="margin:0; font-size:14px;">User ID: ${situs.pengguna_pelapor_id}</p>
                        <p style="margin:0; font-size:12px; color:#6b7280;">(Kontributor)</p>
                    </div>
                    
                    <!-- BAGIAN PENTING: KONTEKS SEJARAH -->
                    <div class="data-item" style="grid-column: span 2; background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #f3f4f6;">
                        <div style="margin-bottom: 10px; padding-bottom:10px; border-bottom:1px dashed #e5e7eb;">
                            <label style="font-size:11px; color:#6b7280; font-weight:bold;">KERAJAAN / MASA:</label>
                            <p style="margin:0; font-size:15px; font-weight:600; margin-top:2px;">
                                ${situs.nama_kerajaan || '-'} ${kerajaanBadge}
                            </p>
                        </div>
                        <div>
                            <label style="font-size:11px; color:#6b7280; font-weight:bold;">PENELITI TERKAIT:</label>
                            <div style="margin-top:4px; line-height:1.6;">
                                ${infoPenelitiHTML}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- LINK MANUAL ARKEOLOG (Fitur Admin) -->
                <div style="margin-top:10px; padding-top:10px;">
                    <label style="font-size:11px; font-weight:bold; color:#6b7280;">🔗 Tambahkan Peneliti Lain (Jika Kurang):</label>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <select class="sel-arkeolog-dashboard" data-situs="${situs.situs_id}" style="flex:1; padding:8px; border:1px solid #ddd; border-radius:4px; font-size:13px;">
                            ${arkeologOptions}
                        </select>
                        <button class="btn-link-peneliti" data-situs="${situs.situs_id}" style="background:#3b82f6; color:white; border:none; padding:0 15px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:600;">
                            Link
                        </button>
                    </div>
                </div>

                <!-- TOMBOL AKSI UTAMA -->
                <div class="actions" style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
                    <button class="btn btn-reject" data-id="${situs.situs_id}" style="background:#ef4444; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;">
                        Tolak Semua
                    </button>
                    <button class="btn btn-approve" data-id="${situs.situs_id}" style="background:#10b981; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;">
                        Setujui Semua
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
        setupActionButtons();

    } catch (err) { container.innerHTML = 'Error: ' + err.message; }
}

async function loadVerifObjek() {
    const container = document.getElementById('pending-list-objek');
    container.innerHTML = '<p>Memuat data...</p>';

    try {
        const data = await getPendingObjek();
        
        if (data.length === 0) {
            container.innerHTML = '<p class="empty-state">🎉 Tidak ada objek pending.</p>';
            return;
        }

        container.innerHTML = ''; 
        data.forEach(obj => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-header">
                    <h3>${obj.nama_objek}</h3>
                    <span class="badge badge-gray">${obj.jenis_objek}</span>
                </div>
                
                <div class="data-grid">
                    <div class="data-item">
                        <label>Lokasi Penemuan</label>
                        <p style="font-weight:bold; color:#2563eb;">${obj.nama_situs || 'Situs ID: ' + obj.situs_id}</p>
                    </div>
                    <div class="data-item">
                        <label>Pelapor</label>
                        <p>${obj.nama_pelapor || 'ID: ' + obj.pengguna_pelapor_id}</p>
                    </div>
                    <div class="data-item">
                        <label>Detail Fisik</label>
                        <p>Bahan: ${obj.bahan}</p>
                        <p>Dimensi: P${obj.panjang} x L${obj.lebar} x T${obj.tinggi} cm</p>
                    </div>
                    <div class="data-item">
                        <label>Info Tambahan</label>
                        <p>${obj.teks_transliterasi || '-'}</p>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn btn-reject-obj" data-id="${obj.objek_id}" style="background:#ef4444; color:white;">Tolak</button>
                    <button class="btn btn-approve-obj" data-id="${obj.objek_id}" style="background:#10b981; color:white;">Setujui</button>
                </div>
            `;
            container.appendChild(card);
        });
        
        setupObjekButtons(); // Listener khusus objek

    } catch (err) { container.innerHTML = 'Error: ' + err.message; }
}

function setupObjekButtons() {
    document.querySelectorAll('.btn-approve-obj').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(!confirm("Setujui objek ini?")) return;
            try { await approveObjek(e.target.dataset.id); loadVerifObjek(); } 
            catch(err){ alert(err.message); }
        });
    });
    document.querySelectorAll('.btn-reject-obj').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(!confirm("Tolak objek ini?")) return;
            try { await rejectObjek(e.target.dataset.id); loadVerifObjek(); } 
            catch(err){ alert(err.message); }
        });
    });
}

function setupActionButtons() {
    // Approve
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(!confirm("Yakin setujui situs ini beserta data baru (kerajaan/arkeolog) di dalamnya?")) return;
            try {
                await approveSitus(e.target.dataset.id);
                alert("Berhasil diverifikasi!");
                loadVerifSitus(); // Reload list
            } catch (err) { alert(err.message); }
        });
    });

    // Reject
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if(!confirm("Yakin tolak? Data kerajaan/arkeolog baru yang tidak terpakai situs lain juga akan dihapus.")) return;
            try {
                await rejectSitus(e.target.dataset.id);
                alert("Data ditolak.");
                loadVerifSitus();
            } catch (err) { alert(err.message); }
        });
    });

    // Link Peneliti Manual
    document.querySelectorAll('.btn-link-peneliti').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const situsId = e.target.dataset.situs;
            const select = document.querySelector(`.sel-arkeolog-dashboard[data-situs="${situsId}"]`);
            const arkeologId = select.value;

            if (!arkeologId) return alert("Pilih peneliti dulu.");

            try {
                await postPenelitian(parseInt(situsId), parseInt(arkeologId));
                alert("Peneliti berhasil dihubungkan!");
                // Beri tanda visual
                e.target.textContent = "✓";
                e.target.disabled = true;
                e.target.style.backgroundColor = "#10b981";
                
                // Opsional: Reload halaman untuk melihat update di list
                // loadVerifikasi(); 
            } catch (err) {
                alert(err.message);
            }
        });
    });
}

// --- 2. LOGIKA NAVIGASI & FORM (SAMA SEPERTI SEBELUMNYA) ---
function setupNavigation() {
    // Update daftar ID menu dan view
    const menus = ['menu-verif-situs', 'menu-verif-objek', 'menu-wilayah', 'menu-kerajaan', 'menu-arkeolog', 'menu-tokoh'];
    const views = ['view-verif-situs', 'view-verif-objek', 'view-wilayah', 'view-kerajaan', 'view-arkeolog', 'view-tokoh'];

    menus.forEach((menuId, index) => {
        const el = document.getElementById(menuId);
        if (!el) return;

        el.addEventListener('click', () => {
            menus.forEach(id => document.getElementById(id).classList.remove('active'));
            views.forEach(id => document.getElementById(id).classList.add('hidden'));

            document.getElementById(menuId).classList.add('active');
            document.getElementById(views[index]).classList.remove('hidden');

            // Load data on demand (biar hemat bandwidth)
            if (menuId === 'menu-verif-situs') loadVerifSitus();
            if (menuId === 'menu-verif-objek') loadVerifObjek(); // Fungsi baru
            
            if (menuId === 'menu-tokoh') loadDropdownKerajaan();
            if (menuId === 'menu-wilayah') loadDropdownWilayahAdmin();
        });
    });
}

// --- 3. SUBMIT FORMS DATA MASTER ---
function setupForms() {
    // Form Kerajaan
    const fKerajaan = document.getElementById('form-kerajaan');
    if (fKerajaan) fKerajaan.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await postKerajaan({
                nama_kerajaan: document.getElementById('nama_kerajaan').value,
                tahun_berdiri: parseInt(document.getElementById('tahun_berdiri').value) || null,
                tahun_runtuh: parseInt(document.getElementById('tahun_runtuh').value) || null,
                pusat_pemerintahan: document.getElementById('pusat_pemerintahan').value,
                deskripsi_singkat: document.getElementById('deskripsi_kerajaan').value
            });
            alert("Kerajaan berhasil!"); e.target.reset();
        } catch (err) { alert(err.message); }
    });

    // Form Arkeolog
    const fArkeolog = document.getElementById('form-arkeolog');
    if (fArkeolog) fArkeolog.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await postArkeolog({
                nama_lengkap: document.getElementById('nama_arkeolog').value,
                afiliasi_institusi: document.getElementById('institusi').value,
                spesialisasi: document.getElementById('spesialisasi').value,
                email: document.getElementById('email_arkeolog').value || '',
                nomor_telepon: document.getElementById('telp_arkeolog').value || ''
            });
            alert("Arkeolog berhasil!"); e.target.reset();
        } catch (err) { alert(err.message); }
    });

    // Form Tokoh
    const fTokoh = document.getElementById('form-tokoh');
    if (fTokoh) fTokoh.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await postTokoh({
                nama_tokoh: document.getElementById('nama_tokoh').value,
                biografi_singkat: document.getElementById('biografi').value,
                kerajaan_id: parseInt(document.getElementById('select-kerajaan-tokoh').value) || null,
                tahun_lahir: null, tahun_wafat: null
            });
            await postGelarTokoh(res.data.tokoh_id, document.getElementById('gelar_tokoh').value);
            alert("Tokoh berhasil!"); e.target.reset();
        } catch (err) { alert(err.message); }
    });

    // Form Wilayah (Kota, Kec, Desa)
    const fKota = document.getElementById('form-kota');
    if (fKota) fKota.addEventListener('submit', async (e) => {
        e.preventDefault();
        try { await postKota(document.getElementById('input-nama-kota').value); alert("Kota OK!"); e.target.reset(); loadDropdownWilayahAdmin(); } 
        catch (err) { alert(err.message); }
    });

    const fKec = document.getElementById('form-kecamatan');
    if (fKec) fKec.addEventListener('submit', async (e) => {
        e.preventDefault();
        try { await postKecamatan(document.getElementById('input-nama-kecamatan').value, parseInt(document.getElementById('adm-select-kota-kec').value)); alert("Kecamatan OK!"); e.target.reset(); } 
        catch (err) { alert(err.message); }
    });

    const fDesa = document.getElementById('form-desa');
    if (fDesa) fDesa.addEventListener('submit', async (e) => {
        e.preventDefault();
        try { await postDesa(document.getElementById('input-nama-desa').value, parseInt(document.getElementById('adm-select-kec-desa').value)); alert("Desa OK!"); e.target.reset(); } 
        catch (err) { alert(err.message); }
    });
}

// --- HELPERS ---
async function loadDropdownKerajaan() {
    const select = document.getElementById('select-kerajaan-tokoh');
    if(!select) return;
    try {
        const list = await getKerajaan();
        select.innerHTML = '<option value="">-- Pilih Kerajaan --</option>' + 
            list.map(k => `<option value="${k.kerajaan_id}">${k.nama_kerajaan}</option>`).join('');
    } catch (err) { console.error(err); }
}

async function loadDropdownWilayahAdmin() {
    const selKotaKec = document.getElementById('adm-select-kota-kec');
    const selKotaDesa = document.getElementById('adm-select-kota-desa');
    const selKecDesa = document.getElementById('adm-select-kec-desa');
    
    if(!selKotaKec) return;

    try {
        const listKota = await getKota();
        const options = '<option value=""> Pilih Kota </option>' + listKota.map(k => `<option value="${k.kota_kabupaten_id}">${k.nama_kota_kabupaten}</option>`).join('');
        
        selKotaKec.innerHTML = options;
        selKotaDesa.innerHTML = options;
    } catch (err) { console.error(err); }

    // Listener khusus di form Desa: Kota -> Kecamatan
    selKotaDesa.addEventListener('change', async () => {
        try {
            const listKec = await getKecamatan(selKotaDesa.value);
            selKecDesa.innerHTML = '<option value=""> Pilih Kecamatan </option>' + listKec.map(k => `<option value="${k.kecamatan_id}">${k.nama_kecamatan}</option>`).join('');
            selKecDesa.disabled = false;
            selKecDesa.style.background = 'white';
        } catch(e) { console.error(e); }
    });
}