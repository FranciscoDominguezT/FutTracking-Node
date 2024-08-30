const db = require('../config/db');

exports.getUserVideos = async (req, res) => {
    try {
        const videosQuery = 'SELECT * FROM videos WHERE usuarioid = $1';
        const result = await db.query(videosQuery, [11]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.log('Error fetching videos:', error.message);
        res.status(500).json({ error: error.message });
    }
};
