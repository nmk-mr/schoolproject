import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateAssignment from "./pages/teacher/CreateAssignment";
import SubmissionsView from "./pages/teacher/SubmissionsView";
import StudentDashboard from "./pages/student/StudentDashboard";
import AssignmentView from "./pages/student/AssignmentView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            
            {/* Teacher routes */}
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/create" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <CreateAssignment />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/submissions/:id" 
              element={
                <ProtectedRoute requiredRole="teacher">
                  <SubmissionsView />
                </ProtectedRoute>
              } 
            />
            
            {/* Student routes */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/assignment/:id" 
              element={
                <ProtectedRoute requiredRole="student">
                  <AssignmentView />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
