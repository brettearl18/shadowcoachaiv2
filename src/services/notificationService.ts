import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
}

export class NotificationService {
  private readonly NOTIFICATIONS_COLLECTION = 'notifications';
  private readonly CLIENTS_COLLECTION = 'clients';
  private readonly COACHES_COLLECTION = 'coaches';
  private readonly RATE_LIMIT = 10; // notifications per minute
  private notificationCount = 0;
  private lastReset = Date.now();

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastReset >= 60000) { // Reset every minute
      this.notificationCount = 0;
      this.lastReset = now;
    }

    if (this.notificationCount >= this.RATE_LIMIT) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.notificationCount++;
  }

  private async sendEmailWithRetry(to: string, template: NotificationTemplate, retryCount = 0): Promise<void> {
    try {
      await this.checkRateLimit();
      
      if (!this.validateEmail(to)) {
        throw new Error('Invalid email address');
      }

      await resend.emails.send({
        from: 'Shadow Coach AI <notifications@shadowcoach.ai>',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return this.sendEmailWithRetry(to, template, retryCount + 1);
      }
      throw error;
    }
  }

  async sendCheckInNotification(checkInId: string): Promise<void> {
    try {
      // Get check-in data with validation
      const checkInRef = doc(db, 'checkIns', checkInId);
      const checkInDoc = await getDoc(checkInRef);
      if (!checkInDoc.exists()) {
        throw new Error('Check-in not found');
      }
      const checkInData = this.validateCheckInData(checkInDoc.data());

      // Get client data with validation
      const clientRef = doc(db, this.CLIENTS_COLLECTION, checkInData.clientId);
      const clientDoc = await getDoc(clientRef);
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }
      const clientData = this.validateClientData(clientDoc.data());

      // Get coach data with validation
      const coachRef = doc(db, this.COACHES_COLLECTION, clientData.coachId);
      const coachDoc = await getDoc(coachRef);
      if (!coachDoc.exists()) {
        throw new Error('Coach not found');
      }
      const coachData = this.validateCoachData(coachDoc.data());

      // Prepare notification templates
      const clientTemplate = this.getCheckInClientTemplate(checkInData);
      const coachTemplate = this.getCheckInCoachTemplate(checkInData, clientData);

      // Send notifications with retry mechanism
      await Promise.all([
        this.sendEmailWithRetry(clientData.email, clientTemplate),
        this.sendEmailWithRetry(coachData.email, coachTemplate)
      ]);

      // Record notification
      await this.recordNotification({
        type: 'check_in',
        checkInId,
        clientId: checkInData.clientId,
        coachId: clientData.coachId,
        status: 'sent',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending check-in notification:', error);
      await this.recordNotification({
        type: 'check_in',
        checkInId,
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      });
      throw new Error('Failed to send check-in notification');
    }
  }

  private validateCheckInData(data: any): any {
    const requiredFields = ['clientId', 'date', 'status'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required check-in fields: ${missingFields.join(', ')}`);
    }

    return data;
  }

  private validateClientData(data: any): any {
    const requiredFields = ['name', 'email', 'coachId'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required client fields: ${missingFields.join(', ')}`);
    }

    if (!this.validateEmail(data.email)) {
      throw new Error('Invalid client email address');
    }

    return data;
  }

  private validateCoachData(data: any): any {
    const requiredFields = ['name', 'email'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required coach fields: ${missingFields.join(', ')}`);
    }

    if (!this.validateEmail(data.email)) {
      throw new Error('Invalid coach email address');
    }

    return data;
  }

  async sendCoachFeedbackNotification(checkInId: string): Promise<void> {
    try {
      // Get check-in data
      const checkInRef = doc(db, 'checkIns', checkInId);
      const checkInDoc = await getDoc(checkInRef);
      const checkInData = checkInDoc.data();

      if (!checkInData) {
        throw new Error('Check-in not found');
      }

      // Get client data
      const clientRef = doc(db, this.CLIENTS_COLLECTION, checkInData.clientId);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();

      // Prepare notification template
      const template = this.getCoachFeedbackTemplate(checkInData);

      // Send notification
      await this.sendEmail(clientData.email, template);

      // Record notification
      await this.recordNotification({
        type: 'coach_feedback',
        checkInId,
        clientId: checkInData.clientId,
        status: 'sent',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending coach feedback notification:', error);
      throw new Error('Failed to send coach feedback notification');
    }
  }

  async sendGoalReminderNotification(goalId: string): Promise<void> {
    try {
      // Get goal data
      const goalRef = doc(db, 'goals', goalId);
      const goalDoc = await getDoc(goalRef);
      const goalData = goalDoc.data();

      if (!goalData) {
        throw new Error('Goal not found');
      }

      // Get client data
      const clientRef = doc(db, this.CLIENTS_COLLECTION, goalData.clientId);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();

      // Prepare notification template
      const template = this.getGoalReminderTemplate(goalData);

      // Send notification
      await this.sendEmail(clientData.email, template);

      // Record notification
      await this.recordNotification({
        type: 'goal_reminder',
        goalId,
        clientId: goalData.clientId,
        status: 'sent',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending goal reminder notification:', error);
      throw new Error('Failed to send goal reminder notification');
    }
  }

  private async sendEmail(to: string, template: NotificationTemplate): Promise<void> {
    try {
      await resend.emails.send({
        from: 'Shadow Coach AI <notifications@shadowcoach.ai>',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  private async recordNotification(notification: any): Promise<void> {
    try {
      await addDoc(collection(db, this.NOTIFICATIONS_COLLECTION), notification);
    } catch (error) {
      console.error('Error recording notification:', error);
      // Don't throw here as this is a secondary operation
    }
  }

  private getCheckInClientTemplate(checkInData: any): NotificationTemplate {
    return {
      subject: 'Your Daily Check-in is Ready',
      html: `
        <h1>Time for Your Daily Check-in!</h1>
        <p>Hi ${checkInData.clientName},</p>
        <p>It's time for your daily check-in. Please complete it to track your progress and receive personalized feedback from your coach.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/check-in">Complete Check-in</a></p>
      `,
      text: `
        Time for Your Daily Check-in!
        
        Hi ${checkInData.clientName},
        
        It's time for your daily check-in. Please complete it to track your progress and receive personalized feedback from your coach.
        
        Complete your check-in here: ${process.env.NEXT_PUBLIC_APP_URL}/client/check-in
      `
    };
  }

  private getCheckInCoachTemplate(checkInData: any, clientData: any): NotificationTemplate {
    return {
      subject: `New Check-in from ${clientData.name}`,
      html: `
        <h1>New Check-in Received</h1>
        <p>Hi ${clientData.coachName},</p>
        <p>${clientData.name} has submitted their daily check-in. Please review and provide feedback when you're ready.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/coach/dashboard">View Check-in</a></p>
      `,
      text: `
        New Check-in Received
        
        Hi ${clientData.coachName},
        
        ${clientData.name} has submitted their daily check-in. Please review and provide feedback when you're ready.
        
        View the check-in here: ${process.env.NEXT_PUBLIC_APP_URL}/coach/dashboard
      `
    };
  }

  private getCoachFeedbackTemplate(checkInData: any): NotificationTemplate {
    return {
      subject: 'New Feedback from Your Coach',
      html: `
        <h1>New Coach Feedback</h1>
        <p>Hi ${checkInData.clientName},</p>
        <p>Your coach has provided feedback on your latest check-in. Check it out to see their insights and recommendations.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard">View Feedback</a></p>
      `,
      text: `
        New Coach Feedback
        
        Hi ${checkInData.clientName},
        
        Your coach has provided feedback on your latest check-in. Check it out to see their insights and recommendations.
        
        View the feedback here: ${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard
      `
    };
  }

  private getGoalReminderTemplate(goalData: any): NotificationTemplate {
    return {
      subject: 'Goal Reminder',
      html: `
        <h1>Goal Reminder</h1>
        <p>Hi ${goalData.clientName},</p>
        <p>This is a reminder about your goal: "${goalData.title}"</p>
        <p>Current Progress: ${goalData.progress}%</p>
        <p>Deadline: ${new Date(goalData.deadline).toLocaleDateString()}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/goals">View Goals</a></p>
      `,
      text: `
        Goal Reminder
        
        Hi ${goalData.clientName},
        
        This is a reminder about your goal: "${goalData.title}"
        
        Current Progress: ${goalData.progress}%
        Deadline: ${new Date(goalData.deadline).toLocaleDateString()}
        
        View your goals here: ${process.env.NEXT_PUBLIC_APP_URL}/client/goals
      `
    };
  }
}

export const notificationService = new NotificationService(); 