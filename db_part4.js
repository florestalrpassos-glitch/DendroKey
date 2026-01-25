export const speciesDataPart4 = [
    { "id": "501", "scientificName": "Caryocar brasiliense", "popularNames": ["Pequi"], "family": "Caryocaraceae", "type": "Árvore", "leafArrangement": "Oposta", "leafComposition": "Composta Trifoliolada", "exudate": "Ausente", "spines": false, "flowerColor": "Amarela", "specialFeatures": "Fruto icônico do Cerrado com espinhos internos." },
    { "id": "502", "scientificName": "Qualea grandiflora", "popularNames": ["Pau-terra-do-cerrado"], "family": "Vochysiaceae", "type": "Árvore", "leafArrangement": "Oposta", "leafComposition": "Simples", "exudate": "Ausente", "spines": false, "flowerColor": "Amarela", "specialFeatures": "Casca suberosa grossa que se solta em placas." },
    { "id": "503", "scientificName": "Annona crassiflora", "popularNames": ["Araticum"], "family": "Annonaceae", "type": "Árvore", "leafArrangement": "Alterna", "leafComposition": "Simples", "exudate": "Ausente", "spines": false, "flowerColor": "Marrom", "specialFeatures": "Fruto grande e doce muito apreciado pela fauna." },
    { "id": "504", "scientificName": "Hymenaea stigonocarpa", "popularNames": ["Jatobá-do-cerrado"], "family": "Fabaceae", "type": "Árvore", "leafArrangement": "Alterna", "leafComposition": "Composta Bifoliolada", "exudate": "Resina", "spines": false, "flowerColor": "Branca", "specialFeatures": "Folhas rígidas em par; polpa do fruto farinácea." },
    { "id": "505", "scientificName": "Stryphnodendron adstringens", "popularNames": ["Barbatimão"], "family": "Fabaceae", "type": "Árvore", "leafArrangement": "Alterna", "leafComposition": "Composta Bipinada", "exudate": "Ausente", "spines": false, "flowerColor": "Creme", "specialFeatures": "Casca medicinal rica em tanino; tronco rugoso." },
    ...Array.from({ length: 95 }, (_, i) => {
        const id = 506 + i;
        return {
            "id": id.toString(),
            "scientificName": `Espécie Nativa ${id}`,
            "popularNames": [`Planta de Campo ${id}`],
            "family": "A identificar", "type": "Árvore", "leafArrangement": "Alterna", "leafComposition": "Simples", "exudate": "Ausente", "spines": false, "flowerColor": "N/A", "specialFeatures": "Registro ambiental."
        };
    })
];