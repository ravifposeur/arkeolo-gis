const BASE_URL = 'https://arkeologis-be.vercel.app/api';

import { getToken } from './auth.js';

export async function getVerifiedSitus() {
    try {
        const response = await fetch(`${BASE_URL}/situs/verified`);
        
        if (!response.ok) {
            throw new Error(`Gagal mengambil data: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error API:", error);
        return []; 
    }
}

export async function loginUser(email, password) {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login gagal');
        }

        return data; 
    } catch (error) {
        console.error("Error Login:", error);
        throw error; 
    }
}

export async function postSitusBaru(dataSitus) {
    const token = getToken();
    
    if (!token) {
        throw new Error("Anda harus login dulu!");
    }

    const response = await fetch(`${BASE_URL}/situs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- INI KUNCINYA
        },
        body: JSON.stringify(dataSitus)
    });

    const result = await response.json();

    if (!response.ok) {
        if (result.errors) {
            const msg = result.errors.map(e => e.message).join('\n');
            throw new Error(msg);
        }
        throw new Error(result.message || 'Gagal menambah situs');
    }

    return result;
}

export async function getPendingSitus() {
    const token = localStorage.getItem('arkeo_token'); // Atau gunakan getToken() jika sudah diimport
    
    const response = await fetch(`${BASE_URL}/situs/pending`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Gagal mengambil data pending (Mungkin bukan Verifikator?)");
    }
    return await response.json();
}

export async function approveSitus(id) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/situs/approve/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Gagal menyetujui situs");
    return await response.json();
}

export async function rejectSitus(id) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/situs/reject/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Gagal menolak situs");
    return await response.json();
}

export async function getObjekBySitus(situsId) {
    try {
        const response = await fetch(`${BASE_URL}/objek/verified/by-situs/${situsId}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Error API Objek:", error);
        return [];
    }
}

/**
 * Kirim Objek Baru
 * Endpoint: POST /api/objek
 */
export async function postObjekBaru(dataObjek) {
    const token = localStorage.getItem('arkeo_token'); // Ambil token
    if (!token) throw new Error("Wajib login!");

    const response = await fetch(`${BASE_URL}/objek`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataObjek)
    });

    const result = await response.json();
    if (!response.ok) {
        if (result.errors) {
            const msg = result.errors.map(e => e.message).join('\n');
            throw new Error(msg);
        }
        throw new Error(result.message);
    }
    return result;
}

export async function getKota() {
    // Endpoint: GET /api/alamat/kota
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/alamat/kota`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return await response.json();
}

export async function getKecamatan(kotaId) {
    // Endpoint: GET /api/alamat/kecamatan/by-kota/:id
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/alamat/kecamatan/by-kota/${kotaId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return await response.json();
}

export async function getDesa(kecamatanId) {
    // Endpoint: GET /api/alamat/desa/by-kecamatan/:id
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/alamat/desa/by-kecamatan/${kecamatanId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return await response.json();
}

// 1. Tambah Kerajaan
export async function postKerajaan(data) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/kerajaan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal menambah kerajaan");
    return await response.json();
}

// 2. Tambah Arkeolog (Crowdsourcing Ready)
export async function postArkeolog(data) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/arkeolog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal menambah arkeolog");
    return await response.json();
}

// 3. Tambah Tokoh
export async function postTokoh(data) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/tokoh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Gagal menambah tokoh");
    return await response.json();
}

// 4. Tambah Gelar ke Tokoh (Tabel Relasi: tokoh_gelar_tokoh)
export async function postGelarTokoh(tokohId, gelar) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/relasi/gelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tokoh_id: tokohId, gelar_tokoh: gelar })
    });
    if (!response.ok) throw new Error("Gagal menambah gelar");
    return await response.json();
}

// --- API RELASI & DROPDOWN ---

// Ambil Semua Arkeolog (Untuk Dropdown)
export async function getArkeolog() {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/arkeolog`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
}

// Ambil Semua Kerajaan (Untuk Dropdown)
export async function getKerajaan() {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/kerajaan`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
}

// Link Arkeolog ke Situs (Tabel Relasi: penelitian_situs)
export async function postPenelitian(situsId, arkeologId) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/relasi/penelitian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ situs_id: situsId, arkeolog_id: arkeologId })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal menghubungkan arkeolog");
    }
    return await response.json();
}

// Ambil Peneliti berdasarkan Situs
export async function getPenelitiBySitus(situsId) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/relasi/penelitian/by-situs/${situsId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok ? await response.json() : [];
}

export async function getAllTokoh() {
    // Endpoint ini bisa diakses publik jika kita update routes/tokoh.js
    // Asumsi: Kita pakai token yg ada (jika login), atau coba akses public
    // (Sebaiknya update routes/tokoh.js agar GET / bisa public, tapi pakai token dulu gpp)
    const token = localStorage.getItem('arkeo_token');
    
    // Jika backend mewajibkan token, fitur ini hanya jalan kalau login.
    // Jika ingin public, hapus 'authenticateToken' di routes/tokoh.js bagian GET /
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const response = await fetch(`${BASE_URL}/tokoh`, { headers });
        return response.ok ? await response.json() : [];
    } catch (e) { return []; }
}

export async function postKota(nama) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/alamat/kota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nama_kota_kabupaten: nama })
    });
    if (!response.ok) throw new Error("Gagal tambah kota");
    return await response.json();
}

export async function postKecamatan(nama, kotaId) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/alamat/kecamatan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nama_kecamatan: nama, kota_kabupaten_id: kotaId })
    });
    if (!response.ok) throw new Error("Gagal tambah kecamatan");
    return await response.json();
}

export async function postDesa(nama, kecamatanId) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/alamat/desa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nama_desa_kelurahan: nama, kecamatan_id: kecamatanId })
    });
    if (!response.ok) throw new Error("Gagal tambah desa");
    return await response.json();
}

export async function postAtribusi(objekId, tokohId) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/relasi/atribusi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ objek_id: objekId, tokoh_id: tokohId })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Gagal menghubungkan tokoh");
    }
    return await response.json();
}

export async function getPendingObjek() {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/objek/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Gagal ambil data objek pending");
    return await response.json();
}

export async function approveObjek(id) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/objek/approve/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Gagal approve objek");
    return await response.json();
}

export async function rejectObjek(id) {
    const token = localStorage.getItem('arkeo_token');
    const response = await fetch(`${BASE_URL}/objek/reject/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Gagal reject objek");
    return await response.json();
}

export async function registerUser(data) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
}

export async function forgotPassword(email) {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    return await response.json();
}

export async function resetPassword(token, newPassword) {
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
}