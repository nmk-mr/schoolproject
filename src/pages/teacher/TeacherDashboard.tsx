import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import ItemCard from '@/components/ItemCard';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Assignment, AssignmentWithTeacher } from '@/types/database.types';

const TeacherDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentWithTeacher[]>([]);
  const [tutorials, setTutorials] = useState<AssignmentWithTeacher[]>([]);
  const [labReports, setLabReports] = useState<AssignmentWithTeacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log("Fetching assignments with teacher names...");
        
        // Get all assignments for the current teacher with teacher info
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .eq('teacher_id', user.id);

        if (assignmentsError) throw assignmentsError;
        if (!assignmentsData) return;

        console.log('Assignments with teacher data:', assignmentsData);

        // Process assignments with counts
        const assignmentsWithCounts = await Promise.all(
          assignmentsData.map(async (assignment: any) => {
            const assignmentId = assignment.id;
            
            // Get teacher name
            const { data: teacherData } = await supabase
              .from('users')
              .select('name')
              .eq('id', assignment.teacher_id)
              .single();
            
            const teacherName = teacherData?.name || 'Unknown Teacher';
            
            // Get submission count for this assignment
            const { count: submissionCount, error: countError } = await supabase
              .from('submissions')
              .select('*', { count: 'exact', head: true })
              .eq('assignment_id', assignmentId);

            if (countError) throw countError;

            // Get total students count for this assignment's year
            const { count: totalStudents, error: studentsError } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'student')
              .eq('year', assignment.year);

            if (studentsError) throw studentsError;

            // Create a properly typed assignment with teacher info
            const assignmentWithTeacher: AssignmentWithTeacher = {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              due_date: assignment.due_date,
              created_at: assignment.created_at,
              category: assignment.category as 'Assignment' | 'Tutorial' | 'Lab Report',
              teacher_id: assignment.teacher_id,
              year: assignment.year,
              updated_at: assignment.updated_at,
              status: assignment.status || null,
              teacher_name: teacherName,
              teacher: { name: teacherName },
              submission_count: submissionCount || 0,
              total_students: totalStudents || 0
            };

            return assignmentWithTeacher;
          })
        );
        
        // Log the processed data for debugging
        console.log('Processed assignments with counts:', assignmentsWithCounts);

        // Filter assignments by category
        const filteredAssignments = assignmentsWithCounts.filter(
          (item): item is AssignmentWithTeacher => item.category === 'Assignment'
        );
        const filteredTutorials = assignmentsWithCounts.filter(
          (item): item is AssignmentWithTeacher => item.category === 'Tutorial'
        );
        const filteredLabReports = assignmentsWithCounts.filter(
          (item): item is AssignmentWithTeacher => item.category === 'Lab Report'
        );

        setAssignments(filteredAssignments);
        setTutorials(filteredTutorials);
        setLabReports(filteredLabReports);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assignments. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [toast, user?.id]);

  const handleViewItem = (id: string) => {
    navigate(`/teacher/submissions/${id}`);
  };

  const handleCreateNew = () => {
    navigate('/teacher/create');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
          <Button 
            onClick={handleCreateNew}
            className="bg-mtu-primary hover:bg-mtu-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        <Separator className="my-4" />

        <Tabs defaultValue="assignments">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
            <TabsTrigger value="lab-reports">Lab Instructions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
              </div>
            ) : assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <ItemCard 
                    key={assignment.id} 
                    item={assignment} 
                    onView={handleViewItem} 
                    isTeacher={true} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No assignments found.</p>
                <Button 
                  variant="outline" 
                  onClick={handleCreateNew}
                  className="mt-4"
                >
                  Create your first Assignment
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tutorials">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
              </div>
            ) : tutorials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutorials.map((tutorial) => (
                  <ItemCard 
                    key={tutorial.id} 
                    item={tutorial} 
                    onView={handleViewItem} 
                    isTeacher={true} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No tutorials found.</p>
                <Button 
                  variant="outline" 
                  onClick={handleCreateNew}
                  className="mt-4"
                >
                  Create your first Tutorial
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="lab-reports">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
              </div>
            ) : labReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labReports.map((labReport) => (
                  <ItemCard 
                    key={labReport.id} 
                    item={labReport} 
                    onView={handleViewItem} 
                    isTeacher={true} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No lab reports found.</p>
                <Button 
                  variant="outline" 
                  onClick={handleCreateNew}
                  className="mt-4"
                >
                  Create your first Lab Instruction
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;
