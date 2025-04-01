import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const auth = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function createTemplate() {
  try {
    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Client Check-in Template',
        },
        sheets: [
          {
            properties: {
              title: 'Check-ins',
            },
            data: [
              {
                rowData: [
                  {
                    values: [
                      { userEnteredValue: 'Date' },
                      { userEnteredValue: 'Week' },
                      { userEnteredValue: 'Weight' },
                      { userEnteredValue: 'Body Fat' },
                      { userEnteredValue: 'Nutrition' },
                      { userEnteredValue: 'Training' },
                      { userEnteredValue: 'Recovery' },
                      { userEnteredValue: 'Percentage Rating' },
                      { userEnteredValue: 'Measurements' },
                    ],
                  },
                  {
                    values: [
                      { userEnteredValue: '2024-03-20' },
                      { userEnteredValue: 'Week 1' },
                      { userEnteredValue: '75' },
                      { userEnteredValue: '20' },
                      { userEnteredValue: JSON.stringify({
                        calories: 2000,
                        protein: 150,
                        carbs: 200,
                        fats: 70,
                        water: 2.5,
                        supplements: ['Protein', 'Creatine']
                      }) },
                      { userEnteredValue: JSON.stringify({
                        workouts: 4,
                        duration: 60,
                        intensity: 8,
                        exercises: ['Squats', 'Deadlifts', 'Bench Press']
                      }) },
                      { userEnteredValue: JSON.stringify({
                        sleep: 7,
                        stress: 6,
                        soreness: 3,
                        notes: 'Feeling good overall'
                      }) },
                      { userEnteredValue: '85' },
                      { userEnteredValue: JSON.stringify({
                        chest: 100,
                        waist: 80,
                        hips: 95,
                        arms: 35,
                        legs: 60
                      }) },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    console.log('Template created successfully!');
    console.log('Spreadsheet URL:', spreadsheet.data.spreadsheetUrl);
    console.log('Spreadsheet ID:', spreadsheet.data.spreadsheetId);

    // Share with the service account
    await sheets.spreadsheets.update({
      spreadsheetId: spreadsheet.data.spreadsheetId,
      requestBody: {
        properties: {
          title: 'Client Check-in Template',
        },
      },
    });

  } catch (error) {
    console.error('Error creating template:', error);
  }
}

createTemplate(); 