import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { speciesDataPart3 as part3 } from './db_part3.js';
import { speciesDataPart4 as part4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...part1, ...part2, ...part3, ...part4];
let activeFilters = { type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [] };

async function init() {
    try {
        await initDB();
        renderFilters();
        renderSpecies(speciesData);
        setupEventListeners();
    } catch (e) { console.error("Erro na inicialização:", e); }
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    const keys = [
        {k:'type', l:'Hábito'}, {k:'flowerColor', l:'Flor'},
        {k:'leafArrangement', l:'Filotaxia'}, {k:'leafComposition', l:'Folha'}
    ];
    container.innerHTML = '';
    keys.forEach(conf => {
        const div = document.createElement('div');
        div.innerHTML = `<p style="font-weight:bold; font-size:0.8rem; margin:10px 0 5px;">${conf.l}</p>`;
        const vals = [...new Set(speciesData.map(s => String(s[conf.k] || "N/I")))].sort();
        vals.forEach(v => {
            const b = document.createElement('button');
            b.className = 'filter-btn';
            b.textContent = v;
            b.onclick = () => {
                if(activeFilters[conf.k].includes(v)) activeFilters[conf.k] = activeFilters[conf.k].filter(x => x !== v);
                else activeFilters[conf.k].push(v);
                b.classList.toggle('active');
                applyFilters();
            };
            div.appendChild(b);
        });
        container.appendChild(div);
    });
}

function applyFilters() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = speciesData.filter(sp => {
        const txt = sp.scientificName.toLowerCase() + sp.popularNames.join().toLowerCase();
        const mTxt = txt.includes(query);
        const mFil = Object.keys(activeFilters).every(k => activeFilters[k].length === 0 || activeFilters[k].includes(String(sp[k])));
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
            <img src="${sp.imageUrl || ''}" class="card-img" onerror="this.src='https://via.placeholder.com/300x150?text=S/Foto'">
            <div class="card-body">
                <div class="pop-name">${sp.popularNames[0]}</div>
                <div class="sci-name">${sp.scientificName}</div>
                <div class="traits-box">
                    <span><b>Família:</b> ${sp.family}</span>
                    <span><b>Hábito:</b> ${sp.type}</span>
                </div>
                <button class="btn-primary reg-btn" data-id="${sp.id}">📷 Registrar</button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Evento de clique nos botões de registro
    document.querySelectorAll('.reg-btn').forEach(btn => {
        btn.onclick = () => window.openModal(btn.dataset.id);
    });
}

function setupEventListeners() {
    document.getElementById('fab-filter').onclick = () => {
        document.getElementById('filter-sidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    };
    document.getElementById('close-filter').onclick = () => {
        document.getElementById('filter-sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    };
    document.getElementById('search-input').oninput = applyFilters;
    document.getElementById('close-modal-btn').onclick = () => document.getElementById('add-modal').classList.add('hidden');

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
            lat: document.getElementById('lat-input').value, lng: document.getElementById('lng-input').value
        });
        document.getElementById('add-modal').classList.add('hidden');
        alert('Salvo com sucesso!');
    };
}

window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('lat-input').value = pos.coords.latitude;
            document.getElementById('lng-input').value = pos.coords.longitude;
            document.getElementById('gps-status').textContent = "✅ GPS OK";
        }, null, {enableHighAccuracy: true});
    }
};

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const obs = await getAllObservations();
    grid.innerHTML = obs.length ? '' : '<p style="text-align:center; padding:20px;">Vazio.</p>';
    obs.forEach(o => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="card-body"><b>${o.speciesName}</b><br><small>${o.note}</small></div>`;
        grid.appendChild(card);
    });
}

init();