import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import { WebSocketProvider } from './providers/WebSocketProvider';
import { ClipboardList } from 'lucide-react';

function App() {
  return (
    <WebSocketProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <ClipboardList className="h-8 w-8 text-indigo-600" />
                    <span className="ml-2 text-xl font-bold text-gray-900">Marketing Tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<TaskList />} />
              <Route path="/task/:id" element={<TaskDetail />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WebSocketProvider>
  );
}

export default App;