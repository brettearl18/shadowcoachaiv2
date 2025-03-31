import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Check if user exists
      const user = await auth.getUser(decodedToken.uid);
      
      // Check user claims
      const claims = decodedToken.role;
      if (claims !== 'admin') {
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }
    } catch (error: any) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: `Invalid token: ${error.message}` }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the organization
    try {
      const orgRef = await db.collection('organizations').add({
        name,
        type,
        adminIds: [],
        coachIds: [],
        settings: {
          allowClientReassignment: true,
          maxClientsPerCoach: 50,
          defaultTemplates: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const org = await orgRef.get();
      return NextResponse.json({ id: org.id, ...org.data() });
    } catch (error: any) {
      console.error('Organization creation failed:', error);
      return NextResponse.json({ error: `Failed to create organization: ${error.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Internal server error:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
} 