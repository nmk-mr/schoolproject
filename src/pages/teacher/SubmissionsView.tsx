import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Assignment, Submission, formatDate } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { File, FileDown, X, Download, FileText } from 'lucide-react';
import { AssignmentFile } from '@/components/AssignmentFile';

const SubmissionsView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch assignment details with teacher check
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', id)
          .eq('teacher_id', user.id)
          .single();

        if (assignmentError) {
          console.error('Assignment error:', assignmentError);
          throw new Error('Assignment not found or you do not have permission to view it');
        }

        setAssignment(assignmentData as Assignment);

        // Fetch submissions for this assignment with student names
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select(`
            id,
            assignment_id,
            student_id,
            student_name,
            file_name,
            file_path,
            submitted_at,
            grade,
            feedback,
            assignments!inner(
              id,
              title,
              teacher_id
            )
          `)
          .eq('assignment_id', id)
          .eq('assignments.teacher_id', user.id)
          .order('submitted_at', { ascending: false });

        if (submissionError) {
          console.error('Submission error:', submissionError);
          throw submissionError;
        }
        
        if (submissionData && submissionData.length > 0) {
          // Process submissions with proper typing
          const processedSubmissions = submissionData.map(submission => {
            const submissionWithName = submission as unknown as Submission & { student_name?: string };
            return {
              ...submissionWithName,
              student_name: submissionWithName.student_name || `Student (${submissionWithName.student_id?.slice(0, 8) || 'unknown'})`
            };
          });
          
          console.log('Processed submissions with student names:', processedSubmissions);
          setSubmissions(processedSubmissions);
        } else {
          console.log('No submissions found for this assignment');
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load data. Please try again later.',
          variant: 'destructive',
        });
        navigate('/teacher');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, toast, navigate]);

  const handleOpenSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
    setIsDialogOpen(true);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      if (!filePath || !fileName) {
        throw new Error('File information is missing');
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please sign in to download files');
      }
      
      console.log('Attempting to download file:', { filePath, fileName });

      // Show loading state
      const loadingToast = toast({
        title: 'Preparing Download',
        description: 'Please wait while we prepare your file...',
        variant: 'default',
      });

      // Clean up the file path
      let cleanFilePath = filePath.replace(/^\/+|\/+$/g, '');
      if (!cleanFilePath) {
        throw new Error('Invalid file path');
      }

      // Remove 'submissions/' prefix if it exists
      if (cleanFilePath.startsWith('submissions/')) {
        cleanFilePath = cleanFilePath.replace('submissions/', '');
      }

      // First try direct download
      try {
        const { data, error } = await supabase.storage
          .from('assignment-submissions')
          .download(cleanFilePath);

        if (error) throw error;
        if (!data) throw new Error('No data received');

        // Create a download link and trigger it
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        loadingToast.dismiss();
        toast({
          title: 'Download Complete',
          description: 'Your file has been downloaded successfully.',
          variant: 'default',
        });
        return;
      } catch (directError) {
        console.log('Direct download failed, trying signed URL...', directError);
      }

      // If direct download failed, try with signed URL as fallback
      try {
        console.log('Trying signed URL for:', cleanFilePath);
        
        // Get a signed URL for the file (valid for 1 hour)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('assignment-submissions')
          .createSignedUrl(cleanFilePath, 3600);
          
        if (signedUrlError) throw signedUrlError;
        if (!signedUrlData?.signedUrl) throw new Error('Could not generate signed URL');
        
        console.log('Generated signed URL:', signedUrlData.signedUrl);
        
        // Download the file using the signed URL
        const response = await fetch(signedUrlData.signedUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        loadingToast.dismiss();
        toast({
          title: 'Download Complete',
          description: 'Your file has been downloaded successfully.',
          variant: 'default',
        });
        return;
      } catch (signedUrlError) {
        console.error('Signed URL download failed:', signedUrlError);
        loadingToast.dismiss();
        throw new Error('Failed to download file. Please try again or contact support.');
      }

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download the file. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to handle file download
  const downloadFile = (blob: Blob, fileName: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download';
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          resolve();
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Direct download method using Supabase storage API
  const directDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('submissions')
      .download(filePath);

    if (error) {
      console.error('Direct download failed:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data received from server');
    }

    await downloadFile(data, fileName);
    return data;
  };

  const handleSaveFeedback = async () => {
    if (!selectedSubmission) return;
    
    setIsSaving(true);
    try {
      // Verify Supabase client is initialized
      if (!supabase) {
        throw new Error('Supabase client is not properly initialized');
      }
  
      // Convert grade to number or null if empty
      const numericGrade = grade.trim() ? parseInt(grade, 10) : null;
      
      if (numericGrade !== null && (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100)) {
        toast({
          title: 'Invalid Grade',
          description: 'Grade must be a number between 0 and 100.',
          variant: 'destructive',
        });
        return;
      }
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        throw new Error('You must be logged in to update submissions');
      }
      
      // Prepare update data
      const updateData = {
        grade: numericGrade,
        feedback: feedback.trim() || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating submission with data:', updateData);
      
      // First verify the assignment belongs to the teacher
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('id, teacher_id')
        .eq('id', selectedSubmission.assignment_id)
        .eq('teacher_id', user.id)
        .single();
        
      if (assignmentError || !assignment) {
        throw new Error('You do not have permission to grade this submission');
      }
      
      // Perform the update
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', selectedSubmission.id)
        .select('*')
        .single();
        
      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to save: ${updateError.message}`);
      }
      
      if (!updatedSubmission) {
        throw new Error('Failed to update submission. Please try again.');
      }
      
      // Update local state
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === selectedSubmission.id 
            ? { ...sub, grade: updatedSubmission.grade, feedback: updatedSubmission.feedback }
            : sub
        )
      );
      
      toast({
        title: 'Success',
        description: 'Grade and feedback saved successfully!',
      });
      
      setIsDialogOpen(false);
      
    } catch (error) {
      console.error('Error saving feedback:', error);
      
      let errorMessage = 'Failed to save feedback. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex justify-center items-center flex-1">
          <div className="w-12 h-12 border-4 border-t-mtu-primary border-r-mtu-primary border-b-mtu-light border-l-mtu-light rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/teacher')}
          className="mb-6"
        >
          &larr; Back to Dashboard
        </Button>

        {assignment && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h1 className="text-2xl font-bold text-mtu-primary">{assignment.title}</h1>
            <div className="mt-2 text-gray-600 mb-4">
              <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-3 text-sm">
                {assignment.category}
              </span>
              <span className="text-sm">
                Due: {formatDate(assignment.due_date)}
              </span>
            </div>
            <p className="whitespace-pre-line">{assignment.description}</p>
            {assignment.file_name && (
              <div className="mt-4">
                <AssignmentFile
                  fileName={assignment.file_name}
                  filePath={assignment.file_path}
                  fileType={assignment.file_type}
                  fileSize={assignment.file_size}
                />
              </div>
            )}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Submissions ({submissions.length})</h2>
          </div>

          {submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.student_name}
                    </TableCell>
                    <TableCell>
                      {formatDate(submission.submitted_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <File className="h-4 w-4 mr-2" />
                        {submission.file_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.grade !== undefined && submission.grade !== null
                        ? `${submission.grade}/100`
                        : 'Not graded'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSubmission(submission)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Review</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(submission.file_path, submission.file_name);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No submissions yet.</p>
            </div>
          )}
        </div>
        
        {selectedSubmission && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Submission</DialogTitle>
                <DialogDescription>
                  Student: {selectedSubmission.student_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2" />
                      {selectedSubmission.file_name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedSubmission.file_path, selectedSubmission.file_name)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade (0-100)</Label>
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max="100"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="Enter grade"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback to the student"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveFeedback}
                  disabled={isSaving}
                  className="bg-mtu-primary hover:bg-mtu-dark"
                >
                  {isSaving ? 'Saving...' : 'Save Feedback'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default SubmissionsView;
