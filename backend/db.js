const { Pool } = require('pg');
require('dotenv').config();

let config;

if (process.env.DATABASE_URL) {
    config = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false 
        }
    };
} else {
    config = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: {
            rejectUnauthorized: false 
        }
    };
}

const pool = new Pool(config);

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Gagal konek DB:', err.message);
    } else {
        console.log('✅ Berhasil konek ke Database Neon!');
        release();
    }
});

module.exports = pool;