"use client"

import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon, Loader2 } from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { ProductGrid } from "@/app/components/ProductGrid"

// Define an interface for the search results
interface ProductSearchResult {
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
  images?: string[];
  category?: string;
  description?: string;
  url?: string;
  [key: string]: string | number | string[] | boolean | object | undefined;
}

// Function to upload image to Cloudinary
const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Function to search products using server API
const searchProductsByImage = async (imageUrl: string): Promise<ProductSearchResult[]> => {
  try {
    const response = await fetch('/api/product-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

export default function FileUpload() {
  const maxSizeMB = 2
  const maxSize = maxSizeMB * 1024 * 1024 // 2MB default
  const [searchResults, setSearchResults] = useState<ProductSearchResult[] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      removeFile,
      getInputProps,
      addFiles,
    },
  ] = useFileUpload({
    accept: "image/svg+xml,image/png,image/jpeg,image/jpg,image/gif",
    maxSize,
  })
  const previewUrl = files[0]?.preview || null

  // Handle file selection and API call
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    addFiles(selectedFiles);
    // Resetear estados al seleccionar nuevo archivo
    setSearchResults(null);
  }, [addFiles]);

  // Handle image processing and search
  const handleProcessImage = async () => {
    if (files.length > 0) {
      try {
        setIsProcessing(true);
        const file = files[0].file as File;

        // First upload to Cloudinary
        const cloudinaryUrl = await uploadImage(file);

        // Then search with the Cloudinary URL
        const products = await searchProductsByImage(cloudinaryUrl);
        setSearchResults(products);
      } catch (error) {
        console.error("Error processing image:", error);
        // Show error to user
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Handle image paste events
  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault()
    console.log("Paste event detected")

    if (!e.clipboardData) return

    const items = e.clipboardData.items

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log("Pasted item type:", item.type)

      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          console.log("Image found:", file.name, file.type, file.size)
          // Create preview
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              handleFileSelect([file])
            }
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
  }, [handleFileSelect])

  // React paste handler
  const handleReactPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    console.log("React paste event detected")

    if (!e.clipboardData) return

    const items = e.clipboardData.items

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log("Pasted item type (React):", item.type)

      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          console.log("Image found (React):", file.name, file.type, file.size)
          // Create preview
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              handleFileSelect([file])
            }
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
  }, [handleFileSelect])

  // Open system file picker
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  // Setup paste events
  useEffect(() => {
    // Add paste event to document
    document.addEventListener('paste', handlePaste)

    // Also try with specific area
    const pasteArea = pasteAreaRef.current
    if (pasteArea) {
      pasteArea.addEventListener('paste', handlePaste)
    }

    // Clean up events when component unmounts
    return () => {
      document.removeEventListener('paste', handlePaste)
      if (pasteArea) {
        pasteArea.removeEventListener('paste', handlePaste)
      }
    }
  }, [handlePaste])

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto">
      <div className="relative">
        {/* Drop area */}
        <div
          ref={pasteAreaRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onPaste={handleReactPaste}
          data-dragging={isDragging || undefined}
          className={`border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px] ${!previewUrl ? 'min-h-52' : ''
            }`}
          tabIndex={0}
        >
          <input
            {...getInputProps()}
            ref={fileInputRef}
            className="sr-only"
            aria-label="Upload image file"
          />
          {previewUrl ? (
            <div className="p-4 mx-auto">
              <Image
                src={previewUrl}
                alt={files[0]?.file?.name || "Uploaded image"}
                width={320}
                height={240}
                className="object-contain max-h-40 max-w-sm"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center border"
                aria-hidden="true"
              >
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">Drop your image here</p>

              <p className="text-muted-foreground text-xs mt-1">
                Paste an image (Ctrl+V)

              </p>
              <Button
                variant="outline"
                className="mt-4 cursor-none"
                onClick={openFilePicker}
              >
                <UploadIcon
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                Select image
              </Button>
            </div>
          )}
        </div>

        {previewUrl && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => {
                removeFile(files[0]?.id);
                setSearchResults(null);
              }}
              aria-label="Remove image"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Process Image Button */}
        {previewUrl && (
          <Button
            className="mt-4 w-full hover:shadow-lg border-neutral-100 border cursor-none"
            onClick={handleProcessImage}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Process Image"}
          </Button>
        )}
      </div>

      {/* Inditex API Search Status */}
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <p className="text-sm">Searching for similar products...</p>
        </div>
      )}

      {/* Inditex API Search Results */}
      {searchResults && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-4">Search Results</h3>
          {searchResults.length === 0 ? (
            <p>No matching products found</p>
          ) : (
            <ProductGrid products={searchResults.map(product => ({
              ...product,
              imageUrl: product.images?.[0] // Use the first image from the results
            }))} />
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}



    </div>
  )
}
