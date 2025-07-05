import React from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { FileIcon, DownloadIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';

interface AssignmentFileProps {
  fileName: string | null;
  filePath: string | null;
  fileType: string | null;
  fileSize: number | null;
}

export function AssignmentFile({ fileName, filePath, fileType, fileSize }: AssignmentFileProps) {
  const { user } = useAuth();

  const handleDownload = async () => {
    if (!filePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('assignment_files')
        .download(filePath);

      if (error) throw error;

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'assignment_file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (!fileName || !filePath) return null;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
      <FileIcon className="w-8 h-8 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <p className="text-xs text-muted-foreground">
          {fileType} • {formatFileSize(fileSize)}
        </p>
      </div>
      {user?.role !== 'teacher' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="shrink-0"
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          Download
        </Button>
      )}
    </div>
  );
} 