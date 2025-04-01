import { NextResponse } from 'next/server';
import { fetchCheckInData, extractSpreadsheetId } from '@/lib/google-sheets';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let data;
    if (url.includes('docs.google.com')) {
      // Handle Google Sheets
      const spreadsheetId = extractSpreadsheetId(url);
      if (!spreadsheetId) {
        return NextResponse.json(
          { error: 'Invalid Google Sheets URL' },
          { status: 400 }
        );
      }
      data = await fetchCheckInData(spreadsheetId);
    } else {
      // Handle web URLs
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch data from URL');
        }
        data = await response.json();
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to fetch data from URL' },
          { status: 400 }
        );
      }
    }

    // Process the data with AI
    const processedData = await processDataWithAI(data);

    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import data' },
      { status: 500 }
    );
  }
}

export async function processDataWithAI(data: any[]) {
  // Calculate scores and generate insights
  const checkIns = data.map(checkIn => ({
    date: checkIn.date,
    week: checkIn.week,
    scores: {
      nutrition: calculateNutritionScore(checkIn.nutrition),
      training: calculateTrainingScore(checkIn.training),
      recovery: calculateRecoveryScore(checkIn.recovery),
      overall: checkIn.percentageRating
    },
    categoryAnswers: {
      nutrition: generateNutritionAnswers(checkIn.nutrition),
      training: generateTrainingAnswers(checkIn.training),
      recovery: generateRecoveryAnswers(checkIn.recovery)
    },
    customQuestions: checkIn.customQuestions
  }));

  const measurements = data.map(checkIn => ({
    date: checkIn.date,
    week: checkIn.week,
    weight: checkIn.weight,
    bodyFat: checkIn.bodyFat,
    measurements: Object.entries(checkIn.measurements).map(([type, value]) => ({
      type,
      value
    }))
  }));

  const insights = generateInsights(data);
  const recommendations = generateRecommendations(data);

  // Group custom questions by category
  const customQuestionsByCategory = data.reduce((acc: Record<string, Array<{question: string, answers: string[]}>>, checkIn) => {
    checkIn.customQuestions.forEach(q => {
      if (!acc[q.category]) {
        acc[q.category] = [];
      }
      const existingQuestion = acc[q.category].find(eq => eq.question === q.question);
      if (existingQuestion) {
        existingQuestion.answers.push(q.answer);
      } else {
        acc[q.category].push({
          question: q.question,
          answers: [q.answer]
        });
      }
    });
    return acc;
  }, {});

  return {
    checkIns,
    measurements,
    insights,
    recommendations,
    customQuestions: customQuestionsByCategory
  };
}

function calculateNutritionScore(nutrition: any) {
  const { calories, protein, carbs, fats } = nutrition;
  // Simple scoring algorithm - can be enhanced
  const score = (protein / 180) * 40 + (carbs / 250) * 30 + (fats / 70) * 30;
  return Math.round(Math.min(score, 100));
}

function calculateTrainingScore(training: any) {
  const { sessions, intensity } = training;
  // Simple scoring algorithm - can be enhanced
  const score = (sessions / 4) * 50 + (intensity / 10) * 50;
  return Math.round(Math.min(score, 100));
}

function calculateRecoveryScore(recovery: any) {
  const { sleep, stress, energy } = recovery;
  // Simple scoring algorithm - can be enhanced
  const score = (sleep / 8) * 40 + ((10 - stress) / 10) * 30 + (energy / 10) * 30;
  return Math.round(Math.min(score, 100));
}

function generateNutritionAnswers(nutrition: any) {
  return [
    { question: 'Daily Calorie Intake', answer: nutrition.calories.toString() },
    { question: 'Protein Intake (g)', answer: nutrition.protein.toString() },
    { question: 'Carb Intake (g)', answer: nutrition.carbs.toString() },
    { question: 'Fat Intake (g)', answer: nutrition.fats.toString() }
  ];
}

function generateTrainingAnswers(training: any) {
  return [
    { question: 'Training Sessions', answer: training.sessions.toString() },
    { question: 'Training Intensity (1-10)', answer: training.intensity.toString() },
    { question: 'Progress Notes', answer: training.progress }
  ];
}

function generateRecoveryAnswers(recovery: any) {
  return [
    { question: 'Sleep Duration (hours)', answer: recovery.sleep.toString() },
    { question: 'Stress Level (1-10)', answer: recovery.stress.toString() },
    { question: 'Energy Level (1-10)', answer: recovery.energy.toString() }
  ];
}

function generateInsights(data: any[]) {
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const first = sortedData[0];
  const last = sortedData[sortedData.length - 1];

  return {
    progress: {
      startDate: first.date,
      endDate: last.date,
      weightChange: last.weight - first.weight,
      bodyFatChange: last.bodyFat - first.bodyFat
    },
    trends: {
      weight: data.map(d => ({ date: d.date, value: d.weight })),
      bodyFat: data.map(d => ({ date: d.date, value: d.bodyFat }))
    },
    patterns: {
      nutrition: {
        averageCalories: data.reduce((sum, d) => sum + d.nutrition.calories, 0) / data.length,
        averageProtein: data.reduce((sum, d) => sum + d.nutrition.protein, 0) / data.length
      },
      training: {
        averageSessions: data.reduce((sum, d) => sum + d.training.sessions, 0) / data.length,
        averageIntensity: data.reduce((sum, d) => sum + d.training.intensity, 0) / data.length
      }
    }
  };
}

function generateRecommendations(data: any[]) {
  const avgCalories = data.reduce((sum, d) => sum + d.nutrition.calories, 0) / data.length;
  const avgIntensity = data.reduce((sum, d) => sum + d.training.intensity, 0) / data.length;
  const avgSleep = data.reduce((sum, d) => sum + d.recovery.sleep, 0) / data.length;

  return {
    nutrition: [
      `Your average daily calories are ${Math.round(avgCalories)}. Consider adjusting based on your goals.`,
      'Focus on maintaining consistent protein intake across all meals.'
    ],
    training: [
      `Your average training intensity is ${avgIntensity.toFixed(1)}/10. Consider increasing intensity gradually.`,
      'Try to maintain consistent training frequency.'
    ],
    recovery: [
      `Your average sleep is ${avgSleep.toFixed(1)} hours. Aim for 7-9 hours for optimal recovery.`,
      'Monitor stress levels and implement recovery strategies.'
    ]
  };
} 