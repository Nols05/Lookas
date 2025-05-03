import Image from 'next/image';
import { Card } from '@/components/ui/card';

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
}

interface ProductGridProps {
    products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                    <a href={product.link} target="_blank" rel="noopener noreferrer" className="block">
                        {product.imageUrl && (
                            <div className="relative aspect-square">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="p-4">
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
                        </div>
                    </a>
                </Card>
            ))}
        </div>
    );
} 