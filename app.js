import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { initDB, saveObservation, getAllObservations } from './collection.js';

const speciesData = [...part1, ...part2];

let activeFilters = {
    type: [],
    leafArrangement: [],
    leafComposition: [],
    leafMargin: [],
    exudate: [],
    spines: []
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
        group.innerHTML = `<p style="font-weight:bold; font-size:0.85rem; margin-bottom:5px; color:#2c3e50;">${conf.label}</p>`;

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
    const query = document.getElementById('search-input').value.toLowerCase();
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
                <button class="btn-primary" onclick="window.openModal('${sp.id}')">📷 Registrar Encontro</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// EXPORTAR PARA CSV (EXCEL)
async function exportToCSV() {
    const data = await getAllObservations();
    if (data.length === 0) return alert('Nenhum dado para exportar.');

    let csvContent = "\uFEFF"; // Garante acentuação correta no Excel
    csvContent += "ID;Nome Popular;Nome Cientifico;Anotacoes;Data;Hora\n";

    data.forEach(obs => {
        const dateObj = new Date(obs.timestamp);
        const row = [
            obs.speciesId,
            obs.speciesName,
            obs.scientificName,
            obs.note.replace(/;/g, ','), // Evita quebrar colunas
            dateObj.toLocaleDateString(),
            dateObj.toLocaleTimeString()
        ];
        csvContent += row.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `DendroKey_Export_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const observations = await getAllObservations();
    grid.innerHTML = '';

    if (observations.length === 0) {
        grid.innerHTML = '<p style="padding:20px; text-align:center; color:#95a5a6;">Seu caderno de campo está vazio.</p>';
        return;
    }

    observations.forEach(obs => {
        const card = document.createElement('div');
        card.className = 'card';
        let imgTag = '<div style="height:180px; background:#ddd; display:flex; align-items:center; justify-content:center; color:#7f8c8d;">Sem Foto</div>';
        if (obs.photo) {
            const imgUrl = URL.createObjectURL(obs.photo);
            imgTag = `<img src="${imgUrl}">`;
        }
        card.innerHTML = `
            ${imgTag}
            <div class="card-body">
                <div class="pop-name">${obs.speciesName}</div>
                <div class="sci-name">${obs.scientificName}</div>
                <div style="background:#f1f1f1; padding:8px; border-radius:5px; margin:5px 0; font-size:0.85rem;">${obs.note || 'Sem notas.'}</div>
                <p style="font-size:0.7rem; color:#95a5a6;">📅 ${new Date(obs.timestamp).toLocaleString()}</p>
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
    document.getElementById('btn-export').onclick = exportToCSV;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
            btn.classList.add('active');
            const target = document.getElementById(`view-${btn.dataset.target}`);
            target.classList.remove('hidden');
            if (btn.dataset.target === 'collection') renderCollection();
        };
    });

    document.getElementById('add-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-species-id').value;
        const sp = speciesData.find(s => s.id === id);
        const photo = document.getElementById('photo-input').files[0];
        const note = document.getElementById('note-input').value;

        await saveObservation({
            speciesId: id,
            speciesName: sp.popularNames[0],
            scientificName: sp.scientificName,
            photo: photo,
            note: note
        });

        alert('Salvo no Caderno de Campo!');
        document.getElementById('add-modal').classList.add('hidden');
        document.getElementById('add-form').reset();
        document.getElementById('photo-preview-text').textContent = "Nenhuma foto selecionada";
    };

    document.getElementById('photo-input').onchange = (e) => {
        const text = document.getElementById('photo-preview-text');
        if (e.target.files.length > 0) {
            text.textContent = "✅ Foto capturada: " + e.target.files[0].name;
            text.style.color = "green";
        }
    };

    document.getElementById('reset-btn').onclick = () => location.reload();
}

window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = "Registrar: " + sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
};

document.querySelector('.close-modal').onclick = () => document.getElementById('add-modal').classList.add('hidden');

init();