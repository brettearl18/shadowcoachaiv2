'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ChartPieIcon,
  PhotoIcon,
  CalendarIcon,
  SparklesIcon,
  DocumentTextIcon,
  ShareIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Update mock data with realistic transformation photos
const MOCK_CLIENTS = [
  {
    id: 'client1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    startDate: '2024-01-01',
    progress: {
      weightData: {
        labels: ['Jan', 'Feb', 'Mar'],
        current: 65.2,
        trend: -5.3,
        data: [70.5, 68.1, 65.2],
        goal: 63
      },
      bodyFatData: {
        labels: ['Jan', 'Feb', 'Mar'],
        current: 22,
        trend: -3,
        data: [25, 23.5, 22],
        goal: 20
      },
      measurements: {
        chest: { current: 90, trend: -2 },
        waist: { current: 70, trend: -4 },
        hips: { current: 92, trend: -3 }
      },
      compliance: {
        nutrition: 90,
        training: 95,
        recovery: 85
      },
      checkInStreak: 12,
      photosSubmitted: 24,
      achievements: [
        'Lost 5kg',
        '10 Check-ins Streak',
        'Perfect Week'
      ],
      photos: [
        {
          id: 'photo1',
          date: '2024-03-20',
          url: 'https://images.unsplash.com/photo-1611072965169-e2d65a92d55e?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1611072965169-e2d65a92d55e?w=200',
          type: 'front'
        },
        {
          id: 'photo2',
          date: '2024-03-20',
          url: 'https://images.unsplash.com/photo-1611072965169-e2d65a92d55e?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1611072965169-e2d65a92d55e?w=200',
          type: 'side'
        },
        {
          id: 'photo3',
          date: '2024-02-20',
          url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200',
          type: 'front'
        },
        {
          id: 'photo4',
          date: '2024-02-20',
          url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200',
          type: 'side'
        },
        {
          id: 'photo5',
          date: '2024-01-20',
          url: 'https://images.unsplash.com/photo-1583454155184-870a1f63be44?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1583454155184-870a1f63be44?w=200',
          type: 'front'
        },
        {
          id: 'photo6',
          date: '2024-01-20',
          url: 'https://images.unsplash.com/photo-1583454155184-870a1f63be44?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1583454155184-870a1f63be44?w=200',
          type: 'side'
        }
      ]
    }
  },
  {
    id: 'client2',
    name: 'Mike Wilson',
    email: 'mike@example.com',
    startDate: '2024-02-01',
    progress: {
      weightData: {
        labels: ['Feb', 'Mar'],
        current: 90.1,
        trend: -2.4,
        data: [92.5, 90.1],
        goal: 85
      },
      bodyFatData: {
        labels: ['Feb', 'Mar'],
        current: 25,
        trend: -1,
        data: [26, 25],
        goal: 18
      },
      measurements: {
        chest: { current: 110, trend: -1 },
        waist: { current: 95, trend: -2 },
        hips: { current: 105, trend: -1 }
      },
      compliance: {
        nutrition: 70,
        training: 80,
        recovery: 75
      },
      checkInStreak: 6,
      photosSubmitted: 8,
      achievements: [
        'First Check-in',
        'Week Streak'
      ],
      photos: [
        {
          id: 'photo7',
          date: '2024-03-15',
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200',
          type: 'front'
        },
        {
          id: 'photo8',
          date: '2024-03-15',
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200',
          type: 'side'
        },
        {
          id: 'photo9',
          date: '2024-02-15',
          url: 'https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=200',
          type: 'front'
        },
        {
          id: 'photo10',
          date: '2024-02-15',
          url: 'https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=200',
          type: 'side'
        }
      ]
    }
  }
];

// Update journey summaries to match the new photos
const MOCK_JOURNEY_SUMMARIES = {
  'client1': {
    socialMedia: {
      instagram: "🌟 Incredible 12-week transformation with Sarah! 💪\n\nStats that speak for themselves:\n📉 -5.3kg weight loss\n🎯 -3% body fat\n📏 -4cm waist reduction\n\nConsistent nutrition (90% adherence) and dedication to training (95% completion) led to these amazing results! Sarah's energy levels are soaring, and she's feeling stronger than ever! 💪\n\nSwipe to see her incredible progress photos! 📸\n\n#TransformationTuesday #FitnessJourney #HealthyLifestyle #CoachingWorks",
      linkedin: "Celebrating another successful client transformation! Over a 3-month coaching period, Sarah demonstrated exceptional commitment to her health and fitness goals. Through data-driven coaching and consistent check-ins, she achieved significant improvements in all key metrics while maintaining a sustainable approach to lifestyle change. Her success showcases the power of personalized coaching combined with client dedication.",
    },
    caseStudy: {
      challenge: "Sarah came to us with goals of weight loss and improved energy levels. Initial challenges included irregular meal timing and inconsistent workout routine.",
      approach: "Implemented a structured nutrition plan with focus on protein timing and portion control. Designed progressive workout program starting with 3 sessions/week.",
      results: "Over 12 weeks:\n- Weight reduction: 70.5kg → 65.2kg (-5.3kg)\n- Body fat: 25% → 22% (-3%)\n- Significant improvements in energy levels and workout performance\n- Maintained 90%+ compliance with nutrition and training protocols",
      keyLearnings: "Success factors included:\n1. Consistent check-in compliance (12-week streak)\n2. Proactive communication and adjustment of protocols\n3. Focus on habit formation before intensity increase",
    }
  },
  'client2': {
    socialMedia: {
      instagram: "💪 6-week Progress Update with Mike! 🔥\n\nCheck out these results:\n⚖️ -2.4kg down\n📉 Body fat dropping\n🎯 Crushing his training goals\n\nDespite some challenges with nutrition, Mike's consistency in the gym (80% attendance) is paying off! Building better habits one day at a time 💪\n\nSwipe to see his progress! 📸\n\n#FitnessProgress #HealthyLifestyle #FitnessJourney #TransformationInProgress",
      linkedin: "Client spotlight: Through focused coaching and accountability, Mike has made steady progress in his first 6 weeks. By addressing lifestyle challenges and implementing strategic changes, we've seen consistent improvements in key health markers. This case demonstrates the importance of personalized approach and gradual habit building.",
    },
    caseStudy: {
      challenge: "Mike started with goals of weight management and lifestyle improvement. Key challenges included late-night eating habits and irregular workout schedule.",
      approach: "Focused on establishing consistent meal timing and prep routines. Introduced structured workout plan with emphasis on form and consistency.",
      results: "In 6 weeks:\n- Weight reduction: 92.5kg → 90.1kg (-2.4kg)\n- Body fat: 26% → 25% (-1%)\n- Improved workout consistency and form\n- Building better nutrition habits",
      keyLearnings: "Areas of focus:\n1. Addressing evening routine for better nutrition compliance\n2. Maintaining workout consistency despite schedule challenges\n3. Progressive approach to habit change",
    }
  }
};

// Add a function to create transformation image
const createTransformationImage = async (beforeUrl: string, afterUrl: string): Promise<string> => {
  // In a real implementation, this would use Canvas API to create the image
  // For now, we'll return a placeholder
  return 'https://placehold.co/1080x1080/png';
};

export function ClientProgressList() {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'bodyFat'>('weight');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState<'instagram' | 'linkedin' | 'caseStudy'>('instagram');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    index: number;
    clientId: string;
  } | null>(null);

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getTrendIcon = (trend: number) => {
    if (trend < 0) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />;
    }
    return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />;
  };

  const getChartData = (client: typeof MOCK_CLIENTS[0], metric: 'weight' | 'bodyFat') => {
    const data = metric === 'weight' ? client.progress.weightData : client.progress.bodyFatData;

          return {
      labels: data.labels,
      datasets: [
        {
          label: metric === 'weight' ? 'Weight (kg)' : 'Body Fat (%)',
          data: data.data,
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1
        },
        {
          label: 'Goal',
          data: Array(data.labels.length).fill(data.goal),
          borderColor: 'rgb(34, 197, 94)',
          borderDash: [5, 5],
          tension: 0.1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      }
    }
  };

  const handleGenerateSummary = (clientId: string) => {
    setSelectedClient(clientId);
    setShowSummaryModal(true);
  };

  const SummaryModal = () => {
    if (!selectedClient || !showSummaryModal) return null;

    const summaries = MOCK_JOURNEY_SUMMARIES[selectedClient as keyof typeof MOCK_JOURNEY_SUMMARIES];
    const client = MOCK_CLIENTS.find(c => c.id === selectedClient);
    
    // Get first and latest photos
    const firstPhoto = client?.progress.photos.find(p => p.type === 'front');
    const latestPhoto = [...(client?.progress.photos || [])]
      .reverse()
      .find(p => p.type === 'front');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Journey Summary
              </h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Summary Type Selector */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setSummaryType('instagram')}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  summaryType === 'instagram'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Instagram
              </button>
              <button
                onClick={() => setSummaryType('linkedin')}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  summaryType === 'linkedin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                LinkedIn
              </button>
              <button
                onClick={() => setSummaryType('caseStudy')}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  summaryType === 'caseStudy'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Case Study
              </button>
            </div>

            {/* Summary Content */}
            <div className="bg-gray-50 rounded-lg p-6">
              {summaryType === 'instagram' && firstPhoto && latestPhoto && (
                <div className="space-y-6">
                  {/* Transformation Image Preview */}
                  <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                    <div className="grid grid-cols-2 h-full">
                      <div className="relative">
                        <img
                          src={firstPhoto.url}
                          alt="Before"
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 text-white rounded-full text-sm">
                          Before
                        </div>
                      </div>
                      <div className="relative">
                        <img
                          src={latestPhoto.url}
                          alt="After"
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white rounded-full text-sm">
                          After
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 rounded-full text-sm font-medium">
                      {new Date(firstPhoto.date).toLocaleDateString()} → {new Date(latestPhoto.date).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Caption */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Caption</h4>
                    <p className="whitespace-pre-line text-gray-600">
                      {summaries.socialMedia.instagram}
                    </p>
                  </div>

                  {/* Download Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        if (firstPhoto && latestPhoto) {
                          const transformationImage = await createTransformationImage(
                            firstPhoto.url,
                            latestPhoto.url
                          );
                          // In a real implementation, this would trigger a download
                          console.log('Downloading transformation image:', transformationImage);
                        }
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Download Image
                    </button>
                  </div>
                </div>
              )}
              {summaryType === 'caseStudy' ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Challenge</h4>
                    <p className="text-gray-600">{summaries.caseStudy.challenge}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Approach</h4>
                    <p className="text-gray-600">{summaries.caseStudy.approach}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Results</h4>
                    <p className="text-gray-600 whitespace-pre-line">{summaries.caseStudy.results}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Learnings</h4>
                    <p className="text-gray-600 whitespace-pre-line">{summaries.caseStudy.keyLearnings}</p>
                  </div>
                </div>
              ) : summaryType === 'linkedin' ? (
                <div>
                  <p className="whitespace-pre-line text-gray-600">
                    {summaries.socialMedia.linkedin}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => {
                  const summary = summaryType === 'caseStudy'
                    ? Object.entries(summaries.caseStudy)
                        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}:\n${value}`)
                        .join('\n\n')
                    : summaryType === 'instagram'
                    ? summaries.socialMedia.instagram
                    : summaries.socialMedia.linkedin;
                  
                  navigator.clipboard.writeText(summary);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Photo Gallery Modal Component
  const PhotoModal = () => {
    if (!selectedPhoto || !showPhotoModal) return null;

    const client = MOCK_CLIENTS.find(c => c.id === selectedPhoto.clientId);
    if (!client) return null;

    const photos = client.progress.photos;
    const currentPhoto = photos[selectedPhoto.index];

    const handlePrevious = () => {
      setSelectedPhoto(prev => prev ? {
        ...prev,
        index: (prev.index - 1 + photos.length) % photos.length
      } : null);
    };

    const handleNext = () => {
      setSelectedPhoto(prev => prev ? {
        ...prev,
        index: (prev.index + 1) % photos.length
      } : null);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="relative w-full max-w-6xl mx-4">
          {/* Close button */}
          <button
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          {/* Navigation buttons */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
          >
            <ArrowLeftIcon className="h-8 w-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
          >
            <ArrowRightIcon className="h-8 w-8" />
          </button>

          {/* Photo info */}
          <div className="absolute top-4 left-4 text-white flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5" />
            <span>{new Date(currentPhoto.date).toLocaleDateString()}</span>
            <span className="px-2 py-1 bg-white/10 rounded-full text-sm capitalize">
              {currentPhoto.type} View
            </span>
          </div>

          {/* Main image */}
          <div className="flex items-center justify-center h-[90vh]">
            <img
              src={currentPhoto.url}
              alt={`Progress photo - ${currentPhoto.type} view`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Photo counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {selectedPhoto.index + 1} / {photos.length}
          </div>
        </div>
      </div>
    );
  };

  // Photo Gallery Component
  const PhotoGallery = ({ clientId }: { clientId: string }) => {
    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    if (!client) return null;

    const photos = client.progress.photos;
    const photosByDate = photos.reduce((acc, photo) => {
      const date = photo.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(photo);
      return acc;
    }, {} as Record<string, typeof photos>);

    return (
      <div className="mt-8">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Progress Photos</h4>
        
        <div className="space-y-6">
          {Object.entries(photosByDate).map(([date, datePhotos]) => (
            <div key={date} className="space-y-2">
              <h5 className="text-sm text-gray-500">
                {new Date(date).toLocaleDateString()}
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {datePhotos.map((photo, photoIndex) => {
                  const globalIndex = photos.findIndex(p => p.id === photo.id);
                  return (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer aspect-[4/5] overflow-hidden rounded-lg bg-gray-100"
                      onClick={() => {
                        setSelectedPhoto({ index: globalIndex, clientId });
                        setShowPhotoModal(true);
                      }}
                    >
                      <img
                        src={photo.thumbnail}
                        alt={`Progress photo - ${photo.type} view`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-full text-white text-xs capitalize">
                        {photo.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Client Progress Cards */}
      {MOCK_CLIENTS.map(client => (
        <div key={client.id} className="bg-white rounded-lg shadow-sm border">
          {/* Client Header */}
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
          >
            <div className="flex items-center justify-between">
                <div>
                <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.email}</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Quick Stats */}
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{client.progress.checkInStreak} streak</span>
                </div>
                <div className="flex items-center space-x-2">
                  <PhotoIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">{client.progress.photosSubmitted} photos</span>
                </div>
              </div>
            </div>

            {/* Compliance Indicators */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              {Object.entries(client.progress.compliance).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500 capitalize">{key}</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getProgressColor(value)}`}>
                      {value}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expanded View */}
          {expandedClient === client.id && (
              <div className="border-t p-4">
              {/* Chart Controls */}
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => setSelectedMetric('weight')}
                  className={`px-4 py-2 rounded-lg ${
                    selectedMetric === 'weight'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Weight Progress
                </button>
                          <button
                  onClick={() => setSelectedMetric('bodyFat')}
                  className={`px-4 py-2 rounded-lg ${
                    selectedMetric === 'bodyFat'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                          >
                  Body Fat Progress
                          </button>
              </div>

              {/* Progress Chart */}
              <div className="h-64 mb-6">
                <Line 
                  data={getChartData(client, selectedMetric)}
                  options={chartOptions}
                />
              </div>

              {/* Current Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Current Weight</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-medium">{client.progress.weightData.current}kg</span>
                    <span className="flex items-center text-sm">
                      {getTrendIcon(client.progress.weightData.trend)}
                      {Math.abs(client.progress.weightData.trend)}kg
                    </span>
                      </div>
                    </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Body Fat</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-medium">{client.progress.bodyFatData.current}%</span>
                    <span className="flex items-center text-sm">
                      {getTrendIcon(client.progress.bodyFatData.trend)}
                      {Math.abs(client.progress.bodyFatData.trend)}%
                    </span>
                  </div>
                </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Goal Weight</div>
                  <div className="text-xl font-medium">{client.progress.weightData.goal}kg</div>
                  <div className="text-sm text-gray-500">
                    {Math.abs(client.progress.weightData.current - client.progress.weightData.goal)}kg to go
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Goal Body Fat</div>
                  <div className="text-xl font-medium">{client.progress.bodyFatData.goal}%</div>
                  <div className="text-sm text-gray-500">
                    {Math.abs(client.progress.bodyFatData.current - client.progress.bodyFatData.goal)}% to go
                  </div>
                </div>
                        </div>

              {/* Measurements */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Body Measurements</h4>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(client.progress.measurements).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500 capitalize">{key}</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{value.current}cm</span>
                        <span className="flex items-center text-sm">
                          {getTrendIcon(value.trend)}
                          {Math.abs(value.trend)}cm
                        </span>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>

              {/* Achievements */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Achievements</h4>
                <div className="flex flex-wrap gap-2">
                  {client.progress.achievements.map((achievement, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>

              {/* Add Photo Gallery before the Generate Summary button */}
              <PhotoGallery clientId={client.id} />

              {/* Generate Summary button */}
              <div className="mt-6 flex justify-end">
                  <button
                  onClick={() => handleGenerateSummary(client.id)}
                  className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Generate Journey Summary
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

      {/* Render both modals */}
      <SummaryModal />
      <PhotoModal />
    </div>
  );
} 