import { speciesData as p1 } from './db.js';
import { speciesDataPart2 as p2 } from './db_part2.js';
import { speciesDataPart3 as p3 } from './db_part3.js';
import { speciesDataPart4 as p4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...p1, ...p2, ...p3, ...p4];
let filters = { type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [], spines: [] };

async function start() {
    try {
        await initDB();
        renderFilters();
        renderSpecies(speciesData);
        setupEvents();
    } catch (e) {
        console.error("Erro Crítico:", e);
        alert("Erro ao carregar banco de dados. Recarregue a página.");
    }
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    const keys = [
        {k:'type', l:'Hábito'}, {k:'flowerColor', l:'Flor'}, {k:'leafArrangement', l:'Filotaxia'},
        {k:'leafComposition', l:'Folha'}, {k:'exudate', l:'Exsudato'}, {k:'spines', l:'Espinhos'}
    ];
    container.innerHTML = '';
    keys.forEach(conf => {
        const div = document.createElement('div');
        div.innerHTML = `<p style="font-weight:bold; font-size:0.9rem; margin:15px 0 8px;">${conf.l}</p>`;
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
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    const res = speciesData.filter(s => {
        const txt = (s.scientificName + s.popularNames.join() + s.family).toLowerCase();
        const mTxt = txt.includes(q);
        const mFil = Object.keys(filters).every(k => filters[k].length === 0 || filters[k].includes(s[k]));
        return mTxt && mFil;
    });
    renderSpecies(res);
}

function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    document.getElementById('count-badge').textContent = `${list.length} espécies encontradas`;
    grid.innerHTML = '';
    list.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="pop-name">${s.popularNames[0]}</div>
            <div class="sci-name">${s.scientificName}</div>
            <div class="traits-box">
                <span><b>Família:</b> ${s.family}</span>
                <span><b>Filotaxia:</b> ${s.leafArrangement}</span>
                <span><b>Folha:</b> ${s.leafComposition}</span>
                <span><b>Exsudato:</b> ${s.exudate}</span>
            </div>
            <button class="btn-primary" onclick="window.openRegModal('${s.id}')">📷 Registrar</button>
        `;
        grid.appendChild(card);
    });
}

function setupEvents() {
    document.getElementById('fab-filter').onclick = () => {
        document.getElementById('filter-sidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    };
    document.getElementById('close-filter').onclick = document.getElementById('overlay').onclick = () => {
        document.getElementById('filter-sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    };
    document.getElementById('search-input').oninput = applyFilters;
    document.getElementById('btn-export').onclick = exportData;
    document.getElementById('photo-input').onchange = (e) => {
        if(e.target.files.length > 0) document.getElementById('photo-feedback').classList.remove('hidden');
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
        const saveBtn = document.getElementById('save-obs-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = "Salvando...";

        const id = document.getElementById('modal-species-id').value;
        const sp = speciesData.find(x => x.id === id);
        const photo = document.getElementById('photo-input').files[0];

        try {
            await saveObservation({
                speciesId: id, speciesName: sp.popularNames[0], scientificName: sp.scientificName,
                photo: photo || null,
                note: document.getElementById('note-input').value,
                lat: document.getElementById('lat-input').value, lng: document.getElementById('lng-input').value,
                timestamp: Date.now()
            });
            alert("Sucesso! Registro salvo no caderno.");
            window.closeRegModal();
        } catch (err) {
            alert("Erro ao salvar registro localmente.");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "SALVAR REGISTRO";
        }
    };
}

window.openRegModal = (id) => {
    const s = speciesData.find(x => x.id === id);
    const gps = document.getElementById('gps-status');
    document.getElementById('add-form').reset();
    document.getElementById('photo-feedback').classList.add('hidden');
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = s.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');

    gps.textContent = "🛰️ Buscando GPS...";
    gps.style.color = "orange";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('lat-input').value = pos.coords.latitude;
            document.getElementById('lng-input').value = pos.coords.longitude;
            gps.textContent = `✅ GPS Fixado: ${pos.coords.latitude.toFixed(4)}`;
            gps.style.color = "green";
        }, null, {enableHighAccuracy: true, timeout: 10000});
    }
};

window.closeRegModal = () => document.getElementById('add-modal').classList.add('hidden');

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const obs = await getAllObservations();
    grid.innerHTML = obs.length ? '' : '<p style="text-align:center; padding:50px; color:#999;">O caderno está vazio.</p>';
    obs.forEach(o => {
        const card = document.createElement('div');
        card.className = 'card';
        let imgHtml = o.photo ? `<img src="${URL.createObjectURL(o.photo)}">` : '<div style="background:#eee; height:150px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#999; margin-bottom:10px;">Sem Foto</div>';
        card.innerHTML = `
            ${imgHtml}
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div><b>${o.speciesName}</b><br><small>${o.scientificName}</small></div>
                <button onclick="window.deleteItem(${o.id})" style="border:none; background:none; color:red; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            <p style="font-size:0.8rem; color:#444; margin:10px 0;">${o.note}</p>
            <p style="font-size:0.6rem; color:#999;">📍 ${o.lat}, ${o.lng} | 🕒 ${new Date(o.timestamp).toLocaleString()}</p>
        `;
        grid.appendChild(card);
    });
}

window.deleteItem = async (id) => { if(confirm("Excluir este registro?")) { await deleteObservation(id); renderCollection(); } };

async function exportData() {
    const data = await getAllObservations();
    if(!data.length) return alert("Caderno vazio.");
    let csv = "\uFEFFID;Popular;Cientifico;Lat;Long;Notas;Data\n";
    data.forEach(o => {
        csv += `${o.speciesId};${o.speciesName};${o.scientificName};${o.lat};${o.lng};${o.note.replace(/;/g,',')};${new Date(o.timestamp).toLocaleString()}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Inventario_DendroKey.csv";
    link.click();
}

start();