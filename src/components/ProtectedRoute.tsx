
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();
  
  console.log("ProtectedRoute:", { user, loading, requiredRole });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log(`ProtectedRoute: User role ${user.role} doesn't match required role ${requiredRole}, redirecting`);
    return <Navigate to={`/${user.role}`} replace />;
  }

  console.log("ProtectedRoute: Access granted");
  return <>{children}</>;
};

export default ProtectedRoute;
