// This file contains helper types and utilities for Supabase
// The actual client is imported from @/integrations/supabase/client

export type UserRole = 'teacher' | 'student';

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
  year?: number;
  created_at: string;
  updated_at?: string;
  password_changed?: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  category: 'Assignment' | 'Tutorial' | 'Lab Report';
  teacher_id: string;
  teacher_name?: string;
  total_students?: number;
  submission_count?: number;
  teacher?: {
    name: string;
  };
  // File properties
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
}

export interface AssignmentWithTeacher extends Assignment {
  teacher_name: string;
  teacher: {
    name: string;
  };
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_path: string;
  file_name: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  student_name?: string;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Re-export the Supabase client
export { supabase } from '@/integrations/supabase/client';
