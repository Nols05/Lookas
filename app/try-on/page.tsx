'use client';

import { useSearchParams } from 'next/navigation';
import ImageSelector from '@/components/ImageSelector';

export default function TryOnPage() {
    const searchParams = useSearchParams();
    const imageUrl = searchParams.get('imageUrl');

    return (
        <div className="container mx-auto py-8">
            <ImageSelector clothesImageUrl={imageUrl} />
        </div>
    );
} 