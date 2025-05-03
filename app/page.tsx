import { MarketAnalysis } from './components/MarketAnalysis';

export default function Page() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Market Analysis Dashboard</h1>
      <MarketAnalysis />
    </main>
  );
}
