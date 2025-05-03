"use server"

import puppeteer, { ElementHandle, Browser } from 'puppeteer';

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

async function exponentialBackoff(retryCount: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 1 minute
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
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
    const MAX_RETRIES = 3;
    const TIMEOUT = 30000; // Increased to 30 seconds

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

    await page.setUserAgent(USER_AGENT);

    // Add randomized viewport size
    await page.setViewport({
        width: 1366 + Math.floor(Math.random() * 100),
        height: 768 + Math.floor(Math.random() * 100),
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: true,
        isMobile: false
    });

    // Add additional browser fingerprint randomization
    await page.evaluateOnNewDocument(() => {
        // Override navigator properties
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

        // Add random plugins length
        Object.defineProperty(navigator, 'plugins', {
            get: () => new Array(Math.floor(Math.random() * 5) + 1).fill(null)
        });
    });

    try {
        let response = null;
        let retryCount = 0;

        while (!response && retryCount < MAX_RETRIES) {
            try {
                console.log(`Navigating to ${productUrl} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                response = await page.goto(productUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: TIMEOUT
                });

                // Check if we're being rate limited or blocked
                const content = await page.content();
                if (content.toLowerCase().includes('rate limit') ||
                    content.toLowerCase().includes('blocked') ||
                    content.toLowerCase().includes('captcha')) {

                    console.log('Detected protection mechanism, implementing backoff strategy...');
                    await exponentialBackoff(retryCount);

                    if (retryCount === MAX_RETRIES - 1) {
                        throw new Error('Protection mechanism detected after all retries');
                    }

                    retryCount++;
                    continue;
                }

            } catch (navigationError) {
                retryCount++;
                console.error(`Navigation attempt ${retryCount} failed:`, navigationError);

                if (retryCount === MAX_RETRIES) {
                    throw navigationError;
                }

                await exponentialBackoff(retryCount);
            }
        }

        if (!response) {
            throw new Error('Failed to load page: No response received after all retries');
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
                    await delay(1000); // Reduced from 10000 to 1000ms
                }
            }
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Scraping failed:', errorMessage);
        throw error;
    } finally {
        await page.close(); // Close only the page, not the browser
    }

    console.log('Scraping completed successfully!');
    return images;
}

