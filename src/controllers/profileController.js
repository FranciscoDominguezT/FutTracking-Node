const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = 'futTrackingNode'; // Asegúrate de que sea el mismo secreto que usas en auth

exports.getProfileInfo = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log('No se proporcionó token');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // First, get the user's role
    const userQuery = 'SELECT rol FROM usuarios WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    console.log('Token decodificado:', decoded);
    console.log('ID de usuario:', userId);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const userRole = userResult.rows[0].rol;

    let profileQuery, profileResult;

    if (userRole === 'Jugador') {
      profileQuery = `
        SELECT 
          u.id AS usuario_id,
          u.nombre,
          u.apellido,
          u.rol,
          pj.usuario_id AS perfil_jugador_id,
          pj.avatar_url,
          pj.edad,
          pj.altura,
          pj.peso,
          pj.nacion_id,
          pj.provincia_id,
          n.nombre AS nacion_nombre,
          p.nombre AS provincia_nombre
        FROM usuarios u
        LEFT JOIN perfil_jugadores pj ON u.id = pj.usuario_id
        LEFT JOIN naciones n ON pj.nacion_id = n.id
        LEFT JOIN provincias p ON pj.provincia_id = p.id
        WHERE u.id = $1
      `;
    } else if (userRole === 'Aficionado') {
      profileQuery = `
        SELECT 
          pa.id, pa.avatar_url,
          u.id AS usuario_id, u.nombre, u.apellido, u.rol
        FROM usuarios u
        LEFT JOIN perfil_aficionados pa ON u.id = pa.usuario_id
        WHERE u.id = $1
      `;
    } else {
      return res.status(400).json({ message: 'Rol de usuario no válido' });
    }

    profileResult = await db.query(profileQuery, [userId]);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }

    const profileData = profileResult.rows[0];

    const followersQuery = 'SELECT COUNT(*) FROM seguidores WHERE usuarioid = $1';
    const followersResult = await db.query(followersQuery, [userId]);
    const followersCount = parseInt(followersResult.rows[0].count, 10);

    console.log('Datos del perfil antes de enviar:', profileData);

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

exports.getPlayerProfile = async (req, res) => {
  const { id } = req.params;
  console.log(`Received usuario_id in backend: ${id}`);

  if (!id) {
    return res.status(400).json({ message: "ID de usuario no proporcionado" });
  }

  try {
    const result = await db.query(`
      SELECT 
        u.id AS usuario_id, u.nombre, u.apellido, u.rol,
        pj.id AS perfil_id, pj.avatar_url, pj.edad, pj.altura, pj.peso,
        n.nombre AS nacion_nombre, p.nombre AS provincia_nombre
      FROM usuarios u
      LEFT JOIN perfil_jugadores pj ON pj.usuario_id = u.id
      LEFT JOIN naciones n ON pj.nacion_id = n.id
      LEFT JOIN provincias p ON pj.provincia_id = p.id
      WHERE u.id = $1
    `, [id]);

    console.log(`Database query result:`, result.rows);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "Perfil no encontrado" });
    }
  } catch (error) {
    console.error("Error fetching player profile:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};



