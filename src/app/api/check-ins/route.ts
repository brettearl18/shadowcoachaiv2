import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { clientService } from '@/services/clientService';
import type { CheckInData } from '@/services/clientService';

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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const checkInId = searchParams.get('checkInId');
    const limitParam = searchParams.get('limit');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check permissions
    const clientDoc = await getDoc(doc(db, 'clients', clientId));
    if (!clientDoc.exists()) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientData = clientDoc.data();
    if (
      decodedToken.role === 'client' && decodedToken.uid !== clientId ||
      decodedToken.role === 'coach' && clientData.coachId !== decodedToken.uid
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (checkInId) {
      // Get specific check-in
      const checkInDoc = await getDoc(doc(db, 'checkIns', checkInId));
      if (!checkInDoc.exists()) {
        return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
      }
      return NextResponse.json({
        id: checkInDoc.id,
        ...checkInDoc.data()
      });
    } else {
      // Get client's check-ins
      const checkInsRef = collection(db, 'checkIns');
      const q = query(
        checkInsRef,
        where('clientId', '==', clientId),
        orderBy('date', 'desc'),
        limit(parseInt(limitParam || '10'))
      );

      const snapshot = await getDocs(q);
      const checkIns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));

      return NextResponse.json(checkIns);
    }
  } catch (error: any) {
    console.error('Error in check-ins API:', error);
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

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    
    const body = await request.json();
    const { clientId, photos, measurements, questionnaire, notes } = body;

    if (!clientId || !measurements || !questionnaire) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check permissions
    if (decodedToken.role === 'client' && decodedToken.uid !== clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Submit check-in
    const checkInId = await clientService.submitCheckIn(clientId, {
      photos: photos || [],
      measurements,
      questionnaire,
      notes: notes || ''
    });

    const checkInDoc = await getDoc(doc(db, 'checkIns', checkInId));
    return NextResponse.json({
      id: checkInDoc.id,
      ...checkInDoc.data()
    });
  } catch (error: any) {
    console.error('Error creating check-in:', error);
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

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    
    const body = await request.json();
    const { id, clientId, coachFeedback } = body;

    if (!id || !clientId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get check-in data
    const checkInRef = doc(db, 'checkIns', id);
    const checkInDoc = await getDoc(checkInRef);
    
    if (!checkInDoc.exists()) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    // Check permissions
    const clientDoc = await getDoc(doc(db, 'clients', clientId));
    if (!clientDoc.exists()) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (
      decodedToken.role === 'client' && decodedToken.uid !== clientId ||
      decodedToken.role === 'coach' && clientDoc.data().coachId !== decodedToken.uid
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update check-in
    await updateDoc(checkInRef, {
      coachFeedback,
      updatedAt: new Date()
    });

    const updatedDoc = await getDoc(checkInRef);
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error: any) {
    console.error('Error updating check-in:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 