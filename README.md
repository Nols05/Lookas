# Market Analysis Dashboard

A real-time market analysis dashboard for stocks and cryptocurrencies, built for HackUPC. This application provides market data visualization, sentiment analysis, and technical indicators for both stocks and crypto assets.

## Features

- Real-time market data from Yahoo Finance (stocks) and CoinGecko (crypto)
- Interactive price charts with 30-day historical data
- Sentiment analysis using Perplexity AI
- Technical indicators and trend analysis
- Clean, modern UI built with Next.js and Shadcn

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- PostgreSQL with Prisma ORM
- TailwindCSS
- Shadcn UI Components
- Recharts for data visualization
- Perplexity API for sentiment analysis

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd market-analysis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your values:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `PERPLEXITY_API_KEY`: Your Perplexity API key

4. Initialize the database:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Select between Stocks or Crypto using the tabs
2. Enter a symbol (e.g., "AAPL" for Apple stock or "bitcoin" for Bitcoin)
3. Click Search to view:
   - Current market data
   - Price chart
   - Sentiment analysis
   - Technical indicators

## API Keys

- No API key is required for basic Yahoo Finance and CoinGecko functionality
- Perplexity API key is required for sentiment analysis
  - Get your key at [Perplexity AI](https://www.perplexity.ai/)

## Contributing

This is a hackathon project, but contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this code for your own projects!
