import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { IncomingMessage } from 'http';

const PRODUCT_URL = 'https://www.zara.com/es/es/chaqueta-corta-trabillas-p04387050.html';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, (response: IncomingMessage) => {
            if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve());
                });
            } else {
                response.resume();
                reject(new Error(`Failed to download ${url}. Status Code: ${response.statusCode}`));
                fs.unlink(filepath, (err) => { if (err) console.error(`Error removing partial file ${filepath}: ${err.message}`); });
                return;
            }
        });

        request.on('error', (err: Error) => {
            fs.unlink(filepath, (unlinkErr) => { if (unlinkErr) console.error(`Error removing file ${filepath} after request error: ${unlinkErr.message}`); });
            reject(new Error(`HTTPS request failed for ${url}: ${err.message}`));
        });
    });
}

async function scrapeZaraImages() {
    console.log('Starting Zara image scraper...');
    let browser: puppeteer.Browser | null = null;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page: puppeteer.Page = await browser.newPage();
        await page.setUserAgent(USER_AGENT);

        console.log(`Navigating to ${PRODUCT_URL}`);
        const response = await page.goto(PRODUCT_URL, { waitUntil: 'networkidle0', timeout: 60000 });
        console.log(`Response status: ${response?.status()} ${response?.statusText()}`);

        if (!response?.ok()) {
            throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
        }

        await page.waitForSelector('.product-detail-color-selector__colors', { visible: true, timeout: 30000 });

        const colorButtons: puppeteer.ElementHandle<Element>[] = await page.$$('.product-detail-color-selector__colors .product-detail-color-selector__color-button');
        console.log(`Found ${colorButtons.length} color variants`);

        const selectedButton: puppeteer.ElementHandle<Element> | null = await page.$('.product-detail-color-selector__color-button--is-selected');
        let selectedColorName: string = `default-color-${Math.random()}`;
        if (selectedButton) {
            selectedColorName = await page.evaluate((btn: Element) => {
                const screenReaderText = btn.querySelector('.product-detail-color-selector__color-area .screen-reader-text');
                return screenReaderText?.textContent?.trim() || `color-${Math.random()}`;
            }, selectedButton);
        }

        console.log(`Processing initially selected color: ${selectedColorName}`);

        async function processColorImages(colorName: string, currentPage: puppeteer.Page) {
            const imageUrls: string[] = await currentPage.evaluate(() => {
                const pictures: Element[] = Array.from(document.querySelectorAll('.media-image'));
                const urls: string[] = [];

                pictures.forEach(picture => {
                    const source = picture.querySelector('source[media="(min-width: 768px)"]');
                    if (source) {
                        const srcset = source.getAttribute('srcset');
                        if (srcset) {
                            const allUrls = srcset.split(',')
                                .map(src => {
                                    const [urlPart, widthPart] = src.trim().split(' ');
                                    return {
                                        url: urlPart?.trim(),
                                        width: parseInt(widthPart?.replace('w', '') || '0', 10)
                                    };
                                })
                                .filter(item => item.url && typeof item.url === 'string')
                                .sort((a, b) => b.width - a.width);

                            if (allUrls.length > 0 && allUrls[0].url) {
                                urls.push(allUrls[0].url);
                            }
                        }
                    }
                });
                return urls;
            });

            console.log(`Found ${imageUrls.length} images for ${colorName}`);
            const dir = path.join(__dirname, 'imagenes', colorName.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]+/g, ''));
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, { recursive: true });
            }

            for (let j = 0; j < imageUrls.length; j++) {
                const imageUrl = imageUrls[j];
                if (!imageUrl || !imageUrl.startsWith('https://')) {
                     console.warn(`Skipping invalid image URL for ${colorName}: ${imageUrl}`);
                     continue;
                }
                const filename = path.join(dir, `imagen_${j}.jpg`);
                console.log(`URL: ${imageUrl}`);
                console.log(`Saving to: ${filename}`);
                try {
                    await delay(500 + Math.random() * 500);
                    await downloadImage(imageUrl, filename);
                    console.log(`Downloaded (${j + 1}/${imageUrls.length}): ${filename}`);
                } catch (error) {
                     let errorMessage = 'Unknown error';
                     if (error instanceof Error) {
                         errorMessage = error.message;
                     }
                    console.error(`Failed to download ${filename}: ${errorMessage}`);
                }
            }
        }

         async function tryClickElement(currentPage: puppeteer.Page, element: puppeteer.ElementHandle<Element>, description: string): Promise<boolean> {
            try {
                console.log(`Attempting click on ${description}...`);
                await currentPage.evaluate((el: Element) => {
                     if (el instanceof HTMLElement) {
                         el.click();
                     } else {
                         console.warn('Element to click is not an HTMLElement');
                     }
                }, element);
                await delay(500);

                const isSelected = await currentPage.evaluate((el: Element): boolean => {
                    const parent = el.closest('.product-detail-color-selector__color');
                    const buttonSelected = el.classList.contains('product-detail-color-selector__color-button--is-selected');
                    const parentSelected = parent?.classList.contains('product-detail-color-selector__color--is-selected');
                    return !!(buttonSelected || parentSelected);
                }, element);

                console.log(`Click result for ${description}: ${isSelected ? 'Successfully selected' : 'Not selected'}`);
                return isSelected;
            } catch (error) {
                let errorMessage = 'Unknown click error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                console.log(`Click failed for ${description}: ${errorMessage}`);
                return false;
            }
        }

        if (selectedColorName && !selectedColorName.startsWith('default-color-')) {
            await processColorImages(selectedColorName, page);
        }

        for (const button of colorButtons) {
            try {
                 const isElementAttached = await page.evaluate((btn: Element) => !!btn.isConnected, button);
                 if (!isElementAttached) {
                     console.warn('Skipping a color button because it seems detached from DOM.');
                     continue;
                 }

                const isSelected = await page.evaluate((btn: Element) => {
                     const parent = btn.closest('.product-detail-color-selector__color');
                     return btn.classList.contains('product-detail-color-selector__color-button--is-selected') ||
                            parent?.classList.contains('product-detail-color-selector__color--is-selected');
                }, button);

                if (!isSelected) {
                    const colorName: string = await page.evaluate((btn: Element) => {
                        const screenReaderText = btn.querySelector('.product-detail-color-selector__color-area .screen-reader-text');
                        return screenReaderText?.textContent?.trim() || `color-${Math.random()}`;
                    }, button);

                    console.log(`Processing color: ${colorName}`);

                    let clickSuccess = false;

                    clickSuccess = await tryClickElement(page, button, `button for ${colorName}`);

                    if (!clickSuccess) {
                        const parentLiHandle = await page.evaluateHandle((btn: Element) =>
                            btn.closest('.product-detail-color-selector__color'), button);

                        if (parentLiHandle instanceof puppeteer.ElementHandle) {
                            clickSuccess = await tryClickElement(page, parentLiHandle, `li element for ${colorName}`);
                            await parentLiHandle.dispose();
                        } else {
                            await parentLiHandle.dispose();
                            console.log(`Could not find parent li for ${colorName} via evaluateHandle.`);
                        }
                    }

                    if (!clickSuccess) {
                        const colorAreaHandle = await button.$('.product-detail-color-selector__color-area');
                         if (colorAreaHandle) {
                            clickSuccess = await tryClickElement(page, colorAreaHandle, `color area div for ${colorName}`);
                            await colorAreaHandle.dispose();
                         } else {
                            console.log(`Could not find color area div for ${colorName}.`);
                         }
                    }

                    if (!clickSuccess) {
                        console.log(`Failed to select color ${colorName} after multiple attempts, skipping...`);
                        continue;
                    }

                     try {
                        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
                        console.log(`Navigation complete for ${colorName}`);
                     } catch (navError) {
                         let errorMessage = 'Unknown navigation error';
                         if (navError instanceof Error) {
                             errorMessage = navError.message;
                         }
                         console.log(`No full navigation detected for ${colorName}. Error: ${errorMessage}. Relying on element waits.`);
                         try {
                            await page.waitForSelector('.product-detail-color-selector__color-button--is-selected', { visible: true, timeout: 7000 });

                             await page.waitForSelector('.media-image__image', { visible: true, timeout: 7000 });
                             console.log(`Element visibility confirmed for ${colorName}`);
                         } catch (waitError) {
                             let waitErrorMessage = 'Unknown wait error';
                             if (waitError instanceof Error) {
                                 waitErrorMessage = waitError.message;
                             }
                             console.error(`Error waiting for elements after clicking ${colorName}: ${waitErrorMessage}. Proceeding, but image list might be stale.`);
                         }
                     }

                    await processColorImages(colorName, page);
                    await delay(1500 + Math.random() * 1000);
                }
            } catch (loopError) {
                 let loopErrorMessage = 'Unknown error in color loop';
                 if (loopError instanceof Error) {
                     loopErrorMessage = loopError.message;
                 }
                 console.error(`Error processing a color button: ${loopErrorMessage}. Attempting to continue...`);
                 await delay(1000);
            }
        }

        console.log('Scraping completed successfully!');

    } catch (error) {
         let mainErrorMessage = 'Unknown scraping error';
         if (error instanceof Error) {
             mainErrorMessage = error.message;
         }
        console.error('Scraping failed:', mainErrorMessage, (error instanceof Error ? error.stack : ''));
        process.exitCode = 1;
    } finally {
         if (browser) {
            try {
                 await browser.close();
                 console.log('Browser closed.');
            } catch (closeError) {
                 let closeErrorMessage = 'Unknown browser close error';
                 if (closeError instanceof Error) {
                     closeErrorMessage = closeError.message;
                 }
                 console.error('Error closing browser:', closeErrorMessage);
                 if (!process.exitCode) {
                     process.exitCode = 1;
                 }
            }
         }
    }
}

scrapeZaraImages();