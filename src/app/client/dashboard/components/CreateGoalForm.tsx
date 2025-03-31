import { useState } from 'react';
import { Goal, GoalType, GoalFrequency } from '@/types/goals';
import { goalService } from '@/services/goalService';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface CreateGoalFormProps {
  onSuccess?: () => void;
}

export default function CreateGoalForm({ onSuccess }: CreateGoalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'weight' as GoalType,
    target: '',
    startValue: '',
    unit: '',
    frequency: 'once' as GoalFrequency,
    targetDate: '',
    milestones: [{ title: '', target: '' }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const goalData = {
        clientId: auth.currentUser.uid,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        target: parseFloat(formData.target),
        startValue: parseFloat(formData.startValue),
        unit: formData.unit,
        frequency: formData.frequency,
        targetDate: formData.targetDate ? new Date(formData.targetDate) : null,
        milestones: formData.milestones
          .filter(m => m.title && m.target)
          .map(m => ({
            id: crypto.randomUUID(),
            title: m.title,
            target: parseFloat(m.target),
            current: parseFloat(formData.startValue),
            completed: false,
            completedAt: null
          }))
      };

      await goalService.createGoal(auth.currentUser.uid, goalData);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error('Error creating goal:', err);
      setError('Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', target: '' }]
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index: number, field: 'title' | 'target', value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as GoalType }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          >
            <option value="weight">Weight</option>
            <option value="measurement">Measurement</option>
            <option value="habit">Habit</option>
            <option value="performance">Performance</option>
            <option value="nutrition">Nutrition</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Frequency</label>
          <select
            required
            value={formData.frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as GoalFrequency }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          >
            <option value="once">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Value</label>
          <input
            type="number"
            required
            step="0.1"
            value={formData.startValue}
            onChange={(e) => setFormData(prev => ({ ...prev, startValue: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Target Value</label>
          <input
            type="number"
            required
            step="0.1"
            value={formData.target}
            onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Unit</label>
          <input
            type="text"
            required
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Target Date</label>
        <input
          type="date"
          value={formData.targetDate}
          onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Milestones</label>
          <button
            type="button"
            onClick={addMilestone}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            Add Milestone
          </button>
        </div>
        <div className="space-y-4">
          {formData.milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Milestone title"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Target value"
                  value={milestone.target}
                  onChange={(e) => updateMilestone(index, 'target', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeMilestone(index)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
} 