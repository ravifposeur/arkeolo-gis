// File: proyek_arkeologi_frontend/modules/panel.js

import { getObjekBySitus, getPenelitiBySitus, getArkeolog, postPenelitian } from './api.js';
import { isLoggedIn } from './auth.js';

export async function openSidePanel(situsData) {
    const panel = document.getElementById('side-panel');
    const content = document.getElementById('panel-content');
    
    panel.classList.add('open');
    content.innerHTML = '<div style="padding:40px;text-align:center"><p>Memuat...</p></div>';

    try {
        const [objekList, penelitiList, allArkeolog] = await Promise.all([
            getObjekBySitus(situsData.situs_id),
            getPenelitiBySitus(situsData.situs_id),
            getArkeolog()
        ]);

        let html = `
            <div class="panel-header-hero">
                <span class="badge badge-blue">${situsData.jenis_situs}</span>
                <h1>${situsData.nama_situs}</h1>
                <p class="subtitle">${situsData.nama_kerajaan || 'Era Tidak Diketahui'}</p>
            </div>
            <div class="panel-body">
                <div class="info-section">
                    <div class="info-row"><span class="icon">📍</span><p>${situsData.jalan_dusun}, ${situsData.nama_desa_kelurahan}</p></div>
                    <div class="info-row"><span class="icon">⏳</span><p>Periode: ${situsData.periode_sejarah || '-'}</p></div>
                </div>
                <hr class="divider">
        `;

        html += `<div class="section-title"><h3>Objek Temuan (${objekList.length})</h3></div>`;
        
        if (objekList.length === 0) {
            html += `<p class="empty-state-panel">Belum ada objek.</p>`;
        } else {
            html += `<div class="objek-list">`;
            
            objekList.forEach(obj => {
                let tokohHTML = '';
                if (obj.tokoh_terkait) {
                    tokohHTML = `
                        <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #eee; font-size:12px; color:#2563eb;">
                            <i class="fa-solid fa-user-tag" style="margin-right:5px;"></i> 
                            <strong>Tokoh Terkait:</strong> ${obj.tokoh_terkait}
                        </div>
                    `;
                }

                let transHTML = '';
                if (obj.teks_transliterasi) {
                    transHTML = `<p class="transliterasi">"${obj.teks_transliterasi}"</p>`;
                }

                html += `
                    <div class="objek-card">
                        <div class="objek-header">
                            <h4>${obj.nama_objek}</h4>
                            <span class="badge badge-gray">${obj.jenis_objek}</span>
                        </div>
                        <div class="objek-details">
                            <p><strong>Bahan:</strong> ${obj.bahan}</p>
                            <p><strong>Dimensi:</strong> P${obj.panjang} x L${obj.lebar} x T${obj.tinggi} cm</p>
                            ${transHTML}
                            ${tokohHTML}
                        </div>
                    </div>`;
            });
            html += `</div>`;
        }

        html += `
            <hr class="divider">
            <div class="section-title"><h3>Tim Peneliti</h3></div>
        `;

        if (penelitiList.length > 0) {
            html += `<ul style="padding-left: 20px; margin-top:0; font-size:14px; color:#374151;">`;
            penelitiList.forEach(p => {
                html += `<li style="margin-bottom:5px;"><strong>${p.nama_lengkap}</strong> <br><small style="color:#6b7280">${p.spesialisasi}</small></li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p style="font-size:13px; color:#9ca3af; font-style:italic">Belum ada data peneliti.</p>`;
        }

        if (isLoggedIn()) {
            const arkeologOptions = allArkeolog.map(a => `<option value="${a.arkeolog_id}">${a.nama_lengkap}</option>`).join('');
            
            html += `
                <div class="link-researcher-box">
                    <p class="link-researcher-title">
                        <i class="fa-solid fa-link" style="margin-right:4px;"></i> Hubungkan Peneliti
                    </p>
                    <div class="link-researcher-form">
                        <select id="select-arkeolog-link" class="link-researcher-select">
                            <option value="">Pilih Nama Peneliti</option>
                            ${arkeologOptions}
                        </select>
                        <button id="btn-link-arkeolog" class="btn-primary btn-sm">
                            Simpan
                        </button>
                    </div>
                </div>
            `;

            html += `
                <div class="sticky-footer">
                    <button id="btn-open-add-objek" class="btn-primary-full">+ Lapor Objek Baru</button>
                </div>
            `;
        }

        html += `</div>`; 
        content.innerHTML = html;

        const btnLink = document.getElementById('btn-link-arkeolog');
        if (btnLink) {
            btnLink.addEventListener('click', async () => {
                const arkeologId = document.getElementById('select-arkeolog-link').value;
                if (!arkeologId) return alert("Pilih arkeolog dulu.");
                try {
                    await postPenelitian(situsData.situs_id, parseInt(arkeologId));
                    alert("Arkeolog berhasil ditambahkan!");
                    openSidePanel(situsData); 
                } catch (err) { alert(err.message); }
            });
        }

        const btnAdd = document.getElementById('btn-open-add-objek');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('openObjekModal', { detail: situsData }));
            });
        }

    } catch (error) {
        content.innerHTML = `<div style="padding:20px; color:red">Error: ${error.message}</div>`;
    }
}

export function closeSidePanel() {
    document.getElementById('side-panel').classList.remove('open');
}

export function setupPanelEvents() {
    const btnClose = document.getElementById('btn-close-panel');
    if(btnClose) btnClose.addEventListener('click', closeSidePanel);
}