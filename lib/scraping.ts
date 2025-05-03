"use server"

import puppeteer, { ElementHandle } from 'puppeteer';


interface ImageInfo {
    url: string;
    color: string;
}

/**
 * Scrapes all product images from a Zara product page
 * @param productUrl The URL of the Zara product page
 * @returns Promise<ImageInfo[]> Array of image URLs with their associated colors
 */
export async function scrapeProductImages(productUrl: string): Promise<ImageInfo[]> {
    const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    const images: ImageInfo[] = [];

    console.log('Starting Zara image scraper...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    try {
        console.log(`Navigating to ${productUrl}`);
        const response = await page.goto(productUrl, { waitUntil: 'networkidle2' });

        if (!response) {
            throw new Error('Failed to load page: No response received');
        }

        console.log(`Response status: ${response.status()} ${response.statusText()}`);

        if (!response.ok()) {
            throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
        }

        async function getColorImages(): Promise<string[]> {
            return await page.evaluate(() => {
                const pictures = Array.from(document.querySelectorAll('.media-image'));
                const urls: string[] = [];

                pictures.forEach(picture => {
                    const source = picture.querySelector('source[media="(min-width: 768px)"]');
                    if (source) {
                        const srcset = source.getAttribute('srcset');
                        if (srcset) {
                            const allUrls = srcset.split(',')
                                .map(src => {
                                    const [url] = src.trim().split(' ');
                                    return url.trim();
                                })
                                .filter(url => {
                                    // Remove query parameters
                                    const urlWithoutParams = url.split('?')[0];
                                    // Check if the URL ends with e1.jpg specifically
                                    return urlWithoutParams.endsWith('e1.jpg');
                                });

                            if (allUrls.length > 0) {
                                urls.push(allUrls[0]);
                            }
                        }
                    }
                });
                return urls;
            });
        }

        // Check if color selector exists
        const hasColorSelector = await page.evaluate(() => {
            return !!document.querySelector('.product-detail-color-selector__colors');
        });

        if (!hasColorSelector) {
            console.log('No color selector found - processing single color product');
            const colorImages = await getColorImages();
            colorImages.forEach((url: string) => images.push({ url, color: 'default' }));
        } else {
            console.log('Color selector found - processing multiple colors');
            await page.waitForSelector('.product-detail-color-selector__colors', { visible: true });

            const colorButtons = await page.$$('.product-detail-color-selector__colors .product-detail-color-selector__color-button');
            console.log(`Found ${colorButtons.length} color variants`);

            const selectedButton = await page.$('.product-detail-color-selector__color-button--is-selected');
            if (!selectedButton) {
                throw new Error('No selected color button found');
            }

            const selectedColorName = await page.evaluate((btn: Element) => {
                const screenReaderText = btn.querySelector('.product-detail-color-selector__color-area .screen-reader-text');
                return screenReaderText?.textContent?.trim() || `color-${Math.random()}`;
            }, selectedButton);

            console.log(`Processing initially selected color: ${selectedColorName}`);

            async function tryClickElement(element: ElementHandle<Element>, description: string): Promise<boolean> {
                try {
                    console.log(`Attempting click on ${description}...`);
                    await page.evaluate((el) => (el as HTMLElement).click(), element);
                    await delay(500);

                    const isSelected = await page.evaluate((el: Element) => {
                        return el.classList.contains('product-detail-color-selector__color-button--is-selected');
                    }, element);

                    console.log(`Click result: ${isSelected ? 'Successfully selected' : 'Not selected'}`);
                    return isSelected;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.log(`Click failed: ${errorMessage}`);
                    return false;
                }
            }

            // Process initially selected color
            const initialImages = await getColorImages();
            initialImages.forEach(url => images.push({ url, color: selectedColorName }));

            // Process other colors
            for (const button of colorButtons) {
                const isSelected = await page.evaluate((btn: Element) =>
                    btn.classList.contains('product-detail-color-selector__color-button--is-selected'), button);

                if (!isSelected) {
                    const colorName = await page.evaluate((btn: Element) => {
                        const screenReaderText = btn.querySelector('.product-detail-color-selector__color-area .screen-reader-text');
                        return screenReaderText?.textContent?.trim() || `color-${Math.random()}`;
                    }, button);

                    console.log(`Processing color: ${colorName}`);

                    let clickSuccess = await tryClickElement(button, 'button');

                    if (!clickSuccess) {
                        const parentLi = await page.evaluateHandle(btn =>
                            btn.closest('.product-detail-color-selector__color'), button);

                        if (parentLi) {
                            const parentElement = parentLi.asElement() as ElementHandle<Element>;
                            if (parentElement) {
                                clickSuccess = await tryClickElement(parentElement, 'li element');
                            }
                            await parentLi.dispose();
                        }
                    }

                    if (!clickSuccess) {
                        const colorArea = await button.$('.product-detail-color-selector__color-area');
                        if (colorArea) {
                            clickSuccess = await tryClickElement(colorArea, 'color area div');
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

                    const colorImages = await getColorImages();
                    colorImages.forEach(url => images.push({ url, color: colorName }));
                    await delay(10000);
                }
            }
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Scraping failed:', errorMessage);
        throw error;
    } finally {
        await browser.close();
    }

    console.log('Scraping completed successfully!');
    return images;
}

