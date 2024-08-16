const supabase = require('../config/supabase');

exports.getVideoData = async (req, res) => {
  const { videoId } = req.params;
  const userId = 11; // Asegúrate de obtener el userId correcto

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) throw error;

    // Verificar si el usuario ha dado like
    const { data: likeData, error: likeError } = await supabase
      .from('video_likes')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId);

    if (likeError) throw likeError;

    const videoData = {
      ...data,
      liked: likeData.length > 0
    };

    res.json(videoData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVideoLikes = async (req, res) => {
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
};

exports.likeVideo = async (req, res) => {
  const { videoId } = req.params;
  const userId = 11; // Asegúrate de manejar correctamente el userId

  try {
    // Verificar si el usuario ya ha dado like
    const { data: existingLikes, error: checkError } = await supabase
      .from('video_likes')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId);

    if (checkError) {
      console.log('Error al verificar like:', checkError);
      return res.status(500).json({ error: checkError.message });
    }

    let updatedLikes;
    if (existingLikes.length > 0) {
      // Si ya le dio like, eliminar el like
      await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', userId);

      // Obtener el número actual de likes
      const { data: videoData, error: fetchError } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();
        
      if (fetchError) throw fetchError;

      updatedLikes = videoData.likes > 0 ? videoData.likes - 1 : 0;

      // Actualizar los likes en la base de datos
      const { data: updatedVideo, error: updateError } = await supabase
        .from('videos')
        .update({ likes: updatedLikes })
        .eq('id', videoId)
        .single();

      if (updateError) throw updateError;
    } else {
      // Si no le ha dado like, agregar el like
      await supabase
        .from('video_likes')
        .insert([{ video_id: videoId, user_id: userId }]);

      // Obtener el número actual de likes
      const { data: videoData, error: fetchError } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();
        
      if (fetchError) throw fetchError;

      updatedLikes = videoData.likes + 1;

      // Actualizar los likes en la base de datos
      const { data: updatedVideo, error: updateError } = await supabase
        .from('videos')
        .update({ likes: updatedLikes })
        .eq('id', videoId)
        .single();

      if (updateError) throw updateError;
    }

    res.json({ likes: updatedLikes, liked: existingLikes.length === 0 });
  } catch (error) {
    console.log('Error handling like:', error.message);
    res.status(500).json({ error: error.message });
  }
};






