import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase as globalSupabaseClient } from '@/integrations/supabase/client';
import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ItemCard from '@/components/ItemCard';

// Define simple types to avoid deep instantiation issues
type AssignmentCategory = 'Assignment' | 'Tutorial' | 'Lab Report';

// User data type
type UserData = {
  id: string;
  email: string;
  name: string;
  role: string;
  year?: number;
  created_at: string;
  updated_at?: string | null;
  user_metadata?: {
    year?: number;
    [key: string]: any;
  };
};

// Simple raw assignment type
type RawAssignment = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  category: string;
  teacher_id: string;
  year: number;
  updated_at?: string | null;
  status?: string | null;
};

// Simple processed assignment type
type ProcessedAssignment = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  category: AssignmentCategory;
  teacher_id: string;
  year: number;
  updated_at?: string | null;
  status?: string | null;
  teacher_name: string;
  submission_count: number;
  total_students: number;
  teacher: {
    name: string | null;
  };
};

// Define the component props interface
interface StudentDashboardProps {}

const StudentDashboard: React.FC<StudentDashboardProps> = () => {
  // State with explicit types
  const [assignments, setAssignments] = useState<ProcessedAssignment[]>([]);
  const [tutorials, setTutorials] = useState<ProcessedAssignment[]>([]);
  const [labReports, setLabReports] = useState<ProcessedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentYear, setStudentYear] = useState<number | null>(null);
  const [isLoadingYear, setIsLoadingYear] = useState(true);

  // Refs
  const dataRef = useRef({
    assignments: [] as ProcessedAssignment[],
    tutorials: [] as ProcessedAssignment[],
    labReports: [] as ProcessedAssignment[]
  });

  // Hooks
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle view item
  const handleViewItem = useCallback((id: string) => {
    navigate(`/student/assignment/${id}`);
  }, [navigate]);

  // Fetch student data including their year
  useEffect(() => {
    async function fetchStudentData() {
      if (!user) return;

      try {
        // First, try to get the user's data from the users table
        const { data: userData, error: userError } = await globalSupabaseClient
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        // Cast the user data to our UserData type
        const userWithMetadata = userData as UserData;
        
        // Try to get the year from user data or user metadata
        const year = userWithMetadata?.year || userWithMetadata?.user_metadata?.year;
        
        if (!year) {
          // If year is still not found, use a default value
          console.warn('Year not found in user data, using default value');
          setStudentYear(1); // Default to first year
        } else {
          setStudentYear(Number(year));
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        // Set a default year to allow the app to continue functioning
        setStudentYear(1);
        toast({
          title: 'Warning',
          description: 'Using default year. Some assignments may not be visible.',
          variant: 'default'
        });
      } finally {
        setIsLoadingYear(false);
      }
    }

    fetchStudentData();
  }, [user, toast]);

  const fetchItems = useCallback(async () => {
    if (isLoadingYear || !studentYear) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Get assignments filtered by student's year
      const supabase = globalSupabaseClient as SupabaseClient;
      const assignmentsQuery = (supabase
        .from('assignments')
        .select('id, title, description, due_date, created_at, category, teacher_id, year, updated_at, status') as any)
        .eq('year', studentYear)
        .order('created_at', { ascending: false });
      
      const assignmentsResult: any = await assignmentsQuery;
      const data = assignmentsResult.data as RawAssignment[] | null;
      const error = assignmentsResult.error as PostgrestError | null;

      if (error) throw error;
      if (!data || data.length === 0) {
        setAssignments([]);
        setTutorials([]);
        setLabReports([]);
        return;
      }

      // Process items
      const processedItems: ProcessedAssignment[] = [];

      for (const item of data) {
        try {
          // Get teacher name
          const { data: teacherData } = await globalSupabaseClient
            .from('users')
            .select('name')
            .eq('id', item.teacher_id)
            .single();

          // Get submission count using a simpler approach
          const submissionsQuery = (supabase
            .from('submissions')
            .select('id', { count: 'exact', head: true }) as any)
            .eq('assignment_id', item.id);
            
          const submissionsResult: any = await submissionsQuery;
          const submissionCount = submissionsResult.count as number | null;
          const submissionsError = submissionsResult.error as PostgrestError | null;
          if (submissionsError) throw submissionsError;

          // Get total students using a simpler approach
          const usersQuery = (supabase
            .from('users')
            .select('id', { count: 'exact', head: true }) as any)
            .eq('role', 'student')
            .eq('year', studentYear);
            
          const usersResult: any = await usersQuery;
          const totalStudents = usersResult.count as number | null;
          const usersError = usersResult.error as PostgrestError | null;
          if (usersError) throw usersError;

          // Create the assignment object with all required fields
          const teacherName = teacherData?.name || 'Unknown Teacher';
          
          // Create a simple object without complex type operations
          const assignment: ProcessedAssignment = {
            id: item.id,
            title: item.title,
            description: item.description,
            due_date: item.due_date,
            created_at: item.created_at,
            category: item.category as AssignmentCategory,
            teacher_id: item.teacher_id,
            year: item.year,
            updated_at: item.updated_at,
            status: item.status,
            teacher_name: teacherName,
            submission_count: submissionCount || 0,
            total_students: totalStudents || 0,
            teacher: {
              name: teacherName
            }
          };

          processedItems.push(assignment);
        } catch (error) {
          console.error(`Error processing assignment ${item.id}:`, error);
          continue;
        }
      }

      // Categorize items
      const assignmentsList = processedItems.filter(item => item.category === 'Assignment');
      const tutorialsList = processedItems.filter(item => item.category === 'Tutorial');
      const labReportsList = processedItems.filter(item => item.category === 'Lab Report');

      setAssignments(assignmentsList);
      setTutorials(tutorialsList);
      setLabReports(labReportsList);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignments. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentYear, isLoadingYear, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            {/* Removed student year display */}
          </div>
        </div>

        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="lab-reports">Lab Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
                  </div>
                ) : assignments.length === 0 ? (
                  <div>No assignments found for your year.</div>
                ) : (
                  <div className="grid gap-4">
                    {assignments.map((assignment) => (
                      <ItemCard
                        key={assignment.id}
                        item={{
                          ...assignment,
                          category: assignment.category as 'Assignment' | 'Tutorial' | 'Lab Report'
                        }}
                        onView={handleViewItem}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials">
            <Card>
              <CardHeader>
                <CardTitle>Tutorials</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
                  </div>
                ) : tutorials.length === 0 ? (
                  <div>No tutorials found for your year.</div>
                ) : (
                  <div className="grid gap-4">
                    {tutorials.map((tutorial) => (
                      <ItemCard
                        key={tutorial.id}
                        item={{
                          ...tutorial,
                          category: tutorial.category as 'Assignment' | 'Tutorial' | 'Lab Report'
                        }}
                        onView={handleViewItem}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab-reports">
            <Card>
              <CardHeader>
                <CardTitle>Lab Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
                  </div>
                ) : labReports.length === 0 ? (
                  <div>No lab reports found for your year.</div>
                ) : (
                  <div className="grid gap-4">
                    {labReports.map((report) => (
                      <ItemCard
                        key={report.id}
                        item={{
                          ...report,
                          category: report.category as 'Assignment' | 'Tutorial' | 'Lab Report'
                        }}
                        onView={() => handleViewItem(report.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;
