import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import NotificationSettings from './pages/settings/NotificationSettings';
import TestNotifications from './pages/TestNotifications';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { NotificationBell } from './components/NotificationBell';
import { NotificationPanel } from './components/NotificationPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthPanel } from './components/AuthPanel';
import { ClipboardList, Settings } from 'lucide-react';

function App() {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  return (
    <ErrorBoundary>
    <WebSocketProvider>
      <Router>
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-200">
          <nav className="bg-white dark:bg-surface-900 shadow-sm dark:shadow-surface-950/50 border-b border-transparent dark:border-surface-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <ClipboardList className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                    <span className="ml-2 text-xl font-bold text-surface-900 dark:text-surface-50">Grower Platform</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/settings/notifications"
                    className="p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors"
                    title="Notification Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </a>
                  <ThemeToggle />
                  <NotificationBell onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)} />
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-surface-900 dark:text-surface-100">
            <Routes>
              <Route path="/" element={<TaskList />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/settings/notifications" element={<NotificationSettings />} />
              <Route path="/test-notifications" element={<TestNotifications />} />
            </Routes>
          </main>
        </div>

        <NotificationPanel
          isOpen={isNotificationPanelOpen}
          onClose={() => setIsNotificationPanelOpen(false)}
        />
      </Router>
    </WebSocketProvider>
    </ErrorBoundary>
  );
}

export default App;