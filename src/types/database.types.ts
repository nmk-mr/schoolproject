import { PostgrestResponse } from '@supabase/supabase-js';

// Base assignment type for database operations
type AssignmentBase = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  teacher_id: string;
  year: number; // 1-5 for years, 6 for final year
  updated_at?: string | null;
  status?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  file_size?: number | null;
};

export interface Assignment extends AssignmentBase {
  category: 'Assignment' | 'Tutorial' | 'Lab Report';
}

// Type for database response
export interface DBAssignment extends AssignmentBase {
  category: string;
}

// Type for assignments with teacher info
export interface AssignmentWithTeacher extends AssignmentBase {
  category: 'Assignment' | 'Tutorial' | 'Lab Report';
  teacher_name: string;
  teacher: {
    name: string | null;
  };
  submission_count: number;
  total_students: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_name: string;
  file_path: string;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  student_name?: string;
  assignments?: {
    title?: string;
    year?: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

export type User = {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
  name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
  year?: number | null; // 1-5 for years, 6 for final year, null for teachers/admins
};

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  year?: 1 | 2 | 3 | 4 | 5 | 6; // Only for students
  created_at: string;
  updated_at: string;
  password_changed?: boolean;
}

declare global {
  namespace SupabaseRPC {
    interface Database {
      get_assignments_with_teacher: () => Promise<PostgrestResponse<Assignment>>;
      get_teacher_assignments: (p_teacher_id: string) => Promise<PostgrestResponse<Assignment>>;
    }
  }
}
