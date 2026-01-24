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

// Cards da Busca Principal com Características Visíveis
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

                <div class="traits-box">
                    <span><b>Hábito:</b> ${sp.type}</span>
                    <span><b>Filotaxia:</b> ${sp.leafArrangement}</span>
                    <span><b>Folha:</b> ${sp.leafComposition}</span>
                    <span><b>Exsudato:</b> ${sp.exudate}</span>
                </div>

                <div class="special-features-box">
                    <b>Destaque:</b> ${sp.specialFeatures}
                </div>

                <button class="btn-primary" style="margin-top:10px;" onclick="window.openModal('${sp.id}')">📷 Registrar Encontro</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

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
        grid.innerHTML = '<p style="padding:40px; text-align:center; color:#999;">Caderno vazio.</p>';
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
        const gpsLink = (obs.lat && obs.lng) ? `<a href="https://www.google.com/maps?q=${obs.lat},${obs.lng}" target="_blank" class="maps-link">📍 Ver no Mapa</a>` : `<span class="maps-link" style="color:#ccc;">📍 Sem GPS</span>`;
        card.innerHTML = `
            ${imgTag}
            <div class="card-body">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div><div class="pop-name">${obs.speciesName}</div><div class="sci-name">${obs.scientificName}</div></div>
                    <button class="btn-delete" onclick="window.confirmDelete(${obs.id})">🗑️</button>
                </div>
                <div class="traits-box">
                    <span><b>Hábito:</b> ${info.type}</span>
                    <span><b>Exsudato:</b> ${info.exudate}</span>
                    <span><b>Folha:</b> ${info.leafComposition}</span>
                    <span><b>ID:</b> #${obs.id}</span>
                </div>
                <div class="note-box">${obs.note || 'Sem anotações.'}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <p style="font-size:0.6rem; color:#999;">🕒 ${new Date(obs.timestamp).toLocaleString()}</p>
                    ${gpsLink}
                </div>
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
        await saveObservation({
            speciesId: id, speciesName: sp.popularNames[0], scientificName: sp.scientificName,
            photo: document.getElementById('photo-input').files[0],
            note: document.getElementById('note-input').value,
            lat: document.getElementById('lat-input').value, lng: document.getElementById('lng-input').value
        });
        document.getElementById('add-modal').classList.add('hidden');
        document.getElementById('add-form').reset();
        alert('Registro salvo!');
    };
    document.getElementById('photo-input').onchange = (e) => {
        document.getElementById('photo-preview-text').textContent = e.target.files.length > 0 ? "✅ Foto Capturada" : "Nenhuma foto";
    };
}

window.confirmDelete = async (id) => {
    if (confirm('Excluir este registro?')) { await deleteObservation(id); renderCollection(); }
};

window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    const gpsStatus = document.getElementById('gps-status');
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = "Registrar " + sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
    gpsStatus.textContent = "🛰️ Buscando GPS...";
    gpsStatus.style.color = "orange";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('lat-input').value = pos.coords.latitude;
                document.getElementById('lng-input').value = pos.coords.longitude;
                gpsStatus.textContent = `✅ GPS fixado: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                gpsStatus.style.color = "green";
            },
            () => { gpsStatus.textContent = "❌ GPS não disponível"; gpsStatus.style.color = "red"; },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
};

document.querySelector('.close-modal').onclick = () => document.getElementById('add-modal').classList.add('hidden');

init();