"use client"

import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"

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

  // Manejar el evento de pegar imágenes
  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    console.log("Evento de pegado detectado")
    
    if (!e.clipboardData) return
    
    const items = e.clipboardData.items
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log("Tipo de elemento pegado:", item.type)
      
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          console.log("Imagen encontrada:", file.name, file.type, file.size)
          // Crear una vista previa
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

  // Manejador de eventos de pegado para React
  const handleReactPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    console.log("Evento React de pegado detectado")
    
    if (!e.clipboardData) return
    
    const items = e.clipboardData.items
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log("Tipo de elemento pegado (React):", item.type)
      
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          console.log("Imagen encontrada (React):", file.name, file.type, file.size)
          // Crear una vista previa
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

  // Manejar el evento de seleccionar archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files)
      onClose()
    }
  }

  // Confirmar la imagen pegada
  const confirmPastedImage = () => {
    if (pastedFile) {
      onFileSelect([pastedFile])
      onClose()
    }
  }

  // Abrir el selector de archivos del sistema
  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  // Configurar eventos de pegado
  useEffect(() => {
    if (!isOpen) return

    // Agregar evento de paste al documento completo
    document.addEventListener('paste', handlePaste)
    
    // También intentar con el área específica
    const pasteArea = pasteAreaRef.current
    if (pasteArea) {
      pasteArea.addEventListener('paste', handlePaste)
    }
    
    // Limpiar los eventos cuando el componente se desmonte o se cierre
    return () => {
      document.removeEventListener('paste', handlePaste)
      if (pasteArea) {
        pasteArea.removeEventListener('paste', handlePaste)
      }
    }
  }, [isOpen])

  // Enfocar el área de pegado cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      // Dar tiempo al DOM para renderizar el diálogo
      setTimeout(() => {
        if (pasteAreaRef.current) {
          pasteAreaRef.current.focus()
        }
      }, 100)
    } else {
      // Limpiar estado al cerrar
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
          <h3 className="text-lg font-medium">Seleccionar imagen</h3>
          <button 
            onClick={onClose} 
            className="rounded-full p-1 hover:bg-accent"
            aria-label="Cerrar"
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
              <img 
                src={pastedImage} 
                alt="Imagen pegada" 
                className="max-h-52 mx-auto object-contain rounded"
              />
              <Button onClick={confirmPastedImage}>Usar esta imagen</Button>
            </div>
          ) : (
            <div className="space-y-4" onClick={() => pasteAreaRef.current?.focus()}>
              <div className="bg-background mb-2 flex size-11 mx-auto shrink-0 items-center justify-center rounded-full border">
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="text-sm font-medium">Pega una imagen aquí (Ctrl+V)</p>
              <p className="text-muted-foreground text-xs">
                La imagen debe ser menor de {maxSizeMB}MB
              </p>
              <p className="text-muted-foreground text-xs">
                Haz clic aquí y luego presiona Ctrl+V
              </p>
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm">O selecciona un archivo</p>
          <Button 
            variant="outline" 
            onClick={openFilePicker}
            className="w-full"
          >
            <UploadIcon className="size-4 me-2" />
            Seleccionar archivo
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

  // Manejar la selección de archivos desde el diálogo personalizado
  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    addFiles(selectedFiles)
  }

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
              <img
                src={previewUrl}
                alt={files[0]?.file?.name || "Uploaded image"}
                className="mx-auto max-h-full rounded object-contain"
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
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove image"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Diálogo para seleccionar o pegar imágenes */}
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
