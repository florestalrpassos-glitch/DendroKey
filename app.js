import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { speciesDataPart3 as part3 } from './db_part3.js';
import { speciesDataPart4 as part4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

// Unificação de todas as 600 espécies
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

// ... (Restante da lógica de renderFilters e applyFilters que já configuramos)

function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    // Este contador agora deve exibir "600 espécies encontradas"
    document.getElementById('count-badge').textContent = `${list.length} espécies encontradas`;
    grid.innerHTML = '';
    list.forEach(sp => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
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

// (Mantenha as funções de exportToCSV, renderCollection e setupEventListeners anteriores)

init();