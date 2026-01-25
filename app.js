import { speciesData as p1 } from './db.js';
import { speciesDataPart2 as p2 } from './db_part2.js';
import { speciesDataPart3 as p3 } from './db_part3.js';
import { speciesDataPart4 as p4 } from './db_part4.js';
import { initDB, saveObservation, getAllObservations, deleteObservation } from './collection.js';

const speciesData = [...p1, ...p2, ...p3, ...p4];
let filters = { type: [], flowerColor: [], leafArrangement: [], leafComposition: [], exudate: [], spines: [] };

async function bootstrap() {
    try {
        console.log("Iniciando DendroKey PRO com 600 espécies...");
        await initDB();
        renderFilters();
        renderSpecies(speciesData);
        setupGlobalEvents();
    } catch (err) {
        console.error("Falha na inicialização:", err);
        alert("Erro técnico detectado. Por favor, limpe o cache do seu navegador e recarregue.");
    }
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    if (!container) return;
    const keys = [
        {k:'type', l:'Hábito'}, {k:'flowerColor', l:'Flor'}, {k:'leafArrangement', l:'Filotaxia'},
        {k:'leafComposition', l:'Folha'}, {k:'exudate', l:'Exsudato'}, {k:'spines', l:'Espinhos'}
    ];
    container.innerHTML = '';
    keys.forEach(conf => {
        const div = document.createElement('div');
        div.innerHTML = `<p style="font-weight:bold; font-size:0.9rem; margin:15px 0 10px; color:#1b4332;">${conf.l}</p>`;
        const vals = [...new Set(speciesData.map(s => String(s[conf.k] || "N/I")))].sort();
        vals.forEach(v => {
            const b = document.createElement('button');
            b.className = 'filter-btn';
            b.textContent = v === 'true' ? 'Sim' : v === 'false' ? 'Não' : v;
            b.onclick = () => {
                const val = v === 'true' ? true : v === 'false' ? false : v;
                if(filters[conf.k].includes(val)) filters[conf.k] = filters[conf.k].filter(x => x !== val);
                else filters[conf.k].push(val);
                b.classList.toggle('active');
                applyFilters();
            };
            div.appendChild(b);
        });
        container.appendChild(div);
    });
}

function applyFilters() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const result = speciesData.filter(s => {
        const txt = (s.scientificName + s.popularNames.join() + s.family).toLowerCase();
        const mTxt = txt.includes(query);
        const mFil = Object.keys(filters).every(k => filters[k].length === 0 || filters[k].includes(s[k]));
        return mTxt && mFil;
    });
    renderSpecies(result);
}

function renderSpecies(list) {
    const grid = document.getElementById('results-grid');
    if (!grid) return;
    document.getElementById('count-badge').textContent = `${list.length} espécies carregadas`;
    grid.innerHTML = '';
    list.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="pop-name">${s.popularNames[0]}</div>
            <div class="sci-name">${s.scientificName}</div>
            <div class="traits-box">
                <span><b>Família:</b> ${s.family}</span>
                <span><b>Hábito:</b> ${s.type}</span>
                <span><b>Filotaxia:</b> ${s.leafArrangement}</span>
                <span><b>Folha:</b> ${s.leafComposition}</span>
                <span><b>Exsudato:</b> ${s.exudate}</span>
            </div>
            <button class="btn-primary" onclick="window.openRegModal('${s.id}')">📷 Registrar</button>
        `;
        grid.appendChild(card);
    });
}

function setupGlobalEvents() {
    document.getElementById('fab-filter').onclick = () => {
        document.getElementById('filter-sidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    };
    document.getElementById('close-filter').onclick = document.getElementById('overlay').onclick = () => {
        document.getElementById('filter-sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    };
    document.getElementById('search-input').oninput = applyFilters;
    document.getElementById('btn-export').onclick = exportToCSV;
    document.getElementById('photo-input').onchange = (e) => {
        if(e.target.files.length > 0) document.getElementById('photo-feedback').classList.remove('hidden');
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
        const saveBtn = document.getElementById('save-obs-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = "Gravando no celular...";

        const id = document.getElementById('modal-species-id').value;
        const sp = speciesData.find(x => x.id === id);
        const photo = document.getElementById('photo-input').files[0];

        try {
            await saveObservation({
                speciesId: id, speciesName: sp.popularNames[0], scientificName: sp.scientificName,
                photo: photo || null,
                note: document.getElementById('note-input').value,
                lat: document.getElementById('lat-input').value, lng: document.getElementById('lng-input').value,
                timestamp: Date.now()
            });
            alert("Registro Ambiental salvo com sucesso!");
            window.closeRegModal();
        } catch (err) {
            alert("Erro de armazenamento. Espaço insuficiente ou falha no sistema.");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "SALVAR REGISTRO";
        }
    };
}

window.openRegModal = (id) => {
    const s = speciesData.find(x => x.id === id);
    const gps = document.getElementById('gps-status');
    document.getElementById('add-form').reset();
    document.getElementById('photo-feedback').classList.add('hidden');
    document.getElementById('modal-species-id').value = id;
    document.getElementById('modal-species-name').textContent = s.popularNames[0];
    document.getElementById('add-modal').classList.remove('hidden');

    gps.textContent = "🛰️ Buscando sinal de GPS...";
    gps.style.color = "orange";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('lat-input').value = pos.coords.latitude;
            document.getElementById('lng-input').value = pos.coords.longitude;
            gps.textContent = `✅ GPS Fixado: ${pos.coords.latitude.toFixed(5)}`;
            gps.style.color = "green";
        }, null, {enableHighAccuracy: true, timeout: 15000});
    }
};

window.closeRegModal = () => document.getElementById('add-modal').classList.add('hidden');

async function renderCollection() {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    const obs = await getAllObservations();
    grid.innerHTML = obs.length ? '' : '<p style="text-align:center; padding:60px; color:#999; font-weight:bold;">Nenhum registro no caderno.</p>';
    obs.forEach(o => {
        const card = document.createElement('div');
        card.className = 'card';
        let imgHtml = o.photo ? `<img src="${URL.createObjectURL(o.photo)}">` : '<div style="background:#eee; height:180px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#999; margin-bottom:12px; font-weight:bold;">Sem Foto Registrada</div>';
        card.innerHTML = `
            ${imgHtml}
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div><b>${o.speciesName}</b><br><small>${o.scientificName}</small></div>
                <button onclick="window.deleteItem(${o.id})" style="border:none; background:none; color:red; font-size:1.8rem; cursor:pointer; padding:5px;">&times;</button>
            </div>
            <p style="font-size:0.85rem; color:#333; margin:12px 0; border-left:3px solid var(--primary); padding-left:10px;">${o.note}</p>
            <p style="font-size:0.65rem; color:#999; font-weight:bold;">📍 ${o.lat}, ${o.lng} | 🕒 ${new Date(o.timestamp).toLocaleString()}</p>
        `;
        grid.appendChild(card);
    });
}

window.deleteItem = async (id) => { if(confirm("Deseja apagar este registro permanentemente?")) { await deleteObservation(id); renderCollection(); } };

async function exportToCSV() {
    const data = await getAllObservations();
    if(!data.length) return alert("Não há registros para exportar.");
    let csv = "\uFEFFID;Nome Popular;Cientifico;Latitude;Longitude;Notas;Data_Hora\n";
    data.forEach(o => {
        csv += `${o.speciesId};${o.speciesName};${o.scientificName};${o.lat};${o.lng};${o.note.replace(/;/g,',')};${new Date(o.timestamp).toLocaleString()}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Inventario_DendroKey_${new Date().getTime()}.csv`;
    link.click();
}

bootstrap();