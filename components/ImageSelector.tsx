// components/ImageSelector.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface TaskResponse {
  error_code: number;
  task_id: string;
  task_type: string;
}

interface ResultResponse {
  data: {
    image: string;
  };
  error_code: number;
  task_status: number;
}

interface ImageSelectorProps {
  clothesImageUrl?: string | null;
}

export default function ImageSelector({ clothesImageUrl }: ImageSelectorProps) {
  const router = useRouter();
  const [workoutType, setWorkoutType] = useState<string>('full_body');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const handleWorkoutTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setWorkoutType(event.target.value);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log('Archivo seleccionado:', file.name);
    }
  };

  const checkTaskResult = async (taskId: string) => {
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '871410ef94msh6db4dc310d7d923p14f776jsna4303bde21e9',
        'X-RapidAPI-Host': 'try-on-clothes.p.rapidapi.com'
      }
    };

    const response = await fetch(
      `https://try-on-clothes.p.rapidapi.com/api/rapidapi/query-async-task-result?task_id=${taskId}`,
      options
    );

    if (!response.ok) {
      throw new Error(`Error consultando resultado: ${response.status}`);
    }

    const result: ResultResponse = await response.json();
    return result;
  };

  const pollTaskResult = async (taskId: string) => {
    const maxAttempts = 10;
    const delayMs = 2000; // 2 segundos entre intentos

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await checkTaskResult(taskId);
      
      if (result.task_status === 2 && result.data?.image) {
        return result.data.image;
      }

      // Si no está listo, esperamos antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Tiempo de espera agotado');
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      console.log('⚠️ Aviso: Debes seleccionar una imagen de una persona primero');
      return;
    }

    setIsLoading(true);
    setResultImage(null); // Limpiamos la imagen anterior si existe

    try {
      const formData = new FormData();
      formData.append('task_type', 'async');
      formData.append('clothes_type', workoutType);
      formData.append('person_image', selectedFile);

      // Obtener la imagen de ropa ya sea de la URL proporcionada o la por defecto
      const imageUrl = clothesImageUrl || '/default-workout.jpg';
      
      try {
        console.log('Descargando imagen de ropa desde:', imageUrl);
        const clothesResponse = await fetch(imageUrl);
        if (!clothesResponse.ok) {
          throw new Error(`Error al descargar la imagen: ${clothesResponse.status}`);
        }
        
        const clothesBlob = await clothesResponse.blob();
        const fileName = clothesImageUrl ? 'selected-clothes.jpg' : 'default-workout.jpg';
        const clothesFile = new File([clothesBlob], fileName, { type: clothesBlob.type || 'image/jpeg' });
        formData.append('clothes_image', clothesFile);
        
        console.log('Imagen de ropa procesada correctamente');
      } catch (error) {
        console.error('Error al procesar la imagen de ropa:', error);
        // Si falla, intentamos con la imagen por defecto
        const defaultResponse = await fetch('/default-workout.jpg');
        const defaultBlob = await defaultResponse.blob();
        const defaultFile = new File([defaultBlob], 'default-workout.jpg', { type: 'image/jpeg' });
        formData.append('clothes_image', defaultFile);
      }

      const options = {
        method: 'POST',
        headers: {
          'X-RapidAPI-Key': '871410ef94msh6db4dc310d7d923p14f776jsna4303bde21e9',
          'X-RapidAPI-Host': 'try-on-clothes.p.rapidapi.com'
        },
        body: formData
      };

      console.log('Enviando petición inicial...');
      
      const response = await fetch('https://try-on-clothes.p.rapidapi.com/portrait/editing/try-on-clothes', options);
      
      if (!response.ok) {
        throw new Error(`Error en la petición inicial: ${response.status}`);
      }

      const data: TaskResponse = await response.json();
      console.log('Task ID recibido:', data.task_id);

      // Consultamos el resultado
      console.log('Consultando resultado...');
      const resultImageUrl = await pollTaskResult(data.task_id);
      
      // Actualizamos la imagen en la interfaz
      setResultImage(resultImageUrl);
      console.log('Imagen actualizada con éxito');

    } catch (error) {
      console.error('Error en el proceso:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-5">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Volver
      </button>
      <div className="flex flex-col md:flex-row justify-between gap-5 mb-5">
        <div className="flex flex-col gap-2">
          <label 
            htmlFor="workout-type"
            className="font-semibold"
          >
            Tipo de prenda:
          </label>
          <select 
            id="workout-type" 
            value={workoutType} 
            onChange={handleWorkoutTypeChange}
            className="p-2 border rounded-md"
          >
            <option value="upper_body">Upper Body</option>
            <option value="lower_body">Lower Body</option>
            <option value="full_body">Full Body</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label 
            htmlFor="image-upload"
            className="font-semibold"
          >
            Seleccionar imagen (persona):
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="p-2 border rounded-md"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className={`
                ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}
                text-white font-semibold py-2 px-4 rounded-md transition-colors
                flex items-center gap-2
              `}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Procesando...
                </>
              ) : (
                'Generar'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center items-center min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
        {resultImage ? (
          <Image 
            src={resultImage}
            alt="Result image"
            width={400}
            height={400}
            className="object-contain max-h-[400px]"
          />
        ) : (
          <div className="text-gray-400">
            {isLoading ? 'Generando imagen...' : 'La imagen generada aparecerá aquí'}
          </div>
        )}
      </div>
    </div>
  );
}