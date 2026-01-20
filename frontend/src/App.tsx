import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { BoardProvider } from './contexts/BoardContext';
import { DemoDataProvider } from './contexts/DemoDataProvider';
import { ToastProvider } from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import DemoModeToggle from './components/DemoModeToggle';
import { useDemoData } from './contexts/DemoDataProvider';
import './App.css';

const AppContent = () => {
  const { demoMode, setDemoMode } = useDemoData();

  return (
    <>
      <DemoModeToggle demoMode={demoMode} onToggle={setDemoMode} />
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <DemoDataProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <BoardProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </BoardProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </DemoDataProvider>
    </ThemeProvider>
  );
}

export default App;
