import { perplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';

export interface SentimentResult {
    score: number;  // -1 to 1
    summary: string;
    confidence: number;
}

export async function analyzeSentiment(symbol: string): Promise<SentimentResult> {
    try {
        const prompt = `Analyze the market sentiment for ${symbol} based on recent news and market data. 
        Return a JSON object with:
        - score (number between -1 and 1, where -1 is very negative and 1 is very positive)
        - summary (brief explanation of the sentiment in 1-2 sentences)
        - confidence (number between 0 and 1)
        
        Format the response as valid JSON only, no other text.`;

        const { text } = await generateText({
            model: perplexity('sonar-pro'),
            prompt,
            temperature: 0.7,
            maxTokens: 150,
        });

        const result = JSON.parse(text);

        return {
            score: result.score,
            summary: result.summary,
            confidence: result.confidence,
        };
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        return {
            score: 0,
            summary: 'Unable to analyze sentiment at this time',
            confidence: 0,
        };
    }
} 