const db = require('../config/db');

exports.getComments = async (req, res) => {
  const { videoid } = req.params;
  try {
    const query = 'SELECT * FROM comentarios WHERE videoid = $1';
    const result = await db.query(query, [videoid]);

    res.status(200).json({ count: result.rowCount });
  } catch (error) {
    console.log('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
};
