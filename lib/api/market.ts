export interface MarketData {
    symbol: string;
    price: number;
    change: number;
    volume: number;
    marketCap?: number;
    historicalData: Array<{
        date: string;
        price: number;
    }>;
}

export async function fetchStockData(symbol: string): Promise<MarketData> {
    const prices = await fetchHistoricalData(symbol, true);
    const historicalData = generateHistoricalDataPoints(prices);

    return {
        symbol: symbol,
        price: prices[prices.length - 1],
        change: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100,
        volume: 5234567,
        marketCap: 2.5e11,
        historicalData
    };
}

export async function fetchCryptoData(symbol: string): Promise<MarketData> {
    const mockPrices: Record<string, Omit<MarketData, 'symbol' | 'historicalData'>> = {
        'ETHEREUM': {
            price: 1839.20,
            change: -0.38,
            volume: 11549652018.419,
            marketCap: 222.08e9
        },
        'BITCOIN': {
            price: 43250.75,
            change: 1.2,
            volume: 28945671234.567,
            marketCap: 845.32e9
        }
    };

    const priceData = mockPrices[symbol] || {
        price: 500.00,
        change: 0.5,
        volume: 1000000000,
        marketCap: 50e9
    };

    const prices = await fetchHistoricalData(symbol, false);
    const historicalData = generateHistoricalDataPoints(prices);

    return {
        symbol,
        ...priceData,
        historicalData
    };
}

function generateHistoricalDataPoints(prices: number[]): Array<{ date: string; price: number }> {
    return prices.map((price, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (prices.length - 1 - index));
        return {
            date: date.toISOString(),
            price
        };
    });
}

export async function fetchHistoricalData(symbol: string, isStock: boolean): Promise<number[]> {
    // Generate realistic mock data based on current price
    const currentPrice = isStock ? 150.25 : (symbol === 'ETHEREUM' ? 1839.20 : 500.00);
    const volatility = isStock ? 0.02 : 0.04; // Higher volatility for crypto
    const trendStrength = 0.005; // Controls the strength of the trend

    // Generate 30 days of historical data with realistic price movements
    const prices: number[] = new Array(30);
    prices[29] = currentPrice; // Set the last price first

    // Generate prices going backwards
    for (let i = 28; i >= 0; i--) {
        const previousPrice = prices[i + 1];
        const daysSinceStart = i / 29; // Normalized time (0 to 1)

        // Create a trend component (slight upward trend)
        const trend = Math.sin(daysSinceStart * Math.PI) * trendStrength;

        // Random walk with controlled volatility
        const randomWalk = (Math.random() - 0.5) * volatility;

        // Combine trend and random walk
        const dailyReturn = trend + randomWalk;

        // Calculate new price with percentage change
        const newPrice = previousPrice * (1 + dailyReturn);

        // Store price with 2 decimal places
        prices[i] = Number(newPrice.toFixed(2));
    }

    return prices;
} 