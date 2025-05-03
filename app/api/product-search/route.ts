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

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate the request
    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileType = file.type.split('/')[1];
    const extension = fileType === 'jpeg' || fileType === 'jpg' ? 'jpeg' : 'png';

    // Convert file to base64 and create a data URL
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const imageUrl = `data:image/${extension};base64,${base64Image}`;

    // Call the Inditex API with query parameter
    const encodedImageUrl = encodeURIComponent(imageUrl);
    const apiUrl = `https://api.inditex.com/pubvsearch/products?image=${encodedImageUrl}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': INDITEX_AUTH_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response:', response);

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