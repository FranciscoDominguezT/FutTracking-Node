const db = require('../config/db');

exports.getUserVideos = async (req, res) => {
    try {
        const videoQuery = 'SELECT * FROM videos WHERE id = $1';
        const result = await db.query(videoQuery, [3]);  // Usamos el ID 3

        res.status(200).json(result.rows);
    } catch (error) {
        console.log('Error fetching video:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getVideoById = async (req, res) => {
    const videoId = req.params.id;
    try {
      const videoQuery = 'SELECT * FROM videos WHERE id = $1';
      const result = await db.query(videoQuery, [videoId]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Video not found" });
      }
  
      const video = result.rows[0];
      res.status(200).json(video);
    } catch (error) {
      console.log('Error fetching video data:', error.message);
      res.status(500).json({ error: error.message });
    }
  };