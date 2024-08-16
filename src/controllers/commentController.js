const supabase = require('../config/supabase');

exports.getComments = async (req, res) => {
  const { videoid } = req.params;
  try {
    const { count, error } = await supabase
      .from('comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('videoid', videoid);

    if (error) {
      console.log('Error fetching comments:', error);
      res.status(500).json({ error: 'Error fetching comments' });
      return;
    }
    
    res.status(200).json({ count });
  } catch (error) {
    console.log('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
};


// Implementa las demás funciones relacionadas con comentarios aquí