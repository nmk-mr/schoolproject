import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Assignment, Submission, formatDate } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { CheckCircle2, Download, File, FileUp, Trash2, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AssignmentFile } from '@/components/AssignmentFile';

interface AssignmentViewProps {}

const AssignmentView: React.FC<AssignmentViewProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Memoize the isOverdue calculation to prevent unnecessary recalculations
  const isOverdue = useMemo(() => {
    return assignment ? new Date(assignment.due_date) < new Date() : false;
  }, [assignment]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch assignment details
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', id)
          .single();

        if (assignmentError) throw assignmentError;
        setAssignment(assignmentData as Assignment);

        // Check if student has already submitted
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', id)
          .eq('student_id', user.id)
          .single();

        if (submissionError && submissionError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which is expected if no submission
          throw submissionError;
        }

        setSubmission(submissionData as Submission || null);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assignment data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        setFile(null);
        return;
      }
      
      const selectedFile = e.target.files[0];
      
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a valid file type (PDF, Word, Excel, Text, or Image).',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
      
    } catch (error) {
      console.error('Error handling file selection:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while processing your file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!file || !user || !id) return;
    
    try {
      setIsSubmitting(true);
      
      // Generate a unique file path with user ID as the folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${file.name.split('.')[0]}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, file);
        
      if (uploadError) {
        // If the error is about the bucket not existing, create it
        if (uploadError.message.includes('bucket not found')) {
          // Create the bucket using the Supabase dashboard or a server-side function
          // For now, show a user-friendly error
          throw new Error('Assignment submissions bucket is not properly configured. Please contact support.');
        } else {
          throw uploadError;
        }
      }
      
      // Get the student's name from the users table
      const { data: { user: userInfo } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();
      
      // Insert the submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .upsert(
          {
            assignment_id: id,
            student_id: user.id,
            student_name: userData?.name || userInfo?.email?.split('@')[0] || `Student ${user.id.slice(0, 8)}`,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            submitted_at: new Date().toISOString(),
          },
          {
            onConflict: 'assignment_id,student_id',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();
        
      if (submissionError) throw submissionError;
      
      setSubmission(submissionData);
      
      toast({
        title: 'Success',
        description: submission ? 'Your submission has been updated.' : 'Your assignment has been submitted successfully!',
      });
      
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'An error occurred while submitting your assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!submission?.file_path) {
      toast({
        title: 'Error',
        description: 'No file found for this submission.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First try to get a public URL
      const { data: publicUrlData } = supabase.storage
        .from('assignment-submissions')
        .getPublicUrl(submission.file_path);
      
      // Try to download via public URL first
      const response = await fetch(publicUrlData.publicUrl);
      
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = submission.file_name || `submission-${new Date().toISOString()}`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Fallback to direct download if public URL fails
      try {
        const { data, error: downloadError } = await supabase.storage
          .from('assignment-submissions')
          .download(submission.file_path);
          
        if (downloadError) throw downloadError;
        
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = submission.file_name || `submission-${new Date().toISOString()}`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        toast({
          title: 'Download Failed',
          description: 'Could not download the file. Please try again later or contact support if the problem persists.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeActualDelete = async () => {
    if (!submission || !assignment) return;
    // Pre-checks are already done in promptForDeleteConfirmation

    try {
      setIsSubmitting(true);
      
      // Check if the bucket exists before attempting to delete
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        // Continue with DB deletion even if bucket check fails
      } else if (buckets?.some(b => b.name === 'assignment-submissions') && submission.file_path) {
        // Only try to delete the file if the bucket exists
        const { error: deleteError } = await supabase.storage
          .from('assignment-submissions')
          .remove([submission.file_path]);
        
        if (deleteError) {
          console.error('Error deleting file:', deleteError);
          // Continue with DB deletion even if file deletion fails
        }
      }
      
      // Delete the submission record
      const { error: dbError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submission.id);
      
      if (dbError) throw dbError;
      
      // Update local state
      setSubmission(null);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast({
        title: 'Submission Removed',
        description: 'Your previous submission has been removed. You can now upload a new file.',
      });
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'An error occurred while deleting your submission.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false); // Close dialog
    }
  };

  const promptForDeleteConfirmation = async () => {
    if (!submission || !assignment) return;

    // Double check conditions before deletion
    const hasFeedbackOrGrade = submission.grade !== null || (submission.feedback && submission.feedback.trim() !== '');
    const isBeforeDueDate = new Date() <= new Date(assignment.due_date);
    
    if (hasFeedbackOrGrade) {
      toast({
        title: 'Cannot Delete',
        description: 'You cannot delete a submission that has already been marked or received feedback.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isBeforeDueDate) {
      toast({
        title: 'Cannot Delete',
        description: 'The due date has passed. You can no longer delete or modify your submission.',
        variant: 'destructive',
      });
      return;
    }
    // If checks pass, show the confirmation dialog
    setShowDeleteConfirm(true);
  };

  const canDeleteSubmission = useMemo(() => {
    if (!submission || !assignment) return false; // Ensure both are present
    
    const hasFeedbackOrGrade = submission.grade !== null || (submission.feedback && submission.feedback.trim() !== '');
    // Ensure assignment.due_date is valid before creating a Date from it
    const isBeforeDueDate = assignment.due_date && new Date() <= new Date(assignment.due_date);
    
    return !hasFeedbackOrGrade && isBeforeDueDate;
  }, [submission, assignment]);

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
          onClick={() => navigate('/student')}
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
              <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                Due: {formatDate(assignment.due_date)} {isOverdue && "(Overdue)"}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
            </CardHeader>
            <CardContent>
              {submission ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-green-100 p-1.5 dark:bg-green-900/50">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-800 dark:text-green-200">
                          Assignment Submitted
                        </h3>
                        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                          Submitted on {new Date(submission.submitted_at).toLocaleDateString()} at{' '}
                          {new Date(submission.submitted_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-sm"
                            onClick={handleDownload}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          {canDeleteSubmission && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-sm gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={promptForDeleteConfirmation}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                        {canDeleteSubmission && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            You can delete and resubmit your work until the due date or until you receive feedback.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-200">
                        Submitted
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-2">
                    <Label htmlFor="file-upload" className="text-sm font-medium leading-none">
                      Upload your work
                    </Label>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="file-upload"
                        className="cursor-pointer flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      >
                        Choose File
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpeg,.jpg,.png,.gif"
                      />
                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                        {file ? file.name : 'No file chosen'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Accepted formats: PDF, Word, Excel, Text, Images (max 10MB)
                    </p>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!file || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                  {isOverdue && (
                    <p className="text-sm text-red-500 font-medium">
                      Note: This assignment is past the due date.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {submission && (
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.grade !== undefined && submission.grade !== null ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="font-medium mb-1">Marks:</p>
                      <p className="text-2xl font-bold text-mtu-primary">
                        {submission.grade}/100
                      </p>
                    </div>
                    
                    {submission.feedback && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium mb-2">Teacher's Feedback:</p>
                          <p className="whitespace-pre-line text-gray-700">
                            {submission.feedback}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Your submission hasn't been marked yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete your submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You will need to upload a new file if you wish to resubmit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeActualDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default AssignmentView;
