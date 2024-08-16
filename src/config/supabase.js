const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://cryvkjhhbrsdmffgqmbj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyeXZramhoYnJzZG1mZmdxbWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0NzA2ODcsImV4cCI6MjAzNDA0NjY4N30.cMsxCSZjo_f80dzggwpRIreO10r8szOKohmKyDrSPYE";

const supabase = createClient(supabaseUrl, supabaseKey);

const testConnection = async () => {
  try{
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .limit(1);
    
      if (error) {
        console.error('Error conectando a Supabase:', error);
      } else {
        console.log('Conexión exitosa:', data);
      }
  }catch(error){
    console.log('error:', error);
  }
};
  
  testConnection();

module.exports = supabase;
