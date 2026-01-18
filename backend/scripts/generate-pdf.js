const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    try {
        // Read stdin
        const html = fs.readFileSync(0, 'utf-8');

        // Launch browser (using system chromium)
        const browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--font-render-hinting=none',
                '--no-zygote',
                '--single-process', // Aggressive memory saving
                '--disable-extensions'
            ],
            headless: 'new'
        });

        const page = await browser.newPage();

        // Optimize for speed/quality
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 }); // 794px = 210mm @ 96dpi

        await page.setContent(html, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
        });

        // Calculate height for Single Page requirement
        const bodyHeight = await page.evaluate(() => {
            document.body.style.transform = 'none'; // Ensure no weird scaling
            return document.documentElement.scrollHeight;
        });

        // Convert px to mm (approx) -> 794px = 210mm -> 1px = 0.264mm
        // TIGHT FIT: Add minimal buffer (1mm) to prevent overflow but remove "extra" space
        const heightMm = Math.ceil(bodyHeight * 0.264583) + 1;

        // Use exact height (do not force A4 minimum) to avoid extra underlay at bottom
        const finalHeight = Math.max(50, heightMm); // Min 50mm just for safety

        const pdf = await page.pdf({
            width: '210mm',
            height: `${finalHeight}mm`,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            pageRanges: '1' // Force 1 page logic just in case
        });

        await browser.close();

        // Write binary to stdout
        process.stdout.write(pdf);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        process.exit(1);
    }
})();
