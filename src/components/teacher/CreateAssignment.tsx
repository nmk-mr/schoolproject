import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface CreateAssignmentProps {
  labId: string;
  onSuccess?: () => void;
}

export function CreateAssignment({ labId, onSuccess }: CreateAssignmentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setUploading(true);

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

      const { error } = await supabase
        .from('assignments')
        .insert({
          title,
          description,
          due_date: dueDate,
          lab_id: labId,
          teacher_id: user.id,
          file_name: uploadedFileName,
          file_path: uploadedFilePath,
          file_type: uploadedFileType,
          file_size: uploadedFileSize,
          category: 'lab' // Adding required category field
        });

      if (error) throw error;

      toast.success('Assignment created successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/teacher/labs/${labId}`);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create New Assignment</h2>
        <p className="text-muted-foreground">Create a new assignment for your students</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter assignment title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter assignment description"
            required
          />
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
            accept=".pdf,.doc,.docx,.txt"
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: PDF, DOC, DOCX, TXT
          </p>
        </div>

        <Button type="submit" disabled={loading || uploading}>
          {loading || uploading ? 'Creating...' : 'Create Assignment'}
        </Button>
      </form>
    </div>
  );
} 