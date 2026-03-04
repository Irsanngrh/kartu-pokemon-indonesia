const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Kredensial Supabase tidak ditemukan di file .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FILES_TO_SEED = [
    { filePath: "scraped_cards_MA3.json", setCode: "MA3", setName: "Evolusi Mega Impian EX" }
];

async function seedDatabase() {
    console.log("Memulai proses seeding database...\n");

    for (const fileInfo of FILES_TO_SEED) {
        
        const fullPath = path.join(__dirname, "..", fileInfo.filePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`[SKIP] File tidak ditemukan: ${fileInfo.filePath}`);
            continue;
        }

        console.log(`Memproses ekspansi: ${fileInfo.setName} (${fileInfo.setCode})`);

        let { data: existingSet, error: setError } = await supabase
            .from('sets')
            .select('id')
            .eq('code', fileInfo.setCode)
            .single();

        if (!existingSet) {
            console.log(`  -> Membuat set baru: ${fileInfo.setCode}`);
            const { data: newSet, error: insertSetError } = await supabase
                .from('sets')
                .insert({ code: fileInfo.setCode, name: fileInfo.setName })
                .select()
                .single();

            if (insertSetError) {
                console.error("Gagal membuat set ekspansi:", insertSetError);
                continue;
            }
            existingSet = newSet;
        }

        const rawData = fs.readFileSync(fullPath, 'utf8');
        const cards = JSON.parse(rawData);
        
        console.log(`  -> Menemukan ${cards.length} kartu. Mulai mengunggah ke tabel 'cards'...`);

        let successCount = 0;
        let errorCount = 0;

        for (const card of cards) {
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
                variant_name: null
            });

            if (insertCardError) {
                console.error(`Gagal mengunggah kartu ${card.name}:`, insertCardError.message);
                errorCount++;
            } else {
                successCount++;
            }
        }

        console.log(`Selesai memproses ${fileInfo.setCode}. Berhasil: ${successCount}, Gagal: ${errorCount}\n`);
    }

    console.log("Proses unggah (seeding) selesai sepenuhnya!");
}

seedDatabase();