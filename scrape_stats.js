
import puppeteer from 'puppeteer';
import fs from 'fs';

// --- Utility Functions for "Human" Behavior ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = async (min = 1000, max = 3000) => {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await sleep(delay);
};

const humanType = async (page, selector, text) => {
    // Type with random speed between keystrokes
    await page.type(selector, text, { delay: Math.floor(Math.random() * 100) + 50 });
};

const humanClick = async (page, selector) => {
    // 1. Move mouse to the element with some randomness/curve (simulated by steps)
    const element = await page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    const box = await element.boundingBox();
    const x = box.x + (box.width / 2);
    const y = box.y + (box.height / 2);

    await page.mouse.move(x, y, { steps: 25 }); // Move in 25 steps to look visible
    await randomDelay(200, 600); // Pause before clicking
    await page.mouse.click(x, y);
};

// --- Main Scraper ---

(async () => {
    console.log('--- Starting "Human" Scraper ---');

    // Launch browser with distinct viewport and header settings
    const browser = await puppeteer.launch({
        headless: false, // Must be false to be "human-like" enough to see (and useful for debugging)
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
    });

    const page = await browser.newPage();

    // Set a realistic User Agent (Windows 10 Chrome)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    try {
        console.log('--- Navigating to Login ---');
        await page.goto('https://members.fantasyfootballscout.co.uk/', { waitUntil: 'networkidle2' });
        await randomDelay(2000, 4000);

        // Login
        await humanType(page, '#username', 'vnfpl');
        await randomDelay(500, 1500);
        await humanType(page, '#password', 'vietnamtop1');
        await randomDelay(1000, 2000);

        await humanClick(page, '#loginButton'); // Adjust if button ID differs
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('--- Logged In ---');
        await randomDelay(3000, 5000);

        const filters = [
            'LAST_TWO_HOME_MATCHES',
            'LAST_FOUR_HOME_MATCHES'
            // Add more as needed
        ];

        const allData = {};

        for (const filter of filters) {
            console.log(`--- Processing Filter: ${filter} ---`);

            // Navigate explicitly to reset state (more human-like than trying to post directly)
            await page.goto('https://members.fantasyfootballscout.co.uk/player-stats/outfield-players/statsbomb-shots/', { waitUntil: 'domcontentloaded' });
            await randomDelay(2000, 5000);

            // Select Dropdown
            await page.select('#frange', filter);
            await randomDelay(1000, 2000);

            // Click Filter Button
            // Using evaluate to find the specific input button usually used in these old forms
            const filterBtnSelector = 'input.cta, input[name="filter"]';
            await page.waitForSelector(filterBtnSelector);
            await humanClick(page, filterBtnSelector);

            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await randomDelay(2000, 4000); // Read the results

            // Scrape Data
            const data = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('#main tbody tr'));
                return rows.map(tr => {
                    const cells = Array.from(tr.querySelectorAll('td'));
                    return {
                        name: cells[0]?.innerText.trim(),
                        team: cells[1]?.innerText.trim(),
                        position: cells[2]?.innerText.trim(),
                        price: cells[3]?.innerText.trim(),
                        // Add more columns based on actual table structure
                    };
                });
            });

            console.log(`Saved ${data.length} rows for ${filter}`);
            allData[filter] = data;
        }

        fs.writeFileSync('ffs_data_human.json', JSON.stringify(allData, null, 2));
        console.log('--- Completed Successfully ---');

    } catch (e) {
        console.error('Error in scraper:', e);
    } finally {
        await browser.close();
    }
})();
