const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not found in .env.local");
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
    { filePath: "scraped_cards_SV2A.json", setCode: "SV2A", setName: "Kartu Pokémon 151" }
];

async function seedDatabase() {
    console.log("Starting database seeding...\n");

    for (const fileInfo of FILES_TO_SEED) {
        const fullPath = path.join(__dirname, "..", fileInfo.filePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`[SKIP] File not found: ${fileInfo.filePath}`);
            continue;
        }

        console.log(`Processing set: ${fileInfo.setName} (${fileInfo.setCode})`);

        let { data: existingSet, error: setError } = await supabase
            .from('sets')
            .select('id')
            .eq('code', fileInfo.setCode)
            .single();

        if (!existingSet) {
            console.log(`  -> Creating new set: ${fileInfo.setCode}`);
            
            const { data: newSet, error: insertSetError } = await supabase
                .from('sets')
                .insert({ code: fileInfo.setCode, name: fileInfo.setName })
                .select()
                .single();

            if (insertSetError) {
                console.error("Failed to create set:", insertSetError);
                continue;
            }
            
            existingSet = newSet;
        }

        const rawData = fs.readFileSync(fullPath, 'utf8');
        const rawCards = JSON.parse(rawData);
        
        console.log(`  -> Found ${rawCards.length} raw cards. Analyzing variants...`);

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
                    vName = order === 1 ? 'Normal' : 'Holo';
                }

                card.variant_order = order;
                card.variant_name = vName;
                processedCards.push(card);
            });
        }

        console.log(`  -> Uploading ${processedCards.length} cards to database...`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < processedCards.length; i++) {
            const card = processedCards[i];
            
            console.log(`     [${i + 1}/${processedCards.length}] Uploading: ${card.name} (${card.variant_name || 'Normal'})`);

            const { error: insertCardError } = await supabase.from('cards').insert({
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

            if (insertCardError) {
                console.error(`     [ERROR] Failed to upload ${card.name}:`, insertCardError.message);
                errorCount++;
            } else {
                successCount++;
            }
        }

        console.log(`Finished processing ${fileInfo.setCode}. Success: ${successCount}, Failed: ${errorCount}\n`);
    }

    console.log("Seeding completed successfully!");
}

seedDatabase();