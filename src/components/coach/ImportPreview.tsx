import { useState } from 'react';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface ImportPreviewProps {
  data: {
    checkIns: any[];
    measurements: any[];
    insights: any;
    recommendations: any;
    customQuestions: Record<string, Array<{question: string, answers: string[]}>>;
  };
  onConfirm: () => void;
  onModify: () => void;
  onCancel: () => void;
}

export function ImportPreview({ data, onConfirm, onModify, onCancel }: ImportPreviewProps) {
  const [activeTab, setActiveTab] = useState('check-ins');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Preview Imported Data</h2>
        <div className="flex space-x-3">
          <button
            onClick={onModify}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Modify
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Confirm Import
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('check-ins')}
            className={`${
              activeTab === 'check-ins'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Check-ins
          </button>
          <button
            onClick={() => setActiveTab('measurements')}
            className={`${
              activeTab === 'measurements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Measurements
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('custom-questions')}
            className={`${
              activeTab === 'custom-questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Custom Questions
          </button>
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'check-ins' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Recent Check-ins</h3>
            <div className="space-y-4">
              {data.checkIns.slice(0, 5).map((checkIn, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Week {checkIn.week}</p>
                      <p className="text-sm text-gray-500">{checkIn.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Overall Score: {checkIn.scores.overall}%</p>
                      <div className="flex space-x-2 text-sm text-gray-600">
                        <span>Nutrition: {checkIn.scores.nutrition}%</span>
                        <span>Training: {checkIn.scores.training}%</span>
                        <span>Recovery: {checkIn.scores.recovery}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'measurements' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Body Measurements</h3>
            <div className="space-y-4">
              {data.measurements.slice(0, 5).map((measurement, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Week {measurement.week}</p>
                      <p className="text-sm text-gray-500">{measurement.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Weight: {measurement.weight} kg</p>
                      <p className="text-sm text-gray-600">Body Fat: {measurement.bodyFat}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Data Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Progress</h4>
                <p className="text-sm text-gray-600">
                  Weight Change: {data.insights.progress.weightChange.toFixed(1)} kg
                </p>
                <p className="text-sm text-gray-600">
                  Body Fat Change: {data.insights.progress.bodyFatChange.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Patterns</h4>
                <p className="text-sm text-gray-600">
                  Average Calories: {data.insights.patterns.nutrition.averageCalories.toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">
                  Average Training Sessions: {data.insights.patterns.training.averageSessions.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'custom-questions' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Custom Questions</h3>
            <div className="space-y-6">
              {Object.entries(data.customQuestions).map(([category, questions]) => (
                <div key={category} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 capitalize">{category}</h4>
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <div key={index} className="border-t border-gray-200 pt-3">
                        <p className="font-medium">{q.question}</p>
                        <div className="mt-2 space-y-2">
                          {q.answers.map((answer, aIndex) => (
                            <p key={aIndex} className="text-sm text-gray-600">
                              Week {aIndex + 1}: {answer}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 