import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { coachService } from '@/services/coachService';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const user = await auth.getUser(decodedToken.uid);

    // Check if user has admin or coach role
    if (!decodedToken.role || !['admin', 'coach'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const coachId = searchParams.get('coachId');

    if (coachId) {
      // Get specific coach
      const coach = await coachService.getCoachProfile(coachId);
      return NextResponse.json(coach);
    } else if (organizationId) {
      // Get all coaches for an organization
      const coaches = await coachService.getOrganizationCoaches(organizationId);
      return NextResponse.json(coaches);
    } else if (decodedToken.role === 'admin') {
      // Get all coaches (admin only)
      const coachesRef = collection(db, 'coaches');
      const snapshot = await getDocs(coachesRef);
      const coaches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return NextResponse.json(coaches);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in coaches API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    // Verify the token and admin role
    const decodedToken = await auth.verifyIdToken(token);
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, specialties, bio, organizationId } = body;

    if (!name || !email || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create coach profile
    const coachData = {
      name,
      email,
      specialties: specialties || [],
      bio: bio || '',
      organizationId,
      totalClients: 0,
      activeClients: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const coachesRef = collection(db, 'coaches');
    const docRef = await addDoc(coachesRef, coachData);
    
    return NextResponse.json({
      id: docRef.id,
      ...coachData
    });
  } catch (error: any) {
    console.error('Error creating coach:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    // Verify the token and admin role
    const decodedToken = await auth.verifyIdToken(token);
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 });
    }

    const coachRef = doc(db, 'coaches', id);
    await updateDoc(coachRef, {
      ...updates,
      updatedAt: new Date()
    });

    const updatedDoc = await getDoc(coachRef);
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error: any) {
    console.error('Error updating coach:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    // Verify the token and admin role
    const decodedToken = await auth.verifyIdToken(token);
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('id');

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 });
    }

    await coachService.deleteCoach(coachId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting coach:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 