import { speciesData as p1 } from './db.js';
import { speciesDataPart2 as p2 } from './db_part2.js';
import { speciesDataPart3 as p3 } from './db_part3.js';
import { speciesDataPart4 as p4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...p1, ...p2, ...p3, ...p4];
let filters = { type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [], spines: [] };

function toUTM(lat, lon) {
    const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, lon0 = -45 * Math.PI / 180;
    const latRad = lat * Math.PI / 180, lonRad = lon * Math.PI / 180;
    const e2 = 2 * f - f * f, ep2 = e2 / (1 - e2), N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
    const T = Math.tan(latRad) ** 2, C = ep2 * Math.cos(latRad) ** 2, A = (lonRad - lon0) * Math.cos(latRad);
    const M = a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latRad - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latRad) + (15 * e2 / 256 + 45 * e2 ** 2 / 1024) * Math.sin(4 * latRad) - (35 * e2 ** 3 / 3072) * Math.sin(6 * latRad));
    const east = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
    const north = k0 * (M + N * Math.tan(latRad) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720)) + 10000000;
    return { e: east.toFixed(2), n: north.toFixed(2) };
}

async function start() {
    await initDB();
    renderFilters();
    renderSpecies(speciesData);
    setupEvents();
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    const keys = [{k:'type', l:'Hábito'}, {k:'flowerColor', l:'Flor'}, {k:'leafArrangement', l:'Filotaxia'}, {k:'leafComposition', l:'Folha'}, {k:'exudate', l:'Exsudato'}, {k:'spines', l:'Espinhos'}];
    container.innerHTML = '';
    keys.forEach(conf => {
        const div = document.createElement('div');
        div.innerHTML = `<p style="font-weight:bold; font-size:0.9rem; margin:15px 0 10px;">${conf.l}</p>`;
        const vals = [...new Set(speciesData.map(s => String(s[conf.k] || "N/I")))].sort();
        vals.forEach(v => {
            const b = document.createElement('button');
            b.className = 'filter-btn';
            b.textContent = v === 'true' ? 'Sim' : v === 'false' ? 'Não' : v;
            b.onclick = () => {
                const val = v === 'true' ? true : v === 'false' ? false : v;
                if(filters[conf.k].includes(val)) filters[conf.k] = filters[conf.k].filter(x => x !== val);
                else filters[conf.k].push(val);
                b.classList.toggle('active');
                applyFilters();
            };
            div.appendChild(b);
        });
        container.appendChild(div);
    });
}

function applyFilters() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const result = speciesData.filter(s => {
        const txt = (s.scientificName + s.popularNames.join() + s.family).toLowerCase();
        return txt.includes(query) && Object.keys(filters).every(k => filters[k].length === 0 || filters[k].includes(s[k]));
    });
    renderSpecies(result);
}

function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    document.getElementById('count-badge').textContent = `${list.length} espécies carregadas`;
    grid.innerHTML = '';
    list.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="pop-name">${s.popularNames[0]}</div>
            <div class="sci-name">${s.scientificName}</div>
            <div class="traits-box">
                <span><b>Família:</b> ${s.family}</span><span><b>Hábito:</b> ${s.type}</span>
            </div>
            <button class="btn-primary" onclick="window.openRegModal('${s.id}')">📷 Registrar</button>
        `;
        grid.appendChild(card);
    });
}

function setupEvents() {
    document.getElementById('fab-filter').onclick = () => { document.getElementById('filter-sidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); };
    document.getElementById('close-filter').onclick = document.getElementById('overlay').onclick = () => { document.getElementById('filter-sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('active'); };
    document.getElementById('search-input').oninput = applyFilters;
    document.getElementById('btn-export').onclick = exportToCSV;
    document.getElementById('photo-input').onchange = (e) => { if(e.target.files.length > 0) document.getElementById('photo-feedback').classList.remove('hidden'); };

    document.getElementById('btn-clear-filters').onclick = () => {
        filters = { type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [], spines: [] };
        document.getElementById('search-input').value = '';
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        applyFilters();
    };

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(`view-${btn.dataset.target}`).classList.remove('hidden');
            if(btn.dataset.target === 'collection') renderCollection();
        };
    });

    document.getElementById('add-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-species-id').value;
        const sp = speciesData.find(x => x.id === id);

        await saveObservation({
            speciesId: id, speciesName: sp.popularNames[0], scientificName: sp.scientificName,
            photo: document.getElementById('photo-input').files[0] || null,
            note: document.getElementById('note-input').value,
            dap: document.getElementById('dap-input').value || "0",
            h: document.getElementById('h-input').value || "0",
            lat: document.getElementById('lat-input').value, lng: document.getElementById('lng-input').value,
            utmE: document.getElementById('utm-e-input').value, utmN: document.getElementById('utm-n-input').value,
            timestamp: Date.now()
        });
        alert("Salvo com sucesso!"); window.closeRegModal();
    };
}

window.openRegModal = (id) => {
    const s = speciesData.find(x => x.id === id);
    document.getElementById('add-form').reset();
    document.getElementById('photo-feedback').classList.add('hidden');
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = s.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
    const gps = document.getElementById('gps-status');
    gps.textContent = "🛰️ Buscando UTM..."; gps.style.color = "orange";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const utm = toUTM(pos.coords.latitude, pos.coords.longitude);
            document.getElementById('lat-input').value = pos.coords.latitude;
            document.getElementById('lng-input').value = pos.coords.longitude;
            document.getElementById('utm-e-input').value = utm.e;
            document.getElementById('utm-n-input').value = utm.n;
            gps.textContent = `✅ UTM: E ${utm.e} | N ${utm.n}`; gps.style.color = "green";
        }, null, {enableHighAccuracy: true});
    }
};

window.closeRegModal = () => document.getElementById('add-modal').classList.add('hidden');

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const obs = await getAllObservations();
    grid.innerHTML = obs.length ? '' : '<p style="text-align:center; padding:50px;">Caderno vazio.</p>';
    obs.forEach(o => {
        const info = speciesData.find(s => s.id === o.speciesId);
        const card = document.createElement('div');
        card.className = 'card';
        let img = o.photo ? `<img src="${URL.createObjectURL(o.photo)}">` : '<div style="background:#eee; height:100px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:10px;">Sem Foto</div>';
        card.innerHTML = `
            ${img}
            <b>${o.speciesName}</b><br><small>${o.scientificName}</small>
            <div class="traits-box" style="background:#f9f9f9; color:#444;">
                <span><b>DAP:</b> ${o.dap}cm</span><span><b>H:</b> ${o.h}m</span>
                <span><b>UTM E:</b> ${o.utmE}</span><span><b>UTM N:</b> ${o.utmN}</span>
            </div>
            <p style="font-size:0.8rem; color:#333; margin:5px 0;">${o.note}</p>
        `;
        grid.appendChild(card);
    });
}

async function exportToCSV() {
    const data = await getAllObservations();
    let csv = "\uFEFFID;Popular;Cientifico;DAP_cm;H_m;UTM_E;UTM_N;Notas;Data\n";
    data.forEach(o => { csv += `${o.speciesId};${o.speciesName};${o.scientificName};${o.dap};${o.h};${o.utmE};${o.utmN};${o.note.replace(/;/g,',')};${new Date(o.timestamp).toLocaleString()}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Inventario_DendroKey.csv";
    link.click();
}

start();