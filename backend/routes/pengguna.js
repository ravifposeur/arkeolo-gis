const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const pool = require('../db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');


const validate = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validators/pengguna.validator');
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', validate({body: registerSchema}), async (req, res) => {
    try {
        const {nama_pengguna, email, password} = req.body;

        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = await pool.query(
            "INSERT INTO pengguna (nama_pengguna, email, password_hash, role) VALUES ($1, $2, $3, 'kontributor') RETURNING pengguna_id, nama_pengguna, email, role",
            [nama_pengguna, email, passwordHash]
        );

        res.status(201).json({
            message: 'User dibuat!',
            user: newUser.rows[0]
        });
    
    } catch (error) {
        console.error('Error saat regist:', error);
        if(error.code === '23505'){
            if (error.constraint === 'pengguna_email_key') {
                return res.status(409).json({message: 'Email sudah terdaftar.'});
            }
            if (error.constraint === 'pengguna_nama_pengguna_key') {
                return res.status(409).json({message: 'Nama pengguna sudah terdaftar.'});
            }
            return res.status(409).json({message: 'Email atau Nama Pengguna sudah terdaftar.'});
        }
        res.status(500).json({message: 'Error di server!'});
    }
});

router.post('/login', async (req, res) =>{
    try {
        const {email, password} = req.body;
        const userResult = await pool.query("SELECT * FROM pengguna WHERE email = $1", [email]);
        
        if (userResult.rows.length === 0){
            return res.status(401).json({message: 'Email/Password Salah.'});
        }
        
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({message: 'Email/Password Salah.'});
        }

        const payload = {
            id: user.pengguna_id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.json({
            message: 'Login Berhasil!',
            token: token
        });
    } catch (error) {
        console.error('Error saat login:', error);

        res.status(500).json({message: "Terjadi error di server."});
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const userResult = await pool.query("SELECT * FROM pengguna WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.json({ message: 'Jika email terdaftar, link reset akan dikirim.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 Jam dari sekarang

        await pool.query(
            "UPDATE pengguna SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3",
            [token, expires, email]
        );

        console.log("========================================");
        console.log(`LINK RESET PASSWORD UNTUK ${email}:`);
        console.log(`Token: ${token}`);
        console.log("========================================");

        res.json({ message: 'Link reset password telah dikirim (Cek Console Server).' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const userResult = await pool.query(
            "SELECT * FROM pengguna WHERE reset_password_token = $1 AND reset_password_expires > $2",
            [token, Date.now()]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(
            "UPDATE pengguna SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE pengguna_id = $2",
            [passwordHash, userResult.rows[0].pengguna_id]
        );

        res.json({ message: 'Password berhasil diubah! Silakan login.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

module.exports = router;