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
    const query = document.getElementById('search-input').value.toLowerCase().trim();
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

        // Usa placeholder verde se a URL da foto estiver vazia
        const imgUrl = sp.imageUrl || 'https://via.placeholder.com/400x250/2d6a4f/ffffff?text=Sem+Foto';

        card.innerHTML = `
            <img src="${imgUrl}" class="card-img" alt="${sp.popularNames[0]}" loading="lazy">
            <div class="card-body">
                <div class="pop-name">${sp.popularNames[0]}</div>
                <div class="sci-name">${sp.scientificName}</div>
                <div class="traits-box">
                    <span><b>Família:</b> ${sp.family}</span>
                    <span><b>Flor:</b> ${sp.flowerColor || 'N/A'}</span>
                    <span><b>Hábito:</b> ${sp.type}</span>
                    <span><b>Folha:</b> ${sp.leafComposition}</span>
                </div>
                <button class="btn-primary" onclick="window.openModal('${sp.id}')">📷 Registrar</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Lógica de exportação e modal permanecem as mesmas das versões v11/v12
// (Certifique-se de manter as funções saveObservation e exportToCSV aqui)

init();