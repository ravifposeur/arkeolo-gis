// File: proyek_arkeologi_backend/db.js

const { Pool } = require('pg');
require('dotenv').config();

// --- DEBUGGING ---
// Cek apakah Vercel bisa membaca DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error("❌ FATAL ERROR: Variabel 'DATABASE_URL' tidak ditemukan / undefined!");
    console.error("Mohon cek Settings > Environment Variables di Dashboard Vercel.");
} else {
    console.log("✅ DATABASE_URL ditemukan (Backend siap connect).");
}

const pool = new Pool({
    // Kita paksa pakai connectionString dari ENV
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Wajib untuk Neon.tech
    }
});

// Cek koneksi saat inisialisasi
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Gagal konek ke Database saat startup:', err.message);
    } else {
        console.log('✅ Berhasil konek ke Database Neon!');
        release();
    }
});

module.exports = pool;