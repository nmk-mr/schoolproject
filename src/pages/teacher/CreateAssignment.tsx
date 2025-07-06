import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const CreateAssignment: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<string>('');
  const [year, setYear] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.log("CreateAssignment component mounted");
    // Log user information to verify authentication
    console.log("Current user:", user);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submission attempted with:", { title, description, dueDate, category, year });

    if (!title || !description || !dueDate || !category || !year) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields including year.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to create assignments.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedFilePath: string | null = null;
      let uploadedFileName: string | null = null;
      let uploadedFileType: string | null = null;
      let uploadedFileSize: number | null = null;

      // Upload file if selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const randomFileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${randomFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assignment_files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        uploadedFilePath = filePath;
        uploadedFileName = file.name;
        uploadedFileType = file.type;
        uploadedFileSize = file.size;
      }

      console.log("Submitting assignment data to Supabase...");
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          title,
          description,
          due_date: dueDate,
          category: category as 'Assignment' | 'Tutorial' | 'Lab Report',
          teacher_id: user.id,
          year: year as 1 | 2 | 3 | 4 | 5 | 6,
          file_name: uploadedFileName,
          file_path: uploadedFilePath,
          file_type: uploadedFileType,
          file_size: uploadedFileSize
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Assignment created successfully:", data);
      toast({
        title: 'Success',
        description: `Assignment has been created successfully.`,
      });

      navigate('/teacher');
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher')}
            className="mb-6"
          >
            &larr; Back to Dashboard
          </Button>

          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle>Create New {category === 'Lab Report' ? 'Lab Instructions' : category || 'Item'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a detailed description"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={setCategory} value={category}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Assignment">Assignment</SelectItem>
                          <SelectItem value="Tutorial">Tutorial</SelectItem>
                          <SelectItem value="Lab Report">Lab Instruction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="year">Academic Year</Label>
                      <Select
                        onValueChange={(value) => setYear(parseInt(value))}
                        value={year.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">First Year</SelectItem>
                          <SelectItem value="2">Second Year</SelectItem>
                          <SelectItem value="3">Third Year</SelectItem>
                          <SelectItem value="4">Fourth Year</SelectItem>
                          <SelectItem value="5">Fifth Year</SelectItem>
                          <SelectItem value="6">Final Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Assignment File (Optional)</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpeg,.jpg,.png,.gif"
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: PDF, Word, Excel, Text, Images
                    </p>
                    {file && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50 py-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/teacher')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-mtu-primary hover:bg-mtu-dark"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateAssignment;
