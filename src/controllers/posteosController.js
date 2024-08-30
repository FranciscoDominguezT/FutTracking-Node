const db = require('../config/db');

exports.getAllPosts = async (req, res) => {
  try {
    const query = `
    SELECT p.*, u.id, u.nombre, u.apellido, pj.avatar_url, COUNT(rp.id) AS count
    FROM posteos p
    LEFT JOIN usuarios u ON p.usuarioid = u.id
    LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id  -- Cambiado a pj.usuario_id
    LEFT JOIN respuestas_posteos rp ON p.id = rp.posteoid
    GROUP BY p.id, u.id, pj.avatar_url
    ORDER BY p.fechapublicacion DESC    
    `;
    const result = await db.query(query);

    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getAllPosts:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.createPost = async (req, res) => {
  const { usuarioid, contenido, videourl } = req.body;

  try {
    const query = 'INSERT INTO posteos (usuarioid, contenido, videourl) VALUES ($1, $2, $3) RETURNING *';
    const result = await db.query(query, [usuarioid, contenido, videourl]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en createPost:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { likes } = req.body;

  try {
    const query = 'UPDATE posteos SET likes = $1 WHERE id = $2 RETURNING *';
    const result = await db.query(query, [likes, id]);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error en updatePost:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM posteos WHERE id = $1';
    await db.query(query, [id]);

    res.status(200).json({ message: 'Posteo eliminado correctamente' });
  } catch (error) {
    console.error('Error en deletePost:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getComments = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT rp.*, u.id, u.nombre, u.apellido, pj.avatar_url, COUNT(r.id) AS count
      FROM respuestas_posteos rp
      LEFT JOIN usuarios u ON rp.usuarioid = u.id
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuarioid
      LEFT JOIN respuestas_posteos r ON rp.id = r.parentid
      WHERE rp.posteoid = $1
      GROUP BY rp.id, u.id, pj.avatar_url
      ORDER BY rp.fechapublicacion ASC
    `;
    const result = await db.query(query, [id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getComments:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.createComment = async (req, res) => {
  const { id } = req.params;
  const { usuarioid, contenido, parentid } = req.body;

  try {
    const query = `
      INSERT INTO respuestas_posteos (posteoid, usuarioid, contenido, parentid)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await db.query(query, [id, usuarioid, contenido, parentid]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en createComment:', error.message);
    res.status(500).json({ error: error.message });
  }
};
