const db = require('../config/db');

exports.getComments = async (req, res) => {
  const { videoid } = req.params;
  try {
    console.log('Recibido videoid:', videoid);

    const query = `
      SELECT c.*, u.nombre, u.apellido, p.avatar_url, c.likes, c.usuarioid
      FROM comentarios c
      JOIN usuarios u ON c.usuarioid = u.id
      LEFT JOIN perfil_jugadores p ON u.id = p.usuario_id
      WHERE c.videoid = $1
    `;
    const result = await db.query(query, [videoid]);
    console.log('Comentarios encontrados:', result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.log('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserComments = async (req, res) => {
  const userId = req.user.id; // Obtener el ID del usuario del token
  try {
    const query = `
      SELECT c.*, u.nombre, u.apellido, p.avatar_url, c.likes
      FROM comentarios c
      JOIN usuarios u ON c.usuarioid = u.id
      LEFT JOIN perfil_jugadores p ON u.id = p.usuario_id
      WHERE c.usuarioid = $1
    `;
    const result = await db.query(query, [userId]);
    console.log('Comentarios encontrados para el usuario:', result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.log('Error fetching user comments:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.likeComment = async (req, res) => {
  const { commentid } = req.params;
  const userid = req.user.id; // Obtener el ID del usuario del token

  try {
    // Verifica si el comentario existe
    const commentResult = await db.query('SELECT * FROM comentarios WHERE id = $1', [commentid]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    let newLikesCount;

    // Verifica si el usuario ya ha dado like al comentario
    const likeCheckResult = await db.query('SELECT * FROM comentarios_likes WHERE comentarioid = $1 AND usuarioid = $2', [commentid, userid]);

    if (likeCheckResult.rows.length > 0) {
      // Si el usuario ya ha dado like, elimina el like
      await db.query('DELETE FROM comentarios_likes WHERE comentarioid = $1 AND usuarioid = $2', [commentid, userid]);

      // Actualiza la cantidad de likes en la tabla comentarios
      const updateResult = await db.query('UPDATE comentarios SET likes = likes - 1 WHERE id = $1 RETURNING likes', [commentid]);
      newLikesCount = updateResult.rows[0].likes;

      res.status(200).json({ message: 'Like removed', likes: newLikesCount });
    } else {
      // Si el usuario no ha dado like, agrega el like
      await db.query('INSERT INTO comentarios_likes (comentarioid, usuarioid) VALUES ($1, $2)', [commentid, userid]);

      // Actualiza la cantidad de likes en la tabla comentarios
      const updateResult = await db.query('UPDATE comentarios SET likes = likes + 1 WHERE id = $1 RETURNING likes', [commentid]);
      newLikesCount = updateResult.rows[0].likes;

      res.status(200).json({ message: 'Like added', likes: newLikesCount });
    }
  } catch (error) {
    console.error("Error updating comment likes:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controlador para contar comentarios por video
exports.contarComentariosPorVideo = async (req, res) => {
  const { videoid } = req.params;
  console.log("Video ID recibido:", videoid);

  try {
      const query = `
          SELECT COUNT(*) AS total_comentarios
          FROM comentarios
          WHERE videoid = $1
      `;
      const result = await db.query(query, [videoid]);
     
      const totalComentarios = parseInt(result.rows[0].total_comentarios, 10);
      console.log("Total de comentarios:", totalComentarios);

      res.status(200).json({ count: totalComentarios });
  } catch (err) {
      console.error("Error en el try/catch:", err);
      res.status(500).json({ error: 'Error en el servidor.' });
  }
};

exports.getCommentsWithReplies = async (req, res) => {
  const { videoid } = req.params;
  try {
    // Consultar comentarios y respuestas
    const query = `
      SELECT c.*, u.nombre, u.apellido, p.avatar_url
      FROM comentarios c
      JOIN usuarios u ON c.usuarioid = u.id
      LEFT JOIN perfil_jugadores p ON u.id = p.usuario_id
      WHERE c.videoid = $1
      ORDER BY c.fechacomentario ASC
    `;
    const result = await db.query(query, [videoid]);
    const comments = result.rows;

    // Crear un mapa de comentarios por id para fácil acceso
    const commentsMap = {};
    comments.forEach(comment => {
      commentsMap[comment.id] = { ...comment, replies: [] };
    });

    // Asociar respuestas con sus comentarios principales
    comments.forEach(comment => {
      if (comment.parent_id) {
        // Asegurarse de que el comentario principal está en el mapa
        if (commentsMap[comment.parent_id]) {
          commentsMap[comment.parent_id].replies.push(comment);
        }
      }
    });

    // Ordenar respuestas por fecha
    Object.values(commentsMap).forEach(comment => {
      if (comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.fechacomentario) - new Date(b.fechacomentario));
      }
    });

    // Filtrar comentarios principales
    const rootComments = comments.filter(comment => !comment.parent_id);

    res.status(200).json(rootComments);
  } catch (error) {
    console.error("Error fetching comments with replies:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createComment = async (req, res) => {
  console.log('createComment llamado');
  // console.log('Headers:', req.headers);
  console.log('Usuario:', req.user);
  console.log('Cuerpo de la solicitud:', req.body);
  console.log('Parámetros:', req.params);

  const { videoid } = req.params;
  const { contenido, parent_id } = req.body;

  if (!req.user) {
    console.log('No se encontró usuario en la solicitud');
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  // Obtener el ID del usuario del token
  const userId = req.user.id;

  if (!userId || !contenido) {
    return res.status(400).json({ error: 'usuarioid y contenido son requeridos' });
  }

  try {
    const query = `
      INSERT INTO comentarios (videoid, usuarioid, contenido, parent_id, fechacomentario)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const result = await db.query(query, [videoid, userId, contenido, parent_id]);

    // Obtener datos adicionales del usuario
    const userQuery = `
      SELECT c.*, u.nombre, u.apellido, 
             COALESCE(pj.avatar_url, pa.avatar_url) as avatar_url
      FROM comentarios c
      JOIN usuarios u ON c.usuarioid = u.id
      LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
      LEFT JOIN perfil_aficionados pa ON u.id = pa.usuario_id
      WHERE c.id = $1
    `;
    const commentWithUserData = await db.query(userQuery, [result.rows[0].id]);

    res.status(201).json(commentWithUserData.rows[0]);
  } catch (error) {
    console.error('Error en createComment:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user.id; // Obtener el ID del usuario del token

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    // Verificar si el comentario pertenece al usuario
    const checkQuery = `SELECT * FROM comentarios WHERE id = $1 AND usuarioid = $2`;
    const checkResult = await db.query(checkQuery, [commentId, userId]);

    if (checkResult.rowCount === 0) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    const deleteQuery = `DELETE FROM comentarios WHERE id = $1 RETURNING *`;
    const result = await db.query(deleteQuery, [commentId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error al eliminar el comentario:', error.message);
    res.status(500).json({ error: error.message });
  }
};
