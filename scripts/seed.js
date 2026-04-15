const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE URL or KEY. Please make sure .env.local exists.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
    const metaPath = path.join(__dirname, "..", "data", "scraped_sets_metadata.json");
    if (!fs.existsSync(metaPath)) {
        console.error("data/scraped_sets_metadata.json not found! Please run scrape.js first.");
        process.exit(1);
    }

    const setsMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

    for (const setInfo of setsMetadata) {
        const filePath = `scraped_cards_${setInfo.code}.json`;
        const fullPath = path.join(__dirname, "..", "data", filePath);

        // Ensure we process the set even if there are no cards scraped (e.g. promo sets without cards)
        // just to create the set entry in Supabase.
        console.log(`\nProcessing Set: ${setInfo.name} (${setInfo.code})`);

        let { data: existingSet } = await supabase
            .from('sets')
            .select('id, set_order, series_name, image_url, release_date')
            .eq('code', setInfo.code)
            .single();

        if (!existingSet) {
            const { data: newSet, error } = await supabase
                .from('sets')
                .insert({
                    code: setInfo.code,
                    name: setInfo.name,
                    set_order: setInfo.set_order,
                    series_name: setInfo.series_name,
                    image_url: setInfo.image_url,
                    release_date: setInfo.release_date
                })
                .select()
                .single();

            if (error) {
                console.error(`Failed to insert set ${setInfo.code}:`, error.message);
                continue;
            }
            existingSet = newSet;
        } else {
            // Update the set if any metadata differs
            if (
                existingSet.set_order !== setInfo.set_order ||
                existingSet.series_name !== setInfo.series_name ||
                existingSet.image_url !== setInfo.image_url ||
                existingSet.release_date !== setInfo.release_date ||
                existingSet.name !== setInfo.name
            ) {
                await supabase
                    .from('sets')
                    .update({
                        set_order: setInfo.set_order,
                        name: setInfo.name,
                        series_name: setInfo.series_name,
                        image_url: setInfo.image_url,
                        release_date: setInfo.release_date
                    })
                    .eq('id', existingSet.id);
            }
        }

        // Check if there are scraped cards to seed
        if (!fs.existsSync(fullPath)) {
            console.log(`No card data file found for ${setInfo.code} (${filePath}), skipping card upload.`);
            continue;
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
            console.log(`[${i + 1}/${processedCards.length}] Uploading: ${card.name} (${setInfo.code})`);

            // Check if card exists to maybe update?
            // Existing seed.js just forcefully inserts, so we'll keep the insert logic assuming db is wiped.
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
    console.log("\nDatabase Seeding Completed Successfully!");
}

seedDatabase();