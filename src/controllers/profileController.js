const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = 'futTrackingNode'; // Asegúrate de que sea el mismo secreto que usas en auth

exports.getProfileInfo = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Token recibido:', req.headers.authorization);

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    console.log('Decoded User ID:', userId);

    const profileQuery = `
    SELECT 
      pj.id, pj.avatar_url, pj.edad, pj.altura, pj.peso,
      u.id AS usuario_id, u.nombre, u.apellido, u.rol,
      n.nombre AS nacion_nombre, p.nombre AS provincia_nombre
    FROM usuarios u
    LEFT JOIN perfil_jugadores pj ON pj.usuario_id = u.id
    LEFT JOIN naciones n ON pj.nacion_id = n.id
    LEFT JOIN provincias p ON pj.provincia_id = p.id
    WHERE u.id = $1
    `;

    const profileResult = await db.query(profileQuery, [userId]);
    console.log('Consulta ejecutada con userId:', userId);
    console.log('Resultados de la consulta:', profileResult.rows);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const profileData = profileResult.rows[0];

    const followersQuery = 'SELECT COUNT(*) FROM seguidores WHERE usuarioid = $1';
    const followersResult = await db.query(followersQuery, [userId]);
    const followersCount = parseInt(followersResult.rows[0].count, 10);

    res.json({
      profile: profileData,
      followersCount: followersCount
    });
  } catch (error) {
    console.error('Error en getProfileInfo:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getPerfil = async (req, res) => {
  const userId = 11;

  try {
    const result = await db.query(`
      SELECT 
        perfil_jugadores.id, 
        perfil_jugadores.avatar_url, 
        usuarios.nombre, 
        usuarios.apellido,
        localidades.nombre AS localidad_nombre,
        provincias.nombre AS provincia_nombre,
        naciones.nombre AS nacion_nombre
      FROM perfil_jugadores
      JOIN usuarios ON usuarios.id = perfil_jugadores.usuario_id
      JOIN localidades ON localidades.id = perfil_jugadores.localidad_id
      JOIN provincias ON provincias.id = localidades.provincia_id
      JOIN naciones ON naciones.id = provincias.nacion_id
      WHERE perfil_jugadores.usuario_id = $1
    `, [userId]);

    if (result.rows.length > 0) {
      // Enviar la información del perfil al frontend
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Perfil no encontrado" });
    }
  } catch (error) {
    console.error("Error fetching profile from database:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

