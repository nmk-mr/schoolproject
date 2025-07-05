import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file in the scripts directory
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('Error: .env file not found in scripts directory');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or Anon Key in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'submissions');

    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { data: createData, error: createError } = await supabase.storage
        .createBucket('submissions', {
          public: false,
          fileSizeLimit: '50MB',
          allowedMimeTypes: [
            'image/png',
            'image/jpeg',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
          ]
        });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      console.log('Bucket created successfully:', createData);
    } else {
      console.log('Bucket already exists');
    }

    // Set bucket policies
    const { data: policyData, error: policyError } = await supabase.rpc('create_storage_policies');
    
    if (policyError) {
      console.error('Error setting storage policies:', policyError);
    } else {
      console.log('Storage policies set successfully');
    }

  } catch (error) {
    console.error('Error in setupStorage:', error);
  }
}

setupStorage();
