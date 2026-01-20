import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { speciesDataPart3 as part3 } from './db_part3.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...part1, ...part2, ...part3];

let activeFilters = {
    type: [], leafArrangement: [], leafComposition: [], leafMargin: [], exudate: [], spines: []
};

async function init() {
    await initDB();
    renderFilters();
    renderSpecies(speciesData);
    setupEventListeners();
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    const filterConfig = [
        { key: 'type', label: 'Hábito' },
        { key: 'leafArrangement', label: 'Filotaxia' },
        { key: 'leafComposition', label: 'Tipo de Folha' },
        { key: 'leafMargin', label: 'Margem' },
        { key: 'exudate', label: 'Exsudato' },
        { key: 'spines', label: 'Espinhos' }
    ];

    container.innerHTML = '';
    filterConfig.forEach(conf => {
        const group = document.createElement('div');
        group.className = 'filter-group';
        group.innerHTML = `<p style="font-weight:bold; font-size:0.85rem; margin-bottom:5px;">${conf.label}</p>`;

        const values = [...new Set(speciesData.map(s => String(s[conf.key])))].sort();
        values.forEach(val => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = val === 'true' ? 'Sim' : val === 'false' ? 'Não' : val;
            btn.onclick = () => {
                const actualVal = val === 'true' ? true : val === 'false' ? false : val;
                if (activeFilters[conf.key].includes(actualVal)) {
                    activeFilters[conf.key] = activeFilters[conf.key].filter(v => v !== actualVal);
                    btn.classList.remove('active');
                } else {
                    activeFilters[conf.key].push(actualVal);
                    btn.classList.add('active');
                }
                applyFilters();
            };
            group.appendChild(btn);
        });
        container.appendChild(group);
    });
}

function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const filtered = speciesData.filter(sp => {
        const matchesText = sp.scientificName.toLowerCase().includes(query) ||
                            sp.popularNames.some(p => p.toLowerCase().includes(query));

        const matchesFilters = Object.keys(activeFilters).every(key => {
            if (activeFilters[key].length === 0) return true;
            return activeFilters[key].includes(sp[key]);
        });

        return matchesText && matchesFilters;
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
            <div class="card-body">
                <p style="color:var(--primary); font-weight:bold; font-size:0.7rem; text-transform:uppercase;">${sp.family}</p>
                <div class="pop-name">${sp.popularNames[0]}</div>
                <div class="sci-name">${sp.scientificName}</div>
                <button class="btn-primary" onclick="window.openModal('${sp.id}')">📷 Registrar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function exportToCSV() {
    const data = await getAllObservations();
    if (data.length === 0) return alert('Acervo vazio.');

    let csvContent = "\uFEFF";
    csvContent += "ID;Nome Popular;Nome Cientifico;Habito;Folha;Arranjo;Exsudato;Notas;Data\n";

    data.forEach(obs => {
        const info = speciesData.find(s => s.id === obs.speciesId);
        const row = [
            obs.speciesId, obs.speciesName, obs.scientificName,
            info.type, info.leafComposition, info.leafArrangement, info.exudate,
            (obs.note || "").replace(/;/g, ','),
            new Date(obs.timestamp).toLocaleString()
        ];
        csvContent += row.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DendroKey_Relatorio_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const observations = await getAllObservations();
    grid.innerHTML = '';

    if (observations.length === 0) {
        grid.innerHTML = '<p style="padding:40px; text-align:center; color:#999;">Acervo vazio.</p>';
        return;
    }

    observations.forEach(obs => {
        const info = speciesData.find(s => s.id === obs.speciesId);
        const card = document.createElement('div');
        card.className = 'card';
        let imgTag = '<div style="height:180px; background:#ddd; display:flex; align-items:center; justify-content:center;">Sem Foto</div>';
        if (obs.photo) {
            const imgUrl = URL.createObjectURL(obs.photo);
            imgTag = `<img src="${imgUrl}">`;
        }

        card.innerHTML = `
            ${imgTag}
            <div class="card-body">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div><div class="pop-name">${obs.speciesName}</div><div class="sci-name">${obs.scientificName}</div></div>
                    <button class="btn-delete" onclick="window.confirmDelete(${obs.id})">🗑️</button>
                </div>
                <div class="traits-box">
                    <span><b>Hábito:</b> ${info.type}</span>
                    <span><b>Folha:</b> ${info.leafComposition}</span>
                    <span><b>Arranjo:</b> ${info.leafArrangement}</span>
                    <span><b>Exsudato:</b> ${info.exudate}</span>
                </div>
                <div class="note-box">${obs.note || 'Sem notas.'}</div>
                <p style="font-size:0.65rem; color:#999; margin-top:8px;">🕒 ${new Date(obs.timestamp).toLocaleString()}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    const fab = document.getElementById('fab-filter');
    const sidebar = document.getElementById('filter-sidebar');
    const overlay = document.getElementById('overlay');

    fab.onclick = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };
    document.getElementById('close-filter').onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('btn-export').onclick = exportToCSV;
    document.getElementById('reset-btn').onclick = () => {
        activeFilters = { type: [], leafArrangement: [], leafComposition: [], leafMargin: [], exudate: [], spines: [] };
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
            if (btn.dataset.target === 'collection') renderCollection();
        };
    });

    document.getElementById('add-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-species-id').value;
        const sp = speciesData.find(s => s.id === id);
        const photo = document.getElementById('photo-input').files[0];
        const note = document.getElementById('note-input').value;
        await saveObservation({ speciesId: id, speciesName: sp.popularNames[0], scientificName: sp.scientificName, photo: photo, note: note });
        document.getElementById('add-modal').classList.add('hidden');
        document.getElementById('add-form').reset();
        alert('Salvo!');
    };

    document.getElementById('photo-input').onchange = (e) => {
        document.getElementById('photo-preview-text').textContent = e.target.files.length > 0 ? "✅ Foto anexada" : "Nenhuma foto";
    };
}

window.confirmDelete = async (id) => {
    if (confirm('Excluir permanentemente?')) { await deleteObservation(id); renderCollection(); }
};

window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
};

document.querySelector('.close-modal').onclick = () => document.getElementById('add-modal').classList.add('hidden');

init();