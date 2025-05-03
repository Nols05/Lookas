"use server"

import puppeteer, { Browser } from 'puppeteer';

interface ImageInfo {
    url: string;
    color: string;
}

interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
}

let browserInstance: Browser | null = null;

async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true
        });
    }
    return browserInstance;
}

export async function closeBrowser() {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15'
];

async function getRandomUserAgent(): Promise<string> {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Scrapes all product images from a Zara product page
 * @param productUrl The URL of the Zara product page
 * @param proxy Optional proxy configuration
 * @returns Promise<ImageInfo[]> Array of image URLs with their associated colors
 */
export async function scrapeProductImages(productUrl: string, proxy?: ProxyConfig): Promise<ImageInfo[]> {
    const USER_AGENT = await getRandomUserAgent();
    const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    const images: ImageInfo[] = [];
    const TIMEOUT = 30000; // 30 seconds
    const CLICK_DELAY = 250; // Reduced from 1500ms
    const COLOR_LOAD_DELAY = 750;

    console.log('Starting Zara image scraper...');
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Configure proxy if provided
    if (proxy) {
        await page.authenticate({
            username: proxy.username || '',
            password: proxy.password || ''
        });

        const proxyServer = `http://${proxy.host}:${proxy.port}`;
        console.log(`Using proxy: ${proxyServer}`);

        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Proxy-Connection': 'keep-alive'
        });
    }

    // Optimize page setup by combining operations
    await Promise.all([
        page.setUserAgent(USER_AGENT),
        page.setViewport({
            width: 1366 + Math.floor(Math.random() * 100),
            height: 768 + Math.floor(Math.random() * 100),
            deviceScaleFactor: 1,
            hasTouch: false,
            isLandscape: true,
            isMobile: false
        }),
        page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', {
                get: () => new Array(Math.floor(Math.random() * 5) + 1).fill(null)
            });
        })
    ]);

    try {
        console.log(`Navigating to ${productUrl}`);
        const response = await page.goto(productUrl, {
            waitUntil: 'networkidle2',
            timeout: TIMEOUT
        });

        if (!response || !response.ok()) {
            throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`);
        }

        // Optimized getColorImages function with better selector caching
        async function getColorImages(): Promise<string[]> {
            return await page.evaluate(() => {
                const pictures = document.querySelectorAll('.media-image');
                return Array.from(pictures)
                    .map(picture => {
                        const source = picture.querySelector('source[media="(min-width: 768px)"]');
                        if (!source) return null;
                        const srcset = source.getAttribute('srcset');
                        if (!srcset) return null;
                        const urls = srcset.split(',')
                            .map(src => src.trim().split(' ')[0].trim())
                            .filter(url => url.split('?')[0].endsWith('e1.jpg'));
                        return urls[0] || null;
                    })
                    .filter(url => url !== null) as string[];
            });
        }

        // Optimized initial page analysis
        const { hasColorSelector, colorButtons, selectedColorName } = await page.evaluate(() => {
            const colorSelector = document.querySelector('.product-detail-color-selector__colors');
            if (!colorSelector) {
                return { hasColorSelector: false, colorButtons: [], selectedColorName: 'default' };
            }

            const buttons = Array.from(document.querySelectorAll('[data-qa-action="select-color"]'));
            const selectedBtn = document.querySelector('.product-detail-color-selector__color-button--is-selected');
            const selectedName = selectedBtn?.querySelector('.product-detail-color-selector__color-area .screen-reader-text')?.textContent?.trim() || 'default';

            return {
                hasColorSelector: true,
                colorButtons: buttons.map(btn => ({
                    isSelected: btn.classList.contains('product-detail-color-selector__color-button--is-selected'),
                    colorName: btn.querySelector('.screen-reader-text')?.textContent?.trim() || `color-${Math.random()}`
                })),
                selectedColorName: selectedName
            };
        });

        if (!hasColorSelector) {
            console.log('No color selector found - processing single color product');
            const colorImages = await getColorImages();
            colorImages.forEach(url => images.push({ url, color: 'default' }));
        } else {
            console.log(`Processing ${colorButtons.length} color variants`);

            // Process initially selected color
            const initialImages = await getColorImages();
            initialImages.forEach(url => images.push({ url, color: selectedColorName }));

            // Process other colors in parallel batches
            const BATCH_SIZE = 3;
            for (let i = 0; i < colorButtons.length; i += BATCH_SIZE) {
                const batch = colorButtons.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (colorInfo) => {
                    if (colorInfo.isSelected) return; // Skip already processed color

                    try {
                        // Click color button using optimized selector
                        await page.evaluate((colorName) => {
                            const buttons = Array.from(document.querySelectorAll('[data-qa-action="select-color"]'));
                            const targetButton = buttons.find(btn =>
                                btn.querySelector('.screen-reader-text')?.textContent?.trim() === colorName
                            );
                            if (targetButton) {
                                (targetButton as HTMLElement).click();
                                // Dispatch click event as backup
                                targetButton.dispatchEvent(new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                }));
                            }
                        }, colorInfo.colorName);

                        await delay(CLICK_DELAY);

                        // Wait for color change to complete
                        await Promise.all([
                            page.waitForSelector('.product-detail-color-selector__color-button--is-selected'),
                            page.waitForSelector('.media-image__image', { visible: true })
                        ]);

                        const colorImages = await getColorImages();
                        colorImages.forEach(url => images.push({ url, color: colorInfo.colorName }));

                        await delay(COLOR_LOAD_DELAY);
                    } catch (error) {
                        console.error(`Failed to process color ${colorInfo.colorName}:`, error);
                    }
                });

                await Promise.all(batchPromises);
            }
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Scraping failed:', errorMessage);
        throw error;
    } finally {
        await page.close();
    }

    console.log('Scraping completed successfully!');
    return images;
}

