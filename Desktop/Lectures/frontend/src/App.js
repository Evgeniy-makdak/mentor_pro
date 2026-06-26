import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import PrivateRoute from './components/PrivateRoute';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MentorLayout from './pages/Mentor/MentorLayout';
import StudentLayout from './pages/Student/StudentLayout';
import DisciplinesPage from './pages/Mentor/DisciplinesPage';
import GroupsPage from './pages/Mentor/GroupsPage';
import StudentsPage from './pages/Mentor/StudentsPage';
import LecturesPage from './pages/Mentor/LecturesPage';
import TestEditorPage from './pages/Mentor/TestEditorPage';
import ReportsPage from './pages/Mentor/ReportsPage';
import FeedbackPage from './pages/Mentor/FeedbackPage';
import StudentLecturesPage from './pages/Student/LecturesPage';
import StudentLectureDetailPage from './pages/Student/LectureDetailPage';
import StudentTestPage from './pages/Student/TestPage';
import StudentResultsPage from './pages/Student/ResultsPage';
import StudentFeedbackPage from './pages/Student/FeedbackPage';
import './App.css';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <PrivateRoute>
          {user?.role === 'mentor' ? <Navigate to="/mentor" replace /> : <Navigate to="/student" replace />}
        </PrivateRoute>
      } />

      <Route path="/mentor/*" element={
        <PrivateRoute role="mentor">
          <MentorLayout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="disciplines" element={<DisciplinesPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="lectures" element={<LecturesPage />} />
        <Route path="lectures/:disciplineId" element={<LecturesPage />} />
        <Route path="tests/*" element={<TestEditorPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>

      <Route path="/student/*" element={
        <PrivateRoute role="student">
          <StudentLayout />
        </PrivateRoute>
      }>
        <Route index element={<StudentLecturesPage />} />
        <Route path="lectures/:disciplineId" element={<StudentLecturesPage />} />
        <Route path="lecture/:lectureId" element={<StudentLectureDetailPage />} />
        <Route path="test" element={<StudentTestPage />} />
        <Route path="results/:lectureId" element={<StudentResultsPage />} />
        <Route path="feedback" element={<StudentFeedbackPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <PWAInstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
