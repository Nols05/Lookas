import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { scrapeProductImages, closeBrowser } from '@/lib/scraping';
import { Button } from '@/components/ui/button';
import ImageSelector from '@/components/ImageSelector';
import { ProductGridSkeleton } from './ProductSkeleton';

interface Product {
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
    imageUrl?: string;
    scrapedImages?: Array<{
        url: string;
        color: string;
    }>;
}

interface ProductGridProps {
    products: Product[];
}

export function ProductGrid({ products: initialProducts }: ProductGridProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
    const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const processingCycleRef = useRef<string | null>(null);
    const BATCH_SIZE = 4; // Process 4 products in parallel

    const handleTryOn = (product: Product, variantIndex: number) => {
        const imageUrl = product.scrapedImages?.[variantIndex]?.url;
        if (imageUrl) {
            setSelectedImageUrl(imageUrl);
            setIsImageSelectorOpen(true);
        }
    };

    useEffect(() => {
        const currentCycle = JSON.stringify(initialProducts);

        if (isProcessing || processingCycleRef.current === currentCycle) return;

        const processProducts = async () => {
            setIsProcessing(true);
            processingCycleRef.current = currentCycle;

            try {
                const productsToProcess = initialProducts.filter(
                    product => !product.imageUrl && product.link && product.link.includes('zara.com')
                );

                const processedProducts = [...initialProducts];

                // Process products in batches
                for (let i = 0; i < productsToProcess.length; i += BATCH_SIZE) {
                    const batch = productsToProcess.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(async (product) => {
                        try {
                            console.log(`Scraping images for ${product.name} from ${product.link}`);
                            const scrapedImages = await scrapeProductImages(product.link);
                            console.log(`Scraped ${scrapedImages.length} images for ${product.name}`);

                            if (scrapedImages.length > 0) {
                                const index = processedProducts.findIndex(p => p.id === product.id);
                                if (index !== -1) {
                                    processedProducts[index] = {
                                        ...product,
                                        scrapedImages: scrapedImages
                                    };
                                }
                            } else {
                                console.log(`No images found after scraping for ${product.name}`);
                            }
                        } catch (error) {
                            console.error(`Failed to scrape images for ${product.name}:`, error);
                        }
                    });

                    // Wait for the current batch to complete and update the UI
                    await Promise.all(batchPromises);
                    setProducts([...processedProducts]);
                }
            } finally {
                setIsProcessing(false);
                await closeBrowser(); // Clean up browser instance after all processing is done
            }
        };

        processProducts();

        // Cleanup function to ensure browser is closed when component unmounts
        return () => {
            closeBrowser().catch(console.error);
        };
    }, [initialProducts]);

    const handleVariantSelect = (productId: string, variantIndex: number) => {
        setSelectedVariants(prev => ({
            ...prev,
            [productId]: variantIndex
        }));
    };

    return (
        <>
            {isProcessing ? (
                <ProductGridSkeleton />
            ) : (
                <div className="grid grid-cols-2 gap-8 w-4xl">
                    {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden">
                            <div className="p-4">
                                {product.scrapedImages && product.scrapedImages.length > 0 ? (
                                    <div>
                                        <div className="flex flex-row gap-3 overflow-x-auto pb-2">
                                            {product.scrapedImages.map((image, index) => (
                                                <div
                                                    key={index}
                                                    className={`
                                                        group relative aspect-square w-[200px] flex-shrink-0 cursor-pointer
                                                        overflow-hidden
                                                        ${selectedVariants[product.id] === index
                                                            ? 'shadow-[0_0_15px_rgba(0,0,0,0.2)] transform scale-[1.02]'
                                                            : 'hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:scale-[1.01]'
                                                        }
                                                        transition-all duration-200 ease-in-out
                                                    `}
                                                    onClick={() => handleVariantSelect(product.id, index)}
                                                >
                                                    <Image
                                                        src={image.url}
                                                        alt={`${product.name} - ${image.color}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 text-center">
                                                        {image.color}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : product.imageUrl ? (
                                    <div className="relative aspect-square w-full">
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative aspect-square w-full bg-gray-200 flex items-center justify-center rounded-lg">
                                        <span className="text-gray-500 text-xs">No Image</span>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <p className="text-sm font-semibold uppercase">{product.brand}</p>
                                    <h3 className="mt-1 text-lg font-medium line-clamp-2">{product.name}</h3>
                                    <p className="mt-2 text-lg font-bold">
                                        {product.price.currency} {product.price.value.current.toFixed(2)}
                                        {product.price.value.original && (
                                            <span className="ml-2 text-sm text-gray-500 line-through">
                                                {product.price.value.original.toFixed(2)}
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            className="flex-1 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-none"
                                            disabled={!product.scrapedImages || selectedVariants[product.id] === undefined}
                                            onClick={() => selectedVariants[product.id] !== undefined && handleTryOn(product, selectedVariants[product.id])}
                                        >
                                            {selectedVariants[product.id] !== undefined
                                                ? `Probar ${product.scrapedImages?.[selectedVariants[product.id]]?.color}`
                                                : 'Selecciona un color'
                                            }
                                        </Button>
                                        <Button variant="outline" className="flex-1 cursor-none" asChild>
                                            <a href={product.link} target="_blank" rel="noopener noreferrer">
                                                Ver en tienda
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <ImageSelector
                isOpen={isImageSelectorOpen}
                onClose={() => {
                    setIsImageSelectorOpen(false);
                    setSelectedImageUrl(null);
                }}
                clothesImageUrl={selectedImageUrl}
            />
        </>
    );
} 