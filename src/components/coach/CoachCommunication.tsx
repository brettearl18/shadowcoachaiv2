'use client';

import { useState, useEffect } from 'react';
import { clientService } from '@/services/clientService';
import { messageService, Message } from '@/services/messageService';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  CalendarIcon,
  BellIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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

interface ClientWithStatus extends Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastActive?: string;
  status?: 'online' | 'offline' | 'away';
}

export function CoachCommunication() {
  const { user } = useAuth();
  const { notifications, setNotifications } = useNotifications();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications' | 'schedule'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to real-time messages
    const unsubscribe = messageService.subscribeToMessages(user.uid, (newMessages) => {
      setMessages(prev => {
        const combined = [...prev, ...newMessages];
        // Remove duplicates and sort by timestamp
        return Array.from(new Map(combined.map(m => [m.id, m])).values())
          .sort((a, b) => b.timestamp - a.timestamp);
      });
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const allClients = await clientService.getAllClients();
      setClients(allClients);
      
      if (user) {
        const userMessages = await messageService.getMessages(user.uid);
        setMessages(userMessages);
      }

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
    if (!newMessage.trim() || !selectedClient || !user) return;

    try {
      await messageService.sendMessage({
        senderId: user.uid,
        receiverId: selectedClient,
        content: newMessage.trim(),
        read: false
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await messageService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.firstName?.toLowerCase().includes(searchLower) ||
      client.lastName?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  });

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 0) return `${hours}h ago`;
      const minutes = Math.floor(diff / (1000 * 60));
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    }
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
        <nav className="flex space-x-4 bg-white rounded-lg p-1 shadow-sm" aria-label="Tabs">
          {[
            { id: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
            { id: 'notifications', label: 'Notifications', icon: BellIcon, count: notifications.filter(n => !n.read).length },
            { id: 'schedule', label: 'Schedule', icon: CalendarIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ease-in-out
                ${activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client.id)}
                  className={`
                    w-full flex items-center p-4 transition-colors duration-150
                    ${selectedClient === client.id
                      ? 'bg-primary/5 border-l-4 border-primary'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                >
                  <div className="relative">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white
                      ${client.status === 'online' ? 'bg-green-500' : 
                        client.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}
                    `} />
                  </div>
                  <div className="ml-3 flex-1 text-left">
                    <div className="font-medium text-gray-900">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{client.email}</div>
                  </div>
                  {client.lastActive && (
                    <div className="text-xs text-gray-400">
                      {formatMessageTime(client.lastActive)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm flex flex-col h-[calc(100vh-12rem)]">
            {selectedClient ? (
              <>
                {/* Selected Client Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">
                        {clients.find(c => c.id === selectedClient)?.firstName} {clients.find(c => c.id === selectedClient)?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {clients.find(c => c.id === selectedClient)?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages
                    .filter(m =>
                      m.senderId === selectedClient ||
                      m.receiverId === selectedClient
                    )
                    .map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-[70%] rounded-lg p-3 shadow-sm
                            ${message.senderId === user?.uid
                              ? 'bg-primary text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                            }
                          `}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className={`text-xs ${message.senderId === user?.uid ? 'text-white/70' : 'text-gray-500'}`}>
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {message.senderId === user?.uid && (
                              <CheckCircleIcon 
                                className={`h-4 w-4 ${message.read ? 'text-white' : 'text-white/70'}`} 
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        setIsTyping(true);
                        setTimeout(() => setIsTyping(false), 1000);
                      }}
                      placeholder="Type your message..."
                      className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {isTyping && (
                    <div className="text-xs text-gray-400 mt-1">
                      Typing...
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Select a client to start messaging</p>
                <p className="text-sm">Choose from your client list on the left</p>
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
