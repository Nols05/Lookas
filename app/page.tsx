import FileUpload from "@/components/FileUpload"
import { Menu } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with minimal navigation */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center">
          <button className="p-2">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="ml-4 font-light text-2xl">ZARA FINDER</h2>
        </div>
      </header>



      {/* Upload section */}
      <main className="flex-1">
        {/* Hero section with file upload */}
        <section className="container mx-auto px-6 py-20 md:py-32 flex flex-col items-center justify-center">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8">
              IS THERE AN OUTFIT YOU'D LIKE TO TRY?
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
              If you found a garment you'd like to try virtually, upload an image. Your style matters. Get started and
              discover how it would look on you.
            </p>

            <div className="max-w-md mx-auto">
              <FileUpload />
            </div>
          </div>
        </section>
      </main>

      {/* Steps section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gray-200 aspect-square flex items-center justify-center relative">
            <span className="absolute top-4 left-4 text-2xl font-light">01</span>
            <span className="text-xl uppercase">UPLOAD</span>
          </div>
          <div className="bg-gray-200 aspect-square flex items-center justify-center relative">
            <span className="absolute top-4 left-4 text-2xl font-light">02</span>
            <span className="text-xl uppercase">ANALYZE</span>
          </div>
          <div className="bg-gray-200 aspect-square flex items-center justify-center relative">
            <span className="absolute top-4 left-4 text-2xl font-light">03</span>
            <span className="text-xl uppercase">MATCH</span>
          </div>
          <div className="bg-gray-200 aspect-square flex items-center justify-center relative">
            <span className="absolute top-4 left-4 text-2xl font-light">04</span>
            <span className="text-xl uppercase">TRY ON</span>
          </div>
          <div className="bg-gray-200 aspect-square flex items-center justify-center relative">
            <span className="absolute top-4 left-4 text-2xl font-light">05</span>
            <span className="text-xl uppercase">SHOP</span>
          </div>
        </div>
      </section>

      {/* Feature section with image */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8">
              SUCCEED WITH VIRTUAL FITTING
            </h2>

            <p className="text-lg text-gray-600 max-w-3xl mb-12">
              From the moment you upload your image to finding the perfect fit, our streamlined process empowers you
              to shop with confidence. With our virtual fitting technology seamlessly integrated and rigorously
              tested, your shopping experience will be transformed.
            </p>
          </div>

          <div className="mt-12 relative h-[400px] md:h-[500px] bg-gray-200 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-light text-white z-10">VIRTUAL FITTING |</span>
              <Image
                src="/placeholder.svg?height=500&width=1200"
                alt="Virtual fitting showcase"
                fill
                className="object-cover opacity-70"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
