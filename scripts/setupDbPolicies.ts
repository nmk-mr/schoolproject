import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as pg from 'pg';

// Load environment variables from .env file in the scripts directory
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('Error: .env file not found in scripts directory');
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing Supabase URL or Service Role Key in .env file');
  process.exit(1);
}

// Parse the database URL to get connection details
const dbUrl = new URL(supabaseUrl.replace('http', 'postgres'));
const dbConfig = {
  user: 'postgres',
  password: 'postgres',
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 5432,
  database: 'postgres',
  ssl: false
};

// SQL to set up RLS policies
const setupScripts = [
  // Enable RLS on submissions table
  `ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;`,
  
  // Drop existing policies to avoid conflicts
  `DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;`,
  `DROP POLICY IF EXISTS "Users can create their own submissions" ON public.submissions;`,
  `DROP POLICY IF EXISTS "Users can update their own submissions" ON public.submissions;`,
  `DROP POLICY IF EXISTS "Users can delete their own submissions" ON public.submissions;`,
  `DROP POLICY IF EXISTS "Teachers can view all submissions" ON public.submissions;`,
  
  // Create policies
  `CREATE POLICY "Users can view their own submissions"
    ON public.submissions
    FOR SELECT
    USING (auth.uid() = student_id);`,
  
  `CREATE POLICY "Users can create their own submissions"
    ON public.submissions
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);`,
  
  `CREATE POLICY "Users can update their own submissions"
    ON public.submissions
    FOR UPDATE
    USING (auth.uid() = student_id);`,
  
  `CREATE POLICY "Teachers can view all submissions"
    ON public.submissions
    FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'teacher'
    ));`
];

async function setupPolicies() {
  const client = new pg.Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Execute each SQL statement
    for (const sql of setupScripts) {
      console.log('Executing:', sql.split('\n')[0], '...');
      await client.query(sql);
    }
    
    console.log('Database policies set up successfully');
  } catch (error) {
    console.error('Error setting up database policies:', error);
  } finally {
    await client.end();
  }
}

setupPolicies();
