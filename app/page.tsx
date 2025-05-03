import ImageSelector from '@/components/ImageSelector';

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Selector de Ejercicios
      </h1>
      <ImageSelector />
    </main>
  );
}