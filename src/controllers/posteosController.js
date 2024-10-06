const db = require('../config/db');

exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id; // Obtenemos el ID del usuario autenticado
    const query = `
      SELECT p.id AS post_id, p.usuarioid, p.contenido, p.videourl, p.fechapublicacion, p.likes, 
             u.nombre, u.apellido, pj.avatar_url, COUNT(rp.id) AS count,
             (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count
      FROM posteos p
      LEFT JOIN usuarios u ON p.usuarioid = u.id
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      LEFT JOIN respuestas_posteos rp ON p.id = rp.posteoid
      WHERE p.usuarioid = $1 
      GROUP BY p.id, u.nombre, u.apellido, pj.avatar_url
      ORDER BY p.fechapublicacion DESC    
    `;

    const result = await db.query(query, [userId]);

    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getAllPosts:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.createPost = async (req, res) => {
  const { contenido, videourl } = req.body;
  const usuarioid = req.user.id; // Usamos el ID del usuario autenticado

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
  try {
    const postId = parseInt(req.params.id, 10); // Asegúrate de convertir el ID a número entero
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const query = `DELETE FROM posteos WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [postId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error al eliminar el post:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getComments = async (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  try {
    const query = `
      SELECT 
        rp.id AS comment_id,
        rp.posteoid,
        rp.usuarioid,
        rp.contenido,
        rp.fechapublicacion,
        rp.likes,
        rp.videourl,
        rp.parentid,
        u.id AS user_id,
        u.nombre,
        u.apellido,
        pj.avatar_url,
        COUNT(r.id) AS count
      FROM respuestas_posteos rp
      LEFT JOIN usuarios u ON rp.usuarioid = u.id
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      LEFT JOIN respuestas_posteos r ON rp.id = r.parentid
      WHERE rp.posteoid = $1
      GROUP BY rp.id, u.id, pj.avatar_url
      ORDER BY rp.fechapublicacion ASC
    `;
    const result = await db.query(query, [parseInt(id)]);

    console.log('Comments retrieved:', result.rows); 
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getComments:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.createComment = async (req, res) => {
  const { id } = req.params; // ID del posteo
  const { contenido, parentid } = req.body; // Datos del comentario
  const usuarioid = req.user.id; // ID del usuario autenticado

  console.log('Creating comment for postId:', id);
  console.log('Comment data:', { usuarioid, contenido, parentid });

  try {
    const query = `
      INSERT INTO respuestas_posteos (posteoid, usuarioid, contenido, parentid)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await db.query(query, [id, usuarioid, contenido, parentid]);

    // Obtener información adicional del usuario
    const userQuery = `
      SELECT u.nombre, u.apellido, pj.avatar_url
      FROM usuarios u
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      WHERE u.id = $1
    `;
    const userResult = await db.query(userQuery, [usuarioid]);

    const commentWithUserData = {
      ...result.rows[0],
      ...userResult.rows[0]
    };

    res.status(201).json(commentWithUserData);
  } catch (error) {
    console.error('Error en createComment:', error.message);
    res.status(500).json({ error: error.message });
  }
};



exports.deleteComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId, 10); // Asegúrate de convertir el ID a número entero
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const query = `DELETE FROM respuestas_posteos WHERE id = $1 RETURNING *`;
    const result = await db.query(query, [commentId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error al eliminar el comentario:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.toggleLike = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    // Verificar si el like ya existe
    const checkLikeQuery = 'SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2';
    const checkLikeResult = await db.query(checkLikeQuery, [postId, userId]);

    if (checkLikeResult.rows.length > 0) {
      // Eliminar el like si ya existe
      const deleteQuery = 'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2';
      await db.query(deleteQuery, [postId, userId]);

      // Reducir el contador de likes
      const updateQuery = 'UPDATE posteos SET likes = likes - 1 WHERE id = $1 RETURNING *';
      const result = await db.query(updateQuery, [postId]);
      res.status(200).json(result.rows[0]);
    } else {
      // Agregar el like si no existe
      const insertQuery = 'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)';
      await db.query(insertQuery, [postId, userId]);

      // Incrementar el contador de likes
      const updateQuery = 'UPDATE posteos SET likes = likes + 1 WHERE id = $1 RETURNING *';
      const result = await db.query(updateQuery, [postId]);
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error en toggleLike:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const query = `
      SELECT p.id AS post_id, p.usuarioid, p.contenido, p.videourl, p.fechapublicacion, p.likes, 
             u.nombre, u.apellido, pj.avatar_url, COUNT(rp.id) AS count,
             (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count
      FROM posteos p
      LEFT JOIN usuarios u ON p.usuarioid = u.id
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      LEFT JOIN respuestas_posteos rp ON p.id = rp.posteoid
      WHERE p.usuarioid = $1 
      GROUP BY p.id, u.nombre, u.apellido, pj.avatar_url
      ORDER BY p.fechapublicacion DESC    
    `;

    const result = await db.query(query, [userId]);

    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getPostsByUser:', error.message);
    res.status(500).json({ error: error.message });
  }
};


