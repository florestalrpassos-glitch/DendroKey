import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { speciesDataPart3 as part3 } from './db_part3.js';
import { speciesDataPart4 as part4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...part1, ...part2, ...part3, ...part4];

let activeFilters = {
    type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [], spines: []
};

async function init() {
    await initDB();
    renderFilters();
    renderSpecies(speciesData);
    setupEventListeners();
}

function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    document.getElementById('count-badge').textContent = `${list.length} espécies encontradas`;
    grid.innerHTML = '';

    list.forEach(sp => {
        const card = document.createElement('div');
        card.className = 'card';

        // Link de imagem com backup para erro de carregamento
        const imgUrl = sp.imageUrl || 'https://via.placeholder.com/400x250/2d6a4f/ffffff?text=Foto+Indisponível';

        card.innerHTML = `
            <img src="${imgUrl}" class="card-img" alt="${sp.popularNames[0]}" onerror="this.src='https://via.placeholder.com/400x250/2d6a4f/ffffff?text=Erro+no+Link'">
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

                <div class="special-features-box">
                    <b>Destaque:</b> ${sp.specialFeatures}
                </div>

                <button class="btn-primary" onclick="window.openModal('${sp.id}')">📷 Registrar Encontro</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// (Mantenha as funções de Filtros, EventListeners, Exportação e Modal do Reset Técnico anterior)

init();