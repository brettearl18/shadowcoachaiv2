'use client';

import React, { useEffect, useState } from 'react';
import { Template, templateService } from '@/services/templateService';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const loadedTemplates = await templateService.getTemplatesByCoach(user.id);
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templateService.deleteTemplate(templateId);
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Questionnaire Templates</h1>
        <Link
          href="/coach/questionnaires/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Create your first questionnaire template to get started</p>
          <Link
            href="/coach/questionnaires/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{template.description}</p>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>{template.questions.length} questions</span>
                  <span>{template.categories.length} categories</span>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-between">
                <Link
                  href={`/coach/questionnaires/edit/${template.id}`}
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() => template.id && handleDeleteTemplate(template.id)}
                  className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 