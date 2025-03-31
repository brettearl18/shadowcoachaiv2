import { NextRequest, NextResponse } from 'next/server';
import { createUserWithRole, updateUserRole, assignCoachToClient, removeCoachFromClient } from '@/utils/userManagement';
import { auth } from '@/lib/firebase-admin';
import { UserRole } from '@/types';
import { createUser } from '@/utils/userManagement';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    console.log('Token:', token);

    // Verify the token
    try {
      const decodedToken = await auth.verifyIdToken(token);
      console.log('Token verified:', decodedToken);

      // Check if user exists
      const user = await auth.getUser(decodedToken.uid);
      console.log('User found:', user);

      // Check user claims
      const claims = decodedToken.role;
      console.log('User claims:', claims);

      if (claims !== 'admin') {
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }
    } catch (error: any) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: `Invalid token: ${error.message}` }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { email, password, role, organizationId } = body;

    if (!email || !password || !role || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the user
    try {
      const userRecord = await createUser({
        email,
        password,
        role: role as UserRole,
        organizationId,
      });

      return NextResponse.json({ user: userRecord });
    } catch (error: any) {
      console.error('User creation failed:', error);
      return NextResponse.json({ error: `Failed to create user: ${error.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Internal server error:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await auth.getUser(decodedToken.uid);
    if (userDoc.customClaims?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, coachId, clientId, action } = body;

    // Handle role update
    if (role) {
      if (!['admin', 'coach', 'client'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }

      await updateUserRole(userId, role as UserRole);
      return NextResponse.json({ success: true });
    }

    // Handle coach-client assignment
    if (coachId && clientId) {
      if (action === 'assign') {
        await assignCoachToClient(clientId, coachId);
      } else if (action === 'remove') {
        await removeCoachFromClient(clientId, coachId);
      } else {
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 