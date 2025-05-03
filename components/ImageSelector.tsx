"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import EvaluationModal from "./EvaluationModal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TaskResponse {
  error_code: number
  task_id: string
  task_type: string
}

interface ResultResponse {
  data: {
    image: string
  }
  error_code: number
  task_status: number
}

interface ImageSelectorProps {
  clothesImageUrl?: string | null
  isOpen: boolean
  onClose: () => void
}

export default function ImageSelector({ clothesImageUrl, isOpen, onClose }: ImageSelectorProps) {
  const [workoutType, setWorkoutType] = useState<string>("full_body")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)

  const handleWorkoutTypeChange = (value: string) => {
    setWorkoutType(value)
  }

  const checkTaskResult = async (taskId: string) => {
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY_TRY_ON!,
        "X-RapidAPI-Host": "try-on-clothes.p.rapidapi.com",
      },
    }

    const response = await fetch(
      `https://try-on-clothes.p.rapidapi.com/api/rapidapi/query-async-task-result?task_id=${taskId}`,
      options,
    )

    if (!response.ok) {
      throw new Error(`Error consultando resultado: ${response.status}`)
    }

    const result: ResultResponse = await response.json()
    return result
  }

  const pollTaskResult = async (taskId: string) => {
    const maxAttempts = 10
    const delayMs = 2000 // 2 segundos entre intentos

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await checkTaskResult(taskId)

      if (result.task_status === 2 && result.data?.image) {
        return result.data.image
      }

      // Si no está listo, esperamos antes del siguiente intento
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    throw new Error("Tiempo de espera agotado")
  }

  const handleGenerate = async () => {
    if (!selectedFile) {
      console.log("⚠️ Aviso: Debes seleccionar una imagen de una persona primero")
      return
    }

    setIsLoading(true)
    setResultImage(null)

    try {
      const formData = new FormData()
      formData.append("task_type", "async")
      formData.append("clothes_type", workoutType)
      formData.append("person_image", selectedFile)

      // Obtener la imagen de ropa ya sea de la URL proporcionada o la por defecto
      const imageUrl = clothesImageUrl || "/default-workout.jpg"

      try {
        console.log("Descargando imagen de ropa desde:", imageUrl)
        const clothesResponse = await fetch(imageUrl)
        if (!clothesResponse.ok) {
          throw new Error(`Error al descargar la imagen: ${clothesResponse.status}`)
        }

        const clothesBlob = await clothesResponse.blob()
        const fileName = clothesImageUrl ? "selected-clothes.jpg" : "default-workout.jpg"
        const clothesFile = new File([clothesBlob], fileName, { type: clothesBlob.type || "image/jpeg" })
        formData.append("clothes_image", clothesFile)

        console.log("Imagen de ropa procesada correctamente")
      } catch (error) {
        console.error("Error al procesar la imagen de ropa:", error)
        // Si falla, intentamos con la imagen por defecto
        const defaultResponse = await fetch("/default-workout.jpg")
        const defaultBlob = await defaultResponse.blob()
        const defaultFile = new File([defaultBlob], "default-workout.jpg", { type: "image/jpeg" })
        formData.append("clothes_image", defaultFile)
      }

      const options = {
        method: "POST",
        headers: {
          "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY_TRY_ON!,
          "X-RapidAPI-Host": "try-on-clothes.p.rapidapi.com",
        },
        body: formData,
      }

      console.log("Enviando petición inicial...")

      const response = await fetch("https://try-on-clothes.p.rapidapi.com/portrait/editing/try-on-clothes", options)

      if (!response.ok) {
        throw new Error(`Error en la petición inicial: ${response.status}`)
      }

      const data: TaskResponse = await response.json()
      console.log("Task ID recibido:", data.task_id)

      // Consultamos el resultado
      console.log("Consultando resultado...")
      const resultImageUrl = await pollTaskResult(data.task_id)

      // Actualizamos la imagen en la interfaz
      setResultImage(resultImageUrl)
      console.log("Imagen actualizada con éxito")
    } catch (error) {
      console.error("Error en el proceso:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setResultImage(null)
    setIsLoading(false)
    setIsEvaluationModalOpen(false)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-[90vw] w-full bg-white sm:max-w-[80vw] lg:max-w-[1200px] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-light tracking-tight uppercase">
              Try on the clothes
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm uppercase tracking-wider mb-2">
                  Garment Type
                </label>
                <Select value={workoutType} onValueChange={handleWorkoutTypeChange}>
                  <SelectTrigger className="w-full bg-white border-gray-200 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="upper_body">Upper Body</SelectItem>
                    <SelectItem value="lower_body">Lower Body</SelectItem>
                    <SelectItem value="full_body">Full Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm uppercase tracking-wider mb-2">
                  Select Person Image
                </label>
                <div className="flex flex-col gap-4">
                  <div className="relative border border-gray-200 shadow-sm bg-white p-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedFile(file)
                          setSelectedFileName(file.name)
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center text-sm uppercase tracking-wider">
                      {selectedFileName ? selectedFileName : "UPLOAD IMAGE"}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !selectedFile}
                    className={cn(
                      "w-full bg-black hover:bg-black/90 text-white",
                      isLoading && "bg-gray-200 text-gray-500"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>

                  <Button
                    onClick={() => resultImage && setIsEvaluationModalOpen(true)}
                    disabled={isLoading || !resultImage}
                    variant="outline"
                    className="w-full shadow-sm hover:shadow-md transition-shadow"
                  >
                    Evaluate
                  </Button>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="border border-gray-200 shadow-sm bg-white aspect-square w-full flex items-center justify-center">
                {resultImage ? (
                  <Image
                    src={resultImage}
                    alt="Result image"
                    width={400}
                    height={400}
                    className="object-contain max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-sm text-gray-400 uppercase tracking-wider">
                    {isLoading ? "Generating image..." : "Result will appear here"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EvaluationModal
        isOpen={isEvaluationModalOpen}
        onClose={() => setIsEvaluationModalOpen(false)}
        imageUrl={resultImage}
      />
    </>
  )
}
