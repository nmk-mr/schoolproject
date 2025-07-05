-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow users to upload to their own submission folder
CREATE POLICY "Users can upload to their own submission folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow users to update their own submissions
CREATE POLICY "Users can update their own submissions"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow users to delete their own submissions
CREATE POLICY "Users can delete their own submissions"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a function to check if a user can access a file
CREATE OR REPLACE FUNCTION can_access_file(file_path text)
RETURNS boolean AS $$
DECLARE
  user_id text;
  path_parts text[];
  file_user_id text;
BEGIN
  -- Get the current user's ID
  user_id := auth.uid()::text;
  
  -- Split the file path to get the user ID
  path_parts := string_to_array(file_path, '/');
  
  -- The user ID should be the second part of the path (after bucket name)
  IF array_length(path_parts, 1) >= 2 THEN
    file_user_id := path_parts[2];
    RETURN user_id = file_user_id;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy to allow users to download their own files
CREATE POLICY "Users can download their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions' AND
    can_access_file(name)
  );

-- Create a function to set up all storage policies
CREATE OR REPLACE FUNCTION create_storage_policies()
RETURNS void AS $$
BEGIN
  -- The policies are already created above
  -- This function is just a convenient way to create all policies at once
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
