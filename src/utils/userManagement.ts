import { auth, db } from '@/lib/firebase-admin';
import { UserRole } from '@/types';

interface CreateUserParams {
  email: string;
  password: string;
  role: UserRole;
  organizationId: string;
}

export async function createUser({ email, password, role, organizationId }: CreateUserParams) {
  try {
    // Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    // Set custom claims for the user
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      organizationId,
    });

    // Create the user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(uid: string, data: Partial<{ email: string; role: UserRole; organizationId: string }>) {
  try {
    const updates: any = { ...data, updatedAt: new Date() };
    
    // Update auth claims if role or organizationId changed
    if (data.role || data.organizationId) {
      const currentClaims = (await auth.getUser(uid)).customClaims || {};
      await auth.setCustomUserClaims(uid, {
        ...currentClaims,
        ...(data.role && { role: data.role }),
        ...(data.organizationId && { organizationId: data.organizationId }),
      });
    }

    // Update email in Auth if provided
    if (data.email) {
      await auth.updateUser(uid, { email: data.email });
    }

    // Update Firestore document
    await db.collection('users').doc(uid).update(updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(uid: string) {
  try {
    // Delete from Auth
    await auth.deleteUser(uid);
    
    // Delete from Firestore
    await db.collection('users').doc(uid).delete();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    return {
      ...userRecord,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

export async function getUserById(uid: string) {
  try {
    const userRecord = await auth.getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();
    return {
      ...userRecord,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    // Get the user's current organization
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const organizationId = userDoc.data()?.organizationId;

    // Update custom claims
    await auth.setCustomUserClaims(userId, {
      role: newRole,
      organizationId
    });

    // Update user document
    await db.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

export async function assignCoachToClient(clientId: string, coachId: string) {
  try {
    // Verify both users exist and have correct roles
    const [clientDoc, coachDoc] = await Promise.all([
      db.collection('users').doc(clientId).get(),
      db.collection('users').doc(coachId).get()
    ]);

    if (!clientDoc.exists || !coachDoc.exists) {
      throw new Error('User not found');
    }

    const clientData = clientDoc.data();
    const coachData = coachDoc.data();

    if (!clientData || !coachData || clientData.role !== 'client' || coachData.role !== 'coach') {
      throw new Error('Invalid user roles');
    }

    // Update client's coach
    await db.collection('users').doc(clientId).update({
      'clientProfile.coachId': coachId,
      updatedAt: new Date()
    });

    // Update coach's client list
    await db.collection('users').doc(coachId).update({
      'coachProfile.clientIds': admin.firestore.FieldValue.arrayUnion(clientId),
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error assigning coach to client:', error);
    throw error;
  }
}

export async function removeCoachFromClient(clientId: string, coachId: string) {
  try {
    // Update client's coach
    await db.collection('users').doc(clientId).update({
      'clientProfile.coachId': null,
      updatedAt: new Date()
    });

    // Update coach's client list
    await db.collection('users').doc(coachId).update({
      'coachProfile.clientIds': admin.firestore.FieldValue.arrayRemove(clientId),
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Error removing coach from client:', error);
    throw error;
  }
} 