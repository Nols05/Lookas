import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handles POST requests to upload an image file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate the request
    if (!file || !file.name) {
      return NextResponse.json(
        { error: 'File is required' },
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

    // Generate a unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    
    // Convert the file to an ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Save the file to the uploads directory
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, Buffer.from(buffer));
    
    // Return the URL to access the file
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ 
      success: true,
      fileUrl 
    });
    
  } catch (error) {
    console.error('Error processing image upload:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 