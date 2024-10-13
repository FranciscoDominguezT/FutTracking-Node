const db = require('../config/db');

exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT p.id AS post_id, p.usuarioid, p.contenido, p.videourl, p.fechapublicacion, p.likes, 
             u.nombre, u.apellido, pj.avatar_url,
             (SELECT COUNT(*) FROM posteos rp WHERE rp.parent_id = p.id) AS count,
             (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count
      FROM posteos p
      LEFT JOIN usuarios u ON p.usuarioid = u.id
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      WHERE p.usuarioid = $1 
      AND p.parent_id IS NULL
      GROUP BY p.id, u.nombre, u.apellido, pj.avatar_url
      ORDER BY p.fechapublicacion DESC  
    `;

    const result = await db.query(query, [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getAllPosts:', error.message);
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


exports.createPost = async (req, res) => {
  const { contenido, videourl, parent_id } = req.body;
  const usuarioid = req.user.id;

  try {
    const query = `
      INSERT INTO posteos (usuarioid, contenido, videourl, parent_id)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await db.query(query, [usuarioid, contenido, videourl, parent_id]);

    // Obtener información adicional del usuario
    const userQuery = `
      SELECT u.nombre, u.apellido, pj.avatar_url
      FROM usuarios u
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      WHERE u.id = $1
    `;
    const userResult = await db.query(userQuery, [usuarioid]);

    const newPost = {
      ...result.rows[0],
      ...userResult.rows[0],
      count: 0,
      like_count: 0
    };

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error en createPost:', error.message);
    res.status(500).json({ error: 'Error creating post' });
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

exports.createComment = async (req, res) => {
  const { id } = req.params; // ID del post padre
  const { contenido, parentid } = req.body;
  const usuarioid = req.user.id;

  try {
    const query = `
      INSERT INTO posteos (usuarioid, contenido, parent_id)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await db.query(query, [usuarioid, contenido, parentid || id]);

    // Obtener información adicional del usuario
    const userQuery = `
      SELECT u.nombre, u.apellido, pj.avatar_url
      FROM usuarios u
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      WHERE u.id = $1
    `;
    const userResult = await db.query(userQuery, [usuarioid]);

    const newComment = {
      ...result.rows[0],
      ...userResult.rows[0],
      comment_id: result.rows[0].id // Asegúrate de que comment_id esté definido
    };

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error en createComment:', error.message);
    res.status(500).json({ error: 'Error creating comment' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Primero, eliminamos las respuestas asociadas
    const deleteCommentsQuery = `DELETE FROM posteos WHERE parent_id = $1`;
    await db.query(deleteCommentsQuery, [postId]);

    // Luego, eliminamos el posteo
    const deletePostQuery = `DELETE FROM posteos WHERE id = $1 RETURNING *`;
    const result = await db.query(deletePostQuery, [postId]);

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
      WITH RECURSIVE comment_tree AS (
        SELECT 
          p.id AS comment_id,
          p.usuarioid,
          p.contenido,
          p.fechapublicacion,
          p.likes,
          p.videourl,
          p.parent_id,
          u.id AS user_id,
          u.nombre,
          u.apellido,
          pj.avatar_url,
          0 AS depth
        FROM posteos p
        LEFT JOIN usuarios u ON p.usuarioid = u.id
        LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
        WHERE p.parent_id = $1
        
        UNION ALL
        
        SELECT 
          p.id,
          p.usuarioid,
          p.contenido,
          p.fechapublicacion,
          p.likes,
          p.videourl,
          p.parent_id,
          u.id,
          u.nombre,
          u.apellido,
          pj.avatar_url,
          ct.depth + 1
        FROM posteos p
        JOIN comment_tree ct ON p.parent_id = ct.comment_id
        LEFT JOIN usuarios u ON p.usuarioid = u.id
        LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      )
      SELECT * FROM comment_tree
      ORDER BY depth, fechapublicacion ASC
    `;

    const result = await db.query(query, [parseInt(id)]);

    console.log('Comments retrieved:', result.rows); 
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getComments:', error.message);
    res.status(500).json({ error: error.message });
  }
};




exports.getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const query = `
      SELECT p.id AS post_id, p.usuarioid, p.contenido, p.videourl, p.fechapublicacion, p.likes, 
             u.nombre, u.apellido, pj.avatar_url,
             (SELECT COUNT(*) FROM posteos rp WHERE rp.parent_id = p.id) AS count,
             (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count
      FROM posteos p
      LEFT JOIN usuarios u ON p.usuarioid = u.id
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      WHERE p.usuarioid = $1 AND p.parent_id IS NULL
      ORDER BY p.fechapublicacion DESC
    `;

    const result = await db.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en getPostsByUser:', error.message);
    res.status(500).json({ error: error.message });
  }
};


