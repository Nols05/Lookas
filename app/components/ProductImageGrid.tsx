import { useState } from 'react';
import { toast } from 'sonner';
import { scrapeProductImages } from '@/lib/scraping';
import Image from 'next/image';

interface InditexProduct {
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
}

interface ProductImageGridProps {
    products: InditexProduct[];
}

export function ProductImageGrid({ products }: ProductImageGridProps) {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [productImages, setProductImages] = useState<Record<string, Array<{
        url: string;
        color: string;
    }>>>({});
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const loadImagesForProduct = async (product: InditexProduct) => {
        if (loadingStates[product.id]) return;

        try {
            setLoadingStates(prev => ({ ...prev, [product.id]: true }));
            const scrapedImages = await scrapeProductImages(product.link);

            setProductImages(prev => ({
                ...prev,
                [product.id]: scrapedImages
            }));

            if (scrapedImages.length === 0) {
                toast.error(`No images found for ${product.name}`);
            } else {
                toast.success(`Loaded ${scrapedImages.length} images for ${product.name}`);
            }
        } catch (error) {
            console.error('Failed to load images:', error);
            toast.error(`Failed to load images for ${product.name}`);
        } finally {
            setLoadingStates(prev => ({ ...prev, [product.id]: false }));
        }
    };

    const handleImageSelect = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        toast.success('Image selected!');
    };

    return (
        <div className="space-y-8">
            {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">{product.name}</h2>
                            <p className="text-gray-600">{product.price.value.current} {product.price.currency}</p>
                        </div>
                        <button
                            onClick={() => loadImagesForProduct(product)}
                            disabled={loadingStates[product.id]}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingStates[product.id] ? 'Loading...' : 'Load Images'}
                        </button>
                    </div>

                    {loadingStates[product.id] && (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {productImages[product.id] && (
                        <div className="space-y-4">
                            {/* Group images by color */}
                            {Object.entries(
                                productImages[product.id].reduce((acc, img) => {
                                    if (!acc[img.color]) {
                                        acc[img.color] = [];
                                    }
                                    acc[img.color].push(img.url);
                                    return acc;
                                }, {} as Record<string, string[]>)
                            ).map(([color, urls]) => (
                                <div key={color} className="space-y-2">
                                    <h3 className="text-lg font-medium">{color}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {urls.map((imageUrl, imageIndex) => (
                                            <div
                                                key={imageIndex}
                                                className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 ${selectedImage === imageUrl ? 'border-blue-500' : 'border-transparent'
                                                    }`}
                                                onClick={() => handleImageSelect(imageUrl)}
                                            >
                                                <Image
                                                    src={imageUrl}
                                                    alt={`${product.name} - ${color} - View ${imageIndex + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
} 