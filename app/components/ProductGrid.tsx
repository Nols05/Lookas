import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { scrapeProductImages } from '@/lib/scraping';

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

    useEffect(() => {
        setProducts(initialProducts);

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                    <a href={product.link} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="p-4">
                            {product.scrapedImages && product.scrapedImages.length > 0 ? (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Resultado {product.id}:</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {product.scrapedImages.map((image, index) => (
                                            <div key={index} className="relative aspect-square">
                                                <Image
                                                    src={image.url}
                                                    alt={`${product.name} - ${image.color}`}
                                                    fill
                                                    className="object-cover rounded-md"
                                                />
                                                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                                    {image.color}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : product.imageUrl ? (
                                <div className="relative aspect-square">
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="relative aspect-square bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">No Image</span>
                                </div>
                            )}

                            <p className="text-sm font-semibold uppercase mt-4">{product.brand}</p>
                            <h3 className="mt-1 text-lg font-medium line-clamp-2">{product.name}</h3>
                            <p className="mt-2 text-lg font-bold">
                                {product.price.currency} {product.price.value.current.toFixed(2)}
                                {product.price.value.original && (
                                    <span className="ml-2 text-sm text-gray-500 line-through">
                                        {product.price.value.original.toFixed(2)}
                                    </span>
                                )}
                            </p>
                        </div>
                    </a>
                </Card>
            ))}
        </div>
    );
} 