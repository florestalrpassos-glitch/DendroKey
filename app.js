import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { speciesDataPart3 as part3 } from './db_part3.js';
import { speciesDataPart4 as part4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...part1, ...part2, ...part3, ...part4];
let activeFilters = { type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [], spines: [] };

async function init() {
    await initDB();
    renderFilters();
    renderSpecies(speciesData);
    setupEventListeners();
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    const config = [
        {k:'type', l:'Hábito'}, {k:'flowerColor', l:'Flor'},
        {k:'leafArrangement', l:'Filotaxia'}, {k:'leafComposition', l:'Folha'},
        {k:'exudate', l:'Látex'}, {k:'spines', l:'Espinhos'}
    ];
    container.innerHTML = '';
    config.forEach(conf => {
        const div = document.createElement('div');
        div.innerHTML = `<p style="font-weight:bold; font-size:0.85rem; margin:15px 0 5px;">${conf.l}</p>`;
        const vals = [...new Set(speciesData.map(s => String(s[conf.k] || "N/I")))].sort();
        vals.forEach(v => {
            const b = document.createElement('button');
            b.className = 'filter-btn';
            b.textContent = v === 'true' ? 'Sim' : v === 'false' ? 'Não' : v;
            b.onclick = () => {
                const val = v === 'true' ? true : v === 'false' ? false : v;
                if(activeFilters[conf.k].includes(val)) activeFilters[conf.k] = activeFilters[conf.k].filter(x => x !== val);
                else activeFilters[conf.k].push(val);
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
    const filtered = speciesData.filter(sp => {
        const txt = sp.scientificName.toLowerCase() + sp.popularNames.join().toLowerCase();
        const mTxt = txt.includes(query);
        const mFil = Object.keys(activeFilters).every(k => activeFilters[k].length === 0 || activeFilters[k].includes(sp[k]));
        return mTxt && mFil;
    });
    renderSpecies(filtered);
}

function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    document.getElementById('count-badge').textContent = `${list.length} espécies encontradas`;
    grid.innerHTML = '';
    list.forEach(sp => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${sp.imageUrl || ''}" class="card-img" onerror="this.src='https://via.placeholder.com/400x200/2d6a4f/ffffff?text=Foto+Indisponível'">
            <div class="card-body">
                <div class="pop-name">${sp.popularNames[0]}</div>
                <div class="sci-name">${sp.scientificName}</div>
                <div class="traits-box">
                    <span><b>Família:</b> ${sp.family}</span>
                    <span><b>Hábito:</b> ${sp.type}</span>
                    <span><b>Filotaxia:</b> ${sp.leafArrangement}</span>
                    <span><b>Folha:</b> ${sp.leafComposition}</span>
                    <span><b>Flor:</b> ${sp.flowerColor || 'N/A'}</span>
                    <span><b>Látex:</b> ${sp.exudate}</span>
                    <span><b>Espinho:</b> ${sp.spines ? 'Sim' : 'Não'}</span>
                </div>
                <div class="special-features-box"><b>Destaque:</b> ${sp.specialFeatures}</div>
                <button class="btn-primary" onclick="window.openModal('${sp.id}')">📷 Registrar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    document.getElementById('fab-filter').onclick = () => {
        document.getElementById('filter-sidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    };
    document.getElementById('close-filter').onclick = document.getElementById('overlay').onclick = () => {
        document.getElementById('filter-sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    };
    document.getElementById('search-input').oninput = applyFilters;
    document.getElementById('reset-btn').onclick = () => location.reload();
    document.getElementById('close-modal-btn').onclick = () => document.getElementById('add-modal').classList.add('hidden');
    document.getElementById('btn-export').onclick = exportToCSV;

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
        const sp = speciesData.find(s => s.id === id);
        await saveObservation({
            speciesId: id, speciesName: sp.popularNames[0], scientificName: sp.scientificName,
            note: document.getElementById('note-input').value,
            lat: document.getElementById('lat-input').value, lng: document.getElementById('lng-input').value,
            timestamp: Date.now()
        });
        document.getElementById('add-modal').classList.add('hidden');
        alert('Registro salvo no caderno!');
    };
}

window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    const gpsStatus = document.getElementById('gps-status');
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
    gpsStatus.textContent = "🛰️ Buscando sinal GPS...";
    gpsStatus.style.color = "orange";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('lat-input').value = pos.coords.latitude;
            document.getElementById('lng-input').value = pos.coords.longitude;
            gpsStatus.textContent = `✅ GPS Fixado: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            gpsStatus.style.color = "green";
        }, null, {enableHighAccuracy: true});
    }
};

async function exportToCSV() {
    const data = await getAllObservations();
    if (!data.length) return alert('Acervo vazio.');
    let csv = "\uFEFFID;Popular;Cientifico;Lat;Long;Notas;Data\n";
    data.forEach(o => {
        csv += `${o.speciesId};${o.speciesName};${o.scientificName};${o.lat};${o.lng};${o.note.replace(/;/g,',')};${new Date(o.timestamp).toLocaleString()}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Relatorio_DendroKey.csv";
    link.click();
}

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const obs = await getAllObservations();
    grid.innerHTML = obs.length ? '' : '<p style="text-align:center; padding:50px; color:#999;">Nenhum registro no acervo.</p>';
    obs.forEach(o => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-body">
                <div style="display:flex; justify-content:space-between;">
                    <b>${o.speciesName}</b>
                    <button onclick="window.deleteItem(${o.id})" style="border:none; background:none; color:red;">🗑️</button>
                </div>
                <small>${o.scientificName}</small>
                <div class="traits-box" style="background:#eee; border:none; color:#555;">
                    <span><b>Lat:</b> ${o.lat}</span><span><b>Long:</b> ${o.lng}</span>
                </div>
                <p style="font-size:0.75rem;">${o.note}</p>
                <p style="font-size:0.6rem; color:#999; margin-top:5px;">🕒 ${new Date(o.timestamp).toLocaleString()}</p>
            </div>`;
        grid.appendChild(card);
    });
}

window.deleteItem = async (id) => { if(confirm('Excluir registro?')) { await deleteObservation(id); renderCollection(); } };

init();