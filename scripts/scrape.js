const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const TARGET_SETS = [
    { code: "MA4", name: "Ledakan Peniada" },
    { code: "MA3", name: "Evolusi Mega Impian ex" },
    { code: "MA2", name: "Kobaran Biru" },
    { code: "MA1", name: "Evolusi Mega" },
    { code: "M-P", name: "Kartu Promo (M-P)" },
    { code: "SV11s", name: "Hitam & Putih" },
    { code: "SV10s", name: "Kehadiran Juara" },
    { code: "SV9s", name: "Ikatan Takdir" },
    { code: "SV8a", name: "Festival Terastal ex" },
    { code: "SV8s", name: "Kilat Rasi" },
    { code: "SV7s", name: "Bimbingan Rasi" },
    { code: "SV6s", name: "Topeng Transfigurasi" },
    { code: "SV5s", name: "Paradoks Andalan" },
    { code: "SV4a", name: "Harta Berkilau ex" },
    { code: "SV4s", name: "Pertemuan Paradoks" },
    { code: "SV3s", name: "Kilau Hitam" },
    { code: "SV2a", name: "Kartu Pokémon 151" },
    { code: "SV2P", name: "Mara Bahaya Salju" },
    { code: "SV2D", name: "Letusan Tanah" },
    { code: "SV1a", name: "Hantaman Triplet" },
    { code: "SV1S", name: "Scarlet ex" },
    { code: "SV1V", name: "Violet ex" },
    { code: "SV-P", name: "Kartu Promo (SV-P)" },
    { code: "S12a", name: "VSTAR Semesta" },
    { code: "S12", name: "Pemicu Paradigma" },
    { code: "S11a", name: "Arkana Memuncak" },
    { code: "S11", name: "Neraka Sirna" },
    { code: "S10a", name: "Fantom Kegelapan" },
    { code: "S10D", name: "Pengamat Waktu" },
    { code: "S10P", name: "Penyulap Ruang" },
    { code: "S-P", name: "Kartu Promo (S-P)" },
    { code: "S10b", name: "Pokémon GO" },
    { code: "S9", name: "Star Birth" },
    { code: "S9a", name: "Pertarungan Daerah" },
    { code: "S8", name: "Teknik Fusion" },
    { code: "S8b", name: "VMAX Klimaks" },
    { code: "S8a", name: "25th ANNIVERSARY COLLECTION" },
    { code: "S7D", name: "Pencakar Langit Sempurna" },
    { code: "S7R", name: "Arus Langit Biru" },
    { code: "S6a", name: "Para Eevee Pahlawan" },
    { code: "S6K", name: "Astral Gelap Gulita" },
    { code: "S6H", name: "Ganjur Salju Perak" },
    { code: "S5a", name: "Dua Pilar Petarung" },
    { code: "S5I", name: "Master Serangan Tunggal" },
    { code: "S5R", name: "Master Serangan Beruntun" },
    { code: "SC3a", name: "VMAX Berkilau Set A" },
    { code: "SC3b", name: "VMAX Berkilau Set B" },
    { code: "SC1a", name: "Pedang & Perisai Set A" },
    { code: "SC1b", name: "Pedang & Perisai Set B" },
    { code: "AC3a", name: "Koleksi TAG TEAM Set A" },
    { code: "AC3b", name: "Koleksi TAG TEAM Set B" },
    { code: "AS4a", name: "Penguasa Langit Set A" },
    { code: "AS4b", name: "Penguasa Langit Set B" },
    { code: "AS3a", name: "Bayangan Tersembunyi Set A" },
    { code: "AS3b", name: "Bayangan Tersembunyi Set B" },
    { code: "AS2a", name: "Kebangkitan Legenda Set A" },
    { code: "AS2b", name: "Kebangkitan Legenda Set B" },
    { code: "AS1a", name: "Hantaman Pertama Set A" },
    { code: "AS1b", name: "Hantaman Pertama Set B" },
];

const RARITY_MAP = {
    "21": "MA", "20": "MUR", "19": "BWR", "18": "ACE", "17": "SSR", "16": "S",
    "15": "SAR", "14": "AR", "13": "A", "12": "K", "11": "Tanpa Tanda",
    "10": "UR", "9": "HR", "8": "SR", "7": "TR", "6": "PR",
    "5": "RRR", "4": "RR", "3": "R", "2": "U", "1": "C"
};

const baseUrl = "https://asia.pokemon-card.com";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Format MM-DD-YYYY to DD/MM/YYYY
function formatDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        // [MM, DD, YYYY] -> "DD/MM/YYYY"
        return `${parts[1]}/${parts[0]}/${parts[2]}`;
    }
    return dateStr;
}

async function scrapeSetMetadata(page) {
    console.log(`\n=================================================`);
    console.log(`Scraping Set Metadata from Search Page...`);
    console.log(`=================================================`);

    const extractedSets = [];
    let pageNo = 1;

    while (true) {
        console.log(`Scraping search page ${pageNo}...`);
        await page.goto(`${baseUrl}/id/card-search/?pageNo=${pageNo}`, { waitUntil: "networkidle2" });
        const content = await page.content();
        const $ = cheerio.load(content);

        const listItems = $("li.expansion");
        if (listItems.length === 0) break;

        listItems.each((_, el) => {
            const href = $(el).find("a.expansionLink").attr("href") || "";
            const match = href.match(/expansionCodes=([^&]+)/);
            const code = match ? match[1] : "";

            const rawDate = $(el).find("time.relaseDate").attr("datetime") || "";

            const metadata = {
                code,
                series_name: $(el).find(".series").text().trim() || "Lainnya",
                image_url: $(el).find(".imageContainer img").attr("src") || "",
                name: $(el).find(".expansionTitle").text().replace(/\s+/g, ' ').trim(),
                release_date: formatDate(rawDate)
            };

            if (metadata.code) {
                extractedSets.push(metadata);
            }
        });

        const hasNextPage = $(".pagination .next a").length > 0;
        if (!hasNextPage) break;
        pageNo++;
        await sleep(1000);
    }

    // Merge with TARGET_SETS (keeping the order of TARGET_SETS)
    const finalSets = TARGET_SETS.map((target, index) => {
        const found = extractedSets.find(s => s.code.toLowerCase() === target.code.toLowerCase());
        return {
            ...target,
            set_order: index + 1, // Store the explicit set_order based on array position
            series_name: found ? found.series_name : "Lainnya",
            image_url: found ? found.image_url : "",
            release_date: found ? found.release_date : ""
        };
    });

    const outDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir, { recursive: true }); }
    const outPath = path.join(outDir, "scraped_sets_metadata.json");
    fs.writeFileSync(outPath, JSON.stringify(finalSets, null, 2));
    console.log(`Saved ${finalSets.length} sets metadata to data/scraped_sets_metadata.json`);
    return finalSets;
}

async function run() {
    console.log("Starting headless browser...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

    // 1. Scrape metadata first
    const setsWithMetadata = await scrapeSetMetadata(page);

    // 2. Scrape individual cards for each target set
    for (const targetSet of setsWithMetadata) {
        console.log(`\n=================================================`);
        console.log(`Processing Set: ${targetSet.code} - ${targetSet.name}`);
        console.log(`=================================================`);

        // Skip if you already have the file (useful for partial runs) - remove block if force reset is needed
        // const existingFile = path.join(__dirname, "..", `scraped_cards_${targetSet.code}.json`);
        // if (fs.existsSync(existingFile)) {
        //     console.log(`File already exists, skipping card scraping for ${targetSet.code}...`);
        //     continue;
        // }

        const urlToRarity = {};
        const rarityKeys = Object.keys(RARITY_MAP);

        console.log(`\nBuilding rarity map...`);
        for (const rarityValue of rarityKeys) {
            const rarityLabel = RARITY_MAP[rarityValue];
            let currentPage = 1;

            while (true) {
                const links = await page.evaluate(async (code, rVal, pNo) => {
                    const formData = new URLSearchParams();
                    formData.append("cardType", "all");
                    formData.append("expansionCodes", code);
                    formData.append("rarity[]", rVal);

                    const res = await fetch(`https://asia.pokemon-card.com/id/card-search/list/?pageNo=${pNo}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: formData.toString()
                    });

                    const html = await res.text();
                    const div = document.createElement('div');
                    div.innerHTML = html;
                    return Array.from(div.querySelectorAll("a[href*='/id/card-search/detail/']")).map(a => a.getAttribute('href'));
                }, targetSet.code, rarityValue, currentPage);

                if (!links || links.length === 0) break;

                for (const link of links) {
                    urlToRarity[link] = rarityLabel;
                }

                console.log(`  -> Found ${links.length} cards with rarity [${rarityLabel}] (Page ${currentPage})`);
                currentPage++;
                await sleep(800);
            }
        }
        console.log("Rarity map built successfully!");

        console.log(`\nGathering all card links...`);
        let listPage = 1;
        let hasMorePages = true;
        const allCardLinks = [];

        while (hasMorePages) {
            const listUrl = `${baseUrl}/id/card-search/list/?expansionCodes=${targetSet.code}&pageNo=${listPage}`;
            console.log(`Scanning page ${listPage}...`);

            await page.goto(listUrl, { waitUntil: "networkidle2" });

            try {
                await page.waitForSelector("a[href*='/id/card-search/detail/']", { timeout: 10000 });
            } catch (error) {
                console.log(`End of pages reached.`);
                hasMorePages = false;
                break;
            }

            const content = await page.content();
            const $ = cheerio.load(content);

            let linksAddedCount = 0;
            $("a[href*='/id/card-search/detail/']").each((_, el) => {
                const href = $(el).attr("href");
                if (!allCardLinks.includes(href)) {
                    allCardLinks.push(href);
                    linksAddedCount++;
                }
            });

            if (linksAddedCount === 0) {
                hasMorePages = false;
            } else {
                listPage++;
            }
        }

        console.log(`\nTotal ${allCardLinks.length} cards found. Extracting details...`);
        const extractedResults = [];

        for (let i = 0; i < allCardLinks.length; i++) {
            const extractedLink = allCardLinks[i];
            const detailUrl = baseUrl + extractedLink;
            console.log(`[${i + 1}/${allCardLinks.length}] Extracting: ${detailUrl}`);

            try {
                await page.goto(detailUrl, { waitUntil: "networkidle2" });
                const detailContent = await page.content();
                const $$ = cheerio.load(detailContent);

                const card = {};

                let stageRaw = $$(".evolveMarker").text().trim();
                if (!stageRaw) {
                    stageRaw = $$(".skillInformation h3.commonHeader").text().replace(/\s+/g, " ").trim();
                }
                card.stage = stageRaw;

                card.name = $$(".pageHeader.cardDetail").contents().filter(function () { return this.nodeType === 3; }).text().trim();
                card.hp = $$(".hitPoint").next(".number").text().trim();

                const typeIcons = [];
                $$(".mainInfomation .type").nextAll("img").each((_, el) => {
                    typeIcons.push($$(el).attr("src"));
                });
                card.types = typeIcons;

                const attacks = [];
                $$(".skill").each((_, el) => {
                    const costIcons = [];
                    $$(el).find(".skillCost img").each((_, imgEl) => {
                        costIcons.push($$(imgEl).attr("src"));
                    });
                    attacks.push({
                        name: $$(el).find(".skillName").text().trim(),
                        cost: costIcons,
                        damage: $$(el).find(".skillDamage").text().trim(),
                        effect: $$(el).find(".skillEffect").text().trim()
                    });
                });
                card.attacks = attacks;

                card.weakness = {
                    type: $$(".weakpoint img").attr("src") || "",
                    value: $$(".weakpoint").text().replace(/\s+/g, " ").trim()
                };

                card.resistance = {
                    type: $$(".resist img").attr("src") || "",
                    value: $$(".resist").text().replace(/\s+/g, " ").trim()
                };

                card.retreat = $$(".escape img").length;

                const evolutions = [];
                $$(".evolutionStep a").each((_, el) => {
                    evolutions.push($$(el).text().trim());
                });
                card.evolution = evolutions;

                const extraTitle = $$(".extraInformation h3").text().trim();
                card.pokedex_number = extraTitle.split(" ")[0] || "";
                card.species = extraTitle.split(" ").slice(1).join(" ") || "";

                const sizes = [];
                $$(".extraInformation .size .value").each((_, el) => {
                    sizes.push($$(el).text().trim());
                });
                card.height = sizes[0] || "";
                card.weight = sizes[1] || "";

                card.description = $$(".extraInformation .discription").text().trim();
                card.illustrator = $$(".illustrator a").text().trim();
                card.expansion_symbol_url = $$(".expansionSymbol img").attr("src") || "";
                card.regulation_mark = $$(".alpha").text().trim();
                card.card_number = $$(".collectorNumber").text().trim();
                card.image_url = $$(".cardImage img").attr("src") || "";
                card.rarity = urlToRarity[extractedLink] || "";

                extractedResults.push(card);
            } catch (err) {
                console.log(`Failed to extract: ${detailUrl}`);
            }

            await sleep(1500);
        }

        const outDir = path.join(__dirname, "..", "data");
        if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir, { recursive: true }); }
        const fileName = `scraped_cards_${targetSet.code}.json`;
        const outPath = path.join(outDir, fileName);
        console.log(`Saving extracted data to data/${fileName}...`);
        fs.writeFileSync(outPath, JSON.stringify(extractedResults, null, 2));
    }

    await browser.close();
    console.log("\nScraping completed successfully!");
}

run();