'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { EyeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { NotificationService } from '@/services/notificationService';
import { CheckInService } from '@/services/checkInService';

interface Template {
  id: string;
  name: string;
  description: string;
  questions: any[];
  categories: any[];
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface TimeWindow {
  openDay: number; // 0-6 for day of week
  closeDay: number; // 0-6 for day of week
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
}

interface CustomInterval {
  value: number;
  unit: 'days' | 'weeks' | 'months';
}

interface StartDateOption {
  type: 'custom' | 'next_occurrence';
  date: string;
}

export default function CreateCheckIn() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [hasTimeWindow, setHasTimeWindow] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({
    openDay: 0, // Sunday
    closeDay: 0, // Sunday
    openTime: '09:00',
    closeTime: '17:00'
  });
  const [customInterval, setCustomInterval] = useState<CustomInterval>({
    value: 1,
    unit: 'days'
  });
  const [startDateOption, setStartDateOption] = useState<StartDateOption>({
    type: 'custom',
    date: ''
  });

  // Load templates and clients
  useEffect(() => {
    const loadData = async () => {
      try {
        // Using the coach ID from our test data
        const coachId = 'JZE3RUm74or2dvUmOot5';
        console.log('Loading data for coach:', coachId);

        // Load templates
        const templatesQuery = query(
          collection(db, 'templates'),
          where('coachId', '==', coachId)
        );
        const templatesSnapshot = await getDocs(templatesQuery);
        const loadedTemplates = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Template[];
        console.log('Loaded templates:', loadedTemplates);
        setTemplates(loadedTemplates);

        // Load clients
        const clientsQuery = query(
          collection(db, 'clients'),
          where('coachId', '==', coachId)
        );
        const clientsSnapshot = await getDocs(clientsQuery);
        const loadedClients = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Client[];
        console.log('Loaded clients:', loadedClients);
        setClients(loadedClients);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data. Please check console for details.');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Function to get next occurrence of a day
  const getNextOccurrence = (dayIndex: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilNext = (dayIndex - currentDay + 7) % 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);
    return nextDate;
  };

  // Update start date when days are selected
  useEffect(() => {
    if (startDateOption.type === 'next_occurrence' && selectedDays.length > 0) {
      // Find the next available day from selected days
      const today = new Date();
      const currentDay = today.getDay();
      
      // Sort selected days to find the next one
      const sortedDays = [...selectedDays].sort((a, b) => {
        const daysUntilA = (a - currentDay + 7) % 7;
        const daysUntilB = (b - currentDay + 7) % 7;
        return daysUntilA - daysUntilB;
      });

      const nextDay = sortedDays[0];
      const nextDate = getNextOccurrence(nextDay);
      
      // Set time to the window open time if it exists, otherwise 00:00
      if (hasTimeWindow && timeWindow.openTime) {
        const [hours, minutes] = timeWindow.openTime.split(':');
        nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        nextDate.setHours(0, 0, 0, 0);
      }

      setStartDateOption(prev => ({
        ...prev,
        date: nextDate.toISOString().slice(0, 16) // Format for datetime-local input
      }));
    }
  }, [selectedDays, startDateOption.type, hasTimeWindow, timeWindow.openTime]);

  // Update actual start date whenever startDateOption changes
  useEffect(() => {
    setStartDate(startDateOption.date);
  }, [startDateOption]);

  const handleCreateCheckIn = async () => {
    if (!selectedTemplate || !selectedClient || !startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (hasTimeWindow && (!timeWindow.openTime || !timeWindow.closeTime)) {
      toast.error('Please set both start and end times for the completion window');
      return;
    }

    if (isRecurring && frequency === 'custom' && customInterval.value < 1) {
      toast.error('Please enter a valid interval greater than 0');
      return;
    }

    try {
      const checkInData = {
        templateId: selectedTemplate,
        clientId: selectedClient,
        startDate: new Date(startDate).toISOString(),
        isRecurring,
        frequency: isRecurring ? frequency : null,
        selectedDays: isRecurring ? selectedDays : null,
        customInterval: frequency === 'custom' ? customInterval : null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        coachId: 'JZE3RUm74or2dvUmOot5',
        responses: [],
        completionWindow: hasTimeWindow ? {
          duration: timeWindow.duration,
          openTime: timeWindow.openTime,
          closeTime: timeWindow.closeTime
        } : null,
        nextProcessingDate: isRecurring ? new Date(startDate) : null
      };

      console.log('Creating check-in with data:', checkInData);

      // Create initial check-in
      const docRef = await addDoc(collection(db, 'checkIns'), checkInData);
      console.log('Check-in created with ID:', docRef.id);

      // Create notification for client
      const notificationService = new NotificationService();
      await notificationService.createNotification({
        userId: selectedClient,
        type: 'check_in_due',
        title: 'New Check-in Scheduled',
        message: `A new check-in has been scheduled for ${new Date(startDate).toLocaleDateString()}`,
        data: {
          checkInId: docRef.id,
          templateId: selectedTemplate
        },
        read: false,
        createdAt: new Date()
      });

      // If recurring, create future check-ins
      if (isRecurring) {
        const checkInService = new CheckInService();
        const recurringDates = calculateRecurringDates(startDate, frequency, selectedDays, customInterval);
        
        // Create future check-ins
        await checkInService.createRecurringCheckIns(checkInData, recurringDates);

        // Create notifications for future check-ins
        for (const date of recurringDates) {
          await notificationService.createNotification({
            userId: selectedClient,
            type: 'check_in_due',
            title: 'Recurring Check-in Due',
            message: `Your recurring check-in is due on ${date.toLocaleDateString()}`,
            data: {
              checkInId: docRef.id,
              templateId: selectedTemplate
            },
            read: false,
            createdAt: new Date(),
            scheduledFor: date
          });
        }
      }

      toast.success('Check-in created successfully');
      router.push('/coach/check-ins');
    } catch (error) {
      console.error('Error creating check-in:', error);
      toast.error('Failed to create check-in. Please check console for details.');
    }
  };

  // Helper function to calculate recurring dates
  const calculateRecurringDates = (startDate: string, frequency: string, selectedDays: number[], customInterval: CustomInterval) => {
    const dates: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3); // Schedule 3 months ahead

    let current = new Date(start);
    while (current <= end) {
      if (frequency === 'weekly' || frequency === 'biweekly') {
        // Add dates for selected days
        for (const day of selectedDays) {
          const date = new Date(current);
          date.setDate(date.getDate() + ((day - date.getDay() + 7) % 7));
          if (date <= end && date > start) {
            dates.push(date);
          }
        }
        // Move to next week/biweek
        current.setDate(current.getDate() + (frequency === 'weekly' ? 7 : 14));
      } else if (frequency === 'monthly') {
        dates.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      } else if (frequency === 'custom') {
        dates.push(new Date(current));
        if (customInterval.unit === 'days') {
          current.setDate(current.getDate() + customInterval.value);
        } else if (customInterval.unit === 'weeks') {
          current.setDate(current.getDate() + (customInterval.value * 7));
        }
      }
    }
    return dates;
  };

  const selectedTemplateData = selectedTemplate 
    ? templates.find(t => t.id === selectedTemplate)
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create New Check-in</h1>
        <p className="text-gray-600">Schedule a new check-in for your client using a template</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Template</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template.id);
                console.log('Selected template:', template);
              }}
              className={`relative p-4 rounded-lg border transition-all ${
                selectedTemplate === template.id
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                </div>
                {selectedTemplate === template.id && (
                  <CheckIcon className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {template.questions?.length || 0} questions
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {template.categories?.length || 0} categories
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Select Client</h2>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                console.log('Selected client:', clients.find(c => c.id === e.target.value));
              }}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Scheduling</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2">Make this a recurring check-in</span>
                </label>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="relative flex p-4 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none">
                    <input
                      type="radio"
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mt-1"
                      checked={startDateOption.type === 'custom'}
                      onChange={() => setStartDateOption(prev => ({ ...prev, type: 'custom' }))}
                    />
                    <div className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900">Custom Date</span>
                      <span className="block text-sm text-gray-500">Choose a specific start date and time</span>
                      {startDateOption.type === 'custom' && (
                        <input
                          type="datetime-local"
                          value={startDateOption.date}
                          onChange={(e) => setStartDateOption(prev => ({ ...prev, date: e.target.value }))}
                          className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  </label>

                  <label className="relative flex p-4 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none">
                    <input
                      type="radio"
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mt-1"
                      checked={startDateOption.type === 'next_occurrence'}
                      onChange={() => setStartDateOption(prev => ({ ...prev, type: 'next_occurrence' }))}
                    />
                    <div className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900">Next Available Day</span>
                      <span className="block text-sm text-gray-500">
                        Automatically start on the next occurrence of selected day(s)
                      </span>
                      {startDateOption.type === 'next_occurrence' && startDateOption.date && (
                        <div className="mt-2 text-sm text-emerald-600">
                          Will start on: {new Date(startDateOption.date).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {isRecurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom Interval</option>
                    </select>
                  </div>

                  {frequency === 'custom' && (
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Repeat every</label>
                        <input
                          type="number"
                          min="1"
                          value={customInterval.value}
                          onChange={(e) => setCustomInterval(prev => ({
                            ...prev,
                            value: parseInt(e.target.value) || 1
                          }))}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Unit</label>
                        <select
                          value={customInterval.unit}
                          onChange={(e) => setCustomInterval(prev => ({
                            ...prev,
                            unit: e.target.value as CustomInterval['unit']
                          }))}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        >
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {(frequency === 'weekly' || frequency === 'biweekly') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setSelectedDays(prev =>
                                prev.includes(index)
                                  ? prev.filter(d => d !== index)
                                  : [...prev, index]
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              selectedDays.includes(index)
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-500'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Response Window</h3>
                  <p className="text-sm text-gray-500">Define when clients can submit their check-in responses</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Window Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="relative flex p-4 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none">
                        <input
                          type="radio"
                          className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mt-1"
                          checked={!hasTimeWindow}
                          onChange={() => setHasTimeWindow(false)}
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">24-Hour Window</span>
                          <span className="block text-sm text-gray-500">Client can respond anytime within the check-in day</span>
                        </div>
                      </label>

                      <label className="relative flex p-4 border rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none">
                        <input
                          type="radio"
                          className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 mt-1"
                          checked={hasTimeWindow}
                          onChange={() => setHasTimeWindow(true)}
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">Custom Window</span>
                          <span className="block text-sm text-gray-500">Set specific hours when client can respond</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {hasTimeWindow && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Window Opens</label>
                          <div className="flex space-x-2">
                            <select
                              value={timeWindow.openDay}
                              onChange={(e) => setTimeWindow(prev => ({ 
                                ...prev, 
                                openDay: parseInt(e.target.value),
                                // If close day is before open day, set it to open day
                                closeDay: parseInt(e.target.value) > prev.closeDay ? parseInt(e.target.value) : prev.closeDay
                              }))}
                              className="w-1/2 rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                                <option key={day} value={index}>{day}</option>
                              ))}
                            </select>
                            <input
                              type="time"
                              value={timeWindow.openTime}
                              onChange={(e) => setTimeWindow(prev => ({ ...prev, openTime: e.target.value }))}
                              className="w-1/2 rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            />
                          </div>
                          <p className="text-sm text-gray-500">
                            Check-in becomes available
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Window Closes</label>
                          <div className="flex space-x-2">
                            <select
                              value={timeWindow.closeDay}
                              onChange={(e) => setTimeWindow(prev => ({ 
                                ...prev, 
                                closeDay: parseInt(e.target.value),
                                // If selected close day is before open day, adjust open day
                                openDay: parseInt(e.target.value) < prev.openDay ? parseInt(e.target.value) : prev.openDay
                              }))}
                              className="w-1/2 rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                                <option 
                                  key={day} 
                                  value={index}
                                  // Disable days that would create a window longer than 7 days
                                  disabled={
                                    timeWindow.openDay > index && 
                                    (7 - timeWindow.openDay + index) > 7
                                  }
                                >
                                  {day}
                                </option>
                              ))}
                            </select>
                            <input
                              type="time"
                              value={timeWindow.closeTime}
                              onChange={(e) => setTimeWindow(prev => ({ ...prev, closeTime: e.target.value }))}
                              className="w-1/2 rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            />
                          </div>
                          <p className="text-sm text-gray-500">
                            Response must be submitted by this time
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Example Schedule</h4>
                        <p className="text-sm text-blue-700">
                          {frequency === 'weekly' && selectedDays.length > 0 ? (
                            <>
                              On {selectedDays.map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]).join(', ')},
                              your client can submit their check-in from{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.openDay]}{' '}
                              at {timeWindow.openTime} until{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.closeDay]}{' '}
                              at {timeWindow.closeTime}.
                            </>
                          ) : frequency === 'daily' ? (
                            <>
                              Every day, your client can submit their check-in from{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.openDay]}{' '}
                              at {timeWindow.openTime} until{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.closeDay]}{' '}
                              at {timeWindow.closeTime}.
                            </>
                          ) : frequency === 'custom' ? (
                            <>
                              Every {customInterval.value} {customInterval.unit}, your client can submit their check-in from{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.openDay]}{' '}
                              at {timeWindow.openTime} until{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.closeDay]}{' '}
                              at {timeWindow.closeTime}.
                            </>
                          ) : (
                            <>
                              On scheduled days, your client can submit their check-in from{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.openDay]}{' '}
                              at {timeWindow.openTime} until{' '}
                              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timeWindow.closeDay]}{' '}
                              at {timeWindow.closeTime}.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateCheckIn}
            disabled={!selectedTemplate || !selectedClient || !startDate || (hasTimeWindow && (!timeWindow.openTime || !timeWindow.closeTime))}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Check-in
          </button>
        </>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading templates and clients...</p>
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No templates found. Create a template first.</p>
          <a
            href="/coach/templates/create"
            className="mt-4 inline-block text-emerald-600 hover:text-emerald-700"
          >
            Create Template
          </a>
        </div>
      )}
    </div>
  );
} 