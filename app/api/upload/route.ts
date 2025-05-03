import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

interface CloudinaryResponse {
    secure_url: string;
    [key: string]: any;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert File to base64 for Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString('base64');
        const dataURI = `data:${file.type};base64,${base64String}`;

        // Upload to Cloudinary
        const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
            cloudinary.uploader.upload(dataURI, {
                folder: 'hackupc',
            }, (error: Error | undefined, result: CloudinaryResponse | undefined) => {
                if (error) reject(error);
                else if (result) resolve(result);
                else reject(new Error('No result from Cloudinary'));
            });
        });

        // Return the Cloudinary URL
        return NextResponse.json({
            url: result.secure_url
        });
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
} 