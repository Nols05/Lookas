import { NextRequest, NextResponse } from 'next/server';

// API authentication token read from environment variables
const INDITEX_AUTH_TOKEN = process.env.INDITEX_AUTH_TOKEN || '';

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

    // Parse the request body
    const body = await request.json();
    const { imageUrl } = body;

    // Validate the request
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Call the Inditex API
    const response = await fetch('https://api.inditex.com/pubvsearch/products', {
      method: 'POST',
      headers: {
        'Authorization': INDITEX_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageUrl }),
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

    // Return the API response
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error processing product search:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 