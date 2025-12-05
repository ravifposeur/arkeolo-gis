import { 
    loginUser, postSitusBaru, 
    postObjekBaru, getKota, getKecamatan, 
    getDesa, getKerajaan, getArkeolog, 
    postKerajaan, postArkeolog, postPenelitian,
    postTokoh, postGelarTokoh, postAtribusi,getAllTokoh,
    registerUser, forgotPassword, resetPassword
} from './api.js';
import { saveToken, removeToken, isLoggedIn } from './auth.js';
import { setupPanelEvents } from './panel.js';


let isAddMode = false;

export function setupUI() {
    setupPanelEvents(); 

    const btnLoginToggle = document.getElementById('btn-login-toggle');
    const modal = document.getElementById('modal-login');
    const btnClose = document.getElementById('btn-close-modal');
    const formLogin = document.getElementById('form-login');
    const errorText = document.getElementById('login-error');
    
    // Variabel untuk Tambah Situs
    const btnFloatingAdd = document.getElementById('btn-add-mode'); 
    const modalAdd = document.getElementById('modal-add-situs');
    const btnCloseAdd = document.getElementById('btn-close-add');
    const formAdd = document.getElementById('form-add-situs');

    // Variabel untuk Tambah Objek
    const modalObjek = document.getElementById('modal-add-objek');
    const formObjek = document.getElementById('form-add-objek');
    const btnCloseObjek = document.getElementById('btn-close-objek');

    // Variabel Dropdown Wilayah
    const selKota = document.getElementById('select-kota');
    const selKec = document.getElementById('select-kecamatan');
    const selDesa = document.getElementById('select-desa');
    
    // Variabel Dropdown & Input Dinamis (Kerajaan & Arkeolog) --- BARU ---
    const selKerajaan = document.getElementById('select-kerajaan');
    const inpNewKerajaan = document.getElementById('input-new-kerajaan'); // Input hidden
    
    const selArkeolog = document.getElementById('select-arkeolog');
    const inpNewArkeolog = document.getElementById('input-new-arkeolog'); // Input hidden

    const btnGpsDirect = document.getElementById('btn-gps-direct');

    // Variabel Dropdown & Input Tokoh (BARU)
    const selTokohObjek = document.getElementById('select-tokoh-objek');
    const divNewTokoh = document.getElementById('container-new-tokoh'); // Div pembungkus input
    const inpNewTokohNama = document.getElementById('input-new-tokoh-nama');
    const inpNewTokohGelar = document.getElementById('input-new-tokoh-gelar');

    // Variabel Modal Auth Baru
    const modalRegister = document.getElementById('modal-register');
    const modalForgot = document.getElementById('modal-forgot');
    const modalReset = document.getElementById('modal-reset');
    
    // Cek status login saat halaman dimuat pertama kali
    updateButtonState();

    btnLoginToggle.addEventListener('click', () => {
        if (isLoggedIn()) {
            if (confirm("Anda yakin ingin keluar?")) {
                removeToken();
                updateButtonState();
                alert("Berhasil logout.");
            }
        } else {
            modal.classList.remove('hidden');
        }
    });

    btnClose.addEventListener('click', () => {
        modal.classList.add('hidden');
        errorText.textContent = ''; 
    });

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const btnSubmit = formLogin.querySelector('button');
        const textAsli = btnSubmit.textContent;
        btnSubmit.textContent = 'Memproses...';
        btnSubmit.disabled = true;

        try {
            const result = await loginUser(email, password);
            saveToken(result.token);
            modal.classList.add('hidden');
            formLogin.reset();
            updateButtonState();
            alert("Login Berhasil! Selamat datang.");
        } catch (error) {
            errorText.textContent = error.message;
        } finally {
            btnSubmit.textContent = textAsli;
            btnSubmit.disabled = false;
        }
    });

    document.getElementById('link-register').addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('hidden'); // Tutup Login
        modalRegister.classList.remove('hidden'); // Buka Register
    });

    document.getElementById('link-login-back').addEventListener('click', (e) => {
        e.preventDefault();
        modalRegister.classList.add('hidden');
        modal.classList.remove('hidden');
    });

    document.getElementById('close-register').addEventListener('click', () => {
        modalRegister.classList.add('hidden');
    });

    document.getElementById('form-register').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await registerUser({
                nama_pengguna: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value
            });
            alert("Registrasi Berhasil! Silakan Login.");
            modalRegister.classList.add('hidden');
            modal.classList.remove('hidden'); // Buka modal login otomatis
        } catch (err) { 
            alert(err.message); 
        }
    });

    document.getElementById('link-forgot').addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('hidden');
        modalForgot.classList.remove('hidden');
    });

    document.getElementById('close-forgot').addEventListener('click', () => modalForgot.classList.add('hidden'));

    document.getElementById('form-forgot').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        try {
            const res = await forgotPassword(email);
            alert(`${res.message}\n(Untuk simulasi: Cek Terminal Backend Anda untuk Token)`);
            
            modalForgot.classList.add('hidden');
            modalReset.classList.remove('hidden');
        } catch (err) { 
            alert(err.message); 
        }
    });

    document.getElementById('close-reset').addEventListener('click', () => modalReset.classList.add('hidden'));

    document.getElementById('form-reset').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await resetPassword(
                document.getElementById('reset-token').value,
                document.getElementById('reset-password').value
            );
            alert("Password berhasil diubah! Silakan login.");
            modalReset.classList.add('hidden');
            modal.classList.remove('hidden'); // Balik ke login
        } catch (err) { 
            alert(err.message); 
        }
    });


    btnFloatingAdd.addEventListener('click', async () => {
        isAddMode = !isAddMode;
        if (isAddMode) {
            btnFloatingAdd.style.backgroundColor = '#fbbf24'; 
            btnFloatingAdd.textContent = 'x'; 
            document.getElementById('map').classList.add('cursor-crosshair');
            
            await ensureDropdownsLoaded(); 
            
            alert("Klik lokasi di peta.");
        } else {
            resetAddMode();
        }
    });

    selKerajaan.addEventListener('change', () => {
        if (selKerajaan.value === 'NEW') {
            inpNewKerajaan.classList.remove('hidden');
            inpNewKerajaan.required = true; // Jadi wajib diisi
            inpNewKerajaan.focus();
        } else {
            inpNewKerajaan.classList.add('hidden');
            inpNewKerajaan.required = false; // Tidak wajib
            inpNewKerajaan.value = ''; // Reset nilai
        }
    });

    selArkeolog.addEventListener('change', () => {
        if (selArkeolog.value === 'NEW') {
            inpNewArkeolog.classList.remove('hidden');
            inpNewArkeolog.required = true;
            inpNewArkeolog.focus();
        } else {
            inpNewArkeolog.classList.add('hidden');
            inpNewArkeolog.required = false;
            inpNewArkeolog.value = '';
        }
    });

    selKota.addEventListener('change', async () => {
        const kotaId = selKota.value;
        resetSelect(selKec, 'Memuat...'); 
        resetSelect(selDesa, 'Pilih Kecamatan Dulu');
        const kecList = await getKecamatan(kotaId);
        populateSelect(selKec, kecList, 'kecamatan_id', 'nama_kecamatan', '-- Pilih Kecamatan --');
    });

    selKec.addEventListener('change', async () => {
        const kecId = selKec.value;
        resetSelect(selDesa, 'Memuat...');
        const desaList = await getDesa(kecId);
        populateSelect(selDesa, desaList, 'desa_kelurahan_id', 'nama_desa_kelurahan', '-- Pilih Desa --');
    });

    btnCloseAdd.addEventListener('click', () => {
        modalAdd.classList.add('hidden');
    });

    formAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = formAdd.querySelector('button');
        const textAsli = btnSubmit.textContent;
        btnSubmit.textContent = "Mengirim Data...";
        btnSubmit.disabled = true;

        try {
            let kerajaanId = selKerajaan.value;
            
            if (kerajaanId === 'NEW') {
                const namaBaru = inpNewKerajaan.value;
                const resKerajaan = await postKerajaan({ 
                    nama_kerajaan: namaBaru, 
                    deskripsi_singkat: "Ditambahkan oleh Kontributor Lapangan" 
                });
                kerajaanId = resKerajaan.data.kerajaan_id; // Pakai ID baru
            } else if (kerajaanId === "") {
                kerajaanId = null;
            }

            const dataSitus = {
                nama_situs: document.getElementById('nama_situs').value,
                jalan_dusun: document.getElementById('jalan_dusun').value,
                jenis_situs: document.getElementById('jenis_situs').value,
                desa_kelurahan_id: parseInt(document.getElementById('select-desa').value),
                kerajaan_id: kerajaanId ? parseInt(kerajaanId) : null,
                latitude: parseFloat(document.getElementById('input-lat').value),
                longitude: parseFloat(document.getElementById('input-lng').value),
                periode_sejarah: 'Tidak Diketahui'
            };

            const resSitus = await postSitusBaru(dataSitus);
            const situsIdBaru = resSitus.data.situs_id;

            let arkeologId = selArkeolog.value;
            
            if (arkeologId === 'NEW') {
                const namaArkeolog = inpNewArkeolog.value;
                const resArkeolog = await postArkeolog({
                    nama_lengkap: namaArkeolog,
                    afiliasi_institusi: "Kontributor Lapangan",
                    spesialisasi: "Umum",
                    email: "", nomor_telepon: "" // Boleh kosong sesuai update terakhir
                });
                arkeologId = resArkeolog.data.arkeolog_id; // Pakai ID baru
            }

            if (arkeologId && arkeologId !== "") {
                await postPenelitian(situsIdBaru, parseInt(arkeologId));
            }

            alert("Sukses! Situs (dan data terkait) berhasil dilaporkan.");
            modalAdd.classList.add('hidden');
            formAdd.reset();
            
            // Sembunyikan input "New" lagi
            inpNewKerajaan.classList.add('hidden');
            inpNewArkeolog.classList.add('hidden');
            
            resetAddMode();

        } catch (error) {
            alert("Gagal: \n" + error.message);
        } finally {
            btnSubmit.textContent = textAsli;
            btnSubmit.disabled = false;
        }
    });
    
    // --- Logic GPS ---
    btnGpsDirect.addEventListener('click', () => {
        if (!navigator.geolocation) return alert("Browser tidak dukung GPS.");

        const iconAsli = btnGpsDirect.innerHTML;
        btnGpsDirect.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
        btnGpsDirect.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                await ensureDropdownsLoaded();

                document.getElementById('input-lat').value = lat;
                document.getElementById('input-lng').value = lng;
                document.getElementById('display-latlng').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)} (GPS)`;

                modalAdd.classList.remove('hidden');

                btnGpsDirect.innerHTML = iconAsli;
                btnGpsDirect.disabled = false;
            },
            (err) => {
                alert("Gagal ambil GPS: " + err.message);
                btnGpsDirect.innerHTML = iconAsli;
                btnGpsDirect.disabled = false;
            },
            { enableHighAccuracy: true }
        );
    });

    document.addEventListener('openObjekModal', async (e) => {
        const situs = e.detail; 
        document.getElementById('objek-situs-id').value = situs.situs_id;
        document.getElementById('objek-context-site').textContent = `Menambahkan ke: ${situs.nama_situs}`;
        
        // LOAD DATA TOKOH SAAT MODAL DIBUKA
        await ensureTokohLoaded(selTokohObjek);
        
        modalObjek.classList.remove('hidden');
    });

    selTokohObjek.addEventListener('change', () => {
        if (selTokohObjek.value === 'NEW') {
            divNewTokoh.classList.remove('hidden');
            inpNewTokohNama.required = true; 
            inpNewTokohGelar.required = true;
        } else {
            divNewTokoh.classList.add('hidden');
            inpNewTokohNama.required = false; 
            inpNewTokohGelar.required = false;
        }
    });

    btnCloseObjek.addEventListener('click', () => {
        modalObjek.classList.add('hidden');
    });

    formObjek.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = formObjek.querySelector('button');
        btnSubmit.textContent = "Mengirim..."; 
        btnSubmit.disabled = true;

        try {
            let tokohId = selTokohObjek.value;
            
            if (tokohId === 'NEW') {
                // Buat Tokoh Baru
                const resTokoh = await postTokoh({
                    nama_tokoh: inpNewTokohNama.value,
                    biografi_singkat: "Ditambahkan oleh Kontributor Lapangan",
                    kerajaan_id: null, // Bisa dikembangkan lagi nanti
                    tahun_lahir: null, 
                    tahun_wafat: null
                });
                tokohId = resTokoh.data.tokoh_id;

                // buat Gelar Tokoh (Wajib jika buat baru sesuai form)
                await postGelarTokoh(tokohId, inpNewTokohGelar.value);
            } else if (tokohId === "") {
                tokohId = null; // User tidak memilih tokoh
            }

            const dataObjek = {
                situs_id: parseInt(document.getElementById('objek-situs-id').value),
                nama_objek: document.getElementById('nama_objek').value,
                jenis_objek: document.getElementById('jenis_objek').value,
                bahan: document.getElementById('bahan').value,
                panjang: parseFloat(document.getElementById('panjang').value),
                lebar: parseFloat(document.getElementById('lebar').value),
                tinggi: parseFloat(document.getElementById('tinggi').value),
                teks_transliterasi: document.getElementById('teks_transliterasi').value
            };

            const resObjek = await postObjekBaru(dataObjek);

            if (tokohId && tokohId !== "") {
                await postAtribusi(resObjek.data.objek_id, parseInt(tokohId));
            }

            alert("Objek (dan data tokoh terkait) berhasil dilaporkan!"); 
            modalObjek.classList.add('hidden'); 
            formObjek.reset();
            
            // Reset tampilan input hidden
            divNewTokoh.classList.add('hidden');

        } catch (err) { 
            alert("Gagal: " + err.message); 
        } finally { 
            btnSubmit.textContent = "Kirim Laporan Objek"; 
            btnSubmit.disabled = false; 
        }
    });

    return {
        onMapClick: (latlng) => {
            if (isAddMode) {
                document.getElementById('input-lat').value = latlng.lat;
                document.getElementById('input-lng').value = latlng.lng;
                document.getElementById('display-latlng').textContent = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
                modalAdd.classList.remove('hidden');
            }
        }
    };
}


function resetAddMode() {
    isAddMode = false;
    const btn = document.getElementById('btn-add-mode');
    btn.style.backgroundColor = '#10b981'; 
    btn.textContent = '+';
    document.getElementById('map').classList.remove('cursor-crosshair');
}

function updateButtonState() {
    const btnLogin = document.getElementById('btn-login-toggle');
    const btnAdd = document.getElementById('btn-add-mode'); 
    const btnGps = document.getElementById('btn-gps-direct');

    if (isLoggedIn()) {
        btnLogin.textContent = 'Logout';
        btnLogin.style.backgroundColor = '#dc2626';
        btnAdd.classList.remove('hidden');
        btnGps.classList.remove('hidden');
    } else {
        btnLogin.textContent = 'Login';
        btnLogin.style.backgroundColor = '#275cceff';
        btnAdd.classList.add('hidden');
        btnGps.classList.add('hidden');
    }
}

function populateSelect(selectElement, data, idKey, nameKey, defaultText) {
    selectElement.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[idKey];
        option.textContent = item[nameKey];
        selectElement.appendChild(option);
    });
    selectElement.disabled = false;
    selectElement.style.background = '#fff';
}

function populateSelectWithNew(selectElement, data, idKey, nameKey, defaultText) {
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    
    // Data asli dari DB
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[idKey];
        option.textContent = item[nameKey];
        selectElement.appendChild(option);
    });

    // Opsi Spesial "Buat Baru"
    const optNew = document.createElement('option');
    optNew.value = "NEW";
    optNew.textContent = "➕ Buat Baru / Lainnya...";
    optNew.style.fontWeight = "bold";
    optNew.style.color = "#2563eb";
    selectElement.appendChild(optNew);

    selectElement.disabled = false;
    selectElement.style.background = '#fff';
}

function resetSelect(selectElement, defaultText) {
    selectElement.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
    selectElement.disabled = true;
    selectElement.style.background = '#eee';
}

async function ensureDropdownsLoaded() {
    const selKota = document.getElementById('select-kota');
    const selKerajaan = document.getElementById('select-kerajaan');
    const selArkeolog = document.getElementById('select-arkeolog'); // Tambah Arkeolog

    // Hanya load jika dropdown masih kosong
    if (selKota.options.length <= 1) {
        try {
            const [kotaList, kerajaanList, arkeologList] = await Promise.all([
                getKota(),
                getKerajaan(),
                getArkeolog()
            ]);
            
            // Isi Kota (Standar)
            populateSelect(selKota, kotaList, 'kota_kabupaten_id', 'nama_kota_kabupaten', '-- Pilih Kota --');
            
            // Isi Kerajaan (Dengan opsi NEW)
            populateSelectWithNew(selKerajaan, kerajaanList, 'kerajaan_id', 'nama_kerajaan', '-- Pilih Kerajaan --');
            
            // Isi Arkeolog (Dengan opsi NEW)
            populateSelectWithNew(selArkeolog, arkeologList, 'arkeolog_id', 'nama_lengkap', '-- Pilih Peneliti (Opsional) --');
            
        } catch (err) {
            console.error("Gagal load data master:", err);
            alert("Gagal koneksi data wilayah. Cek console.");
        }
    }
}

async function ensureTokohLoaded(selectElement) {
    // Hanya load jika dropdown masih kosong (length <= 1)
    if (selectElement.options.length <= 1) {
        try {
            const tokohList = await getAllTokoh();
            populateSelectWithNew(selectElement, tokohList, 'tokoh_id', 'nama_tokoh', '-- Pilih Tokoh (Opsional) --');
        } catch (err) { 
            console.error("Gagal load tokoh", err); 
        }
    }
}