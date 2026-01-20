import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';

// Combina as duas partes em uma única lista de 400 espécies
const speciesData = [...part1, ...part2];

// Estado do Aplicativo
let activeFilters = {
    type: [],
    leafArrangement: [],
    leafComposition: [],
    leafMargin: [],
    exudate: []
};

// Inicialização
function init() {
    renderFilters();
    renderSpecies(speciesData);
    setupTabs();
    setupCameraPreview();

    // Evento de busca por texto
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            applyFilters(e.target.value.toLowerCase());
        });
    }

    // Botão de reset
    document.getElementById('reset-btn').addEventListener('click', resetFilters);
}

// Renderiza os filtros dinamicamente com base nos dados existentes
function renderFilters() {
    const container = document.getElementById('filter-container');
    const filterKeys = [
        { key: 'leafArrangement', label: 'Filotaxia' },
        { key: 'leafComposition', label: 'Tipo de Folha' },
        { key: 'exudate', label: 'Exsudato' }
    ];

    filterKeys.forEach(conf => {
        const uniqueValues = [...new Set(speciesData.map(s => s[conf.key]))];

        const filterGroup = document.createElement('div');
        filterGroup.innerHTML = `<p style="font-weight:bold; margin: 10px 0 5px;">${conf.label}</p>`;

        uniqueValues.forEach(val => {
            const btn = document.createElement('button');
            btn.textContent = val;
            btn.style.cssText = "margin: 2px; padding: 5px 10px; border-radius: 15px; border: 1px solid #2d6a4f; background: white; cursor: pointer;";

            btn.onclick = () => {
                if (activeFilters[conf.key].includes(val)) {
                    activeFilters[conf.key] = activeFilters[conf.key].filter(v => v !== val);
                    btn.style.background = "white";
                    btn.style.color = "black";
                } else {
                    activeFilters[conf.key].push(val);
                    btn.style.background = "#2d6a4f";
                    btn.style.color = "white";
                }
                applyFilters();
            };
            filterGroup.appendChild(btn);
        });
        container.appendChild(filterGroup);
    });
}

// Lógica de Filtragem
function applyFilters(textQuery = "") {
    const filtered = speciesData.filter(sp => {
        const matchesText = sp.scientificName.toLowerCase().includes(textQuery) ||
                            sp.popularNames.some(p => p.toLowerCase().includes(textQuery));

        const matchesFilters = Object.keys(activeFilters).every(key => {
            if (activeFilters[key].length === 0) return true;
            return activeFilters[key].includes(sp[key]);
        });

        return matchesText && matchesFilters;
    });
    renderSpecies(filtered);
}

// Renderiza os Cards na Tela
function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    const badge = document.getElementById('count-badge');
    grid.innerHTML = '';
    badge.textContent = `${list.length} espécie(s)`;

    list.forEach(sp => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-body">
                <div class="pop-name">${sp.popularNames[0]}</div>
                <div class="sci-name">${sp.scientificName}</div>
                <p style="font-size:0.85rem; margin-top:5px;">${sp.description}</p>
                <button class="btn-primary" style="margin-top:10px;" onclick="window.openModal('${sp.id}')">
                    📷 Registrar Encontro
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Lógica da Câmera (Preview)
function setupCameraPreview() {
    const photoInput = document.getElementById('photo-input');
    const previewText = document.getElementById('photo-preview-text');

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                previewText.textContent = "✅ Foto capturada: " + e.target.files[0].name;
                previewText.style.color = "#1b4332";
            }
        });
    }
}

// Funções Globais para o Modal
window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    document.getElementById('modal-species-name').textContent = sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
};

document.querySelector('.close-modal').onclick = () => {
    document.getElementById('add-modal').classList.add('hidden');
};

function setupTabs() {
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(btn => {
        btn.onclick = () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Lógica de troca de aba aqui (simplificada para este exemplo)
        };
    });
}

function resetFilters() {
    activeFilters = { type: [], leafArrangement: [], leafComposition: [], leafMargin: [], exudate: [] };
    location.reload(); // Forma mais simples de resetar tudo
}

init();