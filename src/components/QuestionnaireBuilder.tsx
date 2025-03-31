'use client';

import React, { useState, useEffect } from 'react';
import { Question, Category, QuestionType } from '@/types';
import { PlusIcon, XMarkIcon, ChevronRightIcon, ChevronLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import { templateService } from '@/services/templateService';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface QuestionnaireBuilderProps {
  onSave: (template: { name: string; description: string; categories: Category[]; questions: Question[] }) => void;
  initialTemplate?: {
    name: string;
    description: string;
    categories: Category[];
    questions: Question[];
  };
}

const DEFAULT_CATEGORIES = [
  { id: 'overall', name: 'Overall', description: 'General well-being and progress', order: 0, color: 'bg-indigo-50 border-indigo-200' },
  { id: 'nutrition', name: 'Nutrition', description: 'Diet and eating habits', order: 1, color: 'bg-green-50 border-green-200' },
  { id: 'workouts', name: 'Workouts', description: 'Exercise and training', order: 2, color: 'bg-blue-50 border-blue-200' },
  { id: 'mindset', name: 'Mindset', description: 'Mental health and motivation', order: 3, color: 'bg-purple-50 border-purple-200' },
  { id: 'habits', name: 'Habits', description: 'Daily routines and behaviors', order: 4, color: 'bg-yellow-50 border-yellow-200' },
  { id: 'stress', name: 'Stress', description: 'Stress levels and management', order: 5, color: 'bg-red-50 border-red-200' },
  { id: 'sleep', name: 'Sleep', description: 'Sleep quality and patterns', order: 6, color: 'bg-sky-50 border-sky-200' },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Work-life balance and daily activities', order: 7, color: 'bg-orange-50 border-orange-200' }
];

const QUESTION_TYPE_INFO = {
  text: { label: 'Text', description: 'Small or long text like title or description', icon: 'Aa' },
  number: { label: 'Number', description: 'Numbers (integer, float, decimal)', icon: '1' },
  multiple_choice: { label: 'Multiple Choice', description: 'Give multiple options to choose from', icon: '☐' },
  scale: { label: 'Scale', description: 'A scale from 1 to 10', icon: '⚖️' },
  yes_no: { label: 'Yes/No', description: 'Yes or no', icon: '✓' },
  media: { label: 'Media', description: 'One image or video', icon: '📷' },
  date: { label: 'Date', description: 'Select a specific date', icon: '📅' },
  star_rating: { label: 'Star Rating', description: 'Star rating from 1 to 5', icon: '★' },
  progress_photos: { label: 'Progress Photos', description: 'Sync "Front, Back, Side" photos to gallery', icon: '📸' },
  metric: { label: 'Metric', description: 'Sync to Metrics section automatically', icon: '📊' },
};

interface QuestionWizardProps {
  onComplete: (question: Question) => void;
  onCancel: () => void;
  categories: Category[];
}

function QuestionWizard({ onComplete, onCancel, categories }: QuestionWizardProps) {
  const [step, setStep] = useState(1);
  const [questionData, setQuestionData] = useState<Partial<Question>>({
    id: Math.random().toString(36).substr(2, 9),
    required: false,
    weight: 3,
  });

  const steps = [
    {
      title: 'Write Question',
      description: 'Write your question text',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
            <input
              type="text"
              value={questionData.text || ''}
              onChange={(e) => setQuestionData({ ...questionData, text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="e.g., How are you feeling today?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <input
              type="text"
              value={questionData.description || ''}
              onChange={(e) => setQuestionData({ ...questionData, description: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Add additional context or instructions"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Select Question Type',
      description: 'Choose how you want the question to be answered',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(QUESTION_TYPE_INFO).map(([type, info]) => (
            <button
              key={type}
              onClick={() => setQuestionData({ ...questionData, type: type as QuestionType })}
              className={`text-left p-4 rounded-lg border-2 ${
                questionData.type === type 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{info.icon}</span>
                <span className="font-medium">{info.label}</span>
              </div>
              <p className="text-sm text-gray-500">{info.description}</p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Allocate Sub Category',
      description: 'Choose which category this question belongs to',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setQuestionData({ ...questionData, categoryId: category.id })}
                className={`${
                  questionData.categoryId === category.id ? 'ring-2 ring-primary' : ''
                } ${
                  category.color
                } p-2 rounded-lg text-sm transition-all hover:shadow-md ${
                  questionData.categoryId === category.id ? 'shadow-lg' : ''
                }`}
              >
                <div className="font-medium">{category.name}</div>
                <div className="text-xs text-gray-600 truncate">{category.description}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Allocate Question Weight',
      description: 'Set how important this question is for analysis',
      content: (
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            {[5, 4, 3, 2, 1].map((weight) => (
              <button
                key={weight}
                onClick={() => setQuestionData({ ...questionData, weight })}
                className={`text-left p-4 rounded-lg border-2 ${
                  questionData.weight === weight 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Weight {weight}</h3>
                    <p className="text-sm text-gray-500">
                      {weight === 5 && 'Critical - Essential for progress tracking'}
                      {weight === 4 && 'Very Important - Key indicator'}
                      {weight === 3 && 'Important - Significant metric'}
                      {weight === 2 && 'Somewhat Important - Supporting data'}
                      {weight === 1 && 'Optional - Nice to have'}
                    </p>
                  </div>
                  <div className="flex">
                    {Array(weight).fill(0).map((_, i) => (
                      <div key={i} className="w-2 h-8 bg-emerald-500 rounded-full mx-0.5" />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )
    }
  ];

  const canProceed = () => {
    switch (step) {
      case 1:
        return questionData.text && questionData.text.trim().length > 0;
      case 2:
        return questionData.type;
      case 3:
        return questionData.categoryId;
      case 4:
        return questionData.weight;
      default:
        return false;
    }
  };

  const handleComplete = () => {
    if (questionData.text && questionData.type && questionData.categoryId && questionData.weight) {
      onComplete(questionData as Question);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Question - Step {step}</h2>
              <p className="mt-1 text-sm text-gray-500">{steps[step - 1].description}</p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center">
              {steps.map((_, index) => (
                <React.Fragment key={index}>
                  <div className={`flex-1 h-2 ${
                    index + 1 <= step ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                  {index < steps.length - 1 && (
                    <div className={`w-4 h-4 rounded-full ${
                      index + 1 < step ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {steps[step - 1].content}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {step < steps.length ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Question
              <PlusIcon className="h-5 w-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PreviewModalProps {
  template: {
    name: string;
    description: string;
    categories: Category[];
    questions: Question[];
  };
  onClose: () => void;
}

function PreviewModal({ template, onClose }: PreviewModalProps) {
  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder="Your answer here..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            disabled
          />
        );
      case 'number':
        return (
          <input
            type="number"
            placeholder="0"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            disabled
          />
        );
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            <div className="flex items-center">
              <input type="radio" className="h-4 w-4 text-emerald-600" disabled />
              <label className="ml-2 text-gray-700">Option 1</label>
            </div>
            <div className="flex items-center">
              <input type="radio" className="h-4 w-4 text-emerald-600" disabled />
              <label className="ml-2 text-gray-700">Option 2</label>
            </div>
          </div>
        );
      case 'scale':
        return (
          <div className="flex justify-between items-center space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500"
                disabled
              >
                {num}
              </button>
            ))}
          </div>
        );
      case 'yes_no':
        return (
          <div className="flex space-x-4">
            <button className="px-4 py-2 rounded-md border border-gray-300 text-gray-700" disabled>Yes</button>
            <button className="px-4 py-2 rounded-md border border-gray-300 text-gray-700" disabled>No</button>
          </div>
        );
      case 'media':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-gray-500">Click to upload media</p>
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            disabled
          />
        );
      case 'star_rating':
        return (
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="text-2xl text-gray-300" disabled>★</button>
            ))}
          </div>
        );
      case 'progress_photos':
        return (
          <div className="grid grid-cols-3 gap-4">
            {['Front', 'Side', 'Back'].map((view) => (
              <div key={view} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <p className="text-gray-500">{view} View</p>
              </div>
            ))}
          </div>
        );
      case 'metric':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="0"
              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled
            />
            <span className="text-gray-500">units</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Group questions by category
  const questionsByCategory = template.categories.reduce((acc, category) => {
    acc[category.id] = template.questions.filter(q => q.categoryId === category.id);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {template.categories.map((category) => {
            const categoryQuestions = questionsByCategory[category.id] || [];
            if (categoryQuestions.length === 0) return null;

            return (
              <div key={category.id} className="mb-8 last:mb-0">
                <div className={`px-4 py-2 rounded-md mb-4 ${category.color}`}>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                </div>
                <div className="space-y-8">
                  {categoryQuestions.map((question, index) => (
                    <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <div className="ml-4 flex-grow">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                              {question.text}
                              {question.required && (
                                <span className="ml-2 text-sm text-red-500">*</span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Weight: {question.weight}</span>
                              {Array(question.weight).fill(0).map((_, i) => (
                                <div key={i} className="w-1 h-4 bg-emerald-500 rounded-full" />
                              ))}
                            </div>
                          </div>
                          {question.description && (
                            <p className="mt-1 text-sm text-gray-500">{question.description}</p>
                          )}
                          <div className="mt-4">
                            {renderQuestionInput(question)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {template.questions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No questions added yet
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 sticky bottom-0">
          <button
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            disabled
          >
            Submit Check-in
          </button>
        </div>
      </div>
    </div>
  );
}

interface SavedQuestion extends Question {
  id: string;
  createdAt: Date;
}

export default function QuestionnaireBuilder({ onSave, initialTemplate }: QuestionnaireBuilderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState(initialTemplate?.name || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [categories, setCategories] = useState<Category[]>(initialTemplate?.categories || DEFAULT_CATEGORIES);
  const [questions, setQuestions] = useState<Question[]>(initialTemplate?.questions || []);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    type: 'text',
    category: '',
    weight: 1
  });
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [showSavedQuestions, setShowSavedQuestions] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedQuestions();
    }
  }, [user]);

  const loadSavedQuestions = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'savedQuestions'),
        where('coachId', '==', user.id)
      );
      const querySnapshot = await getDocs(q);
      const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as SavedQuestion[];
      setSavedQuestions(questions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading saved questions:', error);
    }
  };

  const saveQuestion = async (question: Question) => {
    if (!user) return;
    try {
      const savedQuestion = {
        ...question,
        coachId: user.id,
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'savedQuestions'), savedQuestion);
      const newSavedQuestion = {
        ...savedQuestion,
        id: docRef.id,
      } as SavedQuestion;
      setSavedQuestions(prev => [newSavedQuestion, ...prev]);
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleAddQuestion = (question: Question) => {
    setQuestions([...questions, question]);
    saveQuestion(question);
    setShowAddQuestion(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Category',
      description: '',
      order: categories.length,
      color: 'bg-gray-100',
    };
    setCategories([...categories, newCategory]);
  };

  const handleUpdateCategory = (categoryId: string, updates: Partial<Category>) => {
    setCategories(categories.map(c => c.id === categoryId ? { ...c, ...updates } : c));
  };

  const handleDeleteCategory = (categoryId: string) => {
    const newCategories = categories.filter(c => c.id !== categoryId);
    const fallbackCategoryId = newCategories[0]?.id || 'uncategorized';
    
    setQuestions(questions.map(q => 
      q.categoryId === categoryId 
        ? { ...q, categoryId: fallbackCategoryId }
        : q
    ));
    setCategories(newCategories);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save a template');
      return;
    }

    if (!name) {
      toast.error('Please enter a template name');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    try {
      setIsSaving(true);
      const templateData = {
        name,
        description,
        categories,
        questions,
        coachId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (initialTemplate?.id) {
        await templateService.updateTemplate(initialTemplate.id, templateData);
        toast.success('Template updated successfully');
      } else {
        await addDoc(collection(db, 'templates'), templateData);
        toast.success('Template created successfully');
      }

      // Redirect to templates list
      router.push('/coach/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const SavedQuestionsSection = () => {
    // Filter out questions that are already in the template
    const unusedSavedQuestions = savedQuestions.filter(savedQuestion => 
      !questions.some(templateQuestion => 
        templateQuestion.text === savedQuestion.text && 
        templateQuestion.category === savedQuestion.category
      )
    );

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Saved Questions</h3>
          <button
            onClick={() => setShowSavedQuestions(!showSavedQuestions)}
            className="text-sm text-primary hover:text-primary-dark"
          >
            {showSavedQuestions ? 'Hide' : 'Show'} Saved Questions
          </button>
        </div>
        {showSavedQuestions && (
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {unusedSavedQuestions
              .filter(q => !currentQuestion?.category || q.category === currentQuestion.category)
              .map((question) => (
                <button
                  key={question.id}
                  onClick={() => handleAddQuestion(question)}
                  className="text-left p-2 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{question.text}</p>
                    <p className="text-xs text-gray-500">
                      Type: {question.type} | Category: {
                        DEFAULT_CATEGORIES.find(c => c.id === question.category)?.name
                      }
                    </p>
                  </div>
                  <BookmarkSolid className="h-4 w-4 text-primary ml-2" />
                </button>
              ))}
            {unusedSavedQuestions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No unused saved questions available
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Step 1: Template Name and Description</h1>
            <p className="text-sm text-gray-500 mt-1">Start by naming your template and adding a description</p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-5 w-5 mr-2 text-gray-400" />
            Preview
          </button>
        </div>
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Enter template name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Enter template description"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-bold">Step 2: Categories in this Template</h2>
            <p className="text-sm text-gray-500 mt-1">Define the categories to organize your questions</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusIcon className="h-3.5 w-3.5 mr-1" />
            Add Category
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`relative p-2.5 rounded-lg border ${category.color} hover:shadow-sm transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                  className="block w-full bg-transparent font-medium text-sm border-0 focus:ring-0 p-0 mb-0.5"
                  placeholder="Category name"
                />
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                value={category.description || ''}
                onChange={(e) => handleUpdateCategory(category.id, { description: e.target.value })}
                className="block w-full bg-transparent text-xs text-gray-600 border-0 focus:ring-0 p-0"
                placeholder="Category description"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Step 3: Build Questions</h2>
            <p className="text-sm text-gray-500 mt-1">Create and organize your template questions</p>
          </div>
          <button
            onClick={() => setShowAddQuestion(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Question
          </button>
        </div>

        {showAddQuestion && (
          <QuestionWizard
            onComplete={handleAddQuestion}
            onCancel={() => setShowAddQuestion(false)}
            categories={categories}
          />
        )}

        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{QUESTION_TYPE_INFO[question.type].icon}</span>
                  <span className="font-medium">{question.text}</span>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Type: {QUESTION_TYPE_INFO[question.type].label}</span>
                <span>Category: {categories.find(c => c.id === question.categoryId)?.name}</span>
                <span>Weight: {question.weight}</span>
                {question.required && <span className="text-emerald-600">Required</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Template...
            </>
          ) : (
            'Save Template'
          )}
        </button>
      </div>

      {showPreview && (
        <PreviewModal
          template={{ name, description, categories, questions }}
          onClose={() => setShowPreview(false)}
        />
      )}

      <SavedQuestionsSection />
    </div>
  );
} 