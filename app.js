import { speciesData as part1 } from './db.js';
import { speciesDataPart2 as part2 } from './db_part2.js';
import { speciesDataPart3 as part3 } from './db_part3.js';
import { speciesDataPart4 as part4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...part1, ...part2, ...part3, ...part4];
let activeFilters = { type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [] };

async function init() {
    await initDB();
    renderFilters();
    renderSpecies(speciesData);
    setupEventListeners();
}

// ... (renderFilters e applyFilters permanecem iguais à v23)

function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    document.getElementById('count-badge').textContent = `${list.length} espécies encontradas`;
    grid.innerHTML = '';
    list.forEach(sp => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="pop-name">${sp.popularNames[0]}</div>
            <div class="sci-name">${sp.scientificName}</div>
            <div class="traits-box">
                <span><b>Família:</b> ${sp.family}</span>
                <span><b>Folha:</b> ${sp.leafComposition}</span>
                <span><b>Exsudato:</b> ${sp.exudate}</span>
            </div>
            <button class="btn-primary" onclick="window.openModal('${sp.id}')">📷 Registrar</button>
        `;
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    document.getElementById('fab-filter').onclick = () => { document.getElementById('filter-sidebar').classList.add('open'); document.getElementById('overlay').classList.add('active'); };
    document.getElementById('search-input').oninput = applyFilters;
    document.getElementById('reset-btn').onclick = () => location.reload();
    document.getElementById('close-modal-btn').onclick = () => document.getElementById('add-modal').classList.add('hidden');
    document.getElementById('btn-export').onclick = exportToCSV;

    // Monitora a captura da foto
    document.getElementById('photo-input').onchange = (e) => {
        if(e.target.files.length > 0) document.getElementById('photo-preview').style.display = 'block';
    };

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
        const photoFile = document.getElementById('photo-input').files[0];

        await saveObservation({
            speciesId: id, speciesName: sp.popularNames[0], scientificName: sp.scientificName,
            photo: photoFile, // SALVA O ARQUIVO DA CÂMERA
            note: document.getElementById('note-input').value,
            lat: document.getElementById('lat-input').value, lng: document.getElementById('lng-input').value,
            timestamp: Date.now()
        });
        document.getElementById('add-modal').classList.add('hidden');
        document.getElementById('add-form').reset();
        document.getElementById('photo-preview').style.display = 'none';
        alert('Registro salvo com foto!');
    };
}

window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    const gps = document.getElementById('gps-status');
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('lat-input').value = pos.coords.latitude;
            document.getElementById('lng-input').value = pos.coords.longitude;
            gps.textContent = `✅ GPS Fixado`; gps.style.color = "green";
        }, null, {enableHighAccuracy: true});
    }
};

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const obs = await getAllObservations();
    grid.innerHTML = obs.length ? '' : '<p style="text-align:center; padding:30px;">Vazio.</p>';
    obs.forEach(o => {
        const card = document.createElement('div');
        card.className = 'card';
        let imgHtml = '';
        if(o.photo) {
            const url = URL.createObjectURL(o.photo);
            imgHtml = `<img src="${url}">`;
        }
        card.innerHTML = `
            ${imgHtml}
            <div style="display:flex; justify-content:space-between;">
                <b>${o.speciesName}</b>
                <button onclick="window.delItem(${o.id})" style="border:none; background:none; color:red;">🗑️</button>
            </div>
            <p style="font-size:0.75rem;">${o.note}</p>
        `;
        grid.appendChild(card);
    });
}

window.delItem = async (id) => { if(confirm('Excluir?')) { await deleteObservation(id); renderCollection(); } };

init();