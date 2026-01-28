import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthPanel } from '../components/AuthPanel';
import { supabase } from '../lib/supabase';
import { Bell, Send, AlertCircle, CheckCircle, Server, Zap, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:3002/api/v1/notifications';
const API_KEY = 'dev-notification-api-key-2024';

const EVENT_TYPES = [
  { value: 'TASK_ASSIGNED', label: 'Task Assigned', category: 'task_management' },
  { value: 'TASK_OVERDUE', label: 'Task Overdue', category: 'task_management' },
  { value: 'TASK_COMPLETED', label: 'Task Completed', category: 'task_management' },
  { value: 'SUBMISSION_DUE', label: 'Submission Due', category: 'deliverable_workflow' },
  { value: 'DELIVERABLE_SUBMITTED', label: 'Deliverable Submitted', category: 'deliverable_workflow' },
  { value: 'DELIVERABLE_APPROVED', label: 'Deliverable Approved', category: 'deliverable_workflow' },
  { value: 'DELIVERABLE_REJECTED', label: 'Deliverable Rejected', category: 'deliverable_workflow' },
  { value: 'COMMENT_ADDED', label: 'Comment Added', category: 'collaboration' },
  { value: 'REACTION_ADDED', label: 'Reaction Added', category: 'collaboration' },
];

export default function TestNotifications() {
  const { user, isAuthenticated, userId } = useAuth();
  const [eventType, setEventType] = useState('TASK_ASSIGNED');
  const [title, setTitle] = useState('Test Task');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [notificationCount, setNotificationCount] = useState(0);

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Fetch notification count when authenticated
  useEffect(() => {
    if (userId) {
      fetchNotificationCount();
    }
  }, [userId]);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/health');
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch {
      setApiStatus('offline');
    }
  };

  const fetchNotificationCount = async () => {
    if (!userId) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId);

    setNotificationCount(count || 0);
  };

  // Method 1: Send via Backend API (recommended for production)
  const sendViaApi = async () => {
    if (!userId) {
      setResult({ success: false, message: 'You must be logged in to send notifications' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          event_type: eventType,
          recipient_id: userId,
          resource_ref: `task:${crypto.randomUUID().slice(0, 8)}`,
          metadata: {
            taskTitle: title,
            assignedBy: 'Test System',
            deliverableTitle: title,
            commentPreview: 'This is a test notification...',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Notification sent via API! ID: ${data.notification_id || data.id}`,
        });
        fetchNotificationCount();
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create notification',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Network error: ${(error as Error).message}. Is the backend server running on port 3002?`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Send directly to Supabase (for testing without backend)
  const sendDirectToSupabase = async () => {
    if (!userId) {
      setResult({ success: false, message: 'You must be logged in to send notifications' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: userId,
          event_type: eventType,
          state: 'unread',
          resource_ref: `task:${crypto.randomUUID().slice(0, 8)}`,
          metadata: {
            taskTitle: title,
            assignedBy: 'Direct Test',
            deliverableTitle: title,
            commentPreview: 'This notification was created directly in Supabase...',
          },
          priority: 'normal',
        })
        .select()
        .single();

      if (error) {
        setResult({
          success: false,
          message: `Supabase error: ${error.message}`,
        });
      } else {
        setResult({
          success: true,
          message: `Notification created directly! ID: ${data.id}`,
        });
        fetchNotificationCount();
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${(error as Error).message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
          <Bell className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Test Notifications
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Send test notifications to verify the system is working
          </p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mb-6 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-600 dark:text-surface-400">Backend API:</span>
          <span className={`flex items-center gap-1 text-sm font-medium ${
            apiStatus === 'online' ? 'text-green-600 dark:text-green-400' :
            apiStatus === 'offline' ? 'text-red-600 dark:text-red-400' :
            'text-amber-600 dark:text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500' :
              apiStatus === 'offline' ? 'bg-red-500' :
              'bg-amber-500 animate-pulse'
            }`} />
            {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
          </span>
          <button onClick={checkApiStatus} className="p-1 text-surface-400 hover:text-surface-600">
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>

        {isAuthenticated && (
          <>
            <div className="h-4 w-px bg-surface-300 dark:bg-surface-600" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-surface-600 dark:text-surface-400">Your notifications:</span>
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{notificationCount}</span>
              <button onClick={fetchNotificationCount} className="p-1 text-surface-400 hover:text-surface-600">
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Auth Panel */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Step 1: Login
          </h2>
          <AuthPanel />

          {isAuthenticated && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">Authenticated</span>
              </div>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-mono break-all">
                {userId}
              </p>
            </div>
          )}
        </div>

        {/* Send Notification Panel */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Step 2: Send Test Notification
          </h2>
          <div className="bg-white dark:bg-surface-800 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg
                             bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100
                             focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <optgroup label="Task Management">
                    {EVENT_TYPES.filter(t => t.category === 'task_management').map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Deliverable Workflow">
                    {EVENT_TYPES.filter(t => t.category === 'deliverable_workflow').map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Collaboration">
                    {EVENT_TYPES.filter(t => t.category === 'collaboration').map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Title / Content
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg
                             bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100
                             focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Two send buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={sendViaApi}
                  disabled={loading || !isAuthenticated || apiStatus !== 'online'}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700
                             disabled:bg-surface-400 dark:disabled:bg-surface-600
                             text-white font-medium rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Sending...' : 'Send via API'}
                </button>

                <button
                  onClick={sendDirectToSupabase}
                  disabled={loading || !isAuthenticated}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700
                             disabled:bg-surface-400 dark:disabled:bg-surface-600
                             text-white font-medium rounded-lg transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  {loading ? 'Sending...' : 'Direct to DB'}
                </button>
              </div>

              <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
                "Send via API" uses the backend server. "Direct to DB" bypasses the backend (for testing UI).
              </p>

              {!isAuthenticated && (
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                  Please login first to send notifications
                </p>
              )}

              {result && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{result.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          {apiStatus === 'offline' && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-red-600 dark:text-red-400" />
                <h3 className="font-medium text-red-800 dark:text-red-300">Backend Server Not Running</h3>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                Start the backend server to use "Send via API":
              </p>
              <code className="block bg-red-100 dark:bg-red-900/50 px-3 py-2 rounded text-sm font-mono">
                cd server && npm run start:api
              </code>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Or use "Direct to DB" button which works without the backend.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
          Testing Instructions
        </h2>
        <ol className="space-y-3 text-sm text-surface-700 dark:text-surface-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center font-medium">1</span>
            <span><strong>Sign Up / Login</strong> using the form on the left</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center font-medium">2</span>
            <span><strong>Choose a notification type</strong> and enter a title</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center font-medium">3</span>
            <span><strong>Click "Direct to DB"</strong> (works without backend) or <strong>"Send via API"</strong> (requires backend running)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full flex items-center justify-center font-medium">4</span>
            <span><strong>Click the bell icon</strong> in the top navigation to see your notification</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
