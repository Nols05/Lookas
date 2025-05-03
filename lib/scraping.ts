import puppeteer from 'puppeteer';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRODUCT_URL = 'https://www.zara.com/es/es/chaqueta-corta-trabillas-p04387050.html';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err.message);
        });
    });
}

async function scrapeZaraImages() {
    console.log('Starting Zara image scraper...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    console.log(`Navigating to ${PRODUCT_URL}`);
    const response = await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2' });
    console.log(`Response status: ${response.status()} ${response.statusText()}`);

    if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
    }

    await page.waitForSelector('.product-detail-color-selector__colors', { visible: true });

    const colorButtons = await page.$$('.product-detail-color-selector__colors .product-detail-color-selector__color-button');
    console.log(`Found ${colorButtons.length} color variants`);

    const selectedButton = await page.$('.product-detail-color-selector__color-button--is-selected');
    const selectedColorName = await page.evaluate((btn) => {
        const screenReaderText = btn.querySelector('.product-detail-color-selector__color-area .screen-reader-text');
        return screenReaderText?.textContent?.trim() || `color-${Math.random()}`;
    }, selectedButton);

    console.log(`Processing initially selected color: ${selectedColorName}`);

    async function processColorImages(colorName) {
        const imageUrls = await page.evaluate(() => {
            const pictures = Array.from(document.querySelectorAll('.media-image'));
            const urls = [];

            pictures.forEach(picture => {
                const source = picture.querySelector('source[media="(min-width: 768px)"]');
                if (source) {
                    const srcset = source.getAttribute('srcset');
                    if (srcset) {
                        const allUrls = srcset.split(',')
                            .map(src => {
                                const [url, width] = src.trim().split(' ');
                                return {
                                    url: url.trim(),
                                    width: parseInt(width?.replace('w', '') || '0')
                                };
                            })
                            .sort((a, b) => b.width - a.width);

                        if (allUrls.length > 0) {
                            urls.push(allUrls[0].url);
                        }
                    }
                }
            });
            return urls;
        });

        console.log(`Found ${imageUrls.length} images for ${colorName}`);
        const dir = path.join(__dirname, 'imagenes', colorName.replace(/\s+/g, ''));
        fs.mkdirSync(dir, { recursive: true });

        for (let j = 0; j < imageUrls.length; j++) {
            const imageUrl = imageUrls[j];
            const filename = path.join(dir, `imagen_${j}.jpg`);
            console.log(`URL: ${imageUrl}`);
            console.log(`Saving to: ${filename}`);
            try {
                await delay(1000);
                await downloadImage(imageUrl, filename);
                console.log(`Downloaded (${j}/${imageUrls.length - 1}): ${filename}`);
            } catch (error) {
                console.error(`Failed to download ${filename}: ${error}`);
            }
        }
    }

    async function tryClickElement(page, element, description) {
        try {
            console.log(`Attempting click on ${description}...`);
            await page.evaluate(el => el.click(), element);
            await delay(500);

            const isSelected = await page.evaluate((el) => {
                return el.classList.contains('product-detail-color-selector__color-button--is-selected');
            }, element);

            console.log(`Click result: ${isSelected ? 'Successfully selected' : 'Not selected'}`);
            return isSelected;
        } catch (error) {
            console.log(`Click failed: ${error.message}`);
            return false;
        }
    }

    await processColorImages(selectedColorName);

    for (const button of colorButtons) {
        const isSelected = await page.evaluate((btn) =>
            btn.classList.contains('product-detail-color-selector__color-button--is-selected'), button);

        if (!isSelected) {
            const colorName = await page.evaluate((btn) => {
                const screenReaderText = btn.querySelector('.product-detail-color-selector__color-area .screen-reader-text');
                return screenReaderText?.textContent?.trim() || `color-${Math.random()}`;
            }, button);

            console.log(`Processing color: ${colorName}`);

            // Try clicking different elements
            let clickSuccess = await tryClickElement(page, button, 'button');

            if (!clickSuccess) {
                // Get parent li using evaluateHandle instead of $closest
                const parentLi = await page.evaluateHandle(btn =>
                    btn.closest('.product-detail-color-selector__color'), button);

                if (parentLi) {
                    clickSuccess = await tryClickElement(page, parentLi, 'li element');
                    await parentLi.dispose(); // Clean up the handle
                }
            }

            if (!clickSuccess) {
                const colorArea = await button.$('.product-detail-color-selector__color-area');
                if (colorArea) {
                    clickSuccess = await tryClickElement(page, colorArea, 'color area div');
                }
            }

            if (!clickSuccess) {
                console.log(`Failed to select color ${colorName}, skipping...`);
                continue;
            }

            await Promise.all([
                page.waitForSelector('.product-detail-color-selector__color-button--is-selected'),
                page.waitForSelector('.media-image__image', { visible: true })
            ]);

            await processColorImages(colorName);
            await delay(10000);
        }
    }

    await browser.close();
    console.log('Scraping completed successfully!');
} scrapeZaraImages().catch(error => {
    console.error('Scraping failed:', error);
    process.exit(1);
});

