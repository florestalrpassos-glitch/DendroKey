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

// ... (renderFilters e applyFilters permanecem iguais)

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

    // Feedback visual da foto
    const photoInput = document.getElementById('photo-input');
    photoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            document.getElementById('photo-preview-box').classList.remove('hidden');
        }
    });

    document.getElementById('add-form').onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('btn-save-obs');
        saveBtn.disabled = true;
        saveBtn.textContent = "Salvando...";

        const id = document.getElementById('modal-species-id').value;
        const sp = speciesData.find(s => s.id === id);
        const photoFile = document.getElementById('photo-input').files[0];

        try {
            await saveObservation({
                speciesId: id,
                speciesName: sp.popularNames[0],
                scientificName: sp.scientificName,
                photo: photoFile || null, // Salva o arquivo binário direto
                note: document.getElementById('note-input').value,
                lat: document.getElementById('lat-input').value,
                lng: document.getElementById('lng-input').value,
                timestamp: Date.now()
            });
            alert('Registro salvo!');
            document.getElementById('add-modal').classList.add('hidden');
            document.getElementById('add-form').reset();
            document.getElementById('photo-preview-box').classList.add('hidden');
        } catch (err) {
            alert('Erro ao salvar. Verifique o espaço no celular.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "SALVAR NO CADERNO";
        }
    };

    // Navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(`view-${btn.dataset.target}`).classList.remove('hidden');
            if(btn.dataset.target === 'collection') renderCollection();
        };
    });
}

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    const obs = await getAllObservations();
    grid.innerHTML = obs.length ? '' : '<p style="text-align:center; padding:30px;">Acervo vazio.</p>';

    obs.forEach(o => {
        const card = document.createElement('div');
        card.className = 'card';
        let imgHtml = '<div style="background:#eee; height:150px; display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:#999;">Sem foto registrada</div>';

        if(o.photo) {
            const url = URL.createObjectURL(o.photo);
            imgHtml = `<img src="${url}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">`;
        }

        card.innerHTML = `
            ${imgHtml}
            <div style="display:flex; justify-content:space-between; margin-top:10px;">
                <b>${o.speciesName}</b>
                <button onclick="window.delItem(${o.id})" style="border:none; background:none; color:red;">🗑️</button>
            </div>
            <p style="font-size:0.8rem; color:#444; margin:5px 0;">${o.note}</p>
            <p style="font-size:0.6rem; color:#999;">📍 ${o.lat}, ${o.lng} | 🕒 ${new Date(o.timestamp).toLocaleString()}</p>
        `;
        grid.appendChild(card);
    });
}

// Funções globais para o Modal e Delete
window.openModal = (id) => {
    const sp = speciesData.find(s => s.id === id);
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = sp.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('lat-input').value = pos.coords.latitude;
            document.getElementById('lng-input').value = pos.coords.longitude;
            document.getElementById('gps-status').textContent = "✅ GPS Fixado";
        }, null, {enableHighAccuracy: true});
    }
};

window.delItem = async (id) => { if(confirm('Excluir este registro?')) { await deleteObservation(id); renderCollection(); } };

init();