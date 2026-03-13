const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

const TARGET_SETS = [
    { code: "MA3", name: "Evolusi Mega Impian ex" },
    { code: "MA2", name: "Kobaran Biru" },
    { code: "MA1", name: "Evolusi Mega" },
    { code: "SV11S", name: "Hitam & Putih" },
    { code: "SV10S", name: "Kehadiran Juara" },
    { code: "SV9S", name: "Ikatan Takdir" },
    { code: "SV8A", name: "Festival Terastal ex" },
    { code: "SV8S", name: "Kilat Rasi" },
    { code: "SV7S", name: "Bimbingan Rasi" },
    { code: "SV6S", name: "Topeng Transfigurasi" },
    { code: "SV5S", name: "Paradoks Andalan" },
    { code: "SV4A", name: "Harta Berkilau ex" },
    { code: "SV4S", name: "Pertemuan Paradoks" },
    { code: "SV3S", name: "Kilau Hitam" },
    { code: "SV2A", name: "Kartu Pokémon 151" },
    { code: "SV2P", name: "Mara Bahaya Salju" },
    { code: "SV2D", name: "Letusan Tanah" },
    { code: "SV1S", name: "Hantaman Triplet" },
    { code: "SV1V", name: "Violet ex" },
    { code: "SV1S", name: "Scarlet ex" },
    { code: "S12A", name: "VSTAR Semesta" },
    { code: "S12", name: "Pemicu Paradigma" },
    { code: "S11A", name: "Arkana Memuncak" },
    { code: "S11", name: "Neraka Sirna" },
    { code: "S10A", name: "Fantom Kegelapan" },
    { code: "S10P", name: "Penyulap Ruang" },
    { code: "S10D", name: "Pengamat Waktu" },
    { code: "S10B", name: "Pokémon GO" },
    { code: "S9A", name: "Pertarungan Daerah" },
    { code: "S9", name: "Star Birth" },
    { code: "S8B", name: "VMAX Klimaks" },
    { code: "S8", name: "Teknik Fusion" },
    { code: "S8A", name: "Koleksi Peringatan Perayaan 25 Tahun" },
    { code: "S7D", name: "Pencakar Langit Sempurna" },
    { code: "S7R", name: "Arus Langit Biru" }
];

const RARITY_MAP = {
    "21": "MA", "20": "MUR", "19": "BWR", "18": "ACE", "17": "SSR", "16": "S",
    "15": "SAR", "14": "AR", "13": "A", "12": "K", "11": "Tanpa Tanda",
    "10": "UR", "9": "HR", "8": "SR", "7": "TR", "6": "PR",
    "5": "RRR", "4": "RR", "3": "R", "2": "U", "1": "C"
};

const baseUrl = "https://asia.pokemon-card.com";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
    console.log("Starting headless browser...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

    console.log("Opening base URL to bypass CORS...");
    await page.goto(`${baseUrl}/id/card-search/`, { waitUntil: "domcontentloaded" });

    for (const targetSet of TARGET_SETS) {
        console.log(`\n=================================================`);
        console.log(`Processing Set: ${targetSet.code} - ${targetSet.name}`);
        console.log(`=================================================`);

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

        const fileName = `scraped_cards_${targetSet.code}.json`;
        console.log(`Saving extracted data to ${fileName}...`);
        fs.writeFileSync(fileName, JSON.stringify(extractedResults, null, 2));
    }

    await browser.close();
    console.log("\nScraping completed successfully!");
}

run();