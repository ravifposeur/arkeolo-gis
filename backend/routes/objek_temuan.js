const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

const validate = require('../middleware/validation');
const {
    createObjekSchema,
    updateObjekSchema,
    paramsIdSchema,
    paramsSitusIdSchema
} = require('../validators/objek_temuan.validator');

// GET VERIFIED OBJECT BERDASAR SITUS

router.get('/verified/by-situs/:situs_id', validate({ params: paramsSitusIdSchema }), async (req, res) => {
    try {
        const { situs_id } = req.params;
        const query = `
            SELECT 
                o.*,
                -- Gabungkan nama tokoh jika ada lebih dari satu
                STRING_AGG(t.nama_tokoh, ', ') as tokoh_terkait,
                STRING_AGG(t.gelar_tokoh, ', ') as gelar_tokoh
            FROM objek_temuan o
            LEFT JOIN atribusi_artefak aa ON o.objek_id = aa.objek_id
            LEFT JOIN (
                -- Subquery untuk ambil Tokoh + Gelar (jika ada)
                SELECT t.tokoh_id, t.nama_tokoh, g.gelar_tokoh
                FROM tokoh t
                LEFT JOIN tokoh_gelar_tokoh g ON t.tokoh_id = g.tokoh_id
            ) t ON aa.tokoh_id = t.tokoh_id
            WHERE o.situs_id = $1 AND o.status_verifikasi = 'verified'
            GROUP BY o.objek_id
            ORDER BY o.objek_id ASC
        `;
        const result = await pool.query(query, [situs_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error ambil objek terverifikasi:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});

// POST OBJECT TO PENDING

router.post('/', authenticateToken, validate({ body: createObjekSchema }), async (req, res) => {try {
        const { 
            nama_objek, jenis_objek, bahan, panjang, tinggi, lebar,
            teks_transliterasi, aksara, bahasa, situs_id 
        } = req.body;
        
        const penggunaPelaporID = req.user.id;

        const userRole = req.user.role;
        const initialStatus = (userRole === 'administrator' || userRole === 'verifikator') 
            ? 'verified' 
            : 'pending';

        const insertQuery = `
            INSERT INTO objek_temuan (
                nama_objek, jenis_objek, bahan, panjang, tinggi, lebar, 
                teks_transliterasi, aksara, bahasa, situs_id,
                status_verifikasi, pengguna_pelapor_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `;

        const params = [
            nama_objek, jenis_objek, bahan, panjang, tinggi, lebar,
            teks_transliterasi, aksara, bahasa, situs_id,
            initialStatus, penggunaPelaporID   
        ];

        const objekBaru = await pool.query(insertQuery, params);

        res.status(201).json({
            message: initialStatus === 'verified' 
                ? 'Objek berhasil ditambahkan dan terverifikasi otomatis.' 
                : 'Objek berhasil ditambahkan dan menunggu verifikasi.',
            data: objekBaru.rows[0]
        });

    } catch (error) {
        console.error('Error tambah objek temuan:', error);
        res.status(500).json({ message: 'Error di Server' });
    }
});
// GET PENDING OBJECT

router.get('/pending', authenticateToken, isVerifier, async (req, res) => {
    try {
        const query = `
            SELECT 
                o.*, 
                s.nama_situs,
                u.nama_pengguna as nama_pelapor
            FROM objek_temuan o
            LEFT JOIN situs_arkeologi s ON o.situs_id = s.situs_id
            LEFT JOIN pengguna u ON o.pengguna_pelapor_id = u.pengguna_id
            WHERE o.status_verifikasi = 'pending' 
            ORDER BY o.objek_id ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error ambil objek pending:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});


// APPROVED OBJECT

router.put('/approve/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `
            UPDATE objek_temuan
            SET status_verifikasi = 'verified'
            WHERE objek_id = $1 RETURNING *
            `,
            [id]
        );
        
        if (result.rows.length === 0){
            return res.status(404).json({message: 'Objek tidak ditemukan!'});
        }

        res.json({message: 'Objek berhasil diverifikasi', data: result.rows[0]});
    } catch (error) {
        console.error('Error verifikasi objek', error);
        res.status(500).json({message: 'Error di server'});
    }
});

// REJECT OBJECT
router.put('/reject/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `
            UPDATE objek_temuan
            SET status_verifikasi = 'rejected'
            WHERE objek_id = $1 RETURNING *
            `,
            [id]
        );
        
        if (result.rows.length === 0){
            return res.status(404).json({message: 'Objek tidak ditemukan!'});
        }

        res.json({message: 'Objek berhasil direject', data: result.rows[0]});
    } catch (error) {
        console.error('Error reject objek', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.delete('/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const {id} = req.params;
        const result = await pool.query(
            "DELETE FROM objek_temuan WHERE objek_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Objek tidak ditemukan'});
        }

        res.json({
            message: 'Objek berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error saat hapus Objek Temuan', error);

        if(error.code == '23503') {
            return res.status(400).json({
                message: 'Objek ini masih punya tabel yang terhubung'
            });
        }

        res.status(500).json({message: 'Error di server.'});
    }
});

module.exports = router;