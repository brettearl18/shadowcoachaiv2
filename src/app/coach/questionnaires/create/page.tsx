'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionnaireBuilder from '@/components/QuestionnaireBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function CreateQuestionnaire() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (template: {
    name: string;
    description: string;
    categories: any[];
    questions: any[];
  }) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const templateData = {
        ...template,
        createdBy: user.uid,
        organizationId: user.organizationId,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'templates'), templateData);
      router.push('/coach/questionnaires');
    } catch (error) {
      console.error('Error saving template:', error);
      // TODO: Add error handling/notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <QuestionnaireBuilder onSave={handleSave} />
        </div>
      </div>
    </div>
  );
} 