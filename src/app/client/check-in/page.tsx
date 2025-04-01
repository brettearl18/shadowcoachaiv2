'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CameraIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { checkInService, CheckInData, PhotoUpload } from '@/services/checkInService';
import CheckInQuestionnaire from '@/components/CheckInQuestionnaire';
import ProgressPhotoGallery from '@/components/ProgressPhotoGallery';
import MeasurementForm from '@/components/MeasurementForm';
import { clientService } from '@/services/clientService';

interface CheckInData {
  answers: Record<number, number>;
  scores: {
    overall: number;
    categories: {
      nutrition: { score: number; maxPossible: number; percentage: number };
      training: { score: number; maxPossible: number; percentage: number };
      recovery: { score: number; maxPossible: number; percentage: number };
    };
  };
  measurements: {
    weight: {
      current: number;
      previousWeek: number;
      starting: number;
    };
    bodyFat: {
      current: number;
      previousWeek: number;
      starting: number;
    };
    chest: {
      current: number;
      previousWeek: number;
      starting: number;
    };
    waist: {
      current: number;
      previousWeek: number;
      starting: number;
    };
    hips: {
      current: number;
      previousWeek: number;
      starting: number;
    };
  };
  photos?: string[];
  notes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export default function CheckIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<number, number>>({});
  const [weekNumber, setWeekNumber] = useState(1);
  const [previousCheckIn, setPreviousCheckIn] = useState<CheckInData | null>(null);
  const [checkInData, setCheckInData] = useState<Omit<CheckInData, 'id' | 'date'>>({
    clientId: 'mock-user-123',
    scores: {
      overall: 0,
      categories: {}
    },
    answers: {},
    measurements: {},
    photos: [],
    notes: '',
    status: 'pending'
  });
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [step, setStep] = useState<'questionnaire' | 'photos' | 'measurements' | 'notes' | 'review'>('questionnaire');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    const fetchWeekNumber = async () => {
      try {
        const { checkIns } = await clientService.getCheckInHistory('mock-user-123');
        setWeekNumber(checkIns.length + 1);
      } catch (err) {
        console.error('Error fetching week number:', err);
        setWeekNumber(1);
      }
    };

    fetchWeekNumber();
  }, []);

  useEffect(() => {
    const fetchExistingPhotos = async () => {
      try {
        const photos = await checkInService.getClientPhotos('mock-client-id'); // Replace with actual client ID
        setExistingPhotos(photos);
      } catch (error) {
        console.error('Error fetching photos:', error);
      }
    };

    fetchExistingPhotos();
  }, []);

  useEffect(() => {
    const fetchPreviousCheckIn = async () => {
      try {
        const { checkIns } = await clientService.getCheckInHistory('mock-user-123');
        if (checkIns.length > 0) {
          // Get the most recent check-in
          setPreviousCheckIn(checkIns[checkIns.length - 1]);
        }
      } catch (err) {
        console.error('Error fetching previous check-in:', err);
      }
    };

    fetchPreviousCheckIn();
  }, []);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'back') => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotos(prev => {
        // Remove existing photo of the same type
        const filtered = prev.filter(p => p.type !== type);
        return [...filtered, { file, type }];
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string
  ) => {
    const value = e.target.value;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCheckInData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CheckInData],
          [child]: value,
        },
      }));
    } else {
      setCheckInData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleQuestionnaireComplete = (answers: Record<number, number>, scores: CheckInData['scores']) => {
    setQuestionnaireAnswers(answers);
    setCheckInData(prev => ({
      ...prev,
      answers,
      scores
    }));
    setStep('photos');
  };

  const handlePhotosComplete = (uploadedPhotos: PhotoUpload[]) => {
    setPhotos(uploadedPhotos);
    setStep('measurements');
  };

  const handleMeasurementsComplete = (measurements: Record<string, number>) => {
    setCheckInData(prev => ({
      ...prev,
      measurements
    }));
    setStep('notes');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleNotesComplete = (notes: string) => {
    setCheckInData(prev => ({
      ...prev,
      notes,
      attachments: attachments.map(file => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      }))
    }));
    setStep('review');
  };

  const handleGoBack = () => {
    switch (step) {
      case 'photos':
        setStep('questionnaire');
        break;
      case 'measurements':
        setStep('photos');
        break;
      case 'notes':
        setStep('measurements');
        break;
      case 'review':
        setStep('notes');
        break;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required data
      if (!checkInData.scores || !checkInData.answers) {
        throw new Error('Missing required check-in data');
      }

      await clientService.submitCheckIn('mock-user-123', checkInData);
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/client/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting check-in:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Submit Check-in</h1>
              <span className="text-lg font-medium text-emerald-600">
                Week {weekNumber}
              </span>
            </div>

            {success ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Check-in submitted successfully!</h3>
                <p className="mt-1 text-sm text-gray-500">Redirecting to dashboard...</p>
              </div>
            ) : (
              <>
                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="flex justify-between items-center">
                    {['questionnaire', 'photos', 'measurements', 'notes', 'review'].map((s, index) => (
                      <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step === s ? 'bg-emerald-600 text-white' :
                          index < ['questionnaire', 'photos', 'measurements', 'notes', 'review'].indexOf(step) ?
                          'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        {index < 4 && (
                          <div className={`w-24 h-1 ${
                            index < ['questionnaire', 'photos', 'measurements', 'notes', 'review'].indexOf(step) ?
                            'bg-emerald-200' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['Questionnaire', 'Photos', 'Measurements', 'Notes', 'Review'].map((label, index) => (
                      <span key={label} className={`text-sm ${
                        step === ['questionnaire', 'photos', 'measurements', 'notes', 'review'][index] ?
                        'text-emerald-600 font-medium' : 'text-gray-500'
                      }`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg shadow">
                  {step === 'questionnaire' && (
                    <CheckInQuestionnaire onComplete={handleQuestionnaireComplete} />
                  )}
                  {step === 'photos' && (
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Progress Photos</h2>
                      <ProgressPhotoGallery onComplete={handlePhotosComplete} onBack={handleGoBack} />
                    </div>
                  )}
                  {step === 'measurements' && (
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Measurements</h2>
                      <MeasurementForm
                        onComplete={handleMeasurementsComplete}
                        previousCheckIn={previousCheckIn}
                        onBack={handleGoBack}
                      />
                    </div>
                  )}
                  {step === 'notes' && (
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
                      <div className="space-y-4">
                        <textarea
                          className="w-full h-32 p-3 border rounded-lg"
                          placeholder="Add any additional notes about your progress..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        
                        {/* File Upload Section */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                              Attach Files
                            </button>
                            <span className="text-sm text-gray-500">Upload any relevant files</span>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          
                          {/* Attachments List */}
                          {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
                              <div className="space-y-2">
                                {attachments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                      <span className="text-sm text-gray-600">{file.name}</span>
                                      <span className="ml-2 text-xs text-gray-400">
                                        ({(file.size / 1024).toFixed(1)} KB)
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeAttachment(index)}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between gap-4">
                          <button
                            type="button"
                            onClick={handleGoBack}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                          >
                            Go Back
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNotesComplete(notes)}
                            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {step === 'review' && (
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Review Your Check-in</h2>
                      
                      {/* Overall Score */}
                      <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-2">Overall Score</h3>
                        <div className="text-3xl font-bold text-emerald-600">
                          {checkInData.scores.overall.toFixed(1)}/5
                        </div>
                      </div>

                      {/* Category Scores */}
                      <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-2">Category Scores</h3>
                        <div className="space-y-3">
                          {Object.entries(checkInData.scores.categories).map(([category, score]) => (
                            <div key={category} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="capitalize">{category}</span>
                                <span>{score.percentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Photos Preview */}
                      {checkInData.photos && checkInData.photos.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-700 mb-2">Progress Photos</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {checkInData.photos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Progress photo ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes and Attachments Preview */}
                      {(checkInData.notes || checkInData.attachments?.length > 0) && (
                        <div className="mb-6">
                          <h3 className="font-medium text-gray-700 mb-2">Additional Notes</h3>
                          {checkInData.notes && (
                            <p className="text-gray-600 mb-4">{checkInData.notes}</p>
                          )}
                          {checkInData.attachments && checkInData.attachments.length > 0 && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments</h4>
                              <div className="space-y-2">
                                {checkInData.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">{attachment.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between gap-4 mt-6">
                        <button
                          type="button"
                          onClick={handleGoBack}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Go Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className={`flex-1 py-2 px-4 text-white rounded-lg ${
                            isSubmitting ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
                          } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Check-in'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4 mt-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 