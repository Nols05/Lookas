import FileUpload from "@/components/FileUpload"
import { Pointer } from "@/components/magicui/pointer"
import VerticalTimeline from "@/components/VerticalTimeline"
import { Menu } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Pointer className="fill-black" />
      <VerticalTimeline />
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
      <main className="flex-1 mb-96">

        {/* Hero section with file upload */}
        <section className="container mx-auto px-6 py-20 md:py-32 flex flex-col items-center justify-center">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8">
              IS THERE AN OUTFIT YOU&apos;D LIKE TO TRY?
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
              If you found a garment you&apos;d like to try virtually, upload an image. Your style matters. Get started and
              discover how it would look on you.
            </p>

            <div className="max-w-md mx-auto">
              <FileUpload />
            </div>
          </div>
        </section>
      </main>


    </div>
  )
}
