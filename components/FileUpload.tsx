"use client"

import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"

// Define an interface for the search results
interface ProductSearchResult {
  id?: string;
  name?: string;
  images?: string[];
  price?: number;
  brand?: string;
  category?: string;
  description?: string;
  url?: string;
  [key: string]: string | number | string[] | boolean | object | undefined;
}

// Function to upload image to server
const uploadImageToServer = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.fileUrl; // Return the URL of the uploaded file
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

// Componente de diálogo para seleccionar o pegar imágenes
function ImageDialog({ 
  isOpen, 
  onClose, 
  onFileSelect, 
  maxSizeMB 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onFileSelect: (files: FileList | File[]) => void;
  maxSizeMB: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteAreaRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [pastedImage, setPastedImage] = useState<string | null>(null)
  const [pastedFile, setPastedFile] = useState<File | null>(null)

  // Handle image paste events
  const handlePaste = (e: ClipboardEvent) => {
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
              setPastedImage(e.target.result as string)
              setPastedFile(file)
            }
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
  }

  // React paste handler
  const handleReactPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
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
              setPastedImage(e.target.result as string)
              setPastedFile(file)
            }
          }
          reader.readAsDataURL(file)
          break
        }
      }
    }
  }

  // Handle file selection events
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files)
      onClose()
    }
  }

  // Confirm pasted image
  const confirmPastedImage = () => {
    if (pastedFile) {
      onFileSelect([pastedFile])
      onClose()
    }
  }

  // Open system file picker
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  // Setup paste events
  useEffect(() => {
    if (!isOpen) return

    // Add paste event to document
    document.addEventListener('paste', handlePaste)
    
    // Also try with specific area
    const pasteArea = pasteAreaRef.current
    if (pasteArea) {
      pasteArea.addEventListener('paste', handlePaste)
    }
    
    // Clean up events when component unmounts or closes
    return () => {
      document.removeEventListener('paste', handlePaste)
      if (pasteArea) {
        pasteArea.removeEventListener('paste', handlePaste)
      }
    }
  }, [isOpen])

  // Focus paste area when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Give time for DOM to render
      setTimeout(() => {
        if (pasteAreaRef.current) {
          pasteAreaRef.current.focus()
        }
      }, 100)
    } else {
      // Clear state when closing
      setPastedImage(null)
      setPastedFile(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      ref={dialogRef}
    >
      <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Select Image</h3>
          <button 
            onClick={onClose} 
            className="rounded-full p-1 hover:bg-accent"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div 
          ref={pasteAreaRef}
          tabIndex={0}
          onPaste={handleReactPaste}
          className="border border-dashed rounded-lg p-6 mb-4 text-center focus:outline-none focus:ring-2 focus:ring-ring cursor-text"
        >
          {pastedImage ? (
            <div className="space-y-4">
              <Image 
                src={pastedImage} 
                alt="Pasted image" 
                width={320}
                height={240}
                className="max-h-52 mx-auto object-contain rounded"
                style={{ width: 'auto', height: 'auto', maxHeight: '13rem' }}
              />
              <Button onClick={confirmPastedImage}>Use this image</Button>
            </div>
          ) : (
            <div className="space-y-4" onClick={() => pasteAreaRef.current?.focus()}>
              <div className="bg-background mb-2 flex size-11 mx-auto shrink-0 items-center justify-center rounded-full border">
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="text-sm font-medium">Paste an image here (Ctrl+V)</p>
              <p className="text-muted-foreground text-xs">
                Image must be less than {maxSizeMB}MB
              </p>
              <p className="text-muted-foreground text-xs">
                Click here and then press Ctrl+V
              </p>
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm">Or select a file</p>
          <Button 
            variant="outline" 
            onClick={openFilePicker}
            className="w-full"
          >
            <UploadIcon className="size-4 me-2" />
            Select file
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}

export default function FileUpload() {
  const maxSizeMB = 2
  const maxSize = maxSizeMB * 1024 * 1024 // 2MB default
  const [showDialog, setShowDialog] = useState(false)
  const [searchResults, setSearchResults] = useState<ProductSearchResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

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
  const handleFileSelect = async (selectedFiles: FileList | File[]) => {
    addFiles(selectedFiles);
    
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      try {
        setIsSearching(true);
        
        // Upload the image to our server
        const imageUrl = await uploadImageToServer(file);
        
        // Search for products with the image URL
        const products = await searchProductsByImage(imageUrl);
        setSearchResults(products);
      } catch (error) {
        console.error("Error processing image:", error);
        // Show error to user
      } finally {
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* Drop area */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload image file"
          />
          {previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Image
                src={previewUrl}
                alt={files[0]?.file?.name || "Uploaded image"}
                width={320}
                height={240}
                className="mx-auto max-h-full rounded object-contain"
                style={{ width: 'auto', height: 'auto', maxHeight: '100%' }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">Drop your image here</p>
              <p className="text-muted-foreground text-xs">
                SVG, PNG, JPG or GIF (max. {maxSizeMB}MB)
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowDialog(true)}
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
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
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
      </div>

      {/* Inditex API Search Status */}
      {isSearching && (
        <div className="mt-4 text-center">
          <p className="text-sm">Searching for similar products...</p>
        </div>
      )}

      {/* Inditex API Search Results */}
      {searchResults && !isSearching && (
        <div className="mt-4 border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Search Results</h3>
          {searchResults.length === 0 ? (
            <p>No matching products found</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Display search results here */}
              <pre className="text-xs overflow-auto max-h-60">
                {JSON.stringify(searchResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Image Dialog */}
      <ImageDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onFileSelect={handleFileSelect}
        maxSizeMB={maxSizeMB}
      />

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      <p
        aria-live="polite"
        role="region"
        className="text-muted-foreground mt-2 text-center text-xs"
      >
        Single image uploader w/ max size (drop area + button) ∙{" "}
        <a
          href="https://github.com/origin-space/originui/tree/main/docs/use-file-upload.md"
          className="hover:text-foreground underline"
        >
          API
        </a>
      </p>
    </div>
  )
}
