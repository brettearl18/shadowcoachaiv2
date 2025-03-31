'use client';

import { useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProgressPhoto {
  id: string;
  url: string;
  date: string;
  category: 'front' | 'back' | 'side';
}

export default function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'front' | 'back' | 'side'>('front');

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual photo upload to Firebase Storage
      // For now, we'll simulate the upload with a mock URL
      const mockPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        url: URL.createObjectURL(files[0]),
        date: new Date().toISOString(),
        category: selectedCategory
      };

      setPhotos(prev => [...prev, mockPhoto]);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Progress Photos</h2>
      
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

      {/* Upload Button */}
      <div className="mb-6">
        <label className="block">
          <span className="sr-only">Choose progress photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos
          .filter(photo => photo.category === selectedCategory)
          .map(photo => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt={`Progress photo - ${photo.category} view`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {new Date(photo.date).toLocaleDateString()}
              </div>
            </div>
          ))}
      </div>

      {photos.filter(photo => photo.category === selectedCategory).length === 0 && (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No photos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload your first progress photo to track your journey.
          </p>
        </div>
      )}
    </div>
  );
} 