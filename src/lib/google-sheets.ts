import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Initialize the Google Sheets API client
const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface CheckInData {
  date: string;
  week: number;
  weight: number;
  bodyFat: number;
  measurements: {
    chest: number;
    waist: number;
    hips: number;
    arms: number;
    legs: number;
  };
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  training: {
    sessions: number;
    intensity: number;
    progress: string;
  };
  recovery: {
    sleep: number;
    stress: number;
    energy: number;
  };
  customQuestions: Array<{
    question: string;
    answer: string;
    category: string;
  }>;
  percentageRating: number;
}

export async function fetchCheckInData(spreadsheetId: string): Promise<CheckInData[]> {
  try {
    // Fetch the spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Get the first sheet
    const sheet = spreadsheet.data.sheets?.[0];
    if (!sheet) throw new Error('No sheets found in the spreadsheet');

    // Fetch the values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheet.properties?.title}!A:Z`, // Adjust range as needed
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) throw new Error('No data found in the spreadsheet');

    // Get headers from the first row
    const headers = rows[0];
    const headerMap = headers.reduce((acc: Record<string, number>, header: string, index: number) => {
      acc[header.toLowerCase()] = index;
      return acc;
    }, {});

    // Identify custom questions (columns that don't match standard fields)
    const standardFields = ['date', 'week', 'weight', 'body fat', 'chest', 'waist', 'hips', 'arms', 'legs', 
                          'calories', 'protein', 'carbs', 'fats', 'sessions', 'intensity', 'progress',
                          'sleep', 'stress', 'energy', 'percentage rating'];
    
    const customQuestions = headers.filter(header => 
      !standardFields.includes(header.toLowerCase()) && 
      header.toLowerCase() !== 'week' && 
      header.toLowerCase() !== 'upload photos & measurements are non negotiable.'
    );

    // Process data rows
    return rows.slice(1).map(row => {
      const baseData = {
        date: row[headerMap['date']] || '',
        week: parseInt(row[headerMap['week']]) || 0,
        weight: parseFloat(row[headerMap['weight']]) || 0,
        bodyFat: parseFloat(row[headerMap['body fat']]) || 0,
        measurements: {
          chest: parseFloat(row[headerMap['chest']]) || 0,
          waist: parseFloat(row[headerMap['waist']]) || 0,
          hips: parseFloat(row[headerMap['hips']]) || 0,
          arms: parseFloat(row[headerMap['arms']]) || 0,
          legs: parseFloat(row[headerMap['legs']]) || 0,
        },
        nutrition: {
          calories: parseFloat(row[headerMap['calories']]) || 0,
          protein: parseFloat(row[headerMap['protein']]) || 0,
          carbs: parseFloat(row[headerMap['carbs']]) || 0,
          fats: parseFloat(row[headerMap['fats']]) || 0,
        },
        training: {
          sessions: parseFloat(row[headerMap['sessions']]) || 0,
          intensity: parseFloat(row[headerMap['intensity']]) || 0,
          progress: row[headerMap['progress']] || '',
        },
        recovery: {
          sleep: parseFloat(row[headerMap['sleep']]) || 0,
          stress: parseFloat(row[headerMap['stress']]) || 0,
          energy: parseFloat(row[headerMap['energy']]) || 0,
        },
        percentageRating: parseFloat(row[headerMap['percentage rating']]) || 0,
        customQuestions: customQuestions.map(question => ({
          question,
          answer: row[headerMap[question.toLowerCase()]] || '',
          category: determineQuestionCategory(question)
        }))
      };

      return baseData;
    });
  } catch (error) {
    console.error('Error fetching check-in data:', error);
    throw error;
  }
}

function determineQuestionCategory(question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('nutrition') || 
      questionLower.includes('food') || 
      questionLower.includes('diet') || 
      questionLower.includes('meal')) {
    return 'nutrition';
  }
  
  if (questionLower.includes('training') || 
      questionLower.includes('workout') || 
      questionLower.includes('exercise') || 
      questionLower.includes('gym')) {
    return 'training';
  }
  
  if (questionLower.includes('recovery') || 
      questionLower.includes('sleep') || 
      questionLower.includes('stress') || 
      questionLower.includes('energy')) {
    return 'recovery';
  }
  
  return 'general';
}

export function extractSpreadsheetId(url: string): string | null {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
} 