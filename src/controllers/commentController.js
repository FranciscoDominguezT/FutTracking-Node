const db = require('../config/db');

exports.getComments = async (req, res) => {
  const { videoid } = req.params;
  try {
    console.log('Recibido videoid:', videoid); // Verifica que videoid sea el esperado

    // Hacemos la consulta que ya une comentarios con usuarios y perfiles
    const query = `
      SELECT c.*, u.nombre, u.apellido, p.avatar_url
      FROM comentarios c
      JOIN usuarios u ON c.usuarioid = u.id
      LEFT JOIN perfil_jugadores p ON u.id = p.usuario_id
      WHERE c.videoid = $1
    `;
    const result = await db.query(query, [videoid]);

    console.log('Comentarios encontrados:', result.rows); // Verifica qué resultados se obtienen
    res.status(200).json(result.rows);

  } catch (error) {
    console.log('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.likeComment = async (req, res) => {
  const { commentid } = req.params;
  const { userid } = req.body;

  try {
    // Verifica si el comentario existe
    const commentResult = await db.query('SELECT * FROM comentarios WHERE id = $1', [commentid]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verifica si el usuario ya ha dado like al comentario
    const likeCheckResult = await db.query('SELECT * FROM comentarios_likes WHERE comentarioid = $1 AND usuarioid = $2', [commentid, userid]);

    if (likeCheckResult.rows.length > 0) {
      // Si el usuario ya ha dado like, elimina el like
      await db.query('DELETE FROM comentarios_likes WHERE comentarioid = $1 AND usuarioid = $2', [commentid, userid]);

      // Actualiza la cantidad de likes en la tabla comentarios
      await db.query('UPDATE comentarios SET likes = likes - 1 WHERE id = $1', [commentid]);

      res.status(200).json({ message: 'Like removed' });
    } else {
      // Si el usuario no ha dado like, agrega el like
      await db.query('INSERT INTO comentarios_likes (comentarioid, usuarioid) VALUES ($1, $2)', [commentid, userid]);

      // Actualiza la cantidad de likes en la tabla comentarios
      await db.query('UPDATE comentarios SET likes = likes + 1 WHERE id = $1', [commentid]);

      res.status(200).json({ message: 'Like added' });
    }
  } catch (error) {
    console.error("Error updating comment likes:", error);
    res.status(500).json({ error: error.message });
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
        commentsMap[comment.parent_id].replies.push(comment);
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

