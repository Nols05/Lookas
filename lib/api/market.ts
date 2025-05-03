import { z } from 'zod';

const marketDataSchema = z.object({
    symbol: z.string(),
    price: z.number(),
    change: z.number(),
    volume: z.number(),
    marketCap: z.number().optional(),
});

export type MarketData = z.infer<typeof marketDataSchema>;

// Map of common crypto symbols to their CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'usdt': 'tether',
    'bnb': 'binancecoin',
    'xrp': 'ripple',
    'sol': 'solana',
    'ada': 'cardano',
    'doge': 'dogecoin',
    // Add more mappings as needed
};

// Fetch stock data from Yahoo Finance
export async function fetchStockData(symbol: string): Promise<MarketData> {
    const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch stock data for ${symbol}`);
    }

    const data = await response.json();
    const quote = data.chart.result[0].meta.regularMarketPrice;
    const previousClose = data.chart.result[0].meta.previousClose;

    return marketDataSchema.parse({
        symbol,
        price: quote,
        change: ((quote - previousClose) / previousClose) * 100,
        volume: data.chart.result[0].indicators.quote[0].volume[0] || 0,
    });
}

// Fetch crypto data from CoinGecko
export async function fetchCryptoData(symbol: string): Promise<MarketData> {
    // Convert symbol to CoinGecko ID
    const id = COINGECKO_ID_MAP[symbol.toLowerCase()] || symbol.toLowerCase();

    const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch crypto data for ${symbol}`);
    }

    const data = await response.json();
    const cryptoData = data[id];

    return marketDataSchema.parse({
        symbol: symbol.toUpperCase(), // Keep the original symbol in the response
        price: cryptoData.usd,
        change: cryptoData.usd_24h_change,
        volume: cryptoData.usd_24h_vol,
        marketCap: cryptoData.usd_market_cap,
    });
}

// Fetch historical data for charts
export async function fetchHistoricalData(symbol: string, isStock: boolean, days: number = 30) {
    if (isStock) {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${days}d`
        );
        const data = await response.json();
        return data.chart.result[0].indicators.quote[0].close;
    } else {
        // Convert symbol to CoinGecko ID
        const coinId = COINGECKO_ID_MAP[symbol.toLowerCase()] || symbol.toLowerCase();
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
        );
        const data = await response.json();
        return data.prices.map((price: number[]) => price[1]);
    }
} 