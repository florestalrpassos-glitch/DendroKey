import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { speciesDataPart3 as part3 } from './db_part3.js';
import { speciesDataPart4 as part4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...part1, ...part2, ...part3, ...part4];

let activeFilters = {
    type: [], leafArrangement: [], leafComposition: [], flowerColor: [], exudate: [], spines: []
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
        { key: 'flowerColor', label: 'Cor da Flor' },
        { key: 'leafArrangement', label: 'Filotaxia' },
        { key: 'leafComposition', label: 'Tipo de Folha' },
        { key: 'exudate', label: 'Exsudato' },
        { key: 'spines', label: 'Espinhos' }
    ];

    container.innerHTML = '';
    filterConfig.forEach(conf => {
        const group = document.createElement('div');
        group.className = 'filter-group';
        group.innerHTML = `<p style="font-weight:bold; font-size:0.85rem; margin-bottom:5px;">${conf.label}</p>`;
        const values = [...new Set(speciesData.map(s => String(s[conf.key] || "Não Informado")))].sort();
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
        const imgUrl = sp.imageUrl || 'https://via.placeholder.com/400x250/2d6a4f/ffffff?text=Foto+Indisponível';

        card.innerHTML = `
            <img src="${imgUrl}" class="card-img" alt="${sp.popularNames[0]}" onerror="this.src='https://via.placeholder.com/400x250/2d6a4f/ffffff?text=Erro+ao+Carregar'">
            <div class="card-body">
                <div class="pop-name">${sp.popularNames[0]}</div>
                <div class="sci-name">${sp.scientificName}</div>
                <div class="traits-box">
                    <span><b>Família:</b> ${sp.family}</span>
                    <span><b>Hábito:</b> ${sp.type}</span>
                    <span><b>Filotaxia:</b> ${sp.leafArrangement}</span>
                    <span><b>Folha:</b> ${sp.leafComposition}</span>
                    <span><b>Flor:</b> ${sp.flowerColor || 'N/A'}</span>
                    <span><b>Exsudato:</b> ${sp.exudate}</span>
                </div>
                <div class="special-features-box"><b>Destaque:</b> ${sp.specialFeatures}</div>
                <button class="btn-primary" onclick="window.openModal('${sp.id}')">📷 Registrar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// FUNÇÕES DE CADERNO DE CAMPO
async function exportToCSV() {
    const data = await getAllObservations();
    if (data.length === 0) return alert('Acervo vazio.');
    let csvContent = "\uFEFF";
    csvContent += "ID;Nome Popular;Nome Cientifico;Lat;Long;Notas;Data;Hora\n";
    data.forEach(obs => {
        const row = [obs.speciesId, obs.speciesName, obs.scientificName, obs.lat || "S/GPS", obs.lng || "S/GPS", (obs.note || "").replace(/;/g, ','), new Date(obs.timestamp).toLocaleDateString(), new Date(obs.timestamp).toLocaleTimeString()];
        csvContent += row.join(";") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_DendroKey_${new Date().getTime()}.csv`;
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
                    <span><b>Família:</b> ${info.family}</span>
                    <span><b>Hábito:</b> ${info.type}</span>
                    <span><b>ID:</b> #${obs.speciesId}</span>
                </div>
                <div class="note-box">${obs.note || 'Sem anotações.'}</div>
                <p style="font-size:0.6rem; color:#999; margin-top:10px;">🕒 ${new Date(obs.timestamp).toLocaleString()}</p>
            </div>
        `;
        grid.appendChild(card);