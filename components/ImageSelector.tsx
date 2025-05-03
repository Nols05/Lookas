// components/ImageSelector.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function ImageSelector() {
  const [workoutType, setWorkoutType] = useState<string>('full_body');
  
  // Imagen fija que siempre se mostrará
  const fixedImage = '/default-workout.jpg';

  const handleWorkoutTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setWorkoutType(event.target.value);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Archivo seleccionado:', file.name);
    }
  };

  const handleGenerate = () => {
    console.log('Generando con tipo:', workoutType);
    // Aquí puedes añadir la lógica de generación
  };

  return (
    <div className="max-w-3xl mx-auto p-5">
      <div className="flex flex-col md:flex-row justify-between gap-5 mb-5">
        <div className="flex flex-col gap-2">
          <label 
            htmlFor="workout-type"
            className="font-semibold"
          >
            Tipo de entrenamiento:
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
            Seleccionar imagen:
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
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Generar
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center items-center min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
        <Image 
          src={fixedImage}
          alt="Fixed workout image"
          width={400}
          height={400}
          className="object-contain max-h-[400px]"
        />
      </div>
    </div>
  );
}