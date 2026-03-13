const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FILES_TO_SEED = [
    { filePath: "scraped_cards_MA3.json", setCode: "MA3", setName: "Evolusi Mega Impian ex" },
    { filePath: "scraped_cards_MA2.json", setCode: "MA2", setName: "Kobaran Biru" },
    { filePath: "scraped_cards_MA1.json", setCode: "MA1", setName: "Evolusi Mega" },
    { filePath: "scraped_cards_SV11S.json", setCode: "SV11S", setName: "Hitam & Putih" },
    { filePath: "scraped_cards_SV10S.json", setCode: "SV10S", setName: "Kehadiran Juara" },
    { filePath: "scraped_cards_SV9S.json", setCode: "SV9S", setName: "Ikatan Takdir" },
    { filePath: "scraped_cards_SV8A.json", setCode: "SV8A", setName: "Festival Terastal ex" },
    { filePath: "scraped_cards_SV8S.json", setCode: "SV8S", setName: "Kilat Rasi" },
    { filePath: "scraped_cards_SV7S.json", setCode: "SV7S", setName: "Bimbingan Rasi" },
    { filePath: "scraped_cards_SV6S.json", setCode: "SV6S", setName: "Topeng Transfigurasi" },
    { filePath: "scraped_cards_SV5A.json", setCode: "SV5A", setName: "Paradoks Andalan" },
    { filePath: "scraped_cards_SV5S.json", setCode: "SV5S", setName: "Harta Berkilau ex" },
    { filePath: "scraped_cards_SV4S.json", setCode: "SV4S", setName: "Pertemuan Paradoks" },
    { filePath: "scraped_cards_SV3S.json", setCode: "SV3S", setName: "Kilau Hitam" },
    { filePath: "scraped_cards_SV2A.json", setCode: "SV2A", setName: "Kartu Pokémon 151" },
    { filePath: "scraped_cards_SV2P.json", setCode: "SV2P", setName: "Mara Bahaya Salju" },
    { filePath: "scraped_cards_SV2D.json", setCode: "SV2D", setName: "Letusan Tanah" },
    { filePath: "scraped_cards_SV1S.json", setCode: "SV1S", setName: "Hantaman Triplet" },
    { filePath: "scraped_cards_SV1V.json", setCode: "SV1V", setName: "Violet ex" },
    { filePath: "scraped_cards_SV1S.json", setCode: "SV1S", setName: "Scarlet ex" },
    { filePath: "scraped_cards_S12A.json", setCode: "S12A", setName: "VSTAR Semesta" },
    { filePath: "scraped_cards_S12.json", setCode: "S12", setName: "Pemicu Paradigma" },
    { filePath: "scraped_cards_S11A.json", setCode: "S11A", setName: "Arkana Memuncak" },
    { filePath: "scraped_cards_S11.json", setCode: "S11", setName: "Neraka Sirna" },
    { filePath: "scraped_cards_S10A.json", setCode: "S10A", setName: "Fantom Kegelapan" },
    { filePath: "scraped_cards_S10P.json", setCode: "S10P", setName: "Penyulap Ruang" },
    { filePath: "scraped_cards_S10D.json", setCode: "S10D", setName: "Pengamat Waktu" },
    { filePath: "scraped_cards_S10B.json", setCode: "S10B", setName: "Pokémon GO" },
    { filePath: "scraped_cards_S9A.json", setCode: "S9A", setName: "Pertarungan Daerah" },
    { filePath: "scraped_cards_S9.json", setCode: "S9", setName: "Star Birth" },
    { filePath: "scraped_cards_S8B.json", setCode: "S8B", setName: "VMAX Klimaks" },
    { filePath: "scraped_cards_S8.json", setCode: "S8", setName: "Teknik Fusion" },
    { filePath: "scraped_cards_S8A.json", setCode: "S8A", setName: "Koleksi Peringatan Perayaan 25 Tahun" },
    { filePath: "scraped_cards_S7D.json", setCode: "S7D", setName: "Pencakar Langit Sempurna" },
    { filePath: "scraped_cards_S7R.json", setCode: "S7R", setName: "Arus Langit Biru" }
];

async function seedDatabase() {
    for (let setIndex = 0; setIndex < FILES_TO_SEED.length; setIndex++) {
        const fileInfo = FILES_TO_SEED[setIndex];
        const fullPath = path.join(__dirname, "..", fileInfo.filePath);
        const targetOrder = setIndex + 1;

        if (!fs.existsSync(fullPath)) {
            continue;
        }

        console.log(`\nProcessing: ${fileInfo.setName} (${fileInfo.setCode})`);

        let { data: existingSet } = await supabase
            .from('sets')
            .select('id, set_order')
            .eq('code', fileInfo.setCode)
            .single();

        if (!existingSet) {
            const { data: newSet } = await supabase
                .from('sets')
                .insert({
                    code: fileInfo.setCode,
                    name: fileInfo.setName,
                    set_order: targetOrder
                })
                .select()
                .single();

            existingSet = newSet;
        } else if (existingSet.set_order !== targetOrder) {
            await supabase
                .from('sets')
                .update({ set_order: targetOrder })
                .eq('id', existingSet.id);
        }

        const rawData = fs.readFileSync(fullPath, 'utf8');
        const rawCards = JSON.parse(rawData);

        const groupedCards = {};

        for (const card of rawCards) {
            const num = card.card_number || "unknown";
            if (!groupedCards[num]) groupedCards[num] = [];
            groupedCards[num].push(card);
        }

        const processedCards = [];

        for (const num in groupedCards) {
            const group = groupedCards[num];

            group.sort((a, b) => (a.image_url || "").localeCompare(b.image_url || ""));

            group.forEach((card, index) => {
                const order = index + 1;
                let vName = null;

                if (group.length > 1) {
                    vName = order === 1 ? 'Normal' : `Holo ${order - 1}`;
                }

                card.variant_order = order;
                card.variant_name = vName;
                processedCards.push(card);
            });
        }

        for (let i = 0; i < processedCards.length; i++) {
            const card = processedCards[i];

            console.log(`[${i + 1}/${processedCards.length}] Uploading: ${card.name}`);

            await supabase.from('cards').insert({
                set_id: existingSet.id,
                card_number: card.card_number || null,
                name: card.name || "Unknown",
                hp: card.hp || null,
                stage: card.stage || null,
                types: card.types || null,
                evolution: card.evolution || null,
                attacks: card.attacks || null,
                weakness: card.weakness || null,
                resistance: card.resistance || null,
                retreat_cost: card.retreat || 0,
                pokedex_number: card.pokedex_number || null,
                species: card.species || null,
                height: card.height || null,
                weight: card.weight || null,
                description: card.description || null,
                illustrator: card.illustrator || null,
                rarity: card.rarity || null,
                regulation_mark: card.regulation_mark || null,
                image_url: card.image_url || null,
                expansion_symbol_url: card.expansion_symbol_url || null,
                variant_name: card.variant_name,
                variant_order: card.variant_order
            });
        }
    }
}

seedDatabase();