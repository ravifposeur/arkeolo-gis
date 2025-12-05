const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    // Gunakan variabel DATABASE_URL yang nanti kita set di Vercel
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false // Wajib untuk Neon
    }
});

module.exports = pool;