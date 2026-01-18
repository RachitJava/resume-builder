const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    try {
        // Read stdin
        const html = fs.readFileSync(0, 'utf-8');

        // Launch browser (using system chromium)
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--font-render-hinting=none' // Better text kerning
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
        // Add 10mm buffer
        const heightMm = Math.ceil(bodyHeight * 0.264583) + 10;

        // Ensure A4 min height
        const finalHeight = Math.max(297, heightMm);

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
