import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { scrapeProductImages } from '@/lib/scraping';
import { Button } from '@/components/ui/button';

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

    useEffect(() => {
        setProducts(initialProducts);
        setSelectedVariants({});

        const processProducts = async () => {
            const updatedProducts = await Promise.all(initialProducts.map(async (product) => {
                if (!product.imageUrl && product.link && product.link.includes('zara.com')) {
                    console.log(`Scraping images for ${product.name} from ${product.link}`);
                    try {
                        const scrapedImages = await scrapeProductImages(product.link);
                        console.log(`Scraped ${scrapedImages.length} images for ${product.name}`);

                        if (scrapedImages.length > 0) {
                            return {
                                ...product,
                                scrapedImages: scrapedImages
                            };
                        }
                        console.log(`No images found after scraping for ${product.name}`);
                        return product;
                    } catch (error) {
                        console.error(`Failed to scrape images for ${product.name}:`, error);
                        return product;
                    }
                }
                return product;
            }));

            setProducts(updatedProducts);
        };

        processProducts();
    }, [initialProducts]);

    const handleVariantSelect = (productId: string, variantIndex: number) => {
        setSelectedVariants(prev => ({
            ...prev,
            [productId]: variantIndex
        }));
    };

    return (
        <div className="flex flex-col gap-4">
            {products.map((product) => (
                <Card key={product.id} className="overflow-hidden w-full">
                    <div className="p-4">
                        {product.scrapedImages && product.scrapedImages.length > 0 ? (
                            <div>

                                <div className="flex flex-row gap-3 overflow-x-auto pb-2">
                                    {product.scrapedImages.map((image, index) => (
                                        <div
                                            key={index}
                                            className={`
                                                group relative aspect-square w-[200px] flex-shrink-0 cursor-pointer
                                                overflow-hidden rounded-lg
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
                                                className="object-cover rounded-lg"
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
                                    className="flex-1 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    disabled={!product.scrapedImages || selectedVariants[product.id] === undefined}
                                >
                                    {selectedVariants[product.id] !== undefined
                                        ? `Probar ${product.scrapedImages?.[selectedVariants[product.id]]?.color}`
                                        : 'Selecciona un color'
                                    }
                                </Button>
                                <Button variant="outline" className="flex-1" asChild>
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
    );
} 