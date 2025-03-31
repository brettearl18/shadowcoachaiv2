import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { CameraIcon, ArrowUpTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PhotoUpload {
  file: File;
  type: 'front' | 'side' | 'back';
  preview?: string;
}

interface ProgressPhotoGalleryProps {
  onComplete: (photos: PhotoUpload[]) => void;
  onBack: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const RECOMMENDED_MIN_SIZE = 1 * 1024 * 1024; // 1MB in bytes

export default function ProgressPhotoGallery({ onComplete, onBack }: ProgressPhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  const validateFile = (file: File): { error: string | null; warning: string | null } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit`,
        warning: null
      };
    }
    if (!file.type.startsWith('image/')) {
      return {
        error: 'File must be an image (JPEG, PNG, etc.)',
        warning: null
      };
    }
    if (file.size < RECOMMENDED_MIN_SIZE) {
      return {
        error: null,
        warning: 'Image might be too small for optimal quality. We recommend at least 1MB for better detail.'
      };
    }
    return { error: null, warning: null };
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'back') => {
    const file = event.target.files?.[0];
    setError(null);
    setWarning(null);

    if (file) {
      const { error: validationError, warning: validationWarning } = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      if (validationWarning) {
        setWarning(validationWarning);
      }

      // Remove existing photo of the same type
      const newPhotos = photos.filter(p => p.type !== type);
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      
      // Add new photo
      newPhotos.push({
        file,
        type,
        preview
      });
      
      setPhotos(newPhotos);
    }
  };

  const triggerFileInput = (type: 'front' | 'side' | 'back', source: 'camera' | 'file') => {
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current.accept = source === 'camera' ? 'image/*;capture=camera' : 'image/*';
      fileInputRefs[type].current.click();
    }
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      setError('Please upload at least one photo');
      return;
    }
    onComplete(photos);
  };

  const getPhotoByType = (type: 'front' | 'side' | 'back') => {
    return photos.find(p => p.type === type);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {warning && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">{warning}</h3>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['front', 'side', 'back'] as const).map((type) => {
          const photo = getPhotoByType(type);
          return (
            <div key={type} className="flex flex-col items-center">
              <div className="w-full aspect-[3/4] relative rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50">
                {photo ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={photo.preview || ''}
                      alt={`${type} view`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-2 right-2 flex space-x-2">
                      <button
                        onClick={() => triggerFileInput(type, 'camera')}
                        className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                        title="Take new photo"
                      >
                        <CameraIcon className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => triggerFileInput(type, 'file')}
                        className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                        title="Upload from device"
                      >
                        <ArrowUpTrayIcon className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium text-gray-600 capitalize mb-4">
                      {type} View
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => triggerFileInput(type, 'camera')}
                        className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <CameraIcon className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-xs text-gray-500">Take Photo</span>
                      </button>
                      <button
                        onClick={() => triggerFileInput(type, 'file')}
                        className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <ArrowUpTrayIcon className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-xs text-gray-500">Upload File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRefs[type]}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, type)}
                className="hidden"
              />
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500 capitalize">{type} View</p>
                <p className="text-xs text-gray-400">Max size: 10MB</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center text-sm text-gray-500">
        <p>Recommended photo guidelines:</p>
        <ul className="mt-1 text-xs">
          <li>• Maximum size: 10MB per photo</li>
          <li>• Minimum recommended: 1MB for good quality</li>
          <li>• Good lighting and neutral background</li>
          <li>• Wear fitted clothing for accurate tracking</li>
        </ul>
      </div>

      <div className="mt-6 flex justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Go Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
} 