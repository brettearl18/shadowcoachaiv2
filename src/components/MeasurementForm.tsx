import { useState, useEffect } from 'react';
import { validationService } from '@/services/validationService';
import { CheckInData } from '@/types/checkIn';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface MeasurementFormProps {
  onComplete: (measurements: CheckInData['measurements']) => void;
  previousCheckIn?: CheckInData;
  onBack: () => void;
}

const defaultMeasurements = {
  weight: '',
  bodyFat: '',
  chest: '',
  waist: '',
  hips: '',
  arms: '',
  legs: '',
};

interface ValidationState {
  [key: string]: {
    isValid: boolean;
    warning?: string;
    error?: string;
  };
}

export default function MeasurementForm({ onComplete, previousCheckIn, onBack }: MeasurementFormProps) {
  const [measurements, setMeasurements] = useState(defaultMeasurements);
  const [validation, setValidation] = useState<ValidationState>({});
  const [customMeasurements, setCustomMeasurements] = useState<Array<{ name: string; value: string }>>([]);

  useEffect(() => {
    if (previousCheckIn?.measurements) {
      const prevMeasurements = Object.entries(previousCheckIn.measurements).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value?.toString() || '',
      }), {});
      setMeasurements(prev => ({ ...prev, ...prevMeasurements }));
    }
  }, [previousCheckIn]);

  const validateField = (name: string, value: string) => {
    if (!value) {
      return { isValid: true };
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        error: 'Please enter a valid number',
      };
    }

    const previousValue = previousCheckIn?.measurements?.[name];
    return validationService.validateMeasurement(name, numValue, previousValue);
  };

  const handleInputChange = (name: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [name]: value }));
    const validationResult = validateField(name, value);
    setValidation(prev => ({ ...prev, [name]: validationResult }));
  };

  const addCustomMeasurement = () => {
    setCustomMeasurements(prev => [...prev, { name: '', value: '' }]);
  };

  const handleCustomMeasurementChange = (index: number, field: 'name' | 'value', value: string) => {
    setCustomMeasurements(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeCustomMeasurement = (index: number) => {
    setCustomMeasurements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields that have values
    const validationResults: ValidationState = {};
    let hasErrors = false;

    Object.entries(measurements).forEach(([name, value]) => {
      if (value && value.trim() !== '') {  // Only validate non-empty fields
        const result = validateField(name, value);
        validationResults[name] = result;
        if (!result.isValid) hasErrors = true;
      }
    });

    setValidation(validationResults);

    if (hasErrors) {
      return;
    }

    // Convert measurements to numbers and include custom measurements
    const finalMeasurements = Object.entries(measurements).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {  // Only include non-empty values
        acc[key] = parseFloat(value);
      }
      return acc;
    }, {} as Record<string, number>);

    // Add custom measurements
    customMeasurements.forEach(({ name, value }) => {
      if (name && value && name.trim() !== '' && value.trim() !== '') {
        finalMeasurements[name.toLowerCase()] = parseFloat(value);
      }
    });

    // Ensure we have at least one measurement
    if (Object.keys(finalMeasurements).length === 0) {
      setValidation({
        general: {
          isValid: false,
          error: 'Please enter at least one measurement'
        }
      });
      return;
    }

    onComplete(finalMeasurements);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(defaultMeasurements).map(([name, _]) => (
          <div key={name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {name}
            </label>
            <div>
              <input
                type="number"
                step="0.1"
                value={measurements[name]}
                onChange={(e) => handleInputChange(name, e.target.value)}
                className={`block w-full rounded-md shadow-sm sm:text-sm
                  ${validation[name]?.error 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                placeholder={`Enter ${name}`}
              />
            </div>
            {validation[name]?.error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {validation[name].error}
              </p>
            )}
            {validation[name]?.warning && (
              <p className="mt-1 text-sm text-yellow-600 flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {validation[name].warning}
              </p>
            )}
            {validation[name]?.isValid && !validation[name]?.warning && measurements[name] && (
              <p className="mt-1 text-sm text-emerald-600 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Valid measurement
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Custom Measurements */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Custom Measurements</h3>
          <button
            type="button"
            onClick={addCustomMeasurement}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            Add Custom Measurement
          </button>
        </div>
        <div className="space-y-4">
          {customMeasurements.map((measurement, index) => (
            <div key={index} className="flex items-center gap-4">
              <input
                type="text"
                value={measurement.name}
                onChange={(e) => handleCustomMeasurementChange(index, 'name', e.target.value)}
                placeholder="Measurement name"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              />
              <input
                type="number"
                step="0.1"
                value={measurement.value}
                onChange={(e) => handleCustomMeasurementChange(index, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => removeCustomMeasurement(index)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {validation.general?.error && (
          <p className="mb-4 text-sm text-red-600 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            {validation.general.error}
          </p>
        )}
        <div className="flex justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Save Measurements
          </button>
        </div>
      </div>
    </form>
  );
} 