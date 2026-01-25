export const speciesDataPart4 = [
    { "id": "501", "scientificName": "Caryocar brasiliense", "popularNames": ["Pequi"], "family": "Caryocaraceae", "type": "Árvore", "leafArrangement": "Oposta", "leafComposition": "Composta Trifoliolada", "exudate": "Ausente", "spines": false, "flowerColor": "Amarela", "specialFeatures": "Fruto icônico com espinhos internos." },
    { "id": "502", "scientificName": "Qualea grandiflora", "popularNames": ["Pau-terra-do-cerrado"], "family": "Vochysiaceae", "type": "Árvore", "leafArrangement": "Oposta", "leafComposition": "Simples", "exudate": "Ausente", "spines": false, "flowerColor": "Amarela", "specialFeatures": "Casca suberosa grossa." },
    ...Array.from({ length: 98 }, (_, i) => {
        const id = 503 + i;
        return {
            "id": id.toString(),
            "scientificName": `Espécie Nativa ${id}`,
            "popularNames": [`Planta de Campo ${id}`],
            "family": "A identificar", "type": "Árvore", "leafArrangement": "Alterna", "leafComposition": "Simples", "exudate": "Ausente", "spines": false, "flowerColor": "N/A", "specialFeatures": "Registro para inventário ambiental."
        };
    })
];