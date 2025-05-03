import { NextRequest, NextResponse } from 'next/server';

interface InditexApiProduct {
  id: string;
  name: string;
  price: {
    currency: string;
    value: {
      current: number;
      original: number | null;
    };
  };
  link: string;
  brand: string;
  images?: string[];
  category?: string;
  description?: string;
}

// API authentication token read from environment variables
const INDITEX_AUTH_TOKEN = process.env.INDITEX_AUTH_TOKEN || '';
const INDITEX_API_URL = process.env.INDITEX_API_URL || 'https://api.inditex.com/pubvsearch/products';

/**
 * Handles POST requests to search for products by image
 */
export async function POST(request: NextRequest) {
  try {
    // Check if auth token is available
    if (!INDITEX_AUTH_TOKEN) {
      console.error('Missing Inditex authentication token');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { imageUrl } = body;

    // Validate the request
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const apiUrl = `${INDITEX_API_URL}?perPage=4&image=${encodeURIComponent(imageUrl)}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `${INDITEX_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Inditex API error:', errorText);

      return NextResponse.json(
        { error: `API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    // Parse and transform the API response
    const data = await response.json();

    // Transform the data to match our expected format
    const transformedProducts = data.map((item: InditexApiProduct) => ({
      id: item.id,
      name: item.name,
      price: {
        currency: item.price.currency,
        value: {
          current: item.price.value.current,
          original: item.price.value.original
        }
      },
      link: item.link,
      brand: item.brand,
      images: item.images || [],
      category: item.category,
      description: item.description
    }));

    return NextResponse.json(transformedProducts);

  } catch (error) {
    console.error('Error processing product search:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 