'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { fetchStockData, fetchCryptoData, fetchHistoricalData, type MarketData } from '@/lib/api/market';
import { analyzeSentiment, type SentimentResult } from '@/lib/api/sentiment';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { toast } from 'sonner';

const chartConfig = {
    price: {
        label: 'Price',
        color: 'hsl(var(--primary))',
    },
} as const;

export function MarketAnalysis() {
    const [symbol, setSymbol] = useState('');
    const [activeTab, setActiveTab] = useState('stocks');
    const [marketData, setMarketData] = useState<MarketData | null>(null);
    const [historicalData, setHistoricalData] = useState<Array<{ date: string; price: number }>>([]);
    const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSearch() {
        if (!symbol) {
            toast.error('Please enter a symbol');
            return;
        }

        setLoading(true);
        setMarketData(null);
        setHistoricalData([]);
        setSentiment(null);

        try {
            // Fetch market data
            const data = activeTab === 'stocks'
                ? await fetchStockData(symbol)
                : await fetchCryptoData(symbol);
            setMarketData(data);

            // Fetch historical data
            const history = await fetchHistoricalData(symbol, activeTab === 'stocks');
            setHistoricalData(history.map((price: number, index: number) => ({
                date: new Date(Date.now() - (30 - index) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                price
            })));

            // Analyze sentiment
            const sentimentData = await analyzeSentiment(symbol);
            setSentiment(sentimentData);

            toast.success(`Successfully loaded data for ${symbol}`);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : `Failed to fetch data for ${symbol}`
            );
        } finally {
            setLoading(false);
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleSearch();
        }
    };

    return (
        <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                <TabsList>
                    <TabsTrigger value="stocks">Stocks</TabsTrigger>
                    <TabsTrigger value="crypto">Crypto</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex gap-4 mb-8">
                <Input
                    placeholder={`Enter ${activeTab === 'stocks' ? 'stock' : 'crypto'} symbol...`}
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    className="max-w-xs"
                    disabled={loading}
                />
                <Button onClick={handleSearch} disabled={loading}>
                    {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Loading...' : 'Search'}
                </Button>
            </div>

            {marketData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {marketData.symbol}
                                {marketData.change >= 0 ? (
                                    <TrendingUp className="text-green-500" />
                                ) : (
                                    <TrendingDown className="text-red-500" />
                                )}
                            </CardTitle>
                            <CardDescription>Current Market Data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-2xl font-bold">${marketData.price.toFixed(2)}</p>
                                <p className={marketData.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    {marketData.change.toFixed(2)}%
                                </p>
                                <p>Volume: {marketData.volume.toLocaleString()}</p>
                                {marketData.marketCap && (
                                    <p>Market Cap: ${(marketData.marketCap / 1e9).toFixed(2)}B</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {sentiment && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sentiment Analysis</CardTitle>
                                <CardDescription>Based on recent market news</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className={`text-xl font-bold ${sentiment.score > 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        Score: {sentiment.score.toFixed(2)}
                                    </p>
                                    <p>{sentiment.summary}</p>
                                    <p className="text-sm text-gray-500">
                                        Confidence: {(sentiment.confidence * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {historicalData.length > 0 && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Price History (30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[400px]">
                            <LineChart data={historicalData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" dot={false} />
                                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 