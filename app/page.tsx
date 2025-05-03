import FileUpload from "@/components/FileUpload"
import { Pointer } from "@/components/magicui/pointer"
import VerticalTimeline from "@/components/VerticalTimeline"
import { Menu } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pb-96">
      <Pointer className="fill-black" />
      <VerticalTimeline />
      {/* Header with minimal navigation */}
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex items-center">
          <button className="p-2">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="ml-4 font-light text-2xl">LOOKAS</h2>
        </div>
      </header>



      {/* Upload section */}
      <main className="flex-1 mb-96">

        {/* Hero section with file upload */}
        <section className="container mx-auto px-6 py-20 md:py-32 max-w-4xl">
          <div className="mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8">
              IS THERE AN OUTFIT<br /><span className="font-bold">
                YOU&apos;D LIKE TO TRY?

              </span>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
              If you found a garment you&apos;d like to try virtually, upload an image. Your style matters. Get started and
              discover how it would look on you.
            </p>

            <div className="w-[58rem] ">
              <FileUpload />
            </div>
          </div>
        </section>
      </main>


    </div>
  )
}
