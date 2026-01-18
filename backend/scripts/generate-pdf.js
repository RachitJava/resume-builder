const puppeteer = require('puppeteer');
const http = require('http');

let browser;

const initBrowser = async () => {
    const launchOptions = {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-extensions'
        ],
        headless: 'new'
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launchOptions);
    console.log('Browser initialized');
};

const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/generate') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            if (!browser) {
                await initBrowser();
            }

            let page;
            try {
                page = await browser.newPage();

                await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
                await page.setContent(body, {
                    waitUntil: 'domcontentloaded',
                    timeout: 10000
                });

                const bodyHeight = await page.evaluate(() => document.documentElement.scrollHeight);
                const heightMm = Math.ceil(bodyHeight * 0.264583) + 1;
                const finalHeight = Math.max(50, heightMm);

                const pdf = await page.pdf({
                    width: '210mm',
                    height: `${finalHeight}mm`,
                    printBackground: true,
                    margin: { top: 0, right: 0, bottom: 0, left: 0 },
                    pageRanges: '1'
                });

                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Length': pdf.length
                });
                res.end(pdf);

            } catch (error) {
                console.error('PDF Gen Error:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error generating PDF: ' + error.message);
            } finally {
                if (page) await page.close();
            }
        });
    } else if (req.url === '/health') {
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Start server
const PORT = 3000;
(async () => {
    await initBrowser();
    server.listen(PORT, () => {
        console.log(`PDF Server running on port ${PORT}`);
    });
})();
