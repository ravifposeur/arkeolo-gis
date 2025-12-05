const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { tokohSchema, paramsIdSchema } = require('../validators/tokoh.validator');

router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT t.*, k.nama_kerajaan 
            FROM tokoh t
            LEFT JOIN kerajaan k ON t.kerajaan_id = k.kerajaan_id
            WHERE t.status_validasi = 'verified'
            ORDER BY t.nama_tokoh ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.get('/:id', validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT t.*, k.nama_kerajaan 
             FROM tokoh t
             LEFT JOIN kerajaan k ON t.kerajaan_id = k.kerajaan_id
             WHERE t.tokoh_id = $1`, 
             [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tokoh tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error ambil tokoh by id:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.post('/', 
    authenticateToken, 
    validate({ body: tokohSchema }), 
    async (req, res) => {
    try {
        const { nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id } = req.body;
        
        const userRole = req.user.role;
        const initialStatus = (userRole === 'administrator' || userRole === 'verifikator') 
            ? 'verified' 
            : 'pending';

        const result = await pool.query(
            `INSERT INTO tokoh (nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id, status_validasi) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id, initialStatus]
        );
        res.status(201).json({ message: 'Tokoh berhasil dibuat', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.put('/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema, body: tokohSchema }), async (req, res) => {
    try {
        const {id} = req.params;
        const { nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id } = req.body;

        const result = await pool.query(
            `UPDATE tokoh SET nama_tokoh = $1, tahun_lahir = $2,
            tahun_wafat = $3, biografi_singkat = $4, kerajaan_id = $5
            WHERE tokoh_id =  $6 RETURNING *
            `,
            [ nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id, id ]
        );

        if (result.rows.length === 0){
            return res.status(404).json({message: 'Tokoh tidak ditemukan'});
        }

        res.json({message: 'Tokoh berhasil diupdate', data: result.rows[0]});
    } catch (error) {
        console.error('Error ketika post tokoh', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.delete('/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req,res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM tokoh WHERE tokoh_id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Tokoh tidak ditemukan'});
        }

        res.json({
            message: 'Tokoh berhasil dihapus',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error saat Delete Tokoh', error);
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Gagal hapus: Tokoh ini masih dipakai oleh data Situs.' });
        }
        res.status(500).json({message: 'Error di Server'});
    }
});

module.exports = router;