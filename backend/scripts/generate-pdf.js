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
                '--single-process',
                '--disable-extensions'
            ],
            headless: 'new'
        });

        const page = await browser.newPage();

        // Optimize for speed - reduced scale factor
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

        await page.setContent(html, {
            waitUntil: 'domcontentloaded', // Much faster than networkidle0
            timeout: 10000
        });

        // Calculate height for Single Page requirement
        const bodyHeight = await page.evaluate(() => {
            document.body.style.transform = 'none';
            return document.documentElement.scrollHeight;
        });

        // Convert px to mm
        const heightMm = Math.ceil(bodyHeight * 0.264583) + 1;
        const finalHeight = Math.max(50, heightMm);

        const pdf = await page.pdf({
            width: '210mm',
            height: `${finalHeight}mm`,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            pageRanges: '1'
        });

        await browser.close();

        // Write binary to stdout
        process.stdout.write(pdf);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        process.exit(1);
    }
})();
