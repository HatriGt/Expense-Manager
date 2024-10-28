import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iycgjbvkimpaofeodjaf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Y2dqYnZraW1wYW9mZW9kamFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5MjM0OTEsImV4cCI6MjA0NTQ5OTQ5MX0.aEW4whzu_JEyAqS8oZkMfmWF7bxNcI-Xf3ALrJ7vg5s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);