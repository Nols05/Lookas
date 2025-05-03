import { Card } from '@/components/ui/card';

export function ProductSkeleton() {
    return (
        <Card className="overflow-hidden w-full animate-pulse max-w-2xl ml-26 ">
            <div className="p-4">
                <div className="flex flex-row gap-3 overflow-x-auto pb-2">
                    {/* Multiple image placeholders */}
                    {[1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className="relative aspect-square w-[200px] flex-shrink-0 rounded-lg bg-gray-200"
                        />
                    ))}
                </div>

                <div className="mt-4 space-y-3">
                    {/* Brand placeholder */}
                    <div className="h-4 w-24 bg-gray-200 rounded" />

                    {/* Name placeholder */}
                    <div className="space-y-2">
                        <div className="h-5 w-3/4 bg-gray-200 rounded" />
                        <div className="h-5 w-1/2 bg-gray-200 rounded" />
                    </div>

                    {/* Price placeholder */}
                    <div className="h-6 w-32 bg-gray-200 rounded" />

                    {/* Buttons placeholder */}
                    <div className="flex gap-2 mt-4">
                        <div className="flex-1 h-10 bg-gray-200 rounded" />
                        <div className="flex-1 h-10 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function ProductGridSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {[1, 2].map((index) => (
                <ProductSkeleton key={index} />
            ))}
        </div>
    );
} 