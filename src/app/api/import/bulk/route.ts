import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { processDataWithAI } from '../route';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the file content
    const buffer = await file.arrayBuffer();
    const content = new TextDecoder().decode(buffer);

    // Parse CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Process the data with AI
    const processedData = await processDataWithAI(records);

    return NextResponse.json(processedData);
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
} 