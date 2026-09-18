import { supabase } from './supabase.js';

// Test koneksi dan data
async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role')
      .limit(3);
    
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    console.log('Connection successful!');
    console.log('Sample users data:', data);
    
    // Test other tables
    console.log('\nTesting other tables...');
    
    const { data: students } = await supabase
      .from('students')
      .select('id, nim, name, program_studi')
      .limit(3);
    
    const { data: attendances } = await supabase
      .from('attendances')
      .select('id, attendance_type, status, created_at')
      .limit(3);
    
    console.log(`Students: ${students?.length || 0} records`);
    console.log(`Attendances: ${attendances?.length || 0} records`);
    
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();