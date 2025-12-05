const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { createSitusSchema, updateSitusSchema, paramsIdSchema } = require('../validators/situs.validator');

router.get('/verified', async (req, res) => {
    try {
        const verifiedQuery = `
            SELECT 
                s.situs_id, 
                s.nama_situs, 
                s.latitude, 
                s.longitude, 
                s.jenis_situs,
                s.jalan_dusun,
                k.nama_kerajaan,
                d.nama_desa_kelurahan,
                kec.nama_kecamatan,
                kot.nama_kota_kabupaten,
                -- Menggabungkan nama tokoh terkait (dari objek)
                STRING_AGG(DISTINCT t.nama_tokoh, ', ') as tokoh_terkait,
                -- Menggabungkan nama peneliti terkait (dari penelitian_situs)
                STRING_AGG(DISTINCT a.nama_lengkap, ', ') as peneliti_terkait
            FROM 
                situs_arkeologi s
            LEFT JOIN kerajaan k ON s.kerajaan_id = k.kerajaan_id
            LEFT JOIN desa_kelurahan d ON s.desa_kelurahan_id = d.desa_kelurahan_id
            LEFT JOIN kecamatan kec ON d.kecamatan_id = kec.kecamatan_id
            LEFT JOIN kota_kabupaten kot ON kec.kota_kabupaten_id = kot.kota_kabupaten_id
            -- Join ke Tokoh via Objek
            LEFT JOIN objek_temuan o ON s.situs_id = o.situs_id
            LEFT JOIN atribusi_artefak aa ON o.objek_id = aa.objek_id
            LEFT JOIN tokoh t ON aa.tokoh_id = t.tokoh_id
            -- Join ke Arkeolog via Penelitian
            LEFT JOIN penelitian_situs ps ON s.situs_id = ps.situs_id
            LEFT JOIN arkeolog a ON ps.arkeolog_id = a.arkeolog_id
            WHERE 
                s.status_verifikasi = 'verified'
            GROUP BY 
                s.situs_id, k.nama_kerajaan, d.nama_desa_kelurahan, kec.nama_kecamatan, kot.nama_kota_kabupaten
        `;

        const situsVerified = await pool.query(verifiedQuery);
        res.json(situsVerified.rows);
    
    } catch (error) {
        console.error('Error saat ambil situs terverifikasi', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.post('/', 
    authenticateToken, 
    validate({ body: createSitusSchema }), 
    async (req, res) => {
    
    try {
        const {
            nama_situs, jalan_dusun, desa_kelurahan_id,
            latitude, longitude, periode_sejarah,
            jenis_situs, kerajaan_id
        } = req.body;

        const penggunaPelaporID = req.user.id;

        const userRole = req.user.role;
        const initialStatus = (userRole === 'administrator' || userRole === 'verifikator') 
            ? 'verified' 
            : 'pending';

        const insertQuery = `
            INSERT INTO situs_arkeologi 
                (nama_situs, jalan_dusun, desa_kelurahan_id, 
                latitude, longitude, periode_sejarah, jenis_situs, kerajaan_id, 
                status_verifikasi, pengguna_pelapor_id) 
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *
        `;

        const params = [
            nama_situs, jalan_dusun, desa_kelurahan_id,
            latitude, longitude, periode_sejarah, jenis_situs, kerajaan_id,
            initialStatus, penggunaPelaporID   
        ];

        const situsBaru = await pool.query(insertQuery, params);

        res.status(201).json({
            message: initialStatus === 'verified' 
                ? 'Situs berhasil ditambahkan dan terverifikasi otomatis.' 
                : 'Situs baru berhasil ditambahkan dan butuh verifikasi.',
            data: situsBaru.rows[0]
        });

    } catch (error) {
        console.error('Error saat menambah situs baru', error);
        res.status(500).json({ message: 'Error di server' });
    }
});

router.get('/pending', authenticateToken, isVerifier, async (req, res) => {
    try {
        const pendingQuery = `
            SELECT 
                s.situs_id, 
                s.nama_situs, 
                s.latitude, 
                s.longitude, 
                s.jenis_situs,
                s.jalan_dusun,
                s.status_verifikasi, 
                s.pengguna_pelapor_id,
                
                -- Info Wilayah
                d.nama_desa_kelurahan,
                kec.nama_kecamatan,
                kot.nama_kota_kabupaten,

                -- Info Kerajaan & Statusnya
                k.nama_kerajaan,
                k.status_validasi as status_kerajaan,

                -- Info Peneliti & Statusnya
                STRING_AGG(DISTINCT a.nama_lengkap || ' (' || a.status_validasi || ')', ', ') as info_peneliti

            FROM situs_arkeologi s
            LEFT JOIN kerajaan k ON s.kerajaan_id = k.kerajaan_id
            LEFT JOIN desa_kelurahan d ON s.desa_kelurahan_id = d.desa_kelurahan_id
            LEFT JOIN kecamatan kec ON d.kecamatan_id = kec.kecamatan_id
            LEFT JOIN kota_kabupaten kot ON kec.kota_kabupaten_id = kot.kota_kabupaten_id
            
            LEFT JOIN penelitian_situs ps ON s.situs_id = ps.situs_id
            LEFT JOIN arkeolog a ON ps.arkeolog_id = a.arkeolog_id

            WHERE s.status_verifikasi = 'pending'
            
            GROUP BY 
                s.situs_id, k.nama_kerajaan, k.status_validasi, 
                d.nama_desa_kelurahan, kec.nama_kecamatan, kot.nama_kota_kabupaten
            
            ORDER BY s.situs_id ASC
        `;
        
        const situsPending = await pool.query(pendingQuery);
        res.json(situsPending.rows);

    } catch (error) {
        console.error('Error saat ambil situs pending:', error);
        res.status(500).json({message : 'Terjadi error di server.'});
    }
});

router.put('/approve/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); 

        const { id } = req.params;

        const updateSitus = await client.query(
            `UPDATE situs_arkeologi SET status_verifikasi = 'verified' WHERE situs_id = $1 RETURNING *`,
            [id]
        );

        if (updateSitus.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message : 'Situs tak ditemukan'});
        }
        const situsData = updateSitus.rows[0];

        if (situsData.kerajaan_id) {
            await client.query(
                `UPDATE kerajaan SET status_validasi = 'verified' 
                 WHERE kerajaan_id = $1 AND status_validasi = 'pending'`,
                [situsData.kerajaan_id]
            );
        }

        await client.query(
            `UPDATE arkeolog SET status_validasi = 'verified'
             WHERE arkeolog_id IN (SELECT arkeolog_id FROM penelitian_situs WHERE situs_id = $1)
             AND status_validasi = 'pending'`,
            [id]
        );

        await client.query('COMMIT');
        res.json({ message: 'Situs (dan data baru terkait) berhasil diverifikasi!', data: situsData });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat verifikasi situs:', error);
        res.status(500).json({message: 'Terjadi error di server!'});
    } finally {
        client.release();
    }
});

router.put('/reject/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;

        const updateSitus = await client.query(
            "UPDATE situs_arkeologi SET status_verifikasi = 'rejected' WHERE situs_id = $1 RETURNING *",
            [id]
        );
        
        if (updateSitus.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Situs tidak ditemukan.' });
        }
        const situsData = updateSitus.rows[0];

        if (situsData.kerajaan_id) {
            await client.query(
                `UPDATE kerajaan SET status_validasi = 'rejected' 
                 WHERE kerajaan_id = $1 AND status_validasi = 'pending'
                 AND NOT EXISTS (SELECT 1 FROM situs_arkeologi WHERE kerajaan_id = $1 AND situs_id != $2)`,
                [situsData.kerajaan_id, id]
            );
        }

        const relasiPenelitian = await client.query("SELECT arkeolog_id FROM penelitian_situs WHERE situs_id = $1", [id]);
        
        for (let row of relasiPenelitian.rows) {
            await client.query(
                `UPDATE arkeolog SET status_validasi = 'rejected'
                 WHERE arkeolog_id = $1 AND status_validasi = 'pending'
                 AND NOT EXISTS (SELECT 1 FROM penelitian_situs WHERE arkeolog_id = $1 AND situs_id != $2)`,
                [row.arkeolog_id, id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Situs ditolak. Data terkait dibersihkan jika tidak digunakan situs lain.', data: situsData });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat menolak situs:', error);
        res.status(500).json({ message: 'Error server' });
    } finally {
        client.release();
    }
});

router.delete('/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    
    try {
        const { id } = req.params;
        const result = await pool.query(
            "DELETE FROM situs_arkeologi WHERE situs_id = $1 RETURNING *", 
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Situs tidak ditemukan' });
        }
        res.json({ message: 'Situs berhasil dihapus', data: result.rows[0] });
    } catch (error) {
        console.error('Error saat hapus situs:', error);
        if (error.code === '23503') { 
            return res.status(400).json({ 
                message: 'Gagal hapus: Situs ini masih memiliki Objek Temuan yang terhubung. Hapus objek temuannya terlebih dahulu.' 
            });
        }
        res.status(500).json({ message: 'Error server' });
    }
});

module.exports = router;