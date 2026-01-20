import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Login from './pages/Login';
import Templates from './pages/Templates';
import JobMatch from './pages/JobMatch';
import AdminDashboard from './pages/AdminDashboard';
import Downloads from './pages/Downloads';
import PdfViewer from './pages/PdfViewer';
import MockInterview from './pages/MockInterview';
import QuestionBanks from './pages/QuestionBanks';
import Learning from './pages/Learning';
import Welcome from './pages/Welcome';



function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/welcome" replace /> : <Layout><Login /></Layout>} />
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="welcome" element={
          <ProtectedRoute>
            <Welcome />
          </ProtectedRoute>
        } />
        <Route path="templates" element={
          <ProtectedRoute>
            <Templates />
          </ProtectedRoute>
        } />
        <Route path="job-match" element={
          <ProtectedRoute>
            <JobMatch />
          </ProtectedRoute>
        } />
        <Route path="editor" element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        } />
        <Route path="editor/:id" element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        } />
        <Route path="admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="downloads" element={
          <ProtectedRoute>
            <Downloads />
          </ProtectedRoute>
        } />
        <Route path="mock-interview" element={
          <ProtectedRoute>
            <MockInterview />
          </ProtectedRoute>
        } />
        <Route path="mock-interview/:meetingId" element={
          <ProtectedRoute>
            <MockInterview />
          </ProtectedRoute>
        } />
        <Route path="question-banks" element={
          <ProtectedRoute>
            <QuestionBanks />
          </ProtectedRoute>
        } />
        <Route path="learning" element={
          <ProtectedRoute>
            <Learning />
          </ProtectedRoute>
        } />
        <Route path="pdf-viewer" element={
          <ProtectedRoute>
            <PdfViewer />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
