import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { clientService } from '@/services/clientService';
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

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const clientId = searchParams.get('clientId');
    const organizationId = searchParams.get('organizationId');

    if (clientId) {
      // Get specific client
      const client = await clientService.getClientProfile(clientId);
      
      // Check permissions
      if (decodedToken.role === 'client' && decodedToken.uid !== clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (decodedToken.role === 'coach' && client.coachId !== decodedToken.uid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json(client);
    } else if (coachId) {
      // Get coach's clients
      if (decodedToken.role === 'coach' && decodedToken.uid !== coachId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const clients = await coachService.getClientList(coachId);
      return NextResponse.json(clients);
    } else if (organizationId && decodedToken.role === 'admin') {
      // Get organization's clients (admin only)
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('organizationId', '==', organizationId));
      const snapshot = await getDocs(q);
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return NextResponse.json(clients);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in clients API:', error);
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
    if (!['admin', 'coach'].includes(decodedToken.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, coachId, organizationId, goals, metrics } = body;

    if (!name || !email || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create client profile
    const clientData = {
      name,
      email,
      coachId: coachId || null,
      organizationId,
      joinDate: new Date(),
      checkInRate: 0,
      currentStreak: 0,
      totalCheckIns: 0,
      lastCheckIn: null,
      nextCheckInDue: null,
      status: 'active',
      goals: goals || [],
      metrics: metrics || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const clientsRef = collection(db, 'clients');
    const docRef = await addDoc(clientsRef, clientData);

    // Update coach's client count if coach is assigned
    if (coachId) {
      const coachRef = doc(db, 'coaches', coachId);
      const coachDoc = await getDoc(coachRef);
      if (coachDoc.exists()) {
        await updateDoc(coachRef, {
          totalClients: (coachDoc.data().totalClients || 0) + 1,
          activeClients: (coachDoc.data().activeClients || 0) + 1,
          updatedAt: new Date()
        });
      }
    }

    return NextResponse.json({
      id: docRef.id,
      ...clientData
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get current client data
    const clientRef = doc(db, 'clients', id);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check permissions
    if (decodedToken.role === 'client' && decodedToken.uid !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (decodedToken.role === 'coach' && clientDoc.data().coachId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await updateDoc(clientRef, {
      ...updates,
      updatedAt: new Date()
    });

    const updatedDoc = await getDoc(clientRef);
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 