'use client';

import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ProgressPhoto {
  id: string;
  url: string;
  date: string;
  category: 'front' | 'back' | 'side';
  clientId: string;
  clientName: string;
}

interface ClientProgressPhotosProps {
  clientId: string;
  clientName: string;
}

export default function ClientProgressPhotos({ clientId, clientName }: ClientProgressPhotosProps) {
  const [selectedCategory, setSelectedCategory] = useState<'front' | 'back' | 'side'>('front');
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]); // This would be populated from Firebase

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Progress Photos</h2>
        <span className="text-sm text-gray-500">{clientName}</span>
      </div>
      
      {/* Photo Categories */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setSelectedCategory('front')}
          className={`px-4 py-2 rounded-lg ${
            selectedCategory === 'front'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Front View
        </button>
        <button
          onClick={() => setSelectedCategory('back')}
          className={`px-4 py-2 rounded-lg ${
            selectedCategory === 'back'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Back View
        </button>
        <button
          onClick={() => setSelectedCategory('side')}
          className={`px-4 py-2 rounded-lg ${
            selectedCategory === 'side'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Side View
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos
          .filter(photo => photo.category === selectedCategory)
          .map(photo => (
            <div key={photo.id} className="relative">
              <img
                src={photo.url}
                alt={`Progress photo - ${photo.category} view`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {new Date(photo.date).toLocaleDateString()}
              </div>
            </div>
          ))}
      </div>

      {photos.filter(photo => photo.category === selectedCategory).length === 0 && (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No photos available</h3>
          <p className="mt-1 text-sm text-gray-500">
            This client hasn't uploaded any progress photos yet.
          </p>
        </div>
      )}
    </div>
  );
} 