import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please click "Connect to Supabase" to set up your project.');
}

// Create Supabase client with error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Admin user management
export const createAdminUser = async () => {
  const adminEmail = "gennaro.mazzacane@gmail.com";
  const adminPassword = "1500Napoli500";
  
  try {
    const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail(adminEmail);
    
    if (checkError) {
      // User doesn't exist, create new admin
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            role: 'admin'
          }
        }
      });

      if (error) throw error;
      console.log('Admin user created successfully');
      return true;
    } else {
      console.log('Admin user already exists');
      return true;
    }
  } catch (error) {
    console.error('Failed to manage admin user:', error);
    return false;
  }
};