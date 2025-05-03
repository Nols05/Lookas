"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Modal from "./Modal"
import { Loader2 } from "lucide-react"
import EvaluationModal from "./EvaluationModal"

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

  const handleWorkoutTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setWorkoutType(event.target.value)
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setSelectedFileName(file.name)
      console.log("Archivo seleccionado:", file.name)
    }
  }

  const checkTaskResult = async (taskId: string) => {
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "e74b3e8abfmshd437b375b1486fep15f172jsn8653ffba2102",
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
          "X-RapidAPI-Key": "e74b3e8abfmshd437b375b1486fep15f172jsn8653ffba2102",
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

  const handleEvaluateClick = () => {
    if (resultImage) {
      setIsEvaluationModalOpen(true)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-light tracking-tight uppercase mb-8">Pruébate la ropa</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="workout-type" className="block text-sm uppercase tracking-wider mb-2">
                  Garment Type
                </label>
                <select
                  id="workout-type"
                  value={workoutType}
                  onChange={handleWorkoutTypeChange}
                  className="w-full p-3 border border-gray-300 bg-transparent focus:outline-none"
                >
                  <option value="upper_body">Upper Body</option>
                  <option value="lower_body">Lower Body</option>
                  <option value="full_body">Full Body</option>
                </select>
              </div>

              <div>
                <label htmlFor="image-upload" className="block text-sm uppercase tracking-wider mb-2">
                  Select Person Image
                </label>
                <div className="flex flex-col gap-4">
                  <div className="relative border border-gray-300 p-3">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center text-sm uppercase tracking-wider">
                      {selectedFileName ? selectedFileName : "UPLOAD IMAGE"}
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !selectedFile}
                    className={`
                      ${isLoading ? "bg-gray-200 text-gray-500" : "bg-black text-white hover:bg-black/90"}
                      py-3 px-6 transition-colors uppercase text-sm tracking-wider
                      flex items-center justify-center
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing
                      </>
                    ) : (
                      "Generate"
                    )}
                  </button>

                  <button
                    onClick={handleEvaluateClick}
                    disabled={isLoading || !resultImage}
                    className={`
                      ${isLoading || !resultImage ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}
                      py-3 px-6 transition-colors uppercase text-sm tracking-wider
                      flex items-center justify-center mt-2
                    `}
                  >
                    Evaluate
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="border border-gray-300 aspect-square w-full flex items-center justify-center">
                {resultImage ? (
                  <Image
                    src={resultImage || "/placeholder.svg"}
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
        </div>
      </Modal>

      <EvaluationModal
        isOpen={isEvaluationModalOpen}
        onClose={() => setIsEvaluationModalOpen(false)}
        imageUrl={resultImage}
      />
    </>
  )
}
