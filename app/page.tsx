import FileUpload from '@/components/FileUpload';

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Probador Virtual
      </h1>
      <FileUpload />
    </main>
  );
}