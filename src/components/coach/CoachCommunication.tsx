'use client';

import { useState, useEffect } from 'react';
import { clientService } from '@/services/clientService';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  CalendarIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Notification {
  id: string;
  type: 'message' | 'check-in' | 'milestone';
  clientId: string;
  clientName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface ScheduledSession {
  id: string;
  clientId: string;
  clientName: string;
  type: 'check-in' | 'consultation';
  date: string;
  notes?: string;
}

export function CoachCommunication() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications' | 'schedule'>('messages');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const allClients = await clientService.getAllClients();
      setClients(allClients);
      
      // Load mock data for now
      setMessages([
        {
          id: '1',
          senderId: 'client1',
          receiverId: 'coach1',
          content: 'Hi coach, I completed my check-in for today!',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]);

      setNotifications([
        {
          id: '1',
          type: 'check-in',
          clientId: 'client1',
          clientName: 'John Doe',
          content: 'Completed their weekly check-in',
          timestamp: new Date().toISOString(),
          read: false
        }
      ]);

      setSessions([
        {
          id: '1',
          clientId: 'client1',
          clientName: 'John Doe',
          type: 'check-in',
          date: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Monthly progress review'
        }
      ]);
    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return;

    const message = {
      id: Date.now().toString(),
      senderId: 'coach1',
      receiverId: selectedClient,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    try {
      // Send message to backend
      // await messageService.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          {[
            { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
            { id: 'notifications', label: 'Notifications', icon: BellIcon },
            { id: 'schedule', label: 'Schedule', icon: CalendarIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
                }
                px-3 py-2 font-medium text-sm rounded-md
                flex items-center space-x-2 transition-colors
              `}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium text-gray-900 mb-4">Clients</h3>
            <div className="space-y-2">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client.id)}
                  className={`
                    w-full flex items-center space-x-3 p-2 rounded-lg
                    ${selectedClient === client.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4">
            {selectedClient ? (
              <>
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
                  {messages
                    .filter(m =>
                      m.senderId === selectedClient ||
                      m.receiverId === selectedClient
                    )
                    .map(message => (
                      <div
                        key={message.id}
                        className={`
                          flex ${message.senderId === 'coach1' ? 'justify-end' : 'justify-start'}
                        `}
                      >
                        <div
                          className={`
                            max-w-[70%] rounded-lg p-3
                            ${message.senderId === 'coach1'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                            }
                          `}
                        >
                          <p>{message.content}</p>
                          <div
                            className={`
                              text-xs mt-1
                              ${message.senderId === 'coach1'
                                ? 'text-blue-100'
                                : 'text-gray-500'
                              }
                            `}
                          >
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                Select a client to start messaging
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`
                  p-4 rounded-lg border
                  ${notification.read ? 'bg-white' : 'bg-blue-50'}
                `}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {notification.clientName}
                      </div>
                      <div className="text-gray-600">{notification.content}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No new notifications
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="space-y-4">
            {sessions.map(session => (
              <div
                key={session.id}
                className="p-4 rounded-lg border hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.clientName}
                      </div>
                      <div className="text-gray-600">
                        {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                      </div>
                      {session.notes && (
                        <div className="text-sm text-gray-500 mt-1">
                          {session.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(session.date).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No scheduled sessions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 