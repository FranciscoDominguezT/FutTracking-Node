const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const supabaseUrl = "https://cryvkjhhbrsdmffgqmbj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyeXZramhoYnJzZG1mZmdxbWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg0NzA2ODcsImV4cCI6MjAzNDA0NjY4N30.cMsxCSZjo_f80dzggwpRIreO10r8szOKohmKyDrSPYE";
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/api/videos/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const userId = 11; // Asegúrate de manejar correctamente el userId

  try {
    // Obtener datos del video
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();
    
    if (videoError) throw videoError;

    // Verificar si el usuario actual ha dado like
    const { data: userLike, error: userLikeError } = await supabase
      .from('video_likes')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId);

    if (userLikeError) throw userLikeError;

    res.json({
      ...videoData,
      liked: userLike.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/videos/:videoId/likes', async (req, res) => {
    const { videoId } = req.params;
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();
      
      if (error) throw error;
      res.json({ likes: data.likes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/videos/:videoId/like', async (req, res) => {
    const { videoId } = req.params;
    const userId = 11; // Asegúrate de manejar correctamente el userId
  
    try {
      // Verificar si ya existe un like
      const { data: existingLike, error: checkError } = await supabase
        .from('video_likes')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', userId);
  
      if (checkError) throw checkError;
  
      // Iniciar una transacción
      const { data, error } = await supabase.rpc('toggle_like', {
        p_video_id: videoId,
        p_user_id: userId
      });
  
      if (error) throw error;
  
      // Obtener el número actualizado de likes
      const { data: updatedVideo, error: updateError } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();
  
      if (updateError) throw updateError;
  
      res.json({ 
        likes: updatedVideo.likes, 
        liked: !existingLike.length 
      });
    } catch (error) {
      console.log('Error en likeVideo:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
  

// Agrega más rutas según sea necesario

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});