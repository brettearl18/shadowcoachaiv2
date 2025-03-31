import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Question } from '@/types';

export interface Template {
  id?: string;
  name: string;
  description: string;
  questions: Question[];
  categories: Category[];
  coachId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  text: string;
  type: 'text' | 'number' | 'scale' | 'multipleChoice' | 'checkbox';
  category: string;
  weight: number;
  options?: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
}

class TemplateService {
  private collection = 'templates';

  async createTemplate(template: Template): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, template: Partial<Template>): Promise<void> {
    try {
      const docRef = doc(db, this.collection, templateId);
      await updateDoc(docRef, {
        ...template,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, templateId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  async getTemplatesByCoach(coachId: string): Promise<Template[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('coachId', '==', coachId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Template[];
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  async getTemplateById(templateId: string): Promise<Template | null> {
    try {
      const docRef = doc(db, this.collection, templateId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Template;
    } catch (error) {
      console.error('Error getting template:', error);
      throw error;
    }
  }
}

export const templateService = new TemplateService(); 