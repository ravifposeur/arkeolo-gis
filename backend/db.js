const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Wajib true/objek untuk database cloud (Neon)
    }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error koneksi Database:', err.message);
    } else {
        console.log('✅ Berhasil terhubung ke Database!');
        release();
    }
});

module.exports = pool;